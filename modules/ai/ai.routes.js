const express = require('express');
const router = express.Router();
const aiController = require('./ai.controller');

// 🔥 কোনো verifyToken নেই, সবাই অ্যাক্সেস করতে পারবে
router.post('/generate-caption', aiController.generateCaption);

module.exports = router;