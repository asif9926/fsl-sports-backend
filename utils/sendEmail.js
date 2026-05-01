const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // এটি ব্যবহার করলে পোর্ট ও হোস্ট অটোমেটিক সেট হয়
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ট্রান্সপোর্টার ঠিক আছে কি না তা চেক করার জন্য একটি ভেরিফিকেশন কোড
transporter.verify(function (error, success) {
    if (error) {
        console.log("SMTP Connection Error: ", error);
    } else {
        console.log("Server is ready to take our messages");
    }
});

// ==========================================
// Reusable Premium Email UI Components
// ==========================================
const emailHeader = `
    <div style="background-color: #050811; padding: 30px 0; border-bottom: 1px solid #1f2937; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2px; font-style: italic;">
            <span style="color: #ffffff;">FSL</span><span style="color: #10B981;">-SPORTS</span>
        </h1>
    </div>
`;

const emailFooter = `
    <div style="background-color: #0a0f18; padding: 30px 20px; border-top: 1px solid #1f2937; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0 0 15px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Need Help? Contact Us</p>
        <div style="margin-top: 10px;">
            <a href="https://wa.me/8801710256453" style="display: inline-block; padding: 10px 18px; background-color: #050811; border: 1px solid #064e3b; color: #34d399; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; margin: 0 5px;">💬 WhatsApp</a>
            <a href="https://facebook.com/farajeesuperleague" style="display: inline-block; padding: 10px 18px; background-color: #050811; border: 1px solid #1e3a8a; color: #60a5fa; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; margin: 0 5px;">📘 Facebook</a>
        </div>
        <p style="margin: 25px 0 0; font-size: 10px; color: #4b5563; text-transform: uppercase; letter-spacing: 1px;">&copy; ${new Date().getFullYear()} FSL-SPORTS. All rights reserved.</p>
    </div>
`;

// ==========================================
// 1. OTP Email (Beautiful Premium UI)
// ==========================================
exports.sendOtpEmail = async ({ to, username, otp, type }) => {
    try {
        const subjects = {
            verification: 'Verify Your Account — FSL-SPORTS',
            reset: 'Password Reset Request — FSL-SPORTS',
            emailChange: 'Verify New Email — FSL-SPORTS'
        };
        const messages = {
            verification: 'Your account verification OTP is:',
            reset: 'Your password reset OTP is:',
            emailChange: 'Your email change OTP is:'
        };

        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; background-color: #0d131f; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                ${emailHeader}
                <div style="padding: 40px 24px;">
                    <p style="margin: 0 0 10px; font-size: 16px; color: #e5e7eb;">Hello, <strong style="color: #10B981;">${username || 'User'}</strong>!</p>
                    <p style="margin: 0 0 30px; font-size: 14px; color: #9ca3af;">${messages[type]}</p>
                    <div style="margin: 0 auto 30px; background-color: rgba(16, 185, 129, 0.05); border: 1px dashed rgba(16, 185, 129, 0.4); border-radius: 12px; padding: 20px; max-width: 280px;">
                        <h2 style="margin: 0; font-size: 38px; font-weight: 900; color: #10B981; letter-spacing: 12px; text-align: center; padding-left: 12px;">${otp}</h2>
                    </div>
                    <p style="margin: 0 0 10px; font-size: 12px; font-weight: bold; color: #f59e0b; text-transform: uppercase; letter-spacing: 1px;">⏳ Valid for 10 minutes only</p>
                    <p style="margin: 0; font-size: 11px; color: #6b7280;">Never share this OTP with anyone.</p>
                </div>
                ${emailFooter}
            </div>
        `;

        const info = await transporter.sendMail({ from: `"FSL-SPORTS Security" <${process.env.EMAIL_USER}>`, to, subject: subjects[type], html });
        console.log(`[Email Sent] OTP to ${to} (Message ID: ${info.messageId})`);
    } catch (error) {
        console.error(`[Email Error] Failed to send OTP to ${to}:`, error.message);
        throw error;
    }
};

// ==========================================
// 2. Welcome Email (After Registration)
// ==========================================
exports.sendWelcomeEmail = async ({ to, username }) => {
    try {
        const websiteUrl = process.env.FRONTEND_URL || 'http://localhost:5173/login';

        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; background-color: #0d131f; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                ${emailHeader}
                <div style="padding: 40px 24px; text-align: center;">
                    <h2 style="color: #f3f4f6; margin-top: 0; font-size: 22px;">Welcome to the family, <span style="color: #10B981;">${username}</span>! 🎉</h2>
                    <p style="color: #9ca3af; font-size: 15px; line-height: 1.7; margin-bottom: 35px;">
                        Thank you for verifying your account. We are thrilled to have you on board! Explore your dashboard and experience top-notch security with our platform.
                    </p>
                    <a href="${websiteUrl}" style="display: inline-block; padding: 14px 32px; background-color: #10B981; color: #050811; text-decoration: none; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; border-radius: 8px; font-size: 14px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                        🚀 Go to Dashboard
                    </a>
                </div>
                ${emailFooter}
            </div>
        `;

        const info = await transporter.sendMail({ from: `"FSL-SPORTS Team" <${process.env.EMAIL_USER}>`, to, subject: 'Welcome to FSL-SPORTS! 🎉', html });
        console.log(`[Email Sent] Welcome email to ${to} (Message ID: ${info.messageId})`);
    } catch (error) {
        console.error(`[Email Error] Failed to send Welcome Email to ${to}:`, error.message);
        throw error;
    }
};

// ==========================================
// 3. Admin Request Status Email (Approved/Rejected)
// ==========================================
exports.sendAdminStatusEmail = async ({ to, username, status }) => {
    try {
        const isApproved = status === 'approve';
        const websiteUrl = process.env.FRONTEND_URL || 'http://localhost:5173/login';
        
        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; background-color: #0d131f; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                <div style="background-color: ${isApproved ? '#064e3b' : '#7f1d1d'}; border-bottom: 1px solid ${isApproved ? '#047857' : '#b91c1c'}; padding: 25px 0; color: ${isApproved ? '#34d399' : '#f87171'}; text-align: center;">
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">${isApproved ? 'Request Approved! ✅' : 'Request Declined ❌'}</h1>
                </div>
                <div style="padding: 40px 24px; text-align: center;">
                    <p style="margin: 0 0 20px; font-size: 16px; color: #e5e7eb;">Hello, <strong style="color: ${isApproved ? '#10B981' : '#ef4444'};">${username}</strong>!</p>
                    <p style="color: #9ca3af; font-size: 14px; line-height: 1.7; margin-bottom: 35px;">
                        ${isApproved 
                            ? 'Great news! Your request for Admin Access has been approved by the developer. You now have full access to the Admin Dashboard.' 
                            : 'We regret to inform you that your request for Admin Access has been declined at this time. You can continue using your standard user profile.'}
                    </p>
                    <a href="${websiteUrl}" style="display: inline-block; padding: 14px 28px; background-color: #1f2937; border: 1px solid #374151; color: #e5e7eb; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
                        ${isApproved ? 'Explore Admin Panel' : 'Go to Profile'}
                    </a>
                </div>
                ${emailFooter}
            </div>
        `;

        const info = await transporter.sendMail({ from: `"FSL-SPORTS Support" <${process.env.EMAIL_USER}>`, to, subject: `Update: Your Admin Access Request`, html });
        console.log(`[Email Sent] Admin status update to ${to}`);
    } catch (error) {
        console.error(`[Email Error] Failed to send Admin Status to ${to}:`, error.message);
        throw error;
    }
};

// ==========================================
// 4. Magic Link (For Developer)
// ==========================================
exports.sendEmail = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({ from: `"FSL-SPORTS System" <${process.env.EMAIL_USER}>`, to, subject, html });
        console.log(`[Email Sent] Custom email to ${to}`);
    } catch (error) {
        console.error(`[Email Error] Failed to send custom email to ${to}:`, error.message);
        throw error;
    }
};

// ==========================================
// 5. Broadcast Email (From Admin Dashboard)
// ==========================================
exports.sendBroadcastEmailToUsers = async ({ bccList, subject, body }) => {
    try {
        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; background-color: #0d131f; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                ${emailHeader}
                <div style="padding: 40px 24px;">
                    <h2 style="color: #10B981; text-align: center; text-transform: uppercase; letter-spacing: 2px; margin-top: 0; font-size: 18px;">System Update</h2>
                    <div style="background-color: #050811; padding: 25px; border-radius: 12px; border: 1px solid #1f2937; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);">
                        <p style="white-space: pre-wrap; font-size: 15px; color: #d1d5db; line-height: 1.8; margin: 0;">${body}</p>
                    </div>
                    <p style="font-size: 11px; color: #6b7280; text-align: center; margin-top: 25px; text-transform: uppercase; letter-spacing: 0.5px;">This is an official broadcast email from the FSL-SPORTS Admin Desk. Please do not reply directly to this email.</p>
                </div>
                ${emailFooter}
            </div>
        `;

        const info = await transporter.sendMail({ 
            from: `"FSL-SPORTS Admin" <${process.env.EMAIL_USER}>`, 
            bcc: bccList, 
            subject: subject, 
            html 
        });
        console.log(`[Email Sent] Broadcast email sent to ${bccList.length} users successfully!`);
    } catch (error) {
        console.error(`[Email Error] Failed to send Broadcast Email:`, error.message);
        throw error; // Controller error catch korar jonno
    }
};