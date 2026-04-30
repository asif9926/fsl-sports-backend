const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'News title is required'],
        trim: true
    },
    content: {
        type: String,
        required: [true, 'News content is required']
    },
    imageUrl: {
        type: String,
        required: [true, 'News image is required']
    },
    cloudinary_id: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Cricket', 'Football', 'Tennis', 'Others'],
        default: 'Football'
    },
    author: {
        type: String, // আপাতত অ্যাডমিন নিজেই অথর
        default: 'Admin'
    },
    views: {
        type: Number,
        default: 0
    },
    // 🔥 NEW: External Link Field
    externalLink: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('News', newsSchema);