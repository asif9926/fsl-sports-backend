const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        mongoose.set('strictQuery', true);
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected!');
        });
    } catch (err) {
        console.error(`❌ Database Connection Failed: ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
