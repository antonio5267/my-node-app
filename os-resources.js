
const os = require('os');

const cpus = os.cpus();
console.log(' Информация о процессоре ');
console.log(`Количество логических ядер: ${cpus.length}`);
console.log(`Модель процессора: ${cpus[0].model}`);

let totalSpeed = 0;
for (let i = 0; i < cpus.length; i++) {
    totalSpeed += cpus[i].speed;
}
const avgSpeed = (totalSpeed / cpus.length).toFixed(0);
console.log(`Средняя частота: ${avgSpeed} МГц`);

console.log('\n=== Информация о памяти ===');
const totalMem = os.totalmem();
const freeMem = os.freemem();
const usedMem = totalMem - freeMem;

const totalGB = (totalMem / (1024 ** 3)).toFixed(2);
const freeGB = (freeMem / (1024 ** 3)).toFixed(2);
const usedGB = (usedMem / (1024 ** 3)).toFixed(2);
const usedPercent = ((usedMem / totalMem) * 100).toFixed(1);

console.log(`Общий объём: ${totalGB} ГБ`);
console.log(`Свободно: ${freeGB} ГБ`);
console.log(`Использовано: ${usedGB} ГБ (${usedPercent}%)`);
console.log(`Группа: ББМО-01-23`);

if (freeMem / totalMem < 0.2) {
    console.log('ВНИМАНИЕ: Мало свободной памяти!');
} else {
    console.log('Память в норме');
}


console.log('\n Средняя загрузка ');
if (os.platform() === 'win32') {
    console.log('Для Windows средняя загрузка недоступна (os.loadavg() возвращает нули)');
} else {
    const load = os.loadavg();
    console.log(`За 1 мин: ${load[0].toFixed(2)}`);
    console.log(`За 5 мин: ${load[1].toFixed(2)}`);
    console.log(`За 15 мин: ${load[2].toFixed(2)}`);
}