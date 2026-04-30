const mongoose = require('mongoose');

const fanWallSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    imageUrl: { type: String, required: true },
    cloudinary_id: { type: String, required: true },
    // নতুন লাইন: লাইক কাউন্ট করার জন্য
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] 
}, { timestamps: true });

module.exports = mongoose.model('FanWall', fanWallSchema);