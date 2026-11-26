const http = require('http');

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    if (req.method === 'GET' && path === '/headers') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            headers: req.headers,
            method: req.method,
            url: req.url,
            httpVersion: req.httpVersion
        }, null, 2));
    } 
    else if (req.method === 'GET' && path === '/headers/set') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-Powered-By', 'Node.js');
        res.setHeader('X-Group', '401');
        res.setHeader('Cache-Control', 'no-cache');
        res.end('<h1>Заголовки установлены!</h1><p>Проверь их в консоли разработчика (F12) во вкладке Network.</p>');
    } 
    else if (req.method === 'GET' && path === '/headers/check') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            hasContentType: res.hasHeader('Content-Type'),
            hasXGroup: res.hasHeader('X-Group'),
            hasUnknown: res.hasHeader('X-Unknown-Header')
        }, null, 2));
    } 
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
    }
});

server.listen(3000, () => {
    console.log('Сервер заголовков запущен на порту 3000');
});