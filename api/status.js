module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
        status: 'online',
        system: 'MIND_HACK Secure Core v2.0',
        developer: 'Zhiyar Hemn (ژیار هێمن)',
        secureMode: true
    }));
};
