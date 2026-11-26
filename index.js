const http = require('http');
function calculatePi(N) {
  let pi = 0;
  for (let i = 0; i < N; i++) {
    // Чередование знаков: +, -, +, -
    pi += (i % 2 === 0 ? 1 : -1) / (2 * i + 1);
  }
  return 4 * pi;
}
const studentName = "Прищепа Антон Анатольевич";
const studentGroup = "401";
const journalNumber = 14; // Твой номер журнала
const piValue = calculatePi(journalNumber);
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <h1>${studentName}</h1>
    <h2>Группа: ${studentGroup}</h2>
    <p>Число Пи (14 итераций): ${piValue}</p>
  `);
});
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});