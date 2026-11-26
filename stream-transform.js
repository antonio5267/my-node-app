const { Transform, Readable, pipeline } = require('stream');

class UpperCaseTransform extends Transform {
    _transform(chunk, encoding, callback) {
        const text = chunk.toString().toUpperCase();
        callback(null, `[ББМО-01-23] ${text}\n`);
    }
}

class JsonParserTransform extends Transform {
    constructor() {
        super({ objectMode: true });
    }
    _transform(chunk, encoding, callback) {
        try {
            const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
                this.push(JSON.parse(line));
            }
            callback();
        } catch (err) {
            callback(err);
        }
    }
}

class FilterTransform extends Transform {
    constructor(group) {
        super({ objectMode: true });
        this.group = group;
    }
    _transform(obj, encoding, callback) {
        if (obj.group === this.group) {
            this.push(obj);
        }
        callback();
    }
}

class ObjectStringifyTransform extends Transform {
    constructor() {
        super({ objectMode: true });
    }
    _transform(obj, encoding, callback) {
        callback(null, JSON.stringify(obj) + '\n');
    }
}

console.log('=== Демонстрация Transform-потока ===');
const upper = new UpperCaseTransform();
upper.on('data', (data) => process.stdout.write(`Выход: ${data}`));
upper.write('группа ббмо-01-23');
upper.write('студент прищепа');
upper.end();

setTimeout(() => {
    console.log('\n=== Демонстрация Object Mode ===');
    const students = [
        { id: 1, name: "Иван", group: "ББМО-01-23" },
        { id: 2, name: "Мария", group: "ББМО-02-23" },
        { id: 3, name: "Петр", group: "ББМО-01-23" }
    ];

    const source = Readable.from(students, { objectMode: true });
    const filter = new FilterTransform('ББМО-01-23');

    source.on('data', (obj) => console.log(`[OBJECT] ${JSON.stringify(obj)}`));
    source.pipe(filter).on('data', (obj) => {
        console.log(`[FILTERED] ${JSON.stringify(obj)}`);
    });
}, 500);

setTimeout(() => {
    console.log('\n=== Демонстрация async iterator ===');
    const asyncSource = Readable.from(['Данные 1', 'Данные 2', 'Данные 3']);
    
    (async () => {
        let i = 1;
        for await (const chunk of asyncSource) {
            console.log(`[ASYNC] Получен чанк ${i}: "${chunk}"`);
            i++;
        }
        console.log('[ASYNC] Поток завершён');
    })();
}, 1000);

setTimeout(() => {
    console.log('\n=== Цепочка Transform ===');
    const inputJson = [
        '{"id":1,"name":"Иван","group":"ББМО-01-23"}',
        '{"id":2,"name":"Мария","group":"ББМО-02-23"}',
        '{"id":3,"name":"Петр","group":"ББМО-01-23"}'
    ].join('\n');

    const chainSource = Readable.from([inputJson]);
    const chainParser = new JsonParserTransform();
    const chainFilter = new FilterTransform('ББМО-01-23');
    const chainStringify = new ObjectStringifyTransform();

    pipeline(chainSource, chainParser, chainFilter, chainStringify, process.stdout, (err) => {
        if (err) {
            console.error('Ошибка цепочки:', err.message);
        } else {
            console.log('\nОбработано 3 строки, отфильтровано 2');
        }
    });
}, 1500);