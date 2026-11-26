const fs = require('fs');
const path = require('path');
const readline = require('readline');
const dataFile = path.join(__dirname, 'data_14.txt');
const processedFile = path.join(__dirname, 'processed_14.txt');
const bigNumbersFile = path.join(__dirname, 'big_numbers_14.txt'); // Для доп. условия
async function generateFile() {
  if (fs.existsSync(dataFile)) {
    console.log('Файл уже существует, пропускаем генерацию.');
    return;
  }
  console.log('Генерация файла на 100 000 строк...');
  const writeStream = fs.createWriteStream(dataFile);
  for (let i = 1; i <= 100000; i++) {
    const randomNum = Math.floor(Math.random() * 1000) + 1;
    const line = `${i}, ${randomNum}, Вариант 14\n`;
    if (!writeStream.write(line)) {
      await new Promise(resolve => writeStream.once('drain', resolve));
    }
  }
  writeStream.end();
  console.log('Файл сгенерирован!');
}
async function processFile() {
  console.log(`\nОбработка файла: ${path.basename(dataFile)}`);
  const stats = {
    totalLines: 0,
    sum: 0,
    min: Infinity,
    max: -Infinity,
    evenCount: 0,
    oddCount: 0
  };
  const startTime = Date.now();
  const readStream = fs.createReadStream(dataFile, { encoding: 'utf8', highWaterMark: 64 * 1024 }); // Буфер 64 КБ
  
  // Создаем интерфейс для построчного чтения
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
  });
  const bigNumbersStream = fs.createWriteStream(bigNumbersFile);
  for await (const line of rl) {
    stats.totalLines++;
    const parts = line.split(', ');
    if (parts.length >= 2) {
      const num = parseInt(parts[1], 10);      
      if (!isNaN(num)) {
        stats.sum += num;
        if (num < stats.min) stats.min = num;
        if (num > stats.max) stats.max = num;        
        if (num % 2 === 0) stats.evenCount++;
        else stats.oddCount++;
        if (num > 500) {
          bigNumbersStream.write(line + '\n');
        }
      }
    }
    if (stats.totalLines % 10000 === 0) {
      console.log(`Прогресс: ${stats.totalLines / 1000}% (${stats.totalLines} строк обработано)`);
    }
  }
  bigNumbersStream.end();
  const endTime = Date.now();
  const timeSpent = ((endTime - startTime) / 1000).toFixed(2);
  const average = (stats.sum / stats.totalLines).toFixed(2);
  const resultText = `Обработка завершена!
Результаты:
- Всего строк: ${stats.totalLines}
- Сумма чисел: ${stats.sum}
- Среднее значение: ${average}
- Максимальное число: ${stats.max}
- Минимальное число: ${stats.min}
- Четных чисел: ${stats.evenCount}
- Нечетных чисел: ${stats.oddCount}
- Время выполнения: ${timeSpent} сек
`;
  console.log('\n' + resultText);
  fs.writeFileSync(processedFile, resultText, 'utf8');
  console.log(`Результаты сохранены в: ${path.basename(processedFile)}`);
  console.log(`Строки с числами > 500 сохранены в: ${path.basename(bigNumbersFile)}`);
}
async function main() {
  await generateFile();
  await processFile();
}
main();