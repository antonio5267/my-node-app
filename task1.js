const fs = require('fs').promises;
const path = require('path');

async function task1() {
  const filename = 'student_14.txt'; // Твой вариант 14
  const filePath = path.join(__dirname, filename);

  try {
    const now = new Date().toLocaleString('ru-RU');
    const content = `Студент: Прищепа Антон Анатольевич
Группа: 401
Вариант: 14
Дата: ${now}
Любимые книги:
1. "Война и мир" - Л. Толстой
2. "Преступление и наказание" - Ф. Достоевский
3. "Мастер и Маргарита" - М. Булгаков
4. "1984" - Дж. Оруэлл
5. "Гарри Поттер" - Дж. Роулинг
`;

    await fs.writeFile(filePath, content, 'utf8');
    console.log(`Создан файл: ${filename}`);

    // Считаем количество строк в текущем контенте + 1 (для новой строки)
    const linesCount = content.split('\n').length; 
    // Добавляем строку
    await fs.appendFile(filePath, `Количество записей: ${linesCount}\n`, 'utf8');

    const fileData = await fs.readFile(filePath, 'utf8');
    console.log('\nСодержимое файла:');
    console.log(fileData);

  } catch (error) {
    console.error('Ошибка при работе с файлом:', error.message);
  }
}

task1();