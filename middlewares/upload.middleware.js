const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const ApiError = require('../utils/ApiError');

// Cloudinary কনফিগারেশন
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new ApiError(400, 'Only JPEG, PNG, and WebP images are allowed!'), false);
    }
};

// ==========================================
// ১. প্রোফাইল পিকচারের জন্য স্টোরেজ (Overwrite Method)
// ==========================================
const profileStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'CoreAuth_Profiles', 
            public_id: `user_avatar_${req.user.id}`, // ফিক্সড নাম (স্টোরেজ বাঁচাবে)
            overwrite: true,
            invalidate: true,
            allowed_formats: ['jpeg', 'png', 'jpg', 'webp'],
            transformation: [{ width: 500, height: 500, crop: 'fill' }] 
        };
    }
});

// ==========================================
// ২. Fan Wall পোস্টের জন্য স্টোরেজ (Random ID Method)
// ==========================================
const postStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'FanWall_Posts', // আলাদা ফোল্ডারে সেভ হবে
        allowed_formats: ['jpeg', 'png', 'jpg', 'webp'],
        // এখানে public_id দেওয়া হয়নি, তাই ক্লাউডিনারি নিজে রেন্ডম নাম তৈরি করবে
        // ফলে একটি পোস্ট আরেকটিকে ডিলিট করবে না
    }
});

// এক্সপোর্ট করা হচ্ছে (Routes এ ব্যবহারের জন্য)
exports.uploadProfile = multer({
    storage: profileStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Max 2MB
    fileFilter
});

exports.uploadPost = multer({
    storage: postStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB (পোস্টের ছবি একটু বড় হতে পারে)
    fileFilter
});

// ==========================================
// ৩. Frame আপলোডের জন্য স্টোরেজ
// ==========================================
const frameStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'ZSports_Frames', 
        allowed_formats: ['png', 'webp'] // ফ্রেম সাধারণত transparent হয়, তাই png/webp
    }
});

exports.uploadFrame = multer({
    storage: frameStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
    fileFilter
});