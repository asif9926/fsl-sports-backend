const express = require('express');
const router = express.Router();
const fanWallController = require('./fanwall.controller');

// Middlewares
const { verifyToken } = require('../../middlewares/auth.middleware');

// 🔥 Ekhane 'upload' er bodole 'uploadPost' import kora holo
const { uploadPost } = require('../../middlewares/upload.middleware');

// Public route (Shobai dekhte parbe)
router.get('/', fanWallController.getWallPosts);

// Protected route (Shudhu login kora user post korte parbe)
// 🔥 Ekhane uploadPost.single('image') use kora holo
router.post('/', verifyToken, uploadPost.single('image'), fanWallController.createPost);

router.put('/:id/like', verifyToken, fanWallController.toggleLike);
router.get('/my-posts', verifyToken, fanWallController.getMyPosts);

module.exports = router;