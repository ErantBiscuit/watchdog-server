const mineflayer = require(‘mineflayer’);
const express = require(‘express’);

const app = express();

app.get(’/’, function(req, res) {
res.send(‘Watchdog activo’);
});

app.listen(3000, function() {
console.log(‘Express en puerto 3000’);
});

const HOST = ‘ZorrosLand.aternos.me’;
const PORT = 55714;
const USERNAME = ‘WatchdogBot’;

let bot = null;
let connecting = false;
let respawnAttempts = 0;
const MAX_RESPAWN_ATTEMPTS = 5;

function random(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min;
}

function log(msg) {
var timestamp = new Date().toLocaleTimeString(‘es-MX’);
console.log(’[’ + timestamp + ’] ’ + msg);
}

function watchdogLoop() {
if (bot && bot.health !== undefined) {
setTimeout(watchdogLoop, random(30000, 60000));
return;
}

if (connecting) {
setTimeout(watchdogLoop, random(10000, 20000));
return;
}

log(‘Verificando servidor…’);
createBot();

setTimeout(watchdogLoop, random(45000, 90000));
}

function createBot() {
if (connecting || bot) return;

connecting = true;
log(‘Conectando al bot…’);

try {
bot = mineflayer.createBot({
host: HOST,
port: PORT,
username: USERNAME,
version: false,
connectTimeout: 15000,
auth: ‘offline’
});

```
bot.once('login', function() {
  log('Login exitoso');
  connecting = false;
  respawnAttempts = 0;
});

bot.once('spawn', function() {
  log('Bot spawneado');
  antiAfkLoop();
  healthCheckLoop();
});

bot.on('death', function() {
  log('Bot murio');
  respawnAttempts++;

  if (respawnAttempts <= MAX_RESPAWN_ATTEMPTS) {
    setTimeout(function() {
      if (bot) {
        log('Respawn intento: ' + respawnAttempts);
      }
    }, 2000);
  } else {
    log('Reconectando...');
    if (bot) bot.quit();
    bot = null;
    connecting = false;
    setTimeout(createBot, random(20000, 45000));
  }
});

bot.on('health', function() {
  var health = bot.health || 20;
  var food = bot.food || 20;

  if (health < 5) {
    log('Salud baja: ' + health);
    tryEat();
  }

  if (health <= 0) {
    respawnAttempts++;
  }
});

bot.on('end', function() {
  log('Desconectado');
  bot = null;
  connecting = false;

  setTimeout(function() {
    createBot();
  }, random(15000, 30000));
});

bot.on('error', function(err) {
  log('Error: ' + err.message);
});

bot.on('kicked', function(reason) {
  log('Kick: ' + reason);
});
```

} catch (error) {
log(’Error al crear bot: ’ + error.message);
connecting = false;
setTimeout(createBot, 30000);
}
}

function antiAfkLoop() {
if (!bot || !bot.entity) {
setTimeout(antiAfkLoop, 5000);
return;
}

var actions = [‘forward’, ‘back’, ‘left’, ‘right’, ‘jump’, ‘sprint’];
var action = actions[random(0, actions.length - 1)];

bot.look(
Math.random() * Math.PI * 2,
(Math.random() - 0.5) * 0.5,
true
);

if (action === ‘jump’) {
bot.setControlState(‘jump’, true);
setTimeout(function() {
if (bot) bot.setControlState(‘jump’, false);
}, random(300, 800));
} else if (action === ‘sprint’) {
bot.setControlState(‘forward’, true);
bot.setControlState(‘sprint’, true);
setTimeout(function() {
if (bot) {
bot.setControlState(‘forward’, false);
bot.setControlState(‘sprint’, false);
}
}, random(2000, 5000));
} else {
bot.setControlState(action, true);
setTimeout(function() {
if (bot) bot.setControlState(action, false);
}, random(1500, 4000));
}

setTimeout(function() {
if (bot) {
bot.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.3, true);
}
}, random(2000, 5000));

setTimeout(antiAfkLoop, random(20000, 70000));
}

function healthCheckLoop() {
if (!bot) {
setTimeout(healthCheckLoop, 30000);
return;
}

var health = bot.health || 20;
var food = bot.food || 20;

log(’Salud: ’ + health + ’/20 - Comida: ’ + food + ‘/20’);

if (health < 15 || food < 15) {
tryEat();
}

setTimeout(healthCheckLoop, random(30000, 60000));
}

function tryEat() {
if (!bot) return;

var foodItems = [
‘cooked_beef’, ‘cooked_pork’, ‘cooked_chicken’, ‘cooked_mutton’,
‘bread’, ‘apple’, ‘cooked_cod’, ‘cooked_salmon’,
‘baked_potatoes’, ‘carrots’, ‘golden_apple’
];

for (var i = 0; i < foodItems.length; i++) {
var food = foodItems[i];
var item = bot.inventory.findInventoryObject({ name: food });
if (item) {
log(’Comiendo: ’ + food);
bot.consume();
return;
}
}
}

log(‘Iniciando Watchdog’);
watchdogLoop();

process.on(‘uncaughtException’, function(err) {
log(’Error critico: ’ + err.message);
if (bot) bot.quit();
bot = null;
setTimeout(createBot, 30000);
});

process.on(‘unhandledRejection’, function(reason) {
log(’Promesa rechazada: ’ + reason);
});
