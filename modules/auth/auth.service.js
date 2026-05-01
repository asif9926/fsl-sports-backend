const User = require('../user/user.model');
const ApiError = require('../../utils/ApiError');
const { sendOtpEmail, sendWelcomeEmail } = require('../../utils/sendEmail');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const dns = require('dns');
const util = require('util');
const { OAuth2Client } = require('google-auth-library');

const resolveMx = util.promisify(dns.resolveMx);
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateTokens = (userId, role) => {
    // 🔥 মেয়াদ ৩০ দিন করে দেওয়া হলো
    const accessToken = jwt.sign({ id: userId, role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30d' }); 
    const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
    return { accessToken, refreshToken };
};

const isValidEmailDomain = async (email) => {
    try {
        const domain = email.trim().toLowerCase().split('@')[1];
        if (!domain) return false;

        // Strict Whitelist: শুধুমাত্র এই ডোমেইনগুলোই অ্যালাউ করা হবে
        const trustedDomains = [
            'gmail.com', 
            'yahoo.com', 
            'outlook.com', 
            'hotmail.com', 
            'icloud.com', 
            'green.edu.bd', 
            'live.com'
        ];

        // ডোমেইনটি লিস্টে থাকলে true রিটার্ন করবে, লিস্টের বাইরে কিছু হলেই সরাসরি false
        return trustedDomains.includes(domain);
    } catch {
        return false;
    }
};

exports.registerUser = async ({ username, email, password }) => {
    const isDomainValid = await isValidEmailDomain(email);
    if (!isDomainValid) throw new ApiError(400, 'Invalid email domain!');

    const emailLower = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: emailLower });
    
    if (existingUser) {
        if (!existingUser.isVerified) {
            const otp = crypto.randomInt(100000, 999999).toString();
            existingUser.otp = otp;
            existingUser.expireAt = new Date(Date.now() + 10 * 60 * 1000);
            await existingUser.save({ validateBeforeSave: false });
            
            try {
                await sendOtpEmail({ to: emailLower, username: existingUser.username, otp, type: 'verification' });
            } catch (err) {
                console.error("Email Sending Failed in Render! Reason:", err.message);
                throw new ApiError(500, 'Failed to send OTP email. Please check your email configuration.');
            }
            
            throw new ApiError(400, 'Account exists but unverified. New OTP sent!');
        }
        throw new ApiError(409, 'An account with this email already exists!');
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    const newUser = await User.create({
        username: username.trim(),
        email: emailLower,
        password,
        otp,
        expireAt: new Date(Date.now() + 10 * 60 * 1000),
        isVerified: false
    });

    try {
        await sendOtpEmail({ to: emailLower, username: username.trim(), otp, type: 'verification' });
    } catch (err) {
        console.error("Email Sending Failed in Render! Reason:", err.message);
        throw new ApiError(500, 'Failed to send OTP email. Please check your email configuration.');
    }
    
    return { email: newUser.email };
};

exports.verifyOtp = async ({ email, otp }) => {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +expireAt');
    if (!user) throw new ApiError(404, 'User not found!');
    if (user.isVerified) throw new ApiError(400, 'Account is already verified!');
    if (user.otp !== otp) throw new ApiError(400, 'Invalid OTP!');

    user.isVerified = true;
    user.otp = undefined;
    user.expireAt = undefined; 
    await user.save({ validateBeforeSave: false });

    try {
        await sendWelcomeEmail({ to: user.email, username: user.username });
    } catch (err) {
        console.error("Welcome Email Sending Failed! Reason:", err.message);
    }
    
    return { email: user.email };
};

exports.googleLoginService = async (token) => {
    let payload;
    try {
        const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
        payload = ticket.getPayload();
    } catch (err) { throw new ApiError(401, 'Invalid Google token!'); }

    const { email, name, picture, sub: googleId } = payload;
    let user = await User.findOne({ email: email.toLowerCase() });
    let isNewUser = false;

    if (user) {
        if (!user.googleId) user.googleId = googleId;
        if (!user.profileImage) user.profileImage = picture;
        user.isVerified = true;
    } else {
        user = new User({
            username: name,
            email: email.toLowerCase(),
            authProvider: 'google',
            googleId,
            profileImage: picture,
            isVerified: true,
            role: 'user' 
        });
        isNewUser = true;
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    try {
        if (isNewUser) await sendWelcomeEmail({ to: user.email, username: user.username });
    } catch (err) {
         console.error("Welcome Email Sending Failed! Reason:", err.message);
    }
    
    return { user: user.toSafeObject(), accessToken, refreshToken };
};

exports.loginUser = async ({ email, password }) => {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
    if (!user) throw new ApiError(404, 'No account found!');
    if (!user.isVerified) throw new ApiError(403, 'Please verify your email!');
    if (!user.password) throw new ApiError(400, 'Login with Google please.');

    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) throw new ApiError(401, 'Incorrect password!');

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { user: user.toSafeObject(), accessToken, refreshToken };
};

exports.refreshAccessToken = async (incomingToken) => {
    if (!incomingToken) throw new ApiError(401, 'No refresh token.');
    let decoded;
    try {
        decoded = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET);
    } catch { throw new ApiError(403, 'Invalid refresh token.'); }
    
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== incomingToken) throw new ApiError(403, 'Token revoked.');

    const newAccessToken = jwt.sign({ id: user._id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30d' });
    return { accessToken: newAccessToken };
};

exports.logoutUser = async (userId) => {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    return true;
};

exports.forgotPasswordService = async (email) => {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) throw new ApiError(404, 'No account found!');
    if (!user.isVerified) throw new ApiError(403, 'Verify account first!');
    if (!user.password) throw new ApiError(400, 'Google accounts cannot reset password.');

    const resetOtp = crypto.randomInt(100000, 999999).toString();
    user.resetPasswordOtp = resetOtp;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    
    try {
        await sendOtpEmail({ to: email, username: user.username, otp: resetOtp, type: 'reset' });
    } catch (err) {
        console.error("Email Sending Failed in Render! Reason:", err.message);
        throw new ApiError(500, 'Failed to send reset OTP email. Please check your email configuration.');
    }
    
    return { email: user.email };
};

exports.resetPasswordService = async ({ email, otp, newPassword }) => {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+resetPasswordOtp +resetPasswordExpires');
    if (!user) throw new ApiError(404, 'User not found!');
    if (user.resetPasswordOtp !== otp) throw new ApiError(400, 'Invalid OTP!');
    if (user.resetPasswordExpires < Date.now()) throw new ApiError(400, 'OTP expired!');

    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;
    user.refreshToken = null;
    await user.save();
    return true;
};