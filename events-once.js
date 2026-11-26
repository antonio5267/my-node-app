const EventEmitter = require('events');
const emitter = new EventEmitter();

let onCount = 0;
let onceCount = 0;

const onListener = () => {
    onCount++;
    console.log(`[tick #${onCount + onceCount}] on-слушатель`);
};

const onceListener = () => {
    onceCount++;
    console.log(`[tick #${onCount + onceCount}] once-слушатель`);
};

emitter.on('tick', onListener);
emitter.once('tick', onceListener);

console.log(' Сравнение on и once ');
emitter.emit('tick');
emitter.emit('tick');
emitter.emit('tick');

console.log(`on-слушатель вызван: ${onCount} раза`);
console.log(`once-слушатель вызван: ${onceCount} раз`);

console.log('\n=== Управление подписками ===');

const listener1 = () => console.log('Слушатель 1');
const listener2 = () => console.log('Слушатель 2');
const listener3 = () => console.log('Слушатель 3 (группа ББМО-01-23)');

emitter.on('test', listener1);
emitter.on('test', listener2);
emitter.on('test', listener3);

console.log(`Слушателей до удаления: ${emitter.listenerCount('test')}`);

emitter.removeListener('test', listener2);
console.log(`Слушателей после удаления одного: ${emitter.listenerCount('test')}`);

emitter.removeAllListeners('test');
console.log(`Слушателей после removeAllListeners: ${emitter.listenerCount('test')}`);

console.log('\n Порядок вызова ');

emitter.on('order', () => console.log('1. Первый слушатель (группа ББМО-01-23)'));
emitter.on('order', () => console.log('2. Второй слушатель'));
emitter.on('order', () => console.log('3. Третий слушатель'));

emitter.emit('order');