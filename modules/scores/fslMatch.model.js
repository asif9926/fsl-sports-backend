const mongoose = require('mongoose');

const matchDetailSchema = new mongoose.Schema({
    teamA: { type: String, default: 'Team A' },
    scoreA: { type: String, default: '-' },
    oversA: { type: String, default: '' }, // ক্রিকেটের জন্য
    teamB: { type: String, default: 'Team B' },
    scoreB: { type: String, default: '-' },
    oversB: { type: String, default: '' }, // ক্রিকেটের জন্য
    label: { type: String, default: 'LIVE' },
    bottomText: { type: String, default: '' },
    isLive: { type: Boolean, default: false }
});

const fslMatchSchema = new mongoose.Schema({
    sportType: { 
        type: String, 
        required: true, 
        unique: true, 
        enum: ['cricket', 'football'] 
    }, 
    match1: matchDetailSchema,
    match2: matchDetailSchema,
    tournamentLink: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('FslMatch', fslMatchSchema);