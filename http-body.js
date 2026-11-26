const http = require('http');
const querystring = require('querystring');

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    // Логируем метод и путь
    console.log(`[${new Date().toLocaleString('ru-RU')}] ${req.method} ${req.url}`);

    // Обработка POST /echo
    if (req.method === 'POST' && path === '/echo') {
        let body = '';
        let size = 0;
        const MAX_SIZE = 1024 * 1024; // 1 МБ

        req.on('data', chunk => {
            size += chunk.length;
            if (size > MAX_SIZE) {
                res.writeHead(413, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('413 Payload Too Large');
                req.destroy(); // Обрываем соединение
                return;
            }
            body += chunk.toString();
        });

        req.on('end', () => {
            if (res.writableEnded) return; // Если уже ответили 413

            console.log(`  Размер тела: ${size} байт`);
            const contentType = req.headers['content-type'] || '';

            if (contentType.includes('application/json')) {
                try {
                    const json = JSON.parse(body);
                    json.group = '401'; // Эхо-сервер добавляет группу
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify(json, null, 2));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('Ошибка парсинга JSON');
                }
            } else {
                res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(body);
            }
        });

        req.on('error', (err) => {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Ошибка сервера');
        });
    }
    // Обработка POST /form
    else if (req.method === 'POST' && path === '/form') {
        let body = '';

        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            const parsed = querystring.parse(body);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(parsed, null, 2));
        });
    }
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
    }
});

server.listen(3000, () => {
    console.log('Сервер запущен на порту 3000');
});