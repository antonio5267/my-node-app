console.log("5. Синхронный код");
setTimeout(() => {
  console.log("1. setTimeout 0ms");
}, 0);
setTimeout(() => {
  console.log("2. setTimeout без задержки");
}, 0); // В JS если не указать время, считается 0
process.nextTick(() => {
  console.log("3. process.nextTick");
});
Promise.resolve().then(() => {
  console.log("4. Promise.then");
});