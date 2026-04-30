const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const authService = require('./auth.service');

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
};

exports.signup = asyncHandler(async (req, res, next) => {
    const data = await authService.registerUser(req.body);
    res.status(201).json(new ApiResponse(201, data, 'Account created! Check your email for OTP.'));
});

exports.verifyOTP = asyncHandler (async (req, res, next) => {
    await authService.verifyOtp(req.body); // <-- verifyotp এর বদলে verifyOtp
    res.status(200).json(new ApiResponse (200, null, 'Account verified! You can now login.'));
});

exports.login = asyncHandler(async (req, res, next) => {
    const { user, accessToken, refreshToken } = await authService.loginUser(req.body);
    res
        .status(200)
        .cookie('refreshToken', refreshToken, cookieOptions)
        .json(new ApiResponse(200, { user, accessToken }, 'Login successful! 🚀'));
});

exports.googleLogin = asyncHandler(async (req, res, next) => {
    const { token } = req.body;
    if (!token) {
        return next(new ApiError(400, 'Google token is missing!'));
    }
    const { user, accessToken, refreshToken } = await authService.googleLoginService(token);
    res
        .status(200)
        .cookie('refreshToken', refreshToken, cookieOptions)
        .json(new ApiResponse(200, { user, accessToken }, 'Google Login Successful! 🎉'));
});

exports.refreshTokenHandler = asyncHandler(async (req, res, next) => {
    const incomingToken = req.cookies?.refreshToken;
    const { accessToken } = await authService.refreshAccessToken(incomingToken);
    res.status(200).json(new ApiResponse(200, { accessToken }, 'Token refreshed.'));
});

exports.logout = asyncHandler(async (req, res, next) => {
    if (req.user?._id) {
        await authService.logoutUser(req.user._id);
    }
    res
        .status(200)
        .clearCookie('refreshToken', cookieOptions)
        .json(new ApiResponse(200, null, 'Logged out successfully! 👋'));
});

exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    await authService.forgotPasswordService(email);
    res.status(200).json(new ApiResponse(200, null, 'OTP sent to your email! 📩'));
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
    await authService.resetPasswordService(req.body);
    res.status(200).json(new ApiResponse(200, null, 'Password reset successful! ✅'));
});
