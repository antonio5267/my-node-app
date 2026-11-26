const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

const N = 14;
const sourceDir = path.join(__dirname, `source_${N}`);
const backupDir = path.join(__dirname, `backup_${N}`);
const reportFile = path.join(__dirname, `sync_report_${N}.txt`);

async function getFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fsSync.createReadStream(filePath);
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function createTestStructure() {
  console.log(`Создание тестовой структуры в ${sourceDir}...`);
  await fs.mkdir(sourceDir, { recursive: true });
  await fs.mkdir(path.join(sourceDir, 'sub1'), { recursive: true });
  await fs.mkdir(path.join(sourceDir, 'sub2'), { recursive: true });
  await fs.mkdir(path.join(sourceDir, 'sub3'), { recursive: true });

  const files = [
    { name: 'file1.txt', content: 'Текстовый файл 1' },
    { name: 'file2.js', content: 'console.log("Hello");' },
    { name: 'file3.json', content: '{"key": "value"}' },
    { name: 'file4.jpg', content: 'fake image data' },
    { name: 'file5.png', content: 'fake image data' },
    { name: 'sub1/subfile1.txt', content: 'Текст в подпапке 1' },
    { name: 'sub2/subfile2.js', content: 'console.log("Sub 2");' },
    { name: 'sub3/subfile3.json', content: '{"sub": 3}' },
  ];

  for (const file of files) {
    const fullPath = path.join(sourceDir, file.name);
    await fs.writeFile(fullPath, file.content, 'utf8');
  }

  const manifest = files.map(f => ({ name: f.name, size: f.content.length }));
  await fs.writeFile(path.join(sourceDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('Структура создана.\n');
}

async function copyFiles() {
  console.log('Копирование файлов...');
  await fs.mkdir(backupDir, { recursive: true });

  const streamExts = ['.txt', '.js', '.json'];
  let copiedCount = 0;
  let streamCount = 0;
  let normalCount = 0;
  let skippedCount = 0;

  async function processDir(src, dest) {
    const items = await fs.readdir(src, { withFileTypes: true });
    await fs.mkdir(dest, { recursive: true });

    for (const item of items) {
      const srcPath = path.join(src, item.name);
      const destPath = path.join(dest, item.name);

      if (item.isDirectory()) {
        await processDir(srcPath, destPath);
      } else if (item.isFile()) {
        let shouldCopy = true;
        if (fsSync.existsSync(destPath)) {
          const srcStat = await fs.stat(srcPath);
          const destStat = await fs.stat(destPath);
          // Если размер и время изменения совпадают, пропускаем
          if (srcStat.size === destStat.size && srcStat.mtimeMs === destStat.mtimeMs) {
            shouldCopy = false;
          }
        }

        if (!shouldCopy) {
          skippedCount++;
          continue;
        }

        const ext = path.extname(item.name).toLowerCase();
        
        if (streamExts.includes(ext)) {
          // Копирование через потоки
          await new Promise((resolve, reject) => {
            const readStream = fsSync.createReadStream(srcPath);
            const writeStream = fsSync.createWriteStream(destPath);
            readStream.pipe(writeStream);
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
          });
          streamCount++;
        } else {
          // Обычное копирование
          await fs.copyFile(srcPath, destPath);
          normalCount++;
        }
        copiedCount++;
      }
    }
  }

  await processDir(sourceDir, backupDir);
  console.log(`Копирование завершено!`);
  console.log(`- Скопировано файлов: ${copiedCount} (потоки: ${streamCount}, обычные: ${normalCount})`);
  console.log(`- Пропущено (не изменены): ${skippedCount}\n`);
}

async function compareDirectories() {
  console.log('Сравнение директорий...');
  let same = 0, changed = 0, added = 0, deleted = 0;

  async function getFilesMap(dir, base = '') {
    const map = new Map();
    const items = await fs.readdir(dir, { withFileTypes: true });
    for (const item of items) {
      const relPath = path.join(base, item.name);
      if (item.isDirectory()) {
        const subMap = await getFilesMap(path.join(dir, item.name), relPath);
        subMap.forEach((val, key) => map.set(key, val));
      } else {
        const fullPath = path.join(dir, item.name);
        const stat = await fs.stat(fullPath);
        map.set(relPath, { size: stat.size, mtime: stat.mtimeMs });
      }
    }
    return map;
  }

  const srcMap = await getFilesMap(sourceDir);
  const destMap = await getFilesMap(backupDir);

  for (const [file, srcStat] of srcMap) {
    if (!destMap.has(file)) {
      added++;
    } else {
      const destStat = destMap.get(file);
      if (srcStat.size === destStat.size) {
        same++;
      } else {
        changed++;
      }
    }
  }

  for (const file of destMap.keys()) {
    if (!srcMap.has(file)) deleted++;
  }

  const report = `Отчет синхронизации
Совпадают: ${same} файлов
Изменены: ${changed} файлов
Добавлены: ${added} файлов
Удалены: ${deleted} файлов
`;
  await fs.writeFile(reportFile, report, 'utf8');
  console.log(report);
  console.log(`Отчет сохранен: ${path.basename(reportFile)}`);
}

async function main() {
  await createTestStructure();
  await copyFiles();
  await compareDirectories();
}

main();