
const os = require('os');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'monitor.log');
let warningsCount = 0;

function logWarning(message) {
    warningsCount++;
    const timestamp = new Date().toLocaleString('ru-RU');
    const logLine = `[${timestamp}] [ББМО-01-23] Предупреждение: ${message}\n`;
    fs.appendFileSync(logFile, logLine, 'utf8');
}

function getCpuTimes() {
    const cpus = os.cpus();
    let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
    for (let cpu of cpus) {
        user += cpu.times.user;
        nice += cpu.times.nice;
        sys += cpu.times.sys;
        idle += cpu.times.idle;
        irq += cpu.times.irq;
    }
    return { user, nice, sys, idle, irq, total: user + nice + sys + idle + irq };
}

let prevTimes = getCpuTimes();

console.log('Мониторинг (группа ББМО-01-23). Ctrl+C для выхода.\n');

const interval = setInterval(() => {
    // 1. Считаем загрузку CPU
    const currentTimes = getCpuTimes();
    const totalDiff = currentTimes.total - prevTimes.total;
    const idleDiff = currentTimes.idle - prevTimes.idle;
    const busyDiff = totalDiff - idleDiff;
    
    const cpuLoad = ((busyDiff / totalDiff) * 100).toFixed(1);
    prevTimes = currentTimes;
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const freeGB = (freeMem / (1024 ** 3)).toFixed(2);
    const usedPercent = (((totalMem - freeMem) / totalMem) * 100).toFixed(1);

    let status = 'Норма';
    if (cpuLoad > 80) {
        status = 'КРИТИЧНО';
        logWarning(`CPU загружен на ${cpuLoad}%`);
    } else if (cpuLoad > 50) {
        status = 'ПРЕДУПРЕЖДЕНИЕ';
        logWarning(`CPU загружен на ${cpuLoad}%`);
    }

    if (freeMem / totalMem < 0.1) {
        status = 'МАЛО ПАМЯТИ';
        logWarning(`Свободно менее 10% памяти (${freeGB} ГБ)`);
    }
    const output = `CPU: ${cpuLoad}% | RAM: ${usedPercent}% (${freeGB} ГБ свободно) | Статус: ${status}`;
    process.stdout.write(`\r${output}          `); // пробелы в конце, чтобы затереть старый текст

}, 2000);

process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\n\nМониторинг остановлен.');
    console.log(`Предупреждений: ${warningsCount}`);
    console.log(`Логи сохранены в файл: ${logFile}`);
    process.exit(0);
});