/**
 * MIND_HACK & دۆسیە تاریکەکان - Ultimate Secure Backend Server
 * Developer: Zhiyar Hemn (ژیار هێمن)
 * Leaderboard, Anti-Brute-Force, Token Verification & Static Server
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const LEADERBOARD_FILE = path.join(ROOT_DIR, 'leaderboard.json');
const SERVER_SECRET = crypto.randomBytes(32).toString('hex');

// Initialize Leaderboard file if not exists
if (!fs.existsSync(LEADERBOARD_FILE)) {
    const initialLeaderboard = [
        {
            rank: 1,
            name: "سەرکەوت (Sarkawt)",
            time: "14:22",
            date: "2026-11-12",
            token: "MH-MASTER-15-ALPHA-ZH"
        },
        {
            rank: 2,
            name: "ڕەوەند (Rawand)",
            time: "19:45",
            date: "2026-11-13",
            token: "MH-MASTER-15-BETA-ZH"
        }
    ];
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(initialLeaderboard, null, 2), 'utf-8');
}

// Server-Side Verified Tokens Store
const issuedVictoryTokens = new Set();

// =============================================================================
// SERVER-SIDE PRIVATE SECRETS (Never visible in browser)
// =============================================================================
const SECRET_LEVEL_ANSWERS = {
    1: ["OVERRIDE"],
    2: ["THE_TRUTH_IS_HIDDEN", "THETRUTHISHIDDEN"],
    3: ["ZHIYAR"], // Z-H-I-Y-A-R (Zhiyar Hemn)
    4: ["1089"],
    5: ["CRYPTOCORE", "CRYPTO_CORE"],
    6: ["CIPHER"],
    7: ["NEXUS_VALKYRIE_7", "NEXUSVALKYRIE7"],
    8: ["SWITCH", "SWITCH_DOOR_2", "DOOR_2"],
    9: ["RED_SPECTRUM_99", "REDSPECTRUM99"],
    10: ["KURD", "کورد"],
    11: ["GOYZHA", "GOYJA", "گۆیژە"],
    12: ["QUANTUM_LEAP_2026", "QUANTUMLEAP2026"],
    13: ["PREDICTION_UNLOCKED", "PREDICTIONUNLOCKED"],
    14: ["PARADOX_RESOLVED", "PARADOXRESOLVED"],
    15: ["ZHIYAR_HEMN", "ZHIYAR", "ZHIYARHEMN", "ZHIYAR_HEMN_MASTER_KEY_2026"]
};

// Rate Limiting (Anti-Brute Force Protection)
const rateLimitMap = new Map();
const MAX_ATTEMPTS_PER_WINDOW = 6;
const WINDOW_MS = 30 * 1000;

function isRateLimited(clientIp) {
    const now = Date.now();
    const clientData = rateLimitMap.get(clientIp) || { count: 0, resetTime: now + WINDOW_MS };

    if (now > clientData.resetTime) {
        clientData.count = 1;
        clientData.resetTime = now + WINDOW_MS;
        rateLimitMap.set(clientIp, clientData);
        return false;
    }

    clientData.count++;
    rateLimitMap.set(clientIp, clientData);

    return clientData.count > MAX_ATTEMPTS_PER_WINDOW;
}

function timeToSeconds(t) {
    const parts = (t || '99:99').split(':').map(Number);
    if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
    if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    return 99999;
}

function escapeHtml(str) {
    return (str || '').replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}

function generateProgressToken(level) {
    return crypto.createHmac('sha256', SERVER_SECRET).update(`LEVEL_${level}_CLEARED`).digest('hex');
}

function generateVictoryToken() {
    const timeHex = Date.now().toString(36).toUpperCase();
    const salt = crypto.randomBytes(3).toString('hex').toUpperCase();
    const token = `MH-MASTER-15-${timeHex}-${salt}-ZH`;
    issuedVictoryTokens.add(token);
    return token;
}

// MIME Types
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml'
};

// =============================================================================
// HTTP SERVER
// =============================================================================
const server = http.createServer((req, res) => {
    const clientIp = req.socket.remoteAddress || 'unknown';

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // 1. API: Server Health Status
    if (req.url === '/api/status' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'online',
            system: 'MIND_HACK Secure Core v2.0',
            developer: 'Zhiyar Hemn (ژیار هێمن)',
            secureMode: true
        }));
        return;
    }

    // 2. API: Get Live Leaderboard
    if (req.url === '/api/leaderboard' && req.method === 'GET') {
        try {
            const data = fs.readFileSync(LEADERBOARD_FILE, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify([]));
        }
        return;
    }

    // 3. API: Claim Victory & Save to Leaderboard (Fastest Time First)
    if (req.url === '/api/claim' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                const name = (data.name || 'هاکەری نادیار').trim().slice(0, 30);
                const time = (data.time || '00:00').trim();
                const token = (data.token || '').trim();

                let list = [];
                try {
                    list = JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf-8'));
                } catch (e) { list = []; }

                // Check duplicate token
                if (token && list.some(entry => entry.token === token)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'ئەم کۆدە پێشتر لە تەختەی پێشەنگەکان تۆمار کراوە!' }));
                    return;
                }

                list.push({
                    name: escapeHtml(name),
                    time: time,
                    date: new Date().toISOString().split('T')[0],
                    token: token
                });

                // Sort fastest time first
                list.sort((a, b) => timeToSeconds(a.time) - timeToSeconds(b.time));
                list = list.slice(0, 50); // Keep top 50
                list.forEach((entry, i) => entry.rank = i + 1);

                fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(list, null, 2), 'utf-8');

                const savedEntry = list.find(entry => entry.token === token) || list[0];
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, entry: savedEntry }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'هەڵە لە تۆمارکردن!' }));
            }
        });
        return;
    }

    // 4. API: Level Verification
    if (req.url === '/api/verify' && req.method === 'POST') {
        if (isRateLimited(clientIp)) {
            res.writeHead(429, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                isRateLimited: true,
                message: 'دەستگەیشتن بلۆک کرا! بەهۆی تاقیکردنەوەی زۆری هەڵە، بۆ ماوەی ٣٠ چرکە سێرڤەر قفڵ بوو.'
            }));
            return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                const level = parseInt(data.level, 10);
                const rawAnswer = (data.answer || '').toString().trim().toUpperCase().replace(/\s+/g, '_');

                if (!level || level < 1 || level > 15) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'قۆناغی نادیار!' }));
                    return;
                }

                const validList = SECRET_LEVEL_ANSWERS[level] || [];
                const isCorrect = validList.includes(rawAnswer);

                if (isCorrect) {
                    if (level === 15) {
                        const token = generateVictoryToken();
                        console.log(`[VICTORY!]: Client ${clientIp} beat all 15 levels! Token: ${token}`);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: true,
                            isVictory: true,
                            victoryToken: token,
                            message: 'پیرۆزە! تۆ تەواوی ١٥ قۆناغەکەت بە سەرکەوتوویی لە سێرڤەر بڕی!'
                        }));
                    } else {
                        const nextLevel = level + 1;
                        const progressToken = generateProgressToken(level);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: true,
                            nextLevel: nextLevel,
                            progressToken: progressToken,
                            message: `کۆدەکە دروستە و لە سێرڤەر پەسەند کرا! گواستنەوە بۆ قۆناغی ${nextLevel}...`
                        }));
                    }
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: 'شیفرەکە هەڵەیە! سێرڤەر ڕەتیکردەوە. بەبێ دۆزینەوەی کلیلە ڕاستەقینەکە ناتوانیت تێپەڕیت.'
                    }));
                }
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'داواکاریی نادروست!' }));
            }
        });
        return;
    }

    // 5. Static File Serving
    let cleanUrl = req.url.split('?')[0];
    if (cleanUrl === '/') cleanUrl = '/mindhack/index.html';
    if (cleanUrl.endsWith('/')) cleanUrl += 'index.html';

    let safePath = path.normalize(path.join(ROOT_DIR, cleanUrl));

    // If requested file exists in mindhack subfolder, prefer it
    const mindhackCandidate = path.normalize(path.join(ROOT_DIR, 'mindhack', cleanUrl));
    if (fs.existsSync(mindhackCandidate) && fs.statSync(mindhackCandidate).isFile()) {
        safePath = mindhackCandidate;
    }

    if (!safePath.startsWith(ROOT_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Access Denied');
        return;
    }

    fs.stat(safePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('فایلەکە نەدۆزرایەوە (404 Not Found)');
            return;
        }

        const ext = path.extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(safePath);
        stream.pipe(res);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('===========================================================');
    console.log(`[MIND_HACK v2.0] Secure Server Online!`);
    console.log(`Developer: Zhiyar Hemn (ژیار هێمن)`);
    console.log(`Local (Computer): http://localhost:${PORT}/`);
    console.log(`Mobile & iPad:    http://192.168.0.107:${PORT}/`);
    console.log('===========================================================');
});
