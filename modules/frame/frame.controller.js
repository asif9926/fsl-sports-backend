const Frame = require('./frame.model');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const cloudinary = require('cloudinary').v2; // Cloudinary import kora holo

// @desc    Upload a new frame (Admin Only)
exports.addFrame = asyncHandler(async (req, res, next) => {
    const { name, category } = req.body;

    if (!req.file) {
        return next(new ApiError(400, 'Frame image is required!'));
    }

    // Cloudinary থেকে পাওয়া ইমেজের URL এবং ID সেভ করা হচ্ছে
    const frame = await Frame.create({
        name,
        category,
        imageUrl: req.file.path,
        cloudinary_id: req.file.filename // এই ID টি ডিলিট করার সময় কাজে লাগবে
    });

    res.status(201).json(new ApiResponse(201, frame, 'Frame uploaded successfully!'));
});

// @desc    Get all active frames (Public)
exports.getFrames = asyncHandler(async (req, res, next) => {
    const frames = await Frame.find({ isActive: true }).sort('-createdAt');
    res.status(200).json(new ApiResponse(200, frames, 'Frames fetched successfully'));
});

// @desc    Delete a frame (Admin Only)
exports.deleteFrame = asyncHandler(async (req, res, next) => {
    const frame = await Frame.findById(req.params.id);
    if (!frame) return next(new ApiError(404, 'Frame not found!'));

    // ১. Cloudinary থেকে আসল ছবিটি ডিলিট করা
    if (frame.cloudinary_id) {
        await cloudinary.uploader.destroy(frame.cloudinary_id);
    }

    // ২. Database থেকে ফ্রেমের ডাটা ডিলিট করা
    await frame.deleteOne();
    
    res.status(200).json(new ApiResponse(200, null, 'Frame deleted successfully!'));
});