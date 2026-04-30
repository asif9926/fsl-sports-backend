const jwt = require('jsonwebtoken');
const User = require('../modules/user/user.model'); // আপনার সঠিক পাথ দিন
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// ১. verifyToken (asyncHandler দিয়ে মোড়ানো হলো)
exports.verifyToken = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header('Authorization')?.replace('Bearer ', '').trim();

    if (!token) {
        // ম্যানুয়াল res.status এর বদলে ApiError থ্রো করা হলো
        throw new ApiError(401, 'Access denied! Please login to continue.');
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        const msg = err.name === 'TokenExpiredError' 
            ? 'Session expired. Please login again.' 
            : 'Invalid token. Please login again.';
        throw new ApiError(401, msg);
    }

    // পাসওয়ার্ড হাইড করে ইউজার ফেচ করা
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
        throw new ApiError(401, 'User account no longer exists!');
    }

    req.user = user;
    next();
});

// ২. isAdmin
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    // ApiError এর মাধ্যমে গ্লোবাল এরর হ্যান্ডলারে পাঠানো হচ্ছে
    next(new ApiError(403, 'Access denied! Admin privileges required.'));
};

// ৩. authorize
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
            return next(new ApiError(403, `Access denied! Required role: ${roles.join(' or ')}`));
        }
        next();
    };
};