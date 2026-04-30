const mongoose = require('mongoose');

const frameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Frame name is required'],
    trim: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Frame image URL is required']
  },
  cloudinary_id: {
    type: String,
    required: false 
  },
  category: {
    type: String,
    // 🔥 ফিক্স: এখানে 'Team' যোগ করা হয়েছে
    enum: ['Tournament', 'Team', 'Sponsor', 'General'], 
    default: 'Tournament'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Frame', frameSchema);