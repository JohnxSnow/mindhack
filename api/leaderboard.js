const fs = require('fs');
const path = require('path');

const LEADERBOARD_FILE = process.env.VERCEL 
    ? path.join('/tmp', 'leaderboard.json') 
    : path.join(__dirname, '..', 'leaderboard.json');

const INITIAL_LIST = [
    { rank: 1, name: "سەرکەوت (Sarkawt)", time: "14:22", date: "2026-11-12", token: "MH-MASTER-15-ALPHA-ZH" },
    { rank: 2, name: "ڕەوەند (Rawand)", time: "19:45", date: "2026-11-13", token: "MH-MASTER-15-BETA-ZH" }
];

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    try {
        if (fs.existsSync(LEADERBOARD_FILE)) {
            const data = fs.readFileSync(LEADERBOARD_FILE, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(data);
        }
    } catch (e) {}

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(INITIAL_LIST));
};
