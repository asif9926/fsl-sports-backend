const FanWall = require('./fanwall.model');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const cloudinary = require('cloudinary').v2;

// Maximum Post Limit Per User (এক ইউজার সর্বোচ্চ কয়টি ছবি রাখতে পারবে)
const USER_MAX_POSTS = 6;

// @desc    Upload a post to Fan Wall (with Per-User Auto-Delete logic)
exports.createPost = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new ApiError(400, 'Fan post image is required!'));
    }

    // 1. Notun post database e save kora
    const newPost = await FanWall.create({
        user: req.user._id,
        imageUrl: req.file.path,
        cloudinary_id: req.file.filename // Cloudinary ID for deletion
    });

    // 2. Premium Per-User Auto-Delete Logic 
    // শুধু রিকোয়েস্ট করা ইউজারের মোট পোস্ট কাউন্ট করা হচ্ছে
    const userTotalPosts = await FanWall.countDocuments({ user: req.user._id });
    
    if (userTotalPosts > USER_MAX_POSTS) {
        // শুধু এই ইউজারের সবচেয়ে পুরোনো ছবিগুলো খুঁজে বের করা
        const oldestPosts = await FanWall.find({ user: req.user._id })
            .sort({ createdAt: 1 })
            .limit(userTotalPosts - USER_MAX_POSTS);
        
        for (const post of oldestPosts) {
            // Cloudinary theke delete kora (Storage bachanor jonno)
            if(post.cloudinary_id) {
                await cloudinary.uploader.destroy(post.cloudinary_id);
            }
            // Database theke delete kora
            await post.deleteOne();
        }
    }

    res.status(201).json(new ApiResponse(201, newPost, 'Posted to Fan Wall successfully!'));
});

// @desc    Get all wall posts (Community Wall এর জন্য)
exports.getWallPosts = asyncHandler(async (req, res, next) => {
    // Sobcheye notun post shobar upore asbe
    const posts = await FanWall.find()
        .populate('user', 'username profileImage')
        .sort({ createdAt: -1 });
        
    res.status(200).json(new ApiResponse(200, posts, 'Fan Wall fetched successfully'));
});

// @desc    Get current user's gallery posts (Profile -> My Fan Gallery এর জন্য)
exports.getMyPosts = asyncHandler(async (req, res, next) => {
    // শুধু লগইন করা ইউজারের পোস্টগুলো ফেচ করবে
    const posts = await FanWall.find({ user: req.user._id })
        .sort({ createdAt: -1 });
        
    res.status(200).json(new ApiResponse(200, posts, 'User gallery fetched successfully'));
});

// @desc    Toggle Like on a post
exports.toggleLike = asyncHandler(async (req, res, next) => {
    const post = await FanWall.findById(req.params.id);
    if (!post) return next(new ApiError(404, 'Post not found'));

    // চেক করা ইউজার আগে লাইক দিয়েছে কিনা
    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
        // লাইক থাকলে রিমুভ করবে (Unlike)
        post.likes.pull(req.user._id);
    } else {
        // না থাকলে যুক্ত করবে (Like)
        post.likes.push(req.user._id);
    }

    await post.save();
    res.status(200).json(new ApiResponse(200, { likes: post.likes.length, isLiked: !isLiked }, 'Like toggled successfully'));
});