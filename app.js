const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/user/user.routes');
const frameRoutes = require('./modules/frame/frame.routes');
const fanWallRoutes = require('./modules/fanwall/fanwall.routes');
const scoreRoutes = require('./modules/scores/score.routes');
const newsRoutes = require('./modules/news/news.routes');
const aiRoutes = require('./modules/ai/ai.routes'); // Ai chat
const adminRoutes = require('./modules/admin/admin.routes');
const Visitor = require('./modules/visitor/visitor.model');

const app = express();

// Trust Proxy - ডেপ্লয়মেন্ট এবং রেট লিমিটিংয়ের জন্য অত্যন্ত জরুরি
app.set('trust proxy', 1);

// Security middlewares

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" } 
}));

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Logger (development only)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Static files (যেহেতু এখন Cloudinary ব্যবহার করছেন, তাই লোকাল uploads ফোল্ডারের আর দরকার নেই)
// app.use('/uploads', express.static('uploads'));

// 🔥 Auto Visitor Tracking Middleware
app.use(async (req, res, next) => {
    // শুধুমাত্র GET রিকোয়েস্ট (পেজ ভিজিট) কাউন্ট করব
    if (req.method === 'GET') {
        try {
            const today = new Date().toISOString().split('T')[0]; // আজকের তারিখ (যেমন: 2026-04-27)
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

            // $addToSet এর কারণে একই IP বারবার যুক্ত হবে না, ডাটাবেস একদম ক্লিন থাকবে!
            await Visitor.updateOne(
                { date: today },
                { $addToSet: { uniqueIps: ip } }, 
                { upsert: true }
            );
        } catch (error) {
            console.error("Visitor tracking error:", error.message);
        }
    }
    next();
});



// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/frames', frameRoutes);
app.use('/api/v1/fanwall', fanWallRoutes);
app.use('/api/v1/scores', scoreRoutes);
app.use('/api/v1/news', newsRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/admin', adminRoutes); // API Routes

// 404 handler
app.use(function notFoundHandler(req, res, next) {
    res.status(404).json({
        success: false,
        message: 'Route not found: ' + req.method + ' ' + req.originalUrl
    });
});

// Global error handler
app.use(function globalErrorHandler(err, req, res, next) {
    console.error('Global Error X:', err.message);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message: message,
        errors: err.errors || []
    });
});

module.exports = app;