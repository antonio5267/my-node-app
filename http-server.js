const http = require('http');

const server = http.createServer((req, res) => {
    const startTime = new Date().toLocaleString('ru-RU');
    let status = 200;

    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <h1>=== Лабораторная работа №20 ===</h1>
            <p>Группа: ББМО-01-23</p>
            <p>Метод: ${req.method}</p>
            <p>URL: ${req.url}</p>
        `);
    } else if (req.method === 'GET' && req.url === '/about') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <h1>=== О студенте ===</h1>
            <p>Группа: ББМО-01-23</p>
            <p>Студент: Прищепа Антон Анатольевич</p>
        `);
    } else {
        status = 404;
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <h1>=== 404 Not Found ===</h1>
            <p>Путь ${req.url} не найден</p>
        `);
    }

    console.log(`[${startTime}] ${req.method} ${req.url} ${status}`);
});

server.listen(3000, () => {
    console.log('Сервер запущен на порту 3000');
});