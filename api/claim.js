const fs = require('fs');
const path = require('path');

const LEADERBOARD_FILE = process.env.VERCEL 
    ? path.join('/tmp', 'leaderboard.json') 
    : path.join(__dirname, '..', 'leaderboard.json');

function timeToSeconds(t) {
    const parts = (t || '99:99').split(':').map(Number);
    if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
    if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    return 99999;
}

function escapeHtml(str) {
    return (str || '').replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}

function readBody(req) {
    if (req.body !== undefined && req.body !== null) {
        if (typeof req.body === 'string') {
            try { return Promise.resolve(JSON.parse(req.body)); } catch (e) { return Promise.resolve({}); }
        }
        return Promise.resolve(req.body);
    }
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body || '{}'));
            } catch (e) {
                resolve({});
            }
        });
        req.on('error', () => resolve({}));
    });
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    }

    try {
        const data = await readBody(req);
        const name = (data.name || 'هاکەری نادیار').trim().slice(0, 30);
        const time = (data.time || '00:00').trim();
        const token = (data.token || '').trim();

        let list = [];
        try {
            if (fs.existsSync(LEADERBOARD_FILE)) {
                list = JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf-8'));
            }
        } catch (e) { list = []; }

        if (!list || list.length === 0) {
            list = [
                { rank: 1, name: "سەرکەوت (Sarkawt)", time: "14:22", date: "2026-11-12", token: "MH-MASTER-15-ALPHA-ZH" },
                { rank: 2, name: "ڕەوەند (Rawand)", time: "19:45", date: "2026-11-13", token: "MH-MASTER-15-BETA-ZH" }
            ];
        }

        if (token && list.some(entry => entry.token === token)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'ئەم کۆدە پێشتر لە تەختەی پێشەنگەکان تۆمار کراوە!' }));
        }

        list.push({
            name: escapeHtml(name),
            time: time,
            date: new Date().toISOString().split('T')[0],
            token: token
        });

        list.sort((a, b) => timeToSeconds(a.time) - timeToSeconds(b.time));
        list = list.slice(0, 50);
        list.forEach((entry, i) => entry.rank = i + 1);

        try {
            fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(list, null, 2), 'utf-8');
        } catch (e) {}

        const savedEntry = list.find(entry => entry.token === token) || list[0];
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, entry: savedEntry }));
    } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'هەڵە لە تۆمارکردن!' }));
    }
};
