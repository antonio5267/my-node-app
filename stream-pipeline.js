const { Readable, Transform, Writable, pipeline } = require('stream');
const fs = require('fs');
const path = require('path');

const GROUP = 'ББМО-01-23';
const TOTAL = 10000;
const ERRORS_LOG = path.join(__dirname, 'errors.log');
const CSV_FILE = path.join(__dirname, 'students.csv');

fs.writeFileSync(ERRORS_LOG, '');

let stats = {
    generated: 0,
    validated: 0,
    enriched: 0,
    filtered: 0,
    written: 0,
    errors: 0
};

class StudentSource extends Readable {
    constructor() {
        super({ objectMode: true, highWaterMark: 100 });
        this.count = 0;
    }
    _read() {
        if (this.count >= TOTAL) {
            this.push(null);
            return;
        }
        const batch = [];
        for (let i = 0; i < 100 && this.count < TOTAL; i++) {
            this.count++;
            batch.push({
                id: this.count,
                name: `Студент_${this.count}`,
                group: GROUP,
                course: (this.count % 4) + 1,
                grade: Math.floor(Math.random() * 5) + 1
            });
        }
        stats.generated = this.count;
        this.push(batch);
    }
}

class ValidateTransform extends Transform {
    constructor() {
        super({ objectMode: true, highWaterMark: 50 });
    }
    _transform(batch, encoding, callback) {
        const valid = batch.filter(s => s.name && s.grade >= 1 && s.grade <= 5);
        stats.validated += valid.length;
        stats.errors += batch.length - valid.length;
        callback(null, valid);
    }
}

class EnrichTransform extends Transform {
    constructor() {
        super({ objectMode: true, highWaterMark: 50 });
    }
    _transform(batch, encoding, callback) {
        const enriched = batch.map(s => ({
            ...s,
            averageGrade: (s.grade + 4.5) / 2
        }));
        stats.enriched += enriched.length;
        callback(null, enriched);
    }
}

class FilterTransform extends Transform {
    constructor() {
        super({ objectMode: true, highWaterMark: 50 });
    }
    _transform(batch, encoding, callback) {
        const filtered = batch.filter(s => s.grade > 3);
        stats.filtered += filtered.length;
        callback(null, filtered);
    }
}

class FormatTransform extends Transform {
    constructor() {
        super({ objectMode: true });
    }
    _transform(batch, encoding, callback) {
        const lines = batch.map(s => 
            `${s.id},${s.name},${s.group},${s.course},${s.grade},${s.averageGrade}`
        ).join('\n');
        callback(null, lines + '\n');
    }
}

class CsvSink extends Writable {
    constructor(filename) {
        super({ highWaterMark: 1024 });
        this.filename = filename;
        this.stream = fs.createWriteStream(filename);
        this.stream.write('id,name,group,course,grade,averageGrade\n');
    }
    _write(chunk, encoding, callback) {
        const str = chunk.toString();
        const lines = str.split('\n').filter(l => l.trim() !== '');
        stats.written += lines.length;
        
        if (!this.stream.write(str)) {
            this.stream.once('drain', callback);
        } else {
            callback();
        }
    }
    _final(callback) {
        this.stream.end(callback);
    }
}

function logError(msg) {
    const line = `[${new Date().toLocaleString('ru-RU')}] [${GROUP}] ${msg}\n`;
    fs.appendFileSync(ERRORS_LOG, line);
}

async function runPipeline() {
    console.log(`=== Конвейер обработки данных (${GROUP}) ===`);
    console.log(`Источник: ${TOTAL} студентов`);
    console.log('Фильтр: оценка > 3\n');

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        const source = new StudentSource();
        const validate = new ValidateTransform();
        const enrich = new EnrichTransform();
        const filter = new FilterTransform();
        const format = new FormatTransform();
        const sink = new CsvSink(CSV_FILE);

        pipeline(source, validate, enrich, filter, format, sink, (err) => {
            if (err) {
                logError(`Ошибка пайплайна: ${err.message}`);
                reject(err);
            } else {
                const time = ((Date.now() - startTime) / 1000).toFixed(2);
                console.log(`\n=== Результаты ===`);
                console.log(`Всего сгенерировано: ${stats.generated}`);
                console.log(`Прошло валидацию: ${stats.validated}`);
                console.log(`Обогащено: ${stats.enriched}`);
                console.log(`Отфильтровано: ${stats.filtered}`);
                console.log(`Записано в CSV: ${stats.written}`);
                console.log(`Ошибок: ${stats.errors}`);
                console.log(`Время выполнения: ${time} сек`);
                console.log(`Средняя скорость: ${(stats.written / parseFloat(time)).toFixed(0)} записей/сек`);
                resolve();
            }
        });
    });
}

async function demonstrateTimeout() {
    console.log('\n=== Отмена по таймауту ===');
    console.log('Запуск с таймаутом 0.01 сек...');
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10);

    const source = new StudentSource();
    const sink = new CsvSink(path.join(__dirname, 'timeout-test.csv'));

    pipeline(source, sink, (err) => {
        clearTimeout(timeout);
        if (err && err.code === 'ERR_STREAM_PREMATURE_CLOSE') {
            console.log('Таймаут! Обработка отменена');
            console.log('Все потоки корректно закрыты');
        } else if (err) {
            console.log('Ошибка:', err.message);
        } else {
            console.log('Успешно завершено до таймаута');
        }
    });

    setTimeout(() => {
        if (source.destroyed) {
            console.log('Ресурсы освобождены');
        }
    }, 100);
}

async function demonstrateAsyncIterator() {
    console.log('\n=== Сравнение с async iterator ===');
    const startTime = Date.now();
    let count = 0;
    
    const source = new StudentSource();
    for await (const batch of source) {
        count += 1;
    }
    
    const time = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[ASYNC] Обработано: ${count} записей за ${time} сек`);
    console.log(`Скорость: ${(count / parseFloat(time)).toFixed(0)} записей/сек`);
}

(async () => {
    try {
        await runPipeline();
        await demonstrateTimeout();
        await demonstrateAsyncIterator();
    } catch (e) {
        console.error('Критическая ошибка:', e.message);
    }
})();