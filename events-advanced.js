const EventEmitter = require('events');

class PluginManager extends EventEmitter {
    constructor() {
        super();
        
        this.on('newListener', (event, listener) => {
            console.log(`[newListener] Добавлен слушатель "${event}"`);
        });

        this.on('removeListener', (event, listener) => {
            console.log(`[removeListener] Удалён слушатель "${event}"`);
        });
    }

    registerPlugin(name, eventName, handler) {
        this.on(eventName, handler);
        this.emit('plugin:registered', name);
    }

    unregisterPlugin(name, eventName, handler) {
        this.removeListener(eventName, handler);
        this.emit('plugin:removed', name);
    }
}

const manager = new PluginManager();

console.log('=== Система плагинов ===');

manager.on('plugin:registered', (name) => {
    console.log(`[PLUGIN] Зарегистрирован: ${name}`);
});

manager.on('plugin:removed', (name) => {
    console.log(`[PLUGIN] Удалён: ${name}`);
});

const loggerHandler = (msg) => console.log(`[LOG] ${msg}`);
const alertHandler = (msg) => console.log(`[ALERT] ${msg}`);

manager.registerPlugin('LoggerPlugin', 'log', loggerHandler);
manager.registerPlugin('AlertPlugin', 'alert', alertHandler);
manager.unregisterPlugin('LoggerPlugin', 'log', loggerHandler);

console.log('\n=== Демонстрация утечки ===');

const leakyEmitter = new EventEmitter();
const dummyListener = () => {};

console.log(`Слушателей до: ${leakyEmitter.listenerCount('leak')}`);

for (let i = 0; i < 1000; i++) {
    leakyEmitter.on('leak', dummyListener);
}

console.log(`Слушателей после добавления 1000: ${leakyEmitter.listenerCount('leak')}`);

leakyEmitter.removeAllListeners('leak');
console.log(`Слушателей после removeAllListeners: ${leakyEmitter.listenerCount('leak')}`);

console.log('\n=== Асинхронные слушатели ===');

const asyncEmitter = new EventEmitter();

asyncEmitter.on('asyncTask', async (msg) => {
    console.log(`[ББМО-01-23] async-слушатель начал работу`);
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`[ББМО-01-23] async-слушатель завершён через 100ms`);
});

console.log('[ББМО-01-23] emit вызван (не ждёт async-слушатель)');
asyncEmitter.emit('asyncTask', 'test');