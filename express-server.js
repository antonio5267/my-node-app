
const express = require('express');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(compression());
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 минута
    max: 100, // максимум 100 запросов
    message: { error: 'Слишком много запросов, попробуйте позже', status: 429 }
});
app.use(limiter);

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - start;
        console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
    });
    next();
});
app.get('/', (req, res) => {
    res.send(`
        <html>
            <body style="font-family: Arial; padding: 20px;">
                <h1>Лабораторная работа №16</h1>
                <h2>Группа: ББМО-01-23</h2>
                <p>Дата и время: ${new Date().toLocaleString()}</p>
                <p>Приветствую, студент!</p>
                <h3>Доступные маршруты:</h3>
                <ul>
                    <li><a href="/about">/about</a> - О разработчике</li>
                    <li><a href="/contacts">/contacts</a> - Контакты</li>
                    <li><a href="/api/books">/api/books</a> - Список книг</li>
                </ul>
            </body>
        </html>
    `);
});

app.get('/about', (req, res) => {
    res.send(`
        <h1>О разработчике</h1>
        <p>Студент: Прищепа Антон Анатольевич</p>
        <p>Группа: 401</p>
    `);
});

app.get('/contacts', (req, res) => {
    res.send(`
        <h1>Контакты</h1>
        <p>Email: vod9noi52@gmail.com</p>
    `);
});


let books = [];
const authors = ["Толстой", "Достоевский", "Булгаков", "Пушкин", "Лермонтов"];
const genres = ["роман", "поэма", "рассказ"];
for (let i = 1; i <= 100; i++) {
    books.push({
        id: i,
        title: `Книга ${i}`,
        author: authors[i % authors.length],
        year: 1800 + (i % 200),
        genre: genres[i % genres.length],
        isbn: `978-${1000000000 + i}`,
        available: i % 3 !== 0 // некоторые недоступны
    });
}

app.get('/api/books', (req, res) => {
    let result = [...books];
    
    if (req.query.author) result = result.filter(b => b.author === req.query.author);
    if (req.query.year) result = result.filter(b => b.year === parseInt(req.query.year));
    if (req.query.yearFrom) result = result.filter(b => b.year >= parseInt(req.query.yearFrom));
    if (req.query.yearTo) result = result.filter(b => b.year <= parseInt(req.query.yearTo));
    
    if (req.query.search) {
        const s = req.query.search.toLowerCase();
        result = result.filter(b => b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s));
    }

    if (req.query.sort) {
        const field = req.query.sort.replace('-', '');
        const desc = req.query.sort.startsWith('-');
        result.sort((a, b) => (a[field] < b[field] ? -1 : 1) * (desc ? -1 : 1));
    }
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    res.json({
        total: result.length,
        page,
        limit,
        data: result.slice(offset, offset + limit)
    });
});

// GET /api/books/stats (Задание 4)
app.get('/api/books/stats', (req, res) => {
    const stats = {
        total: books.length,
        byAuthor: {},
        byGenre: {},
        oldestYear: Math.min(...books.map(b => b.year)),
        newestYear: Math.max(...books.map(b => b.year))
    };
    books.forEach(b => {
        stats.byAuthor[b.author] = (stats.byAuthor[b.author] || 0) + 1;
        stats.byGenre[b.genre] = (stats.byGenre[b.genre] || 0) + 1;
    });
    res.json(stats);
});

// GET /api/books/search
app.get('/api/books/search', (req, res) => {
    if (!req.query.author) return res.status(400).json({ error: 'Укажите автора' });
    const found = books.filter(b => b.author === req.query.author);
    res.json(found);
});

// GET /api/books/:id
app.get('/api/books/:id', (req, res) => {
    const book = books.find(b => b.id === parseInt(req.params.id));
    if (!book) return res.status(404).json({ error: 'Книга не найдена', status: 404 });
    res.json(book);
});

// POST /api/books
app.post('/api/books', (req, res) => {
    const { title, author, year } = req.body;
    if (!title || !author || !year) {
        return res.status(400).json({ error: 'Невалидные данные', status: 400 });
    }
    const newBook = { id: books.length + 1, title, author, year };
    books.push(newBook);
    res.status(201).json(newBook);
});

// PUT /api/books/:id
app.put('/api/books/:id', (req, res) => {
    const book = books.find(b => b.id === parseInt(req.params.id));
    if (!book) return res.status(404).json({ error: 'Книга не найдена', status: 404 });
    Object.assign(book, req.body);
    res.json(book);
});

// DELETE /api/books/:id
app.delete('/api/books/:id', (req, res) => {
    const index = books.findIndex(b => b.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Книга не найдена', status: 404 });
    books.splice(index, 1);
    res.json({ message: 'Книга удалена' });
});

app.get('/error', (req, res) => {
    throw new Error('Это тестовая ошибка!');
});

app.get('/async-error', async (req, res, next) => {
    try {
        throw new Error('Асинхронная ошибка!');
    } catch (err) {
        next(err);
    }
});
app.use((err, req, res, next) => {
    console.error('Ошибка:', err.message);
    res.status(err.status || 500).json({
        error: err.message || 'Внутренняя ошибка сервера',
        status: err.status || 500
    });
});
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});