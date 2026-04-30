const User = require('./user.model');
const ApiError = require('../../utils/ApiError');
// 🔥 Update: sendAdminStatusEmail ইমপোর্ট করা হলো
const { sendOtpEmail, sendEmail, sendAdminStatusEmail } = require('../../utils/sendEmail'); 
const crypto = require('crypto');
const dns = require('dns');
const util = require('util');
const jwt = require('jsonwebtoken');

const resolveMx = util.promisify(dns.resolveMx);

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

exports.getUserProfile = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found!');
    return user.toSafeObject();
};

exports.updateProfileService = async (userId, { username, email }) => {
    const user = await User.findById(userId).select('+otpCode +otpExpires +pendingEmail');
    if (!user) throw new ApiError(404, 'User not found!');

    if (email && user.email !== email.toLowerCase().trim()) {
        const isDomainValid = await isValidEmailDomain(email);
        if (!isDomainValid) throw new ApiError(400, 'Invalid email domain! Please use a real email address.');
    }

    if (user.email === email?.toLowerCase()?.trim()) {
        user.username = username.trim();
        await user.save({ validateBeforeSave: false });
        return { user: user.toSafeObject(), requireOtp: false };
    }

    if (user.authProvider === 'google') throw new ApiError(400, 'Google users cannot change their email address!');

    const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (emailExists) throw new ApiError(409, 'This email is already in use!');

    const otp = crypto.randomInt(100000, 999999).toString();
    user.username = username.trim();
    user.pendingEmail = email.toLowerCase().trim();
    user.otpCode = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save({ validateBeforeSave: false });
    await sendOtpEmail({ to: email, username: user.username, otp, type: 'emailChange' });
    
    return { user: user.toSafeObject(), requireOtp: true };
};

exports.verifyNewEmailService = async (userId, otp) => {
    const user = await User.findById(userId).select('+otpCode +otpExpires +pendingEmail');
    if (!user) throw new ApiError(404, 'User not found!');
    if (!user.pendingEmail) throw new ApiError(400, 'No pending email change request!');
    if (user.otpCode !== otp) throw new ApiError(400, 'Invalid OTP!');
    if (user.otpExpires < Date.now()) throw new ApiError(400, 'OTP expired! Please request again.');

    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.otpCode = null;
    user.otpExpires = null;

    await user.save({ validateBeforeSave: false });
    return user.email;
};

exports.changePasswordService = async (userId, { oldPassword, newPassword }) => {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new ApiError(404, 'User not found!');

    const hasExistingPassword = !!user.password;
    if (hasExistingPassword) {
        if (!oldPassword) throw new ApiError(400, 'Current password is required to change password!');
        const isMatch = await user.isPasswordCorrect(oldPassword);
        if (!isMatch) throw new ApiError(400, 'Current password is incorrect!');
        if (oldPassword === newPassword) throw new ApiError(400, 'New password cannot be the same as current password!');
    }

    user.password = newPassword;
    user.authProvider = 'local';
    user.refreshToken = null;

    await user.save();
    return true;
};

exports.uploadImageService = async (userId, file) => {
    if (!file) throw new ApiError(400, 'No file uploaded!');
    const imagePath = file.path; 
    await User.findByIdAndUpdate(userId, { profileImage: imagePath });
    return imagePath;
};

exports.deleteAccountService = async (userId) => {
    const user = await User.findByIdAndDelete(userId);
    if (!user) throw new ApiError(404, 'User not found!');
    return true;
};

exports.requestAdminAccessService = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found!');
    if (user.role === 'admin') throw new ApiError(400, 'You are already an admin!');
    if (user.adminRequestStatus === 'pending') throw new ApiError(400, 'Your request is already pending!');

    user.adminRequestStatus = 'pending';
    await user.save({ validateBeforeSave: false });

    const requestToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' });

    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const approveUrl = `${baseUrl}/api/v1/user/developer/approve/${user._id}/${requestToken}`;
    const rejectUrl = `${baseUrl}/api/v1/user/developer/reject/${user._id}/${requestToken}`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h2 style="color: #4F46E5;">New Admin Access Request</h2>
            <p><strong>Name:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p>This request will automatically expire in 24 hours.</p>
            <div style="margin-top: 20px;">
                <a href="${approveUrl}" style="padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">✅ Approve Admin</a>
                <a href="${rejectUrl}" style="padding: 12px 24px; background-color: #EF4444; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-left: 10px;">❌ Reject Request</a>
            </div>
        </div>
    `;

    await sendEmail({ to: process.env.DEVELOPER_EMAIL, subject: 'URGENT: Admin Access Request - CoreAuth', html: htmlContent });
    return true;
};

exports.handleAdminRequestByDeveloper = async (userId, token, action) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found!');

    try {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        if (action === 'approve') {
            user.role = 'admin';
            user.adminRequestStatus = 'none';
        } else {
            user.adminRequestStatus = 'rejected';
        }
        await user.save({ validateBeforeSave: false });
        
        // 🔥 NEW: অ্যাডমিন রিকোয়েস্ট আপডেট হওয়ার পর ইউজারকে মেইল পাঠানো হচ্ছে
        await sendAdminStatusEmail({ 
            to: user.email, 
            username: user.username, 
            status: action 
        });

        return action === 'approve' ? 'Successfully Approved as Admin!' : 'Request Rejected!';

    } catch (error) {
        if (user.adminRequestStatus === 'pending') {
            user.adminRequestStatus = 'rejected';
            await user.save({ validateBeforeSave: false });
        }
        throw new ApiError(400, 'Link has expired (24h passed). Request has been automatically rejected.');
    }
};