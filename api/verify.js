const crypto = require('crypto');

const SECRET_LEVEL_ANSWERS = {
    1: ["OVERRIDE"],
    2: ["THE_TRUTH_IS_HIDDEN", "THETRUTHISHIDDEN"],
    3: ["ZHIYAR"],
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

const SERVER_SECRET = crypto.randomBytes(32).toString('hex');

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
        const level = parseInt(data.level, 10);
        const rawAnswer = (data.answer || '').toString().trim().toUpperCase().replace(/\s+/g, '_');

        if (!level || level < 1 || level > 15) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'قۆناغی نادیار!' }));
        }

        const validList = SECRET_LEVEL_ANSWERS[level] || [];
        const isCorrect = validList.includes(rawAnswer);

        if (isCorrect) {
            if (level === 15) {
                const timeHex = Date.now().toString(36).toUpperCase();
                const salt = crypto.randomBytes(3).toString('hex').toUpperCase();
                const token = `MH-MASTER-15-${timeHex}-${salt}-ZH`;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                    success: true,
                    isVictory: true,
                    victoryToken: token,
                    message: 'پیرۆزە! تۆ تەواوی ١٥ قۆناغەکەت بە سەرکەوتوویی لە سێرڤەر بڕی!'
                }));
            } else {
                const nextLevel = level + 1;
                const progressToken = crypto.createHmac('sha256', SERVER_SECRET).update(`LEVEL_${level}_CLEARED`).digest('hex');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                    success: true,
                    nextLevel: nextLevel,
                    progressToken: progressToken,
                    message: `کۆدەکە دروستە و لە سێرڤەر پەسەند کرا! گواستنەوە بۆ قۆناغی ${nextLevel}...`
                }));
            }
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
                success: false,
                message: 'شیفرەکە هەڵەیە! سێرڤەر ڕەتیکردەوە. بەبێ دۆزینەوەی کلیلە ڕاستەقینەکە ناتوانیت تێپەڕیت.'
            }));
        }
    } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'داواکاریی نادروست!' }));
    }
};
