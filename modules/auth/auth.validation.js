const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg
        });
    }
    return next();
};

const signupValidation = [
    body('username').trim().notEmpty().withMessage('Username required!')
        .isLength({ min: 3 }).withMessage('Min 3 chars!')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Alphanumeric only!'),
    body('email').trim().isEmail().withMessage('Valid email required!').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Min 6 chars!')
        .matches(/\d/).withMessage('Must have a number!')
        .matches(/[!@#$%^&*]/).withMessage('Must have special char!')
];

const loginValidation = [
    body('email').isEmail().withMessage('Valid email required!'),
    body('password').notEmpty().withMessage('Password required!')
];

const forgotPasswordValidation = [
    body('email').isEmail().withMessage('Valid email required!')
];

const resetPasswordValidation = [
    body('email').isEmail().withMessage('Valid email required!'),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('6-digit OTP!'),
    body('newPassword').isLength({ min: 6 }).withMessage('Min 6 chars!')
];

module.exports = { validate, signupValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation };