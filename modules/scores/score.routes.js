const express = require('express');
const router = express.Router();
const scoreController = require('./score.controller');

// আপনার auth.middleware.js থেকে ফাংশনগুলো ইমপোর্ট করুন
// (পাথটি আপনার প্রজেক্ট স্ট্রাকচার অনুযায়ী ঠিক করে নেবেন, আমি আপনার আগের ফাইলের লোকেশন অনুযায়ী দিলাম)
const { verifyToken, isAdmin } = require('../../middlewares/auth.middleware');

// ==========================================
// পাবলিক রাউট (যেকোনো ইউজার বা ভিজিটর দেখতে পারবে)
// ==========================================
router.get('/football', scoreController.getFootballScores);
router.get('/cricket', scoreController.getCricketScores);
router.get('/:sport/results', scoreController.getRecentResults);
router.get('/fsl/:sport', scoreController.getFslData); 


// ==========================================
// প্রটেকটেড রাউট (শুধুমাত্র অ্যাডমিন পরিবর্তন করতে পারবে)
// ==========================================
// প্রথমে verifyToken চেক করবে ইউজার লগ-ইন কিনা, তারপর isAdmin চেক করবে তার রোল অ্যাডমিন কিনা
router.put('/fsl/:sport', verifyToken, isAdmin, scoreController.updateFslData);


module.exports = router;