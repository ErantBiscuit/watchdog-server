const mineflayer = require(‘mineflayer’)
const express = require(‘express’)

const app = express()

app.get(’/’, (req, res) => {
res.send(‘Watchdog activo - ZorrosLand Bedrock’)
})

app.listen(3000, () => {
console.log(‘Server express en puerto 3000’)
})

// ======================================
// CONFIGURACIÓN ZOROSLAND BEDROCK
// ======================================

const HOST = ‘ZorrosLand.aternos.me’
const PORT = 55714
const USERNAME = ‘WatchdogBot’

// ======================================
// VARIABLES GLOBALES
// ======================================

let bot = null
let connecting = false
let respawnAttempts = 0
const MAX_RESPAWN_ATTEMPTS = 5
let lastHealthCheck = Date.now()

// ======================================
// UTILIDADES
// ======================================

function random(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min
}

function log(msg) {
const timestamp = new Date().toLocaleTimeString(‘es-MX’)
console.log(`[${timestamp}] ${msg}`)
}

// ======================================
// WATCHDOG PRINCIPAL
// ======================================

async function watchdogLoop() {
// Si ya hay bot conectado, solo hacer chequeo
if (bot && bot.health !== undefined) {
setTimeout(watchdogLoop, random(30000, 60000))
return
}

// Si está conectando, esperar
if (connecting) {
setTimeout(watchdogLoop, random(10000, 20000))
return
}

log(‘🔍 Verificando servidor…’)
createBot()

setTimeout(watchdogLoop, random(45000, 90000))
}

// ======================================
// CREAR BOT CON AUTO-RESPAWN BEDROCK
// ======================================

function createBot() {
if (connecting || bot) return

connecting = true
log(‘🤖 Intentando conexión a Bedrock…’)

bot = mineflayer.createBot({
host: HOST,
port: PORT,
username: USERNAME,
version: false, // Auto-detectar versión
connectTimeout: 15000,
auth: ‘offline’,
hideErrors: false
})

// ============ EVENTOS ============

// LOGIN EXITOSO
bot.once(‘login’, () => {
log(‘✅ Login exitoso en Bedrock’)
connecting = false
respawnAttempts = 0
})

// SPAWN - BOT APARECIÓ EN EL MUNDO
bot.once(‘spawn’, () => {
log(‘🌍 Spawn completado - Bot en el servidor’)
lastHealthCheck = Date.now()

```
// Iniciar comportamientos
antiAfkLoop()
healthCheckLoop()
```

})

// MUERTE DEL BOT
bot.on(‘death’, () => {
log(‘💀 Bot murió - intentando respawn…’)
respawnAttempts++

```
if (respawnAttempts <= MAX_RESPAWN_ATTEMPTS) {
  // Esperar a que respawnee automáticamente
  setTimeout(() => {
    if (bot) {
      log(`🔄 Respawn intento ${respawnAttempts}/${MAX_RESPAWN_ATTEMPTS}`)
    }
  }, 2000)
} else {
  log('❌ Demasiados respawns - reconectando completamente')
  if (bot) bot.quit()
  bot = null
  connecting = false
  setTimeout(createBot, random(20000, 45000))
}
```

})

// CAMBIO DE SALUD
bot.on(‘health’, () => {
const health = bot.health || 20
const food = bot.food || 20

```
if (health < 5) {
  log(`⚠️ ¡ALERTA! Salud baja: ${health}/20`)
  tryEat()
}

if (health <= 0) {
  log('💀 Bot sin salud detectado')
  respawnAttempts++
}
```

})

// DESCONEXIÓN
bot.on(‘end’, () => {
log(‘🔌 Conexión terminada - Reintentando…’)
bot = null
connecting = false

```
// Reintento rápido
setTimeout(() => {
  createBot()
}, random(15000, 30000))
```

})

// ERRORES
bot.on(‘error’, err => {
if (err.code === ‘ECONNRESET’ || err.code === ‘ETIMEDOUT’) {
log(`⚠️ Error de conexión normal: ${err.code}`)
return
}
log(`❌ Error: ${err.message}`)
})

// KICKS
bot.on(‘kicked’, reason => {
log(`🚫 Kick: ${reason}`)
})

// CHAT (detectar si lo atacan)
bot.on(‘chat’, (username, message) => {
if (username !== USERNAME) {
log(`💬 ${username}: ${message}`)
}
})

// ENTITY HURT (Si es atacado)
bot.on(‘entityHurt’, (entity) => {
if (entity === bot.entity) {
log(`⚔️ ¡Bot siendo atacado por ${entity.type}!`)
tryEat()
}
})
}

// ======================================
// ANTI-AFK REALISTA
// ======================================

function antiAfkLoop() {
if (!bot || !bot.entity) {
setTimeout(antiAfkLoop, 5000)
return
}

const actions = [
‘forward’,
‘back’,
‘left’,
‘right’,
‘jump’,
‘sprint’
]

const action = actions[random(0, actions.length - 1)]

// Mirada realista
bot.look(
Math.random() * Math.PI * 2,
(Math.random() - 0.5) * 0.5,
true
)

// SALTO
if (action === ‘jump’) {
bot.setControlState(‘jump’, true)
setTimeout(() => {
if (bot) bot.setControlState(‘jump’, false)
}, random(300, 800))
}
// SPRINT MOVIMIENTO
else if (action === ‘sprint’) {
bot.setControlState(‘forward’, true)
bot.setControlState(‘sprint’, true)
setTimeout(() => {
if (bot) {
bot.setControlState(‘forward’, false)
bot.setControlState(‘sprint’, false)
}
}, random(2000, 5000))
}
// MOVIMIENTO NORMAL
else {
bot.setControlState(action, true)
setTimeout(() => {
if (bot) bot.setControlState(action, false)
}, random(1500, 4000))
}

// Segunda mirada
setTimeout(() => {
if (bot) {
bot.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.3, true)
}
}, random(2000, 5000))

// Siguiente acción (20-70 segundos)
setTimeout(antiAfkLoop, random(20000, 70000))
}

// ======================================
// CHEQUEO DE SALUD CONSTANTE
// ======================================

function healthCheckLoop() {
if (!bot) {
setTimeout(healthCheckLoop, 30000)
return
}

const health = bot.health || 20
const food = bot.food || 20

log(`❤️ Salud: ${health}/20 | 🍗 Comida: ${food}/20`)

// Si está enfermo, comer
if (health < 15 || food < 15) {
tryEat()
}

setTimeout(healthCheckLoop, random(30000, 60000))
}

// ======================================
// INTENTAR COMER
// ======================================

function tryEat() {
if (!bot) return

// Buscar comida en el inventario
const foodItems = [
‘cooked_beef’, ‘cooked_pork’, ‘cooked_chicken’, ‘cooked_mutton’,
‘bread’, ‘apple’, ‘cooked_cod’, ‘cooked_salmon’,
‘baked_potatoes’, ‘carrots’, ‘golden_apple’, ‘melon_slice’,
‘pumpkin_pie’, ‘beetroot’, ‘cooked_rabbit’
]

for (const food of foodItems) {
const item = bot.inventory.findInventoryObject({ name: food })
if (item) {
log(`🍽️ Comiendo ${food}...`)
bot.consume().catch(() => {
// Ignorar errores de consumo
})
return
}
}

log(‘⚠️ Sin comida disponible’)
}

// ======================================
// INICIAR WATCHDOG
// ======================================

log(‘🚀 Iniciando Watchdog Bot para ZorrosLand Bedrock’)
log(`📍 ${HOST}:${PORT}`)
log(`👤 Usuario: ${USERNAME}`)
log(‘⚙️ Modo: Permanentemente conectado (sin desconexiones)’)

watchdogLoop()

// Manejo de errores global
process.on(‘uncaughtException’, (err) => {
log(`🔥 ERROR CRÍTICO: ${err.message}`)
if (bot) bot.quit()
bot = null
setTimeout(createBot, 30000)
})

process.on(‘unhandledRejection’, (reason) => {
log(`⚠️ Promesa rechazada: ${reason}`)
})
