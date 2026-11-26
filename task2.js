const fs = require('fs').promises;
const path = require('path');

const baseDir = path.join(__dirname, 'project_14');
async function printTree(dir, prefix = '') {
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isLast = i === items.length - 1;
      const marker = isLast ? '└── ' : '├── ';
      console.log(prefix + marker + item.name);
      
      if (item.isDirectory()) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        await printTree(path.join(dir, item.name), newPrefix);
      }
    }
  } catch (error) {
    console.error('Ошибка при чтении дерева:', error.message);
  }
}

async function task2() {
  try {
    console.log(`Создание структуры в папке: ${baseDir}`);
    const dirs = [
      'src/modules',
      'src/components',
      'src/utils',
      'data/input',
      'data/output',
      'data/temp'
    ];

    for (const dir of dirs) {
      const fullPath = path.join(baseDir, dir);
      await fs.mkdir(fullPath, { recursive: true });
    }
    const readmeContent = `README от ${new Date().toLocaleDateString('ru-RU')}\n`;
    const allDirs = [
      'src', 'src/modules', 'src/components', 'src/utils',
      'data', 'data/input', 'data/output', 'data/temp'
    ];

    for (const dir of allDirs) {
      const fullPath = path.join(baseDir, dir);
      await fs.writeFile(path.join(fullPath, 'info.txt'), `Это папка ${dir}\n`, 'utf8');
      await fs.writeFile(path.join(fullPath, 'README.md'), readmeContent, 'utf8');
    }
    console.log('\n Исходное дерево ');
    await printTree(baseDir);
    console.log('\nПеремещение папки temp (в нашем случае она уже внутри data, пропускаем)...');
    console.log('Переименование data/output в data/results...');
    await fs.rename(path.join(baseDir, 'data/output'), path.join(baseDir, 'data/results'));


    console.log('Удаление папки temp...');
    await fs.rm(path.join(baseDir, 'data/temp'), { recursive: true, force: true });

    console.log('\n Обновленное дерево ');
    await printTree(baseDir);

    console.log('\nВсе операции выполнены успешно!');

  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}

task2();