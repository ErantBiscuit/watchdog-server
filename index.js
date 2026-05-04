const mineflayer = require('mineflayer')
const express = require('express')

const app = express()
app.get('/', (req, res) => res.send('Watchdog activo ✓'))
app.listen(3000)

// ======================================
// CONFIGURACIÓN
// ======================================
const HOST         = 'ErantBiscuit91-nHIh.aternos.me'
const PORT         = 26881
const USERNAME     = 'WatchdogBot'

// Horario Querétaro (UTC-6)
const HORA_INICIO = 6   // 6:00 AM — conectar
const HORA_FIN    = 24  // 12:00 AM — desconectar

// ======================================
// VARIABLES
// ======================================
let bot               = null
let connecting        = false
let afkTimer          = null
let ultimoIntento    = null

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
  const s   = now.getUTCSeconds().toString().padStart(2, '0')
  console.log(`[${h}:${m}:${s} QRO] ${msg}`)
}

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ======================================
// ANTI-AFK
// ======================================
function iniciarAntiAfk() {
  if (afkTimer) clearTimeout(afkTimer)
  log('✓ Anti-AFK iniciado')

  function ciclo() {
    if (!bot) return

    const tipo = random(1, 6)

    // Mirada aleatoria
    bot.look(
      Math.random() * Math.PI * 2,
      (Math.random() - 0.5) * 0.6,
      true
    )

    if (tipo === 1) {
      // Caminar adelante
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
      // Saltar
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
      // Solo mirar
      setTimeout(() => {
        if (bot) bot.look(Math.random() * Math.PI * 2, Math.random() * 0.4, true)
      }, random(1000, 4000))
    }

    afkTimer = setTimeout(ciclo, random(20000, 50000))
  }

  ciclo()
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
    log('⏱ Fuera de horario, esperando las 6 AM...')
    return
  }

  connecting = true
  ultimoIntento = new Date()
  log('→ Conectando al servidor...')

  bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username: USERNAME,
    version: false,
    connectTimeout: 30000,
    checkTimeoutInterval: 10000
  })

  bot.once('login', () => {
    log('✓ Login exitoso')
    connecting = false
  })

  bot.once('spawn', () => {
    log('✓ Bot en el servidor — anti-AFK activo')
    iniciarAntiAfk()
  })

  bot.on('end', (reason) => {
    log(`✗ Desconectado: ${reason}`)
    detenerAntiAfk()
    bot = null
    connecting = false

    if (dentroDeHorario()) {
      const espera = random(5000, 15000)
      log(`↻ Reconectando en ${espera / 1000}s...`)
      setTimeout(createBot, espera)
    } else {
      log('⏱ Fin de horario — no reconectando')
    }
  })

  bot.on('error', (err) => {
    if (['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'].includes(err.code)) {
      log(`⚠ Error de red: ${err.code}`)
      return
    }
    log(`⚠ Error: ${err.message}`)
  })

  bot.on('kicked', (reason) => {
    log(`✗ Kick: ${reason}`)
  })
}

// ======================================
// LOOP PRINCIPAL
// ======================================
async function loopPrincipal() {
  const dentro = dentroDeHorario()
  const h = horaQro()

  // Conectar a las 6 AM
  if (dentro && !bot && !connecting) {
    if (h === HORA_INICIO) {
      log('═══════════════════════════════════')
      log('📅 INICIO DE HORARIO (6:00 AM)')
      log('═══════════════════════════════════')
    }
    createBot()
  }

  // Desconectar a las 12 AM
  if (!dentro && bot) {
    log('═══════════════════════════════════')
    log('🌙 FIN DE HORARIO (12:00 AM)')
    log('═══════════════════════════════════')
    detenerAntiAfk()
    bot.quit()
    bot = null
    connecting = false
  }

  // Intentar reconectar si cayó durante el horario
  if (dentro && !bot && !connecting) {
    createBot()
  }

  setTimeout(loopPrincipal, 30000) // Verificar cada 30 segundos
}

// ======================================
// INICIO
// ======================================
log('═══════════════════════════════════')
log('🐕 WATCHDOG v3 iniciando')
log('═══════════════════════════════════')
log(`⏰ Horario: 6:00 AM — 12:00 AM (Querétaro)`)
log(`🎮 Servidor: ${HOST}:${PORT}`)
log(`👤 Usuario: ${USERNAME}`)
log('═══════════════════════════════════')

loopPrincipal()
