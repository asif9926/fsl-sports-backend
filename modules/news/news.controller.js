const News = require('./news.model');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const cloudinary = require('cloudinary').v2;

// Maximum News Limit (স্টোরেজ বাঁচানোর জন্য)
const MAX_NEWS_LIMIT = 30;

// @desc    Create new news with Auto-Delete logic (Admin Only)
exports.createNews = asyncHandler(async (req, res, next) => {
    // 🔥 NEW: externalLink রিসিভ করা হলো
    const { title, content, category, externalLink } = req.body;

    if (!req.file) {
        return next(new ApiError(400, 'News image is required!'));
    }

    // ১. নতুন নিউজ ডাটাবেসে সেভ করা
    const news = await News.create({
        title,
        content,
        category,
        externalLink, // 🔥 NEW: সেভ করা হলো
        imageUrl: req.file.path,
        cloudinary_id: req.file.filename
    });

    // ২. Premium Auto-Delete Logic 
    const totalNews = await News.countDocuments();
    
    if (totalNews > MAX_NEWS_LIMIT) {
        // সবচেয়ে পুরনো নিউজগুলো খুঁজে বের করা
        const oldestNews = await News.find().sort({ createdAt: 1 }).limit(totalNews - MAX_NEWS_LIMIT);
        
        for (const oldItem of oldestNews) {
            // ক্লাউডিনারি থেকে ছবি ডিলিট করা (স্টোরেজ বাঁচানোর জন্য)
            if(oldItem.cloudinary_id) {
                await cloudinary.uploader.destroy(oldItem.cloudinary_id);
            }
            // ডাটাবেস থেকে ডিলিট করা
            await oldItem.deleteOne();
        }
    }

    res.status(201).json(new ApiResponse(201, news, 'News published successfully!'));
});

// @desc    Get all news (Public)
exports.getAllNews = asyncHandler(async (req, res, next) => {
    const news = await News.find().sort('-createdAt');
    res.status(200).json(new ApiResponse(200, news, 'News fetched successfully'));
});

// @desc    Get single news by ID (Public)
exports.getNewsById = asyncHandler(async (req, res, next) => {
    const news = await News.findById(req.params.id);
    
    if (!news) {
        return next(new ApiError(404, 'News not found!'));
    }

    // ভিউ কাউন্ট বাড়ানো
    news.views += 1;
    await news.save();

    res.status(200).json(new ApiResponse(200, news, 'News fetched successfully'));
});

// @desc    Delete news (Admin Only)
exports.deleteNews = asyncHandler(async (req, res, next) => {
    const news = await News.findById(req.params.id);
    if (!news) return next(new ApiError(404, 'News not found!'));

    if (news.cloudinary_id) {
        await cloudinary.uploader.destroy(news.cloudinary_id);
    }

    await news.deleteOne();
    res.status(200).json(new ApiResponse(200, null, 'News deleted successfully!'));
});