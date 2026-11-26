const fs = require('fs');
const path = require('path');

function setupLogger(app) {
  const logFile = path.join(__dirname, 'logs.txt');

  function writeLog(eventName, data) {
    const time = new Date().toISOString();
    const logMessage = `[${time}] ${eventName}: ${JSON.stringify(data)}\n`;

    fs.appendFile(logFile, logMessage, (err) => {
      if (err) console.error('Ошибка записи лога:', err);
    });
  }

  app.on('server:started', (port) => writeLog('server:started', { port }));
  app.on('server:stopped', () => writeLog('server:stopped', {}));
  app.on('request:received', (reqInfo) => writeLog('request:received', reqInfo));
}

module.exports = { setupLogger };