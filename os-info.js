
const os = require('os');

console.log('=== Информация о системе (группа ББМО-01-23) ===');

console.log(`Платформа: ${os.platform()}`);
// Человекочитаемое имя ОС
console.log(`Тип ОС: ${os.type()}`);
// Разрядность процессора
console.log(`Архитектура: ${os.arch()}`);
// Версия ОС
console.log(`Версия ОС: ${os.release()}`);
// Имя хоста в сети
console.log(`Имя хоста: ${os.hostname()}`);

const uptime = os.uptime();
const hours = Math.floor(uptime / 3600);
const minutes = Math.floor((uptime % 3600) / 60);
const seconds = Math.floor(uptime % 60);
console.log(`Время работы: ${hours} ч ${minutes} мин ${seconds} сек`);

const platform = os.platform();
if (platform === 'win32') {
    console.log('Вы работаете в Windows');
} else if (platform === 'linux') {
    console.log('Вы работаете в Linux');
} else if (platform === 'darwin') {
    console.log('Вы работаете в macOS');
} else {
    console.log('Неизвестная платформа');
}