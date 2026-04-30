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
// Cricbuzz Data Formatter (ম্যাজিক ট্রিক!)
// ==========================================
const formatCricbuzzData = (cricbuzzData) => {
    let formattedMatches = [];
    if (!cricbuzzData || !cricbuzzData.typeMatches) return [];

    cricbuzzData.typeMatches.forEach(type => {
        if (type.seriesMatches) {
            type.seriesMatches.forEach(series => {
                if (series.seriesAdWrapper && series.seriesAdWrapper.matches) {
                    series.seriesAdWrapper.matches.forEach(m => {
                        const info = m.matchInfo;
                        const scoreInfo = m.matchScore;
                        
                        let team1 = info.team1?.teamName || 'Team 1';
                        let team2 = info.team2?.teamName || 'Team 2';
                        
                        let r1 = '0';
                        let r2 = '0';
                        
                        // স্কোর, উইকেট এবং ওভার সুন্দরভাবে সাজানো হচ্ছে
                        if (scoreInfo) {
                            if (scoreInfo.team1Score) {
                                const s = scoreInfo.team1Score.inngs2 || scoreInfo.team1Score.inngs1;
                                if (s) r1 = s.wickets ? `${s.runs}/${s.wickets} (${s.overs})` : `${s.runs}`;
                            }
                            if (scoreInfo.team2Score) {
                                const s = scoreInfo.team2Score.inngs2 || scoreInfo.team2Score.inngs1;
                                if (s) r2 = s.wickets ? `${s.runs}/${s.wickets} (${s.overs})` : `${s.runs}`;
                            }
                        }
                        
                        // ফ্রন্টএন্ড ঠিক যে ফরম্যাটে ডেটা চায়, সেভাবে পুশ করা হচ্ছে
                        formattedMatches.push({
                            matchType: type.matchType || 'Match',
                            name: `${team1} vs ${team2}`,
                            teams: [team1, team2],
                            status: info.status || 'Match info unavailable',
                            score: [ { r: r1 }, { r: r2 } ] 
                        });
                    });
                }
            });
        }
    });
    return formattedMatches;
};

// ১. Cricket Live Scores (Cricbuzz API)
exports.getCricketScores = asyncHandler(async (req, res) => {
    const now = Date.now();
    if (cricketCache.data && (now - cricketCache.lastFetched < CACHE_DURATION)) {
        return res.status(200).json(new ApiResponse(200, cricketCache.data, "Fetched from cache"));
    }

    const options = {
        method: 'GET',
        url: 'https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live',
        headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com'
        },
        timeout: 10000
    };

    try {
        const response = await axios.request(options);
        cricketCache.data = formatCricbuzzData(response.data); // Formatter দিয়ে ডেটা পার্স করা হচ্ছে
        cricketCache.lastFetched = now;

        res.status(200).json(new ApiResponse(200, cricketCache.data, "Fetched Cricbuzz Live Data"));
    } catch (error) {
        console.error("Cricbuzz API Error:", error.message);
        res.status(200).json(new ApiResponse(200, cricketCache.data || [], "Failed to fetch from API"));
    }
});

// ২. Football Live Scores (AllSportsAPI)
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

// ৩. Get Recent/Completed Matches (Cricbuzz & AllSportsAPI)
exports.getRecentResults = asyncHandler(async (req, res) => {
    const { sport } = req.params;
    let resultsData = [];

    try {
        if (sport === 'cricket') {
            const options = {
                method: 'GET',
                url: 'https://cricbuzz-cricket.p.rapidapi.com/matches/v1/recent',
                headers: {
                    'x-rapidapi-key': RAPIDAPI_KEY,
                    'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com'
                },
                timeout: 10000
            };
            const response = await axios.request(options);
            resultsData = formatCricbuzzData(response.data); // Formatter দিয়ে ডেটা পার্স করা হচ্ছে
            
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

    // ২. 🔥 Socket.IO এর মাধ্যমে রিয়েল-টাইম ব্রডকাস্ট (সব ইউজারের কাছে পাঠানো)
    // (আপনার server.js এ app.set('io', io) করা থাকতে হবে, যা সাধারণত চ্যাট বানানোর সময় করা হয়)
    const io = req.app.get('io'); 
    if (io) {
        // 'fsl_score_updated' ইভেন্টে আপডেট হওয়া ডেটাটি পাঠিয়ে দিলাম
        io.emit('fsl_score_updated', updatedFslData);
    }

    res.status(200).json(new ApiResponse(200, updatedFslData, `FSL ${sport} board updated!`));
});