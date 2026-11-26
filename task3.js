const fs = require('fs').promises;
const path = require('path');
const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : __dirname;
const reportFile = path.join(targetDir, 'report_14.json');
const allowedExtensions = ['.js', '.json', '.txt', '.md'];

async function scanDirectory(dir) {
  let stats = {
    totalFiles: 0,
    totalDirs: 0,
    totalSizeBytes: 0,
    extensions: {},
    files: [] // Для топ-5
  };

  try {
    const items = await fs.readdir(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.name === 'node_modules' || item.name === '.git') continue;

      if (item.isDirectory()) {
        stats.totalDirs++;
        const subStats = await scanDirectory(fullPath);
        stats.totalFiles += subStats.totalFiles;
        stats.totalDirs += subStats.totalDirs;
        stats.totalSizeBytes += subStats.totalSizeBytes;
        stats.files = stats.files.concat(subStats.files);
        for (const [ext, data] of Object.entries(subStats.extensions)) {
          if (!stats.extensions[ext]) stats.extensions[ext] = { count: 0, size: 0 };
          stats.extensions[ext].count += data.count;
          stats.extensions[ext].size += data.size;
        }
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (allowedExtensions.includes(ext)) {
          const fileStat = await fs.stat(fullPath);
          
          stats.totalFiles++;
          stats.totalSizeBytes += fileStat.size;
          
          if (!stats.extensions[ext]) stats.extensions[ext] = { count: 0, size: 0 };
          stats.extensions[ext].count++;
          stats.extensions[ext].size += fileStat.size;
          
          stats.files.push({
            name: item.name,
            path: path.relative(targetDir, fullPath),
            size: fileStat.size
          });
        }
      }
    }
  } catch (error) {
    console.error(`Ошибка при чтении директории ${dir}:`, error.message);
  }

  return stats;
}

async function task3() {
  console.log(`Анализ директории: ${targetDir}\n`);
  const stats = await scanDirectory(targetDir);
  stats.files.sort((a, b) => b.size - a.size);
  const top5Largest = stats.files.slice(0, 5);
  const top5Smallest = stats.files.slice(-5).reverse();
  console.log(`Общее количество папок: ${stats.totalDirs}`);
  console.log(`Общее количество файлов: ${stats.totalFiles}`);
  const sizeKB = (stats.totalSizeBytes / 1024).toFixed(2);
  const sizeMB = (stats.totalSizeBytes / (1024 * 1024)).toFixed(2);
  console.log(`Общий размер: ${sizeMB} МБ (${stats.totalSizeBytes} байт)`);
  console.log('\nРасширения файлов:');
  for (const [ext, data] of Object.entries(stats.extensions)) {
    console.log(`  ${ext}: ${data.count} файлов (${(data.size / 1024).toFixed(1)} КБ)`);
  }
  console.log('\nТоп-5 самых больших файлов:');
  top5Largest.forEach((f, i) => console.log(`  ${i+1}. ${f.name} (${(f.size/1024).toFixed(1)} КБ) - ./${f.path}`));

  console.log('\nТоп-5 самых маленьких файлов:');
  top5Smallest.forEach((f, i) => console.log(`  ${i+1}. ${f.name} (${(f.size/1024).toFixed(1)} КБ) - ./${f.path}`));

  const report = {
    analyzedDirectory: targetDir,
    totalDirs: stats.totalDirs,
    totalFiles: stats.totalFiles,
    totalSizeBytes: stats.totalSizeBytes,
    extensions: stats.extensions,
    top5Largest,
    top5Smallest
  };

  try {
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\nОтчет сохранен: ${path.basename(reportFile)}`);
  } catch (error) {
    console.error('Ошибка при сохранении отчета:', error.message);
  }
}

task3();