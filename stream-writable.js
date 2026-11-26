const { Writable } = require('stream');

const chunks = [
    'Группа: ББМО-01-23\n',
    'Студент: Прищепа Антон Анатольевич\n',
    'Лабораторная работа: №21\n',
    'Тема: Потоки в Node.js\n'
];

let totalChunks = 0;

const writable = new Writable({
    highWaterMark: 16,
    write(chunk, encoding, callback) {
        const text = chunk.toString().trim();
        console.log(`[WRITE] ${text}`);
        
        // Имитируем задержку обработки
        setTimeout(() => {
            callback();
        }, 500);
    }
});

console.log('=== Демонстрация Writable-потока ===');

writable.on('drain', () => {
    console.log('[DRAIN] Буфер освобождён, продолжаем запись');
});

writable.on('finish', () => {
    console.log('[FINISH] Все данные записаны');
    console.log(`Всего записано: ${totalChunks} чанка`);
});

let i = 0;
function writeNext() {
    if (i < chunks.length) {
        const chunk = chunks[i];
        i++;
        totalChunks++;
        
        const result = writable.write(chunk);
        console.log(`  write() вернул: ${result} ${result ? '' : '← буфер переполнен!'}`);
        
        if (!result) {
            writable.once('drain', () => {
                writeNext();
            });
        } else {
            writeNext();
        }
    } else {
        writable.end();
    }
}

writeNext();