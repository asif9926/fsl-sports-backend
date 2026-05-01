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
// Core Brevo HTTP API Sender Function
// ==========================================
const sendViaBrevoAPI = async (toEmail, toName, subject, htmlContent) => {
    // এখানে আপনার Brevo অ্যাকাউন্টের জিমেইলটি দিন (Sender Email)
    const senderEmail = 'jihad2080k@gmail.com'; 
    
    const payload = {
        sender: { name: 'FSL-SPORTS', email: senderEmail },
        to: [{ email: toEmail, name: toName || 'User' }],
        subject: subject,
        htmlContent: htmlContent
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(JSON.stringify(errData));
    }
    return await response.json();
};

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
                </div>
                ${emailFooter}
            </div>
        `;

        await sendViaBrevoAPI(to, username, subjects[type], html);
        console.log(`[HTTP API] OTP successfully sent to ${to}`);
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
                    <p style="color: #9ca3af; font-size: 15px; line-height: 1.7; margin-bottom: 35px;">Thank you for verifying your account. Explore your dashboard and experience top-notch security!</p>
                    <a href="${websiteUrl}" style="display: inline-block; padding: 14px 32px; background-color: #10B981; color: #050811; text-decoration: none; font-weight: 900; border-radius: 8px;">🚀 Go to Dashboard</a>
                </div>
                ${emailFooter}
            </div>
        `;
        await sendViaBrevoAPI(to, username, 'Welcome to FSL-SPORTS! 🎉', html);
    } catch (error) {
        console.error(`[Email Error] Welcome Email failed:`, error.message);
    }
};

// ==========================================
// 3. Admin Request Status Email (Approved/Rejected)
// ==========================================
exports.sendAdminStatusEmail = async ({ to, username, status }) => {
    try {
        const isApproved = status === 'approve';
        const html = `<h2>Hello ${username}, your admin access request was ${isApproved ? 'Approved ✅' : 'Declined ❌'}.</h2>`;
        await sendViaBrevoAPI(to, username, 'Update: Your Admin Access Request', html);
    } catch (error) { throw error; }
};

// ==========================================
// 4. Magic Link (For Developer)
// ==========================================
exports.sendEmail = async ({ to, subject, html }) => {
    try {
        await sendViaBrevoAPI(to, 'User', subject, html);
    } catch (error) { throw error; }
};

// ==========================================
// 5. Broadcast Email (From Admin Dashboard)
// ==========================================
exports.sendBroadcastEmailToUsers = async ({ bccList, subject, body }) => {
    try {
        // Brevo API দিয়ে Broadcast মেইল পাঠানো (লুপ করে)
        const html = `
            <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; background-color: #0d131f;">
                ${emailHeader}
                <div style="padding: 40px 24px; color: #d1d5db; white-space: pre-wrap;">${body}</div>
                ${emailFooter}
            </div>
        `;
        
        // সব ইউজারকে একটি রিকোয়েস্টেই মেইল পাঠানো
        const bccArray = bccList.map(email => ({ email }));
        const payload = {
            sender: { name: 'FSL-SPORTS Admin', email: 'jihad2080k@gmail.com' },
            bcc: bccArray,
            subject: subject,
            htmlContent: html
        };

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'accept': 'application/json', 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Broadcast Failed");
        console.log(`[HTTP API] Broadcast email sent successfully!`);
    } catch (error) {
        console.error(`[Email Error] Failed to send Broadcast Email:`, error.message);
        throw error; //[cite: 4]
    }
};