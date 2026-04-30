const User = require('../user/user.model');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

const Visitor = require('../visitor/visitor.model');
// আপনার sendEmail.js এর সঠিক পাথ দিন (সাধারণত utils ফোল্ডারে থাকে)
const { sendBroadcastEmailToUsers } = require('../../utils/sendEmail'); 

// ১. ড্যাশবোর্ডের জন্য ইউজার এবং স্ট্যাটস আনা (Real Data)
exports.getDashboardData = asyncHandler(async (req, res, next) => {
    const verifiedUsers = await User.find({ isVerified: true }).select('username email isVerified');
    
    // 🌍 রিয়েল ভিজিটর ডাটা ফেচ করা
    const today = new Date().toISOString().split('T')[0];
    const todayData = await Visitor.findOne({ date: today });
    const allData = await Visitor.find();

    // আজকের ইউনিক ভিজিটর বের করা
    const todayVisits = todayData ? todayData.uniqueIps.length : 0;
    
    // সবদিনের ভিজিটর যোগ করে টোটাল ভিজিটর বের করা
    const totalVisits = allData.reduce((acc, curr) => acc + curr.uniqueIps.length, 0);

    const stats = {
        todayVisits: todayVisits, 
        totalVisits: totalVisits,
    };

    res.status(200).json(new ApiResponse(200, { stats, verifiedUsers }, 'Real Dashboard data fetched'));
});



// ২. ইমেইল ব্রডকাস্ট করা
exports.sendBroadcastEmail = asyncHandler(async (req, res, next) => {
    const { recipient, subject, body } = req.body;

    if (!subject || !body) return next(new ApiError(400, 'Subject and email body are required!'));

    let bccList = [];
    
    if (recipient === 'all') {
        const users = await User.find({ isVerified: true }).select('email');
        bccList = users.map(u => u.email);
        if(bccList.length === 0) return next(new ApiError(404, 'No verified users found.'));
    } else {
        bccList = [recipient]; // নির্দিষ্ট একজনকে
    }

    // আপনার গ্লোবাল ইমেইল ফাংশন কল করা হলো
    await sendBroadcastEmailToUsers({ bccList, subject, body });

    res.status(200).json(new ApiResponse(200, null, 'Email Broadcast Successful! 🚀'));
});