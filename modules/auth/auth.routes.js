const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('./auth.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const {
    signupValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    validate
} = require('./auth.validation');

// ============================================
// Rate Limiters — handler function use করা হচ্ছে
// message object use করলে next() call হয় না!
// ============================================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: function (req, res) {
        return res.status(429).json({
            success: false,
            message: 'Too many login attempts! Try again after 15 minutes.'
        });
    }
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: function (req, res) {
        return res.status(429).json({
            success: false,
            message: 'Too many requests! Try again later.'
        });
    }
});

// ============================================
// Routes
// ============================================
router.post('/signup', authLimiter, signupValidation, validate, authController.signup);
router.post('/verify-otp', authLimiter, authController.verifyOTP);
router.post('/login', loginLimiter, loginValidation, validate, authController.login);
router.post('/google', authController.googleLogin);
router.get('/refresh', authController.refreshTokenHandler);
router.post('/logout', verifyToken, authController.logout);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, validate, authController.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidation, validate, authController.resetPassword);

module.exports = router;
