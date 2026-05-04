const mineflayer = require(‘mineflayer’);
const express = require(‘express’);

const app = express();
app.get(’/’, (req, res) => res.send(‘OK’));
app.listen(3000);

// CONFIG
const config = {
host: ‘ZorrosLand.aternos.me’,
port: 55714,
username: ‘WatchdogBot’,
version: false,
auth: ‘offline’
};

let bot = null;
let reconnecting = false;

function connectBot() {
if (reconnecting || bot) return;
reconnecting = true;

console.log(’[’ + new Date().toLocaleTimeString() + ‘] Conectando…’);

bot = mineflayer.createBot(config);

bot.once(‘login’, () => {
console.log(’[’ + new Date().toLocaleTimeString() + ‘] Login OK’);
reconnecting = false;
});

bot.once(‘spawn’, () => {
console.log(’[’ + new Date().toLocaleTimeString() + ‘] En servidor’);
antiAfk();
checkHealth();
});

bot.on(‘death’, () => {
console.log(’[’ + new Date().toLocaleTimeString() + ‘] Murio’);
});

bot.on(‘kicked’, (reason) => {
console.log(’[’ + new Date().toLocaleTimeString() + ’] Kick: ’ + reason);
});

bot.on(‘end’, () => {
console.log(’[’ + new Date().toLocaleTimeString() + ‘] Desconectado’);
bot = null;
reconnecting = false;
setTimeout(connectBot, 30000);
});

bot.on(‘error’, (err) => {
console.log(’[’ + new Date().toLocaleTimeString() + ’] Error: ’ + err.message);
});
}

function antiAfk() {
if (!bot) return;

const moves = [‘forward’, ‘back’, ‘left’, ‘right’, ‘jump’];
const move = moves[Math.floor(Math.random() * moves.length)];

if (move === ‘jump’) {
bot.setControlState(‘jump’, true);
setTimeout(() => bot.setControlState(‘jump’, false), 500);
} else {
bot.setControlState(move, true);
setTimeout(() => bot.setControlState(move, false), 2000);
}

bot.look(
Math.random() * Math.PI * 2,
(Math.random() - 0.5) * 0.5
);

setTimeout(antiAfk, Math.random() * 30000 + 20000);
}

function checkHealth() {
if (!bot) {
setTimeout(checkHealth, 30000);
return;
}

const health = bot.health || 20;
const food = bot.food || 20;
console.log(’[’ + new Date().toLocaleTimeString() + ’] Salud: ’ + health + ’ Comida: ’ + food);

if (health < 10 || food < 10) {
const items = [‘cooked_beef’, ‘cooked_chicken’, ‘bread’, ‘apple’, ‘cooked_pork’];
for (let item of items) {
const foodItem = bot.inventory.findInventoryObject({name: item});
if (foodItem) {
bot.consume();
console.log(’[’ + new Date().toLocaleTimeString() + ‘] Comiendo’);
break;
}
}
}

setTimeout(checkHealth, 60000);
}

connectBot();

process.on(‘uncaughtException’, (err) => {
console.log(’Error: ’ + err.message);
if (bot) bot.quit();
setTimeout(connectBot, 30000);
});
