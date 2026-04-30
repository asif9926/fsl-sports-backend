const Groq = require('groq-sdk');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

// Groq ইনিশিয়ালাইজ করা হচ্ছে (API Key .env থেকে নেবে)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.generateCaption = asyncHandler(async (req, res, next) => {
    const { mood } = req.body;

    if (!mood) {
        return next(new ApiError(400, 'Mood is required to generate caption!'));
    }

    // AI-কে কড়া নির্দেশ (Prompt) দেওয়া হচ্ছে যাতে শুধু সুন্দর ক্যাপশন দেয়, ফালতু কথা না বলে
    // 🔥 Advanced Context-Aware Premium Prompt
    const prompt = `Act as an elite Sports Social Media Copywriter for a premium platform named 'FSL-SPORTS'. Generate a highly engaging, viral-worthy social media caption based on this input/mood: "${mood}".

    Tone & Context Rules:
    1. If the input feels like a FAN (e.g., hype, banter, match reaction), make the tone highly energetic, passionate, and slightly informal.
    2. If the input feels like TOURNAMENT MANAGEMENT (e.g., official announcements, match results, fixtures), make the tone professional, authoritative, yet thrilling.

    Formatting Rules:
    - Start with a strong, attention-grabbing hook.
    - Keep the body concise and punchy (max 2-3 sentences).
    - Seamlessly integrate 2-4 highly relevant sports emojis.
    - Add 3 trending hashtags, ALWAYS including #FSLSports and #FanZone.
    - STRICT RULE: Output ONLY the caption. No conversational filler, no quotes, no "Here is your caption" text.`;


    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            // 🔥 এখানে পুরোনো 'llama3-8b-8192' মুছে নিচের নতুন মডেলটি দিন:
            model: 'llama-3.1-8b-instant', 
            temperature: 0.7,
            max_tokens: 100,
        });

        const caption = chatCompletion.choices[0]?.message?.content || "Legendary moments! 🏆⚽";

        res.status(200).json(new ApiResponse(200, { caption }, 'Caption generated magically!'));
    } catch (error) {
        console.error("Groq AI Error:", error);
        return next(new ApiError(500, 'AI is sleeping right now. Try again later!'));
    }
});