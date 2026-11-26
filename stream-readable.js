const { Readable } = require('stream');

const chunks = [
    'Группа: ББМО-01-23\n',
    'Студент: Прищепа Антон Анатольевич\n',
    'Лабораторная работа: №21\n',
    'Тема: Потоки в Node.js\n'
];

let index = 0;
let totalBytes = 0;
let totalChunks = 0;

const readable = new Readable({
    read(size) {
        if (index < chunks.length) {
            const chunk = chunks[index];
            index++;
            totalBytes += Buffer.byteLength(chunk);
            totalChunks++;
            this.push(chunk);
        } else {
            this.push(null);
        }
    }
});

console.log('=== Демонстрация Readable-потока ===');

readable.on('data', (chunk) => {
    process.stdout.write(`[CHUNK ${totalChunks}] ${chunk}`);
});

readable.on('end', () => {
    console.log('[END] Поток завершён');
    console.log(`Всего получено чанков: ${totalChunks}`);
    console.log(`Общий размер данных: ${totalBytes} байт`);
});

readable.on('error', (err) => {
    console.error('Ошибка:', err);
});