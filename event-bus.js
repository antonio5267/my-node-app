const EventEmitter = require('events');
const http = require('http');
const os = require('os');

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.metrics = {};
        this.totalEvents = 0;
        this.onAnyListeners = [];
        this.originalListeners = new Map();
    }

    on(event, listener, priority = 0) {
        if (!this.originalListeners.has(event)) {
            this.originalListeners.set(event, []);
        }
        const listeners = this.originalListeners.get(event);
        listeners.push({ listener, priority });
        listeners.sort((a, b) => b.priority - a.priority);
        
        super.removeAllListeners(event);
        listeners.forEach(l => super.on(event, l.listener));
        return this;
    }

    emit(event, ...args) {
        if (!this.metrics[event]) {
            this.metrics[event] = { count: 0, errors: 0, lastCalled: null };
        }
        this.metrics[event].count++;
        this.metrics[event].lastCalled = new Date().toISOString();
        this.totalEvents++;

        this.onAnyListeners.forEach(listener => listener(event, args));

        return super.emit(event, ...args);
    }

    onAny(listener) {
        this.onAnyListeners.push(listener);
    }

    getMetrics() {
        return {
            group: 'ББМО-01-23',
            events: this.metrics,
            total: this.totalEvents,
            listeners: this.eventNames().reduce((acc, name) => {
                acc[name] = this.listenerCount(name);
                return acc;
            }, {})
        };
    }
}

const bus = new EventBus();

console.log('=== EventBus (группа ББМО-01-23) ===');

console.log('\n--- Приоритеты ---');
bus.on('test', () => console.log('[priority 0] Низкий приоритет'), 0);
bus.on('test', () => console.log('[priority 10] Высокий приоритет'), 10);
bus.on('test', () => console.log('[priority 5] Средний приоритет'), 5);
bus.emit('test');

console.log('\n--- Wildcard ---');
bus.onAny((event, args) => {
    console.log(`[onAny] Событие "${event}" с аргументами: ${JSON.stringify(args)}`);
});
bus.emit('greet', 'Иван');
bus.emit('info', 'ББМО-01-23');

console.log('\n--- Once-кэш ---');
let onceCount = 0;
bus.once('tick', () => { onceCount++; });
bus.emit('tick');
bus.emit('tick');
bus.emit('tick');
console.log(`once-слушатель вызван: ${onceCount} раз`);

console.log('\n--- Обработка ошибок ---');
bus.on('error', (err) => {
    console.log(`[ERROR] [ББМО-01-23] Ошибка в слушателе "test": ${err.message}`);
});
bus.on('test2', () => { throw new Error('Тестовая ошибка в слушателе'); });
bus.on('error', (err) => {
    console.log(`[ERROR] [ББМО-01-23] Ошибка в слушателе "test2": ${err.message}`);
});

try { bus.emit('test2'); } catch (e) { bus.emit('error', e); }

console.log('\n--- Метрики ---');
console.log(JSON.stringify(bus.getMetrics().events, null, 2));

const server = http.createServer((req, res) => {
    bus.emit('request', req.url);
    if (req.url === '/metrics') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(bus.getMetrics(), null, 2));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(3000, () => {
    console.log('\nHTTP-сервер запущен на http://localhost:3000/metrics');
    console.log('Открой в браузере, чтобы увидеть метрики.');
});