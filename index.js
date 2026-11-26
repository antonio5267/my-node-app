const http = require('http');
const { EventEmitter } = require('events');
const logger = require('./logger'); // Подключаем логгер для Задания 2
class AppServer extends EventEmitter {
  constructor() {
    super();
    this.server = null;
  }
  start(port) {
    this.server = http.createServer((req, res) => {
      // Генерируем событие при запросе
      this.emit('request:received', { url: req.url, method: req.method });
      if (req.method === 'GET' && req.url.startsWith('/order/')) {
        const orderId = req.url.split('/')[2];
        orderHandler.processOrder(orderId);
      }
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Hello from Event-Driven Server!');
    });

    this.server.listen(port, () => {
      // Генерируем событие старта
      this.emit('server:started', port);
    });
  }
  stop() {
    if (this.server) {
      this.server.close(() => {
        this.emit('server:stopped');
      });
    }
  }
}
class OrderHandler extends EventEmitter {
  processOrder(orderId) {
    this.emit('order:start', orderId);
    setTimeout(() => {
      this.emit('order:processing', `Заказ #${orderId}: Идёт обработка...`);
      setTimeout(() => {
        const sum = Math.floor(Math.random() * 900) + 100; // Случайная сумма 100-1000
        this.emit('order:complete', { orderId, sum });
      }, 2000);
    }, 2000);
  }
}
class UserTracker extends EventEmitter {
  trackAction(userId, action, metadata) {
    this.emit('user:action', {
      userId: userId,
      action: action,
      timestamp: new Date().toISOString(),
      metadata: metadata,
      id: Math.random().toString(36).substr(2, 9)
    });
  }
}
const app = new AppServer();
const orderHandler = new OrderHandler();
const userTracker = new UserTracker();
logger.setupLogger(app);
app.on('server:started', (port) => {
  console.log(`Сервер запущен на порту ${port}`);
});

app.on('request:received', (reqInfo) => {
  console.log(`Получен запрос: ${reqInfo.method} ${reqInfo.url}`);
});

app.on('server:stopped', () => {
  console.log('Сервер остановлен');
});
orderHandler.on('order:start', (orderId) => {
  console.log(`[order:start] Заказ #${orderId} начат`);
});

orderHandler.on('order:processing', (msg) => {
  console.log(`[order:processing] ${msg}`);
});

orderHandler.on('order:complete', ({ orderId, sum }) => {
  let pi = 0;
  for (let i = 0; i < 1000000; i++) {
    pi += (i % 2 === 0 ? 1 : -1) / (2 * i + 1);
  }
  pi = (pi * 4).toFixed(7); // Округляем до 7 знаков
  
  console.log(`[order:complete] Заказ #${orderId} завершён на сумму ${sum} руб. PI = ${pi}`);
});
userTracker.on('user:action', (data) => {
  console.log(`\n👤 Пользователь ${data.userId} совершил действие "${data.action}"`);
  console.log(`Время: ${data.timestamp}`);
  console.log(`ID события: ${data.id}`);
  console.log(`Доп. данные:`, data.metadata, `\n`);
});
const PORT = 3000;
app.start(PORT);
setTimeout(() => {
  userTracker.trackAction('user_1', 'login', { ip: '192.168.1.1', browser: 'Chrome' });
}, 1000);

setTimeout(() => {
  userTracker.trackAction('user_2', 'purchase', { item: 'book', price: 500 });
}, 2000);
setTimeout(() => {
  app.stop();
  process.exit(0); // Принудительно закрываем процесс
}, 10000);