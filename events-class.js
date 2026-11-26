const EventEmitter = require('events');

class DatabaseConnection extends EventEmitter {
    connect() {
        this.emit('connect', 'Соединение установлено');
    }

    query(sql, result) {
        this.emit('query', { sql, result });
    }

    close() {
        this.emit('close', 'Соединение закрыто');
    }

    error(message) {
        this.emit('error', message);
    }
}

const db = new DatabaseConnection();

console.log('=== DatabaseConnection (группа ББМО-01-23) ===');

db.on('connect', (msg) => console.log(`[EVENT] ${msg}`));
db.on('query', (data) => {
    console.log(`[EVENT] Выполнение запроса: ${data.sql}`);
    console.log(`[EVENT] Результат: ${data.result}`);
});
db.on('close', (msg) => console.log(`[EVENT] ${msg}`));

db.connect();
db.query('SELECT * FROM students', '50 записей');
db.query('INSERT INTO students', '1 запись добавлена');
db.close();

console.log('\n=== Демонстрация ошибки ===');
db.on('error', (err) => {
    console.log(`[EVENT] Ошибка: ${err}`);
    console.log('(слушатель error перехватил ошибку, процесс не упал)');
});

db.error('Connection timeout');