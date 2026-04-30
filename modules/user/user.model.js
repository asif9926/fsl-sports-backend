const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: { type: String, select: false },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    adminRequestStatus: { type: String, enum: ['none', 'pending', 'rejected'], default: 'none' },
    profileImage: { type: String, default: "" },
    refreshToken: { type: String, default: null, select: false },
    otp: { type: String, select: false },
    expireAt: { type: Date, expires: 0, select: false }, // TTL auto-delete
    resetPasswordOtp: { type: String, default: null, select: false },
    resetPasswordExpires: { type: Date, default: null, select: false },
    pendingEmail: { type: String, default: null, select: false },
    otpCode: { type: String, default: null, select: false },
    otpExpires: { type: Date, default: null, select: false }
}, { timestamps: true });

// Mongoose 8.x-এ async function ব্যবহার করলে next() কল করার দরকার নেই, শুধু return করলেই হয়।
userSchema.pre('save', async function () { 
    if (!this.isModified('password') || !this.password) return; // next() বাদ দিন
    
    this.password = await bcrypt.hash(this.password, 12);
    // শেষের next() ও বাদ দিন
});

userSchema.methods.isPasswordCorrect = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.refreshToken;
    delete obj.otp;
    delete obj.expireAt;
    delete obj.resetPasswordOtp;
    delete obj.resetPasswordExpires;
    delete obj.pendingEmail;
    delete obj.otpCode;
    delete obj.otpExpires;
    delete obj.__v; // Fixed typo [cite: 659]
    return obj;
};

module.exports = mongoose.model('User', userSchema);