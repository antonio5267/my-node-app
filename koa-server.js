
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

app.use(bodyParser());
app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`[${new Date().toLocaleString()}] ${ctx.method} ${ctx.url} - ${ms}ms`);
});
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = {
            error: err.message || 'Внутренняя ошибка сервера',
            status: ctx.status
        };
        console.error('Ошибка:', err.message);
    }
});
router.get('/', async (ctx) => {
    ctx.type = 'html';
    ctx.body = `
        <html>
            <head><title>ЛР №15</title></head>
            <body style="font-family: Arial; background-color: #f0f0f0; padding: 20px;">
                <h1 style="color: #333;">Лабораторная работа №15</h1>
                <h2 style="color: #555;">Группа: 401</h2>
                <p style="font-size: 18px;">Дата и время: <b>${new Date().toLocaleString()}</b></p>
                <p style="font-size: 18px; color: green;">Приветствую, студент!</p>
            </body>
        </html>
    `;
});

let users = [
    { id: 1, name: "Борис Егор", group: "401" },
    { id: 2, name: "Рогалик Славик", group: "401" }
];
router.get('/api/users', async (ctx) => {
    ctx.body = users;
});
router.post('/api/users', async (ctx) => {
    const { name, group } = ctx.request.body;
    if (!name || !group) {
        ctx.status = 400;
        ctx.body = { error: 'Невалидные данные: нужны name и group' };
        return;
    }
    const newUser = { id: users.length + 1, name, group };
    users.push(newUser);
    ctx.status = 201;
    ctx.body = newUser;
});
router.put('/api/users/:id', async (ctx) => {
    const id = parseInt(ctx.params.id);
    const { name, group } = ctx.request.body;
    const user = users.find(u => u.id === id);
    if (!user) {
        ctx.status = 404;
        ctx.body = { error: 'Пользователь не найден' };
        return;
    }
    user.name = name || user.name;
    user.group = group || user.group;
    ctx.body = user;
});
router.delete('/api/users/:id', async (ctx) => {
    const id = parseInt(ctx.params.id);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
        ctx.status = 404;
        ctx.body = { error: 'Пользователь не найден' };
        return;
    }
    users.splice(index, 1);
    ctx.body = { message: 'Пользователь удален' };
});

router.get('/error', async (ctx) => {
    throw new Error('Это тестовая ошибка!');
});

router.get('/protected', async (ctx) => {
    if (!ctx.headers.authorization) {
        ctx.status = 401;
        ctx.body = { error: 'Требуется авторизация' };
        return;
    }
    ctx.body = { message: 'Доступ разрешен' };
});
let students = [];
// Генерируем 50 студентов (Задание 5)
for (let i = 1; i <= 50; i++) {
    students.push({
        id: i,
        name: `Студент_${i} Антон`,
        group: i % 2 === 0 ? "Б" : "401",
        course: (i % 4) + 1
    });
}
router.get('/students', async (ctx) => {
    let result = [...students];

    if (ctx.query.group) {
        result = result.filter(s => s.group === ctx.query.group);
    }
    if (ctx.query.search) {
        const search = ctx.query.search.toLowerCase();
        result = result.filter(s => s.name.toLowerCase().includes(search));
    }
    if (ctx.query.sort) {
        let sortField = ctx.query.sort;
        let descending = false;
        if (sortField.startsWith('-')) {
            descending = true;
            sortField = sortField.substring(1);
        }
        result.sort((a, b) => {
            if (a[sortField] < b[sortField]) return descending ? 1 : -1;
            if (a[sortField] > b[sortField]) return descending ? -1 : 1;
            return 0;
        });
    }
    const limit = parseInt(ctx.query.limit) || 10;
    const offset = parseInt(ctx.query.offset) || 0;
    const total = result.length;
    const paginatedResult = result.slice(offset, offset + limit);
    ctx.body = {
        total: total,
        limit: limit,
        offset: offset,
        data: paginatedResult
    };
});
router.get('/students/:id', async (ctx) => {
    const id = parseInt(ctx.params.id);
    const student = students.find(s => s.id === id);
    if (!student) {
        ctx.status = 404;
        ctx.body = { error: 'Студент не найден' };
        return;
    }
    ctx.body = student;
});
router.post('/students', async (ctx) => {
    const { name, group, course } = ctx.request.body;
    if (!name || !group || !course) {
        ctx.status = 400;
        ctx.body = { error: 'Не все обязательные поля заполнены' };
        return;
    }
    const newStudent = {
        id: students.length + 1,
        name,
        group,
        course
    };
    students.push(newStudent);
    ctx.status = 201;
    ctx.body = newStudent;
});
router.put('/students/:id', async (ctx) => {
    const id = parseInt(ctx.params.id);
    const { name, group, course } = ctx.request.body;
    const student = students.find(s => s.id === id);
    if (!student) {
        ctx.status = 404;
        ctx.body = { error: 'Студент не найден' };
        return;
    }
    student.name = name || student.name;
    student.group = group || student.group;
    student.course = course || student.course;
    ctx.body = student;
});
router.delete('/students/:id', async (ctx) => {
    const id = parseInt(ctx.params.id);
    const index = students.findIndex(s => s.id === id);
    if (index === -1) {
        ctx.status = 404;
        ctx.body = { error: 'Студент не найден' };
        return;
    }
    students.splice(index, 1);
    ctx.body = { message: 'Студент удален' };
});
app.use(router.routes()).use(router.allowedMethods());

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});