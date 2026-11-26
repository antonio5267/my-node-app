
const os = require('os');

console.log('=== Сетевые интерфейсы ===');
const networkInterfaces = os.networkInterfaces();
let totalInterfaces = 0;
let mainInterface = null;

for (const [name, interfaces] of Object.entries(networkInterfaces)) {
    for (const iface of interfaces) {
        totalInterfaces++;

        let maskedMac = iface.mac;
        if (maskedMac && maskedMac !== '00:00:00:00:00:00') {
            maskedMac = maskedMac.substring(0, 8) + ':**:**';
        }

        console.log(`Интерфейс: ${name}`);
        if (iface.family === 'IPv4' || iface.family === 4) {
            console.log(`  IPv4: ${iface.address}`);
        } else if (iface.family === 'IPv6' || iface.family === 6) {
            console.log(`  IPv6: ${iface.address}`);
        }
        console.log(`  MAC: ${maskedMac}`);
        console.log(`  Внутренний: ${iface.internal ? 'да' : 'нет'}`);

        if (!iface.internal && (iface.family === 'IPv4' || iface.family === 4) && !mainInterface) {
            mainInterface = { name, address: iface.address };
        }
    }
}

console.log(`Всего интерфейсов: ${totalInterfaces}`);
if (mainInterface) {
    console.log(`Основной интерфейс: ${mainInterface.name} (${mainInterface.address})`);
} else {
    console.log('Основной интерфейс не найден');
}

console.log('\n=== Информация о пользователе ===');
const userInfo = os.userInfo();
console.log(`Имя пользователя: ${userInfo.username}`);
console.log(`UID: ${userInfo.uid}`);
console.log(`Домашняя директория: ${userInfo.homedir}`);
console.log(`Оболочка по умолчанию: ${userInfo.shell}`);
console.log(`Группа: ББМО-01-23`);

console.log('\n=== Проверка безопасности ===');
if (os.platform() === 'win32') { // ТУТ БЫЛА ОПЕЧАТКА, ИСПРАВЛЕНО
    console.log('Проверка root: вы в Windows, проверка UID не применима');
} else {
    if (userInfo.uid === 0) {
        console.log('Проверка root: ВЫ ROOT! Это опасно.');
    } else {
        console.log('Проверка root: нет (вы обычный пользователь)');
    }
}