const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { verifyToken } = require('../../middlewares/auth.middleware'); 

// 🔥 Ekhane 'upload' er bodole 'uploadProfile' import kora holo
const { uploadProfile } = require('../../middlewares/upload.middleware');

// User Profile Routes
router.get('/profile', verifyToken, userController.getProfile);
router.put('/update', verifyToken, userController.updateProfile);
router.post('/verify-email', verifyToken, userController.verifyNewEmail);
router.put('/change-password', verifyToken, userController.changePassword);

// 🔥 Ekhane uploadProfile.single('image') use kora holo
router.post('/upload-image', verifyToken, uploadProfile.single('image'), userController.uploadImage);

router.delete('/delete', verifyToken, userController.deleteAccount);

// Admin Request Routes
router.post('/request-admin', verifyToken, userController.requestAdminAccess);

// Developer Magic Link Route
router.get('/developer/:action/:userId/:token', userController.handleAdminRequest);

module.exports = router;