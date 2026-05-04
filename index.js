const mineflayer = require('mineflayer')
const express = require('express')
// npm install mineflayer aternos-api
const Aternos = require('aternos-api')
 
const app = express()
app.get('/', (req, res) => res.send('Watchdog activo'))
app.listen(3000)
 
// ======================================
// CONFIGURACIÓN — edita esto
// ======================================
const HOST         = 'ErantBiscuit91-nHIh.aternos.me'
const PORT         = 25565
const USERNAME     = 'WatchdogBot'
 
// Guarda estos como variables de entorno en Render:
// ATERNOS_USER, ATERNOS_PASS, ATERNOS_SERVER
const ATERNOS_USER   = process.env.ATERNOS_USER
const ATERNOS_PASS   = process.env.ATERNOS_PASS
const SERVER_NAME    = process.env.ATERNOS_SERVER
 
// Horario Querétaro (UTC-6)
const HORA_INICIO = 6   // 6:00 AM — encender y conectar
const HORA_FIN    = 24  // Medianoche — apagar (hora 0)
 
// ======================================
// VARIABLES
// ======================================
let bot               = null
let connecting        = false
let afkTimer          = null
let servidor          = null
let servidorEncendido = false
 
// ======================================
// UTILIDADES
// ======================================
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
 
function horaQro() {
  const now = new Date()
  return (now.getUTCHours() - 6 + 24) % 24
}
 
function dentroDeHorario() {
  const h = horaQro()
  return h >= HORA_INICIO && h < HORA_FIN
}
 
function log(msg) {
  const now = new Date()
  const h   = horaQro()
  const m   = now.getUTCMinutes().toString().padStart(2, '0')
  console.log(`[${h}:${m} QRO] ${msg}`)
}
 
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
 
// ======================================
// CONTROL DE ATERNOS
// ======================================
async function loginAternos() {
  try {
    log('Iniciando sesión en Aternos...')
    const aternos   = await Aternos.connect(ATERNOS_USER, ATERNOS_PASS)
    const lista     = await aternos.getServers()
    servidor        = lista.find(s => s.name === SERVER_NAME) || lista[0]
    log(`Servidor Aternos: ${servidor.name}`)
    return true
  } catch (err) {
    log(`Error Aternos login: ${err.message}`)
    return false
  }
}
 
async function encenderServidor() {
  if (servidorEncendido) return true
  if (!servidor) {
    const ok = await loginAternos()
    if (!ok) return false
  }
 
  try {
    const status = await servidor.getStatus()
    log(`Estado Aternos: ${status.label}`)
 
    if (status.id === 2) {           // 2 = online
      log('Servidor ya está encendido')
      servidorEncendido = true
      return true
    }
 
    if (status.id !== 1) {           // 1 = offline — cualquier otro estado, esperar
      log(`Servidor ocupado (${status.label}), esperando 30s...`)
      await esperar(30000)
      return encenderServidor()
    }
 
    log('Encendiendo servidor...')
    await servidor.start()
 
    // Esperar hasta 4 minutos a que esté en línea
    for (let i = 0; i < 24; i++) {
      await esperar(10000)
      const s = await servidor.getStatus()
      log(`Estado: ${s.label}`)
      if (s.id === 2) {
        log('✔ Servidor en línea')
        servidorEncendido = true
        return true
      }
    }
 
    log('Timeout esperando servidor')
    return false
  } catch (err) {
    log(`Error encendiendo: ${err.message}`)
    return false
  }
}
 
async function apagarServidor() {
  if (!servidor || !servidorEncendido) return
  try {
    log('Apagando servidor Aternos...')
    await servidor.stop()
    servidorEncendido = false
    log('✔ Servidor apagado')
  } catch (err) {
    log(`Error apagando: ${err.message}`)
  }
}
 
// ======================================
// ANTI-AFK — el bot se queda dentro todo el horario
// ======================================
function iniciarAntiAfk() {
  if (afkTimer) clearTimeout(afkTimer)
 
  function ciclo() {
    if (!bot) return
 
    const tipo = random(1, 6)
 
    // Mirada aleatoria siempre
    bot.look(
      Math.random() * Math.PI * 2,
      (Math.random() - 0.5) * 0.6,
      true
    )
 
    if (tipo === 1) {
      // Caminar adelante, sprint aleatorio
      bot.setControlState('forward', true)
      bot.setControlState('sprint', random(0, 1) === 1)
      setTimeout(() => {
        if (!bot) return
        bot.setControlState('forward', false)
        bot.setControlState('sprint', false)
      }, random(800, 3000))
 
    } else if (tipo === 2) {
      // Lateral
      const dir = random(0, 1) === 0 ? 'left' : 'right'
      bot.setControlState(dir, true)
      setTimeout(() => {
        if (!bot) return
        bot.setControlState(dir, false)
      }, random(500, 2000))
 
    } else if (tipo === 3) {
      // Saltar corriendo
      bot.setControlState('forward', true)
      bot.setControlState('sprint', true)
      bot.setControlState('jump', true)
      setTimeout(() => {
        if (!bot) return
        bot.setControlState('jump', false)
        bot.setControlState('forward', false)
        bot.setControlState('sprint', false)
      }, random(400, 1200))
 
    } else if (tipo === 4) {
      // Agacharse
      bot.setControlState('sneak', true)
      setTimeout(() => {
        if (!bot) return
        bot.setControlState('sneak', false)
      }, random(600, 2000))
 
    } else if (tipo === 5) {
      // Retroceder
      bot.look(Math.random() * Math.PI * 2, 0, true)
      bot.setControlState('back', true)
      setTimeout(() => {
        if (!bot) return
        bot.setControlState('back', false)
      }, random(500, 1500))
 
    } else {
      // Pausa — solo mira (simula que el jugador está leyendo el chat, etc.)
      setTimeout(() => {
        if (bot) bot.look(Math.random() * Math.PI * 2, Math.random() * 0.4, true)
      }, random(1000, 4000))
    }
 
    afkTimer = setTimeout(ciclo, random(20000, 50000))
  }
 
  ciclo()
  log('Anti-AFK iniciado')
}
 
function detenerAntiAfk() {
  if (afkTimer) {
    clearTimeout(afkTimer)
    afkTimer = null
  }
}
 
// ======================================
// BOT DE MINECRAFT
// ======================================
function createBot() {
  if (connecting || bot) return
  if (!dentroDeHorario()) {
    log('Fuera de horario, no conectando')
    return
  }
 
  connecting = true
  log('Conectando al servidor de Minecraft...')
 
  bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username: USERNAME,
    version: false,
    connectTimeout: 30000,
    checkTimeoutInterval: 10000
  })
 
  bot.once('login', () => {
    log('✔ Login exitoso')
    connecting = false
  })
 
  bot.once('spawn', () => {
    log('✔ Spawn completado — el bot se queda hasta las 12 AM')
    iniciarAntiAfk()
  })
 
  bot.on('end', (reason) => {
    log(`Desconectado: ${reason}`)
    detenerAntiAfk()
    bot = null
    connecting = false
 
    if (dentroDeHorario()) {
      const t = random(8000, 20000)
      log(`Reconectando en ${t / 1000}s...`)
      setTimeout(createBot, t)
    } else {
      log('Fuera de horario — no reconectando')
    }
  })
 
  bot.on('error', (err) => {
    if (['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'].includes(err.code)) {
      log(`Error de red (normal en Aternos): ${err.code}`)
      return
    }
    log(`Error: ${err.message}`)
  })
 
  bot.on('kicked', (reason) => {
    log(`Kick: ${reason}`)
  })
}
 
// ======================================
// LOOP PRINCIPAL — cada 60 segundos
// ======================================
async function loopPrincipal() {
  const dentro = dentroDeHorario()
 
  // — ENCENDER a las 6 AM —
  if (dentro && !servidorEncendido) {
    log('=== Inicio de horario — encendiendo servidor ===')
    const ok = await encenderServidor()
    if (ok) {
      await esperar(15000)  // margen extra para que Minecraft cargue
      createBot()
    } else {
      log('No se pudo encender, reintentando en 2 minutos...')
    }
  }
 
  // — APAGAR a las 12 AM —
  if (!dentro && servidorEncendido) {
    log('=== Fin de horario — apagando ===')
    if (bot) {
      bot.quit()
      await esperar(3000)
    }
    await apagarServidor()
  }
 
  // — Reconectar si el bot cayó dentro del horario —
  if (dentro && servidorEncendido && !bot && !connecting) {
    log('Bot caído durante horario activo — reconectando...')
    createBot()
  }
 
  setTimeout(loopPrincipal, 60 * 1000)
}
 
// ======================================
// ARRANQUE
// ======================================
log('=== Watchdog v2 iniciando ===')
loginAternos().then(() => {
  loopPrincipal()
})
