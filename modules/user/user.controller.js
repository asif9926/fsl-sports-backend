const userService = require('./user.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

exports.getProfile = asyncHandler(async (req, res) => {
    const user = await userService.getUserProfile(req.user.id);
    res.status(200).json(new ApiResponse(200, user, 'Profile fetched successfully'));
});

exports.updateProfile = asyncHandler(async (req, res) => {
    const result = await userService.updateProfileService(req.user.id, req.body);
    res.status(200).json(new ApiResponse(200, result, result.requireOtp ? 'OTP sent to new email' : 'Profile updated successfully'));
});

exports.verifyNewEmail = asyncHandler(async (req, res) => {
    const email = await userService.verifyNewEmailService(req.user.id, req.body.otp);
    res.status(200).json(new ApiResponse(200, { email }, 'Email updated successfully'));
});

exports.changePassword = asyncHandler(async (req, res) => {
    await userService.changePasswordService(req.user.id, req.body);
    res.status(200).json(new ApiResponse(200, null, 'Password updated successfully'));
});

exports.uploadImage = asyncHandler(async (req, res) => {
    const imagePath = await userService.uploadImageService(req.user.id, req.file);
    res.status(200).json(new ApiResponse(200, { image: imagePath }, 'Image uploaded successfully'));
});

exports.deleteAccount = asyncHandler(async (req, res) => {
    await userService.deleteAccountService(req.user.id);
    res.status(200).json(new ApiResponse(200, null, 'Account deleted successfully'));
});

// 🔥 NEW 1: ইউজার যখন ফ্রন্টএন্ড থেকে অ্যাডমিন হওয়ার রিকোয়েস্ট পাঠাবে
exports.requestAdminAccess = asyncHandler(async (req, res) => {
    await userService.requestAdminAccessService(req.user.id);
    res.status(200).json(new ApiResponse(200, null, 'Admin request sent to developer! Please wait for approval.'));
});

// 🔥 NEW 2: ডেভেলপার যখন ইমেইলের "Approve/Reject" লিংকে ক্লিক করবে
exports.handleAdminRequest = asyncHandler(async (req, res) => {
    const { action, userId, token } = req.params;
    const message = await userService.handleAdminRequestByDeveloper(userId, token, action);
    
    // লিংকে ক্লিক করলে ব্রাউজারে ডিরেক্ট এই সুন্দর পেজটি ওপেন হবে
    res.status(200).send(`
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background-color: #f3f4f6;">
            <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
                <h2 style="color: ${action === 'approve' ? '#10B981' : '#EF4444'}; font-size: 24px;">${message}</h2>
                <p style="color: #6B7280; margin-top: 10px;">You can now safely close this tab.</p>
            </div>
        </div>
    `);
});