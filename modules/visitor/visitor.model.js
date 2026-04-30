const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    date: { 
        type: String, 
        required: true, 
        unique: true // ফরম্যাট: YYYY-MM-DD
    },
    uniqueIps: [{ 
        type: String // সারাদিনের ইউনিক আইপিগুলো এখানে জমা হবে
    }]
});

module.exports = mongoose.model('Visitor', visitorSchema);