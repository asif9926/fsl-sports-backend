const express = require('express');
const router = express.Router();
const newsController = require('./news.controller');
const { uploadPost } = require('../../middlewares/upload.middleware');
const { verifyToken } = require('../../middlewares/auth.middleware');

router.get('/', newsController.getAllNews);
router.get('/:id', newsController.getNewsById);
router.post('/', verifyToken, uploadPost.single('newsImage'), newsController.createNews);
router.delete('/:id', verifyToken, newsController.deleteNews);

module.exports = router;