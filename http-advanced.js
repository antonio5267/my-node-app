const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GROUP = '401';
const logFile = path.join(__dirname, 'access.log');

function logAccess(method, urlPath, status) {
    const time = new Date().toLocaleString('ru-RU');
    const line = `[${time}] [${GROUP}] ${method} ${urlPath} ${status}\n`;
    fs.appendFileSync(logFile, line);
    console.log(line.trim());
}

const middlewares = [];
middlewares.push((req, res, next) => {
    res.setHeader('X-Group', GROUP);
    next();
});
middlewares.push((req, res, next) => {
    if (req.url.startsWith('/static')) {
        const filePath = path.join(__dirname, 'public', req.url.replace('/static', ''));
        if (filePath.includes('..')) {
            res.writeHead(403); res.end('403 Forbidden'); return;
        }
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath);
            const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' }[ext] || 'text/plain';
            res.setHeader('Content-Type', mime);
            res.setHeader('Cache-Control', 'max-age=60');
            const content = fs.readFileSync(filePath);
            res.setHeader('ETag', `"${content.length}"`);
            if (req.headers['if-none-match'] === `"${content.length}"`) {
                res.writeHead(304); res.end(); return;
            }
            res.writeHead(200); res.end(content); return;
        }
    }
    next();
});
middlewares.push((req, res, next) => {
    if (req.url === '/stream') {
        const bigFile = path.join(__dirname, 'big-file.txt');
        if (!fs.existsSync(bigFile)) fs.writeFileSync(bigFile, 'A'.repeat(1024 * 1024));
        res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
        fs.createReadStream(bigFile).pipe(res);
        return;
    }
    next();
});
middlewares.push((req, res, next) => {
    if (req.url === '/metrics') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ group: GROUP, status: 'ok' }));
        return;
    }
    next();
});

const server = http.createServer((req, res) => {
    let i = 0;
    const next = () => {
        const mw = middlewares[i++];
        if (mw) mw(req, res, next);
        else {
            res.writeHead(404);
            res.end('404 Not Found');
            logAccess(req.method, req.url, 404);
        }
    };
    next();
    res.on('finish', () => logAccess(req.method, req.url, res.statusCode));
});

server.listen(3000, () => console.log(`[INFO] HTTP-сервер запущен на порту 3000`));

try {
    if (!fs.existsSync('key.pem') || !fs.existsSync('cert.pem')) {
        console.log('Генерация сертификатов...');
        execSync('openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"', { stdio: 'inherit' });
    }
    const options = {
        key: fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem')
    };
    https.createServer(options, (req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`=== HTTPS работает! ===\nГруппа: ${GROUP}`);
    }).listen(3443, () => console.log('[INFO] HTTPS-сервер запущен на порту 3443'));
} catch (e) {
    console.log('Ошибка при создании HTTPS (возможно, не установлен OpenSSL). Пропускаем...');
}