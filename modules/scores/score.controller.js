const axios = require('axios');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const FslMatch = require('./fslMatch.model'); 

let cricketCache = { data: null, lastFetched: null };
let footballCache = { data: null, lastFetched: null };

// ৫ মিনিটের ক্যাশ
const CACHE_DURATION = 5 * 60 * 1000; 

// আপনার RapidAPI Key 
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// ==========================================
// NEW API Data Formatter (Perfectly Mapped!)
// ==========================================
const formatNewCricketData = (apiResponse) => {
    let formattedMatches = [];
    
    // API রেসপন্সের 'data' প্রপার্টির ভেতরে মূলত অ্যারেটি আছে
    const matchesArray = apiResponse?.data || [];

    matchesArray.forEach(m => {
        // নতুন API এর সঠিক Key অনুযায়ী ডেটা নেওয়া হচ্ছে
        let team1 = m.team_a || 'Team 1';
        let team2 = m.team_b || 'Team 2';
        
        // স্কোর যদি না থাকে (যেমন এখনো ব্যাট করেনি), তাহলে '0' দেখাবে
        let score1 = m.team_a_scores || '0';
        let score2 = m.team_b_scores || '0';

        // স্ট্যাটাস একটু সুন্দর করে দেখানোর জন্য need_run_ball অথবা toss ব্যবহার করা হলো
        let statusText = m.need_run_ball || m.toss || m.match_status || 'Match info unavailable';

        // ফ্রন্টএন্ড ঠিক যে ফরম্যাটে ডেটা চায়, সেভাবে পুশ করা হচ্ছে
        formattedMatches.push({
            matchType: m.series || m.match_type || 'Match',
            name: `${team1} vs ${team2}`,
            teams: [team1, team2],
            status: statusText,
            score: [ { r: score1 }, { r: score2 } ] 
        });
    });

    return formattedMatches;
};

// ১. Cricket Live Scores (New API: cricket-live-line1)
exports.getCricketScores = asyncHandler(async (req, res) => {
    const now = Date.now();
    if (cricketCache.data && (now - cricketCache.lastFetched < CACHE_DURATION)) {
        return res.status(200).json(new ApiResponse(200, cricketCache.data, "Fetched from cache"));
    }

    const options = {
        method: 'GET',
        url: 'https://cricket-live-line1.p.rapidapi.com/liveMatches',
        headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'cricket-live-line1.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        timeout: 10000
    };

    try {
        const response = await axios.request(options);
        cricketCache.data = formatNewCricketData(response.data); // Formatter দিয়ে ডেটা পার্স করা হচ্ছে
        cricketCache.lastFetched = now;

        res.status(200).json(new ApiResponse(200, cricketCache.data, "Fetched Live Data"));
    } catch (error) {
        console.error("New Cricket API Error:", error.message);
        res.status(200).json(new ApiResponse(200, cricketCache.data || [], "Failed to fetch from API"));
    }
});

// ২. Football Live Scores (AllSportsAPI - Unchanged)
exports.getFootballScores = asyncHandler(async (req, res) => {
    const now = Date.now();
    if (footballCache.data && (now - footballCache.lastFetched < CACHE_DURATION)) {
        return res.status(200).json(new ApiResponse(200, footballCache.data, "Fetched from cache"));
    }

    const options = {
        method: 'GET',
        url: 'https://allsportsapi2.p.rapidapi.com/api/matches/live', 
        headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'allsportsapi2.p.rapidapi.com'
        },
        timeout: 10000
    };

    try {
        const response = await axios.request(options);
        footballCache.data = response.data.events || response.data.matches || response.data || [];
        footballCache.lastFetched = now;

        res.status(200).json(new ApiResponse(200, footballCache.data, "Fetched AllSports Live Data"));
    } catch (error) {
        console.error("Football API Error:", error.message);
        res.status(200).json(new ApiResponse(200, footballCache.data || [], "Failed to fetch from API"));
    }
});

// ৩. Get Recent/Completed Matches (New API & AllSportsAPI)
exports.getRecentResults = asyncHandler(async (req, res) => {
    const { sport } = req.params;
    let resultsData = [];

    try {
        if (sport === 'cricket') {
            const options = {
                method: 'GET',
                url: 'https://cricket-live-line1.p.rapidapi.com/recentMatches',
                headers: {
                    'x-rapidapi-key': RAPIDAPI_KEY,
                    'x-rapidapi-host': 'cricket-live-line1.p.rapidapi.com',
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            };
            const response = await axios.request(options);
            resultsData = formatNewCricketData(response.data); // Formatter দিয়ে ডেটা পার্স করা হচ্ছে
            
        } else if (sport === 'football') {
            const options = {
                method: 'GET',
                url: 'https://allsportsapi2.p.rapidapi.com/api/events/schedule',
                params: { date: new Date().toISOString().split('T')[0] },
                headers: {
                    'x-rapidapi-key': RAPIDAPI_KEY,
                    'x-rapidapi-host': 'allsportsapi2.p.rapidapi.com'
                },
                timeout: 10000
            };
            const response = await axios.request(options);
            resultsData = response.data.events || response.data.matches || response.data || [];
        }

        res.status(200).json(new ApiResponse(200, resultsData, `${sport} recent results fetched successfully`));
    } catch (error) {
        console.error(`Results Error (${sport}):`, error.message); 
        res.status(200).json(new ApiResponse(200, [], "Failed to fetch recent results"));
    }
});

// ==========================================
// FSL PREMIUM SECTION LOGIC (Unchanged)
// ==========================================
exports.getFslData = asyncHandler(async (req, res) => {
    const { sport } = req.params;
    let fslData = await FslMatch.findOne({ sportType: sport });
    
    if (!fslData) {
        fslData = {
            sportType: sport,
            match1: { teamA: 'Team A', scoreA: '-', oversA: '', teamB: 'Team B', scoreB: '-', oversB: '', label: 'LIVE', bottomText: '', isLive: false },
            match2: { teamA: 'Team C', scoreA: '-', oversA: '', teamB: 'Team D', scoreB: '-', oversB: '', label: 'Upcoming', bottomText: '', isLive: false },
            tournamentLink: ''
        };
    }
    res.status(200).json(new ApiResponse(200, fslData, `FSL ${sport} data fetched`));
});

exports.updateFslData = asyncHandler(async (req, res) => {
    const { sport } = req.params;
    const { match1, match2, tournamentLink } = req.body;

    // ১. ডেটাবেসে আপডেট করা হলো
    const updatedFslData = await FslMatch.findOneAndUpdate(
        { sportType: sport },
        { $set: { match1, match2, tournamentLink } },
        { new: true, upsert: true }
    );

    // ২. 🔥 Socket.IO এর মাধ্যমে রিয়েল-টাইম ব্রডকাস্ট 
    const io = req.app.get('io'); 
    if (io) {
        io.emit('fsl_score_updated', updatedFslData);
    }

    res.status(200).json(new ApiResponse(200, updatedFslData, `FSL ${sport} board updated!`));
});