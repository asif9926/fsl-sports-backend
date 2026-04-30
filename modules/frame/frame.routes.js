const express = require('express');
const router = express.Router();
const frameController = require('./frame.controller');

// 🔥 FIX: uploadPost-er bodole uploadFrame ekhane import kora holo
const { uploadFrame } = require('../../middlewares/upload.middleware');
const { verifyToken } = require('../../middlewares/auth.middleware');

// ফ্রেম আনার রাউট
router.get('/', frameController.getFrames);

// 🔥 FIX: uploadPost.single-er bodole uploadFrame.single deya holo
router.post('/upload', verifyToken, uploadFrame.single('frameImage'), frameController.addFrame);

// ফ্রেম ডিলিট করার রাউট
router.delete('/:id', verifyToken, frameController.deleteFrame);

module.exports = router;