const http = require('http');

let students = [
    { id: 1, name: "Иван", group: "ББМО-01-23" },
    { id: 2, name: "Мария", group: "ББМО-01-23" }
];

const routes = [
    { method: 'GET', pattern: /^\/api\/students$/, handler: handleGetAll },
    { method: 'GET', pattern: /^\/api\/students\/(\d+)$/, handler: handleGetOne },
    { method: 'POST', pattern: /^\/api\/students$/, handler: handleCreate },
    { method: 'PUT', pattern: /^\/api\/students\/(\d+)$/, handler: handleUpdate },
    { method: 'DELETE', pattern: /^\/api\/students\/(\d+)$/, handler: handleDelete },
];

function sendJSON(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data, null, 2));
}

function handleGetAll(req, res, url) {
    const groupQuery = url.searchParams.get('group');
    if (groupQuery) {
        const filtered = students.filter(s => s.group === groupQuery);
        return sendJSON(res, 200, filtered);
    }
    sendJSON(res, 200, students);
}

function handleGetOne(req, res, url, id) {
    const student = students.find(s => s.id === parseInt(id));
    if (!student) return sendJSON(res, 404, { error: 'Студент не найден' });
    sendJSON(res, 200, student);
}

function handleCreate(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
        const data = JSON.parse(body);
        const newStudent = { id: students.length + 1, ...data };
        students.push(newStudent);
        sendJSON(res, 201, newStudent);
    });
}

function handleUpdate(req, res, url, id) {
    const student = students.find(s => s.id === parseInt(id));
    if (!student) return sendJSON(res, 404, { error: 'Студент не найден' });

    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
        const data = JSON.parse(body);
        Object.assign(student, data);
        sendJSON(res, 200, student);
    });
}

function handleDelete(req, res, url, id) {
    const index = students.findIndex(s => s.id === parseInt(id));
    if (index === -1) return sendJSON(res, 404, { error: 'Студент не найден' });
    
    students.splice(index, 1);
    sendJSON(res, 200, { deleted: true, id: parseInt(id) });
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    let matchedRoute = null;
    let pathParams = [];

    for (const route of routes) {
        if (route.method === req.method) {
            const match = path.match(route.pattern);
            if (match) {
                matchedRoute = route;
                pathParams = match.slice(1);
                break;
            }
        }
    }

    if (matchedRoute) {
        matchedRoute.handler(req, res, url, ...pathParams);
    } else {
        const methodExists = routes.some(r => r.pattern.test(path));
        if (methodExists) {
            sendJSON(res, 405, { error: 'Method Not Allowed' });
            console.log(`[${new Date().toLocaleString('ru-RU')}] [ББМО-01-23] ${req.method} ${req.url} 405`);
        } else {
            sendJSON(res, 404, { error: 'Not Found' });
            console.log(`[${new Date().toLocaleString('ru-RU')}] [ББМО-01-23] ${req.method} ${req.url} 404`);
        }
    }
});

server.listen(3000, () => {
    console.log('Сервер запущен на порту 3000');
});