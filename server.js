require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { Server } = require('socket.io'); // 🔥 1. সকেট ইম্পোর্ট করা হলো

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectDB();

        // সার্ভারটি একটি ভেরিয়েবলে (server) রাখা হলো
        const server = app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📌 Environment: ${process.env.NODE_ENV}`);
        });

        // 🔥 ==========================================
        // PRO-LEVEL SOCKET.IO CONFIGURATION
        // ==========================================
        const io = new Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:5173',
                credentials: true,
                methods: ['GET', 'POST']
            }
        });
        
        // 🔥 এই লাইনটি যোগ করতে হবে যাতে কন্ট্রোলার থেকে io এক্সেস করা যায়!
        app.set('io', io);

        io.on('connection', (socket) => {
            console.log('🟢 A Fan connected to Live Chat:', socket.id);
            
            // ১. ইউজার নির্দিষ্ট রুমে জয়েন করবে (যেমন: 'fanwall_global')
            socket.on('join_room', (room) => {
                socket.join(room);
            });

            // ২. কেউ মেসেজ দিলে শুধু ওই রুমের সবাইকে পাঠিয়ে দেবে
            socket.on('send_message', (data) => {
                io.to(data.room).emit('receive_message', data);
            });
            
            // ৩. ইউজার বের হয়ে গেলে
            socket.on('disconnect', () => {
                console.log('🔴 Fan disconnected from Live Chat');
            });
        });
        // ==========================================

        process.on('SIGTERM', () => {
            server.close(() => {
                console.log('✅ Server closed.');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            server.close(() => {
                console.log('✅ Server closed.');
                process.exit(0);
            });
        });

        process.on('unhandledRejection', (err) => {
            console.error('❌ Unhandled Rejection:', err.message);
            server.close(() => process.exit(1));
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();