const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

// রিয়েল-টাইম ডেটা ফেচ এবং ইমেইল পাঠানোর রাউট
router.get('/dashboard-data', verifyToken, adminController.getDashboardData);
router.post('/send-email', verifyToken, adminController.sendBroadcastEmail);

module.exports = router;