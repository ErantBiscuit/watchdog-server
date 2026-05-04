const mineflayer = require('mineflayer')
const express = require('express')
const axios = require('axios')

const app = express()
app.get('/', (req, res) => res.send('Watchdog activo'))
app.listen(3000)

// ======================================
// CONFIGURACIÓN — edita esto
// ======================================
const HOST         = 'ErantBiscuit91-nHIh.aternos.me'
const PORT         = 26881
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
let servidorEncendido = false
let aternoscookie    = null

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
// CONTROL DE ATERNOS CON AXIOS
// ======================================
async function loginAternos() {
  try {
    log('Iniciando sesión en Aternos...')
    
    const response = await axios.post('https://api.aternos.org/v1/login', {
      username: ATERNOS_USER,
      password: ATERNOS_PASS
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (response.data && response.data.token) {
      aternoscookie = response.data.token
      log('✔ Login en Aternos exitoso')
      return true
    }
    
    log('Error: No se recibió token de Aternos')
    return false
  } catch (err) {
    log(`Error Aternos login: ${err.message}`)
    return false
  }
}

async function obtenerServidores() {
  try {
    if (!aternoscookie) {
      const ok = await loginAternos()
      if (!ok) return null
    }

    const response = await axios.get('https://api.aternos.org/v1/servers', {
      headers: {
        'Authorization': `Bearer ${aternoscookie}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (response.data && response.data.servers) {
      return response.data.servers
    }
    return null
  } catch (err) {
    log(`Error obteniendo servidores: ${err.message}`)
    return null
  }
}

async function obtenerEstadoServidor(serverid) {
  try {
    if (!aternoscookie) {
      const ok = await loginAternos()
      if (!ok) return null
    }

    const response = await axios.get(`https://api.aternos.org/v1/servers/${serverid}/status`, {
      headers: {
        'Authorization': `Bearer ${aternoscookie}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    return response.data.status
  } catch (err) {
    log(`Error obteniendo estado: ${err.message}`)
    return null
  }
}

async function encenderServidor() {
  if (servidorEncendido) return true

  try {
    log('Intentando obtener servidor Aternos...')
    const servidores = await obtenerServidores()
    
    if (!servidores || servidores.length === 0) {
      log('No se encontraron servidores')
      return false
    }

    const servidor = servidores.find(s => s.name === SERVER_NAME) || servidores[0]
    const serverid = servidor.id

    log(`Servidor encontrado: ${servidor.name}`)

    const status = await obtenerEstadoServidor(serverid)
    log(`Estado actual: ${status}`)

    if (status === 'online') {
      log('✔ Servidor ya está encendido')
      servidorEncendido = true
      return true
    }

    if (status === 'offline' || status === 'stopped') {
      log('Enviando comando de encendido...')
      
      await axios.post(`https://api.aternos.org/v1/servers/${serverid}/start`, {}, {
        headers: {
          'Authorization': `Bearer ${aternoscookie}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      log('Esperando a que el servidor se encienda (hasta 4 minutos)...')
      
      for (let i = 0; i < 24; i++) {
        await esperar(10000)
        const s = await obtenerEstadoServidor(serverid)
        log(`Estado: ${s}`)
        if (s === 'online') {
          log('✔ Servidor en línea')
          servidorEncendido = true
          return true
        }
      }

      log('Timeout esperando servidor')
      return false
    }

    log(`Servidor en estado: ${status}, esperando...`)
    await esperar(30000)
    return encenderServidor()

  } catch (err) {
    log(`Error encendiendo: ${err.message}`)
    return false
  }
}

async function apagarServidor() {
  if (!servidorEncendido) return

  try {
    log('Apagando servidor Aternos...')
    
    const servidores = await obtenerServidores()
    if (!servidores || servidores.length === 0) return

    const servidor = servidores.find(s => s.name === SERVER_NAME) || servidores[0]
    const serverid = servidor.id

    await axios.post(`https://api.aternos.org/v1/servers/${serverid}/stop`, {}, {
      headers: {
        'Authorization': `Bearer ${aternoscookie}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

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
      // Pausa — solo mira
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
      await esperar(15000)
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
