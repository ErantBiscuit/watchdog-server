const mineflayer = require('mineflayer')
const express = require('express')

const app = express()
app.get('/', (req, res) => res.send('Watchdog Guardián Activo ✓'))
app.listen(3000)

// ======================================
// CONFIGURACIÓN (Vía Variables de Entorno)
// ======================================
const HOST = process.env.SERVER_IP || 'ZorrosLand.aternos.me'
const PORT = parseInt(process.env.SERVER_PORT) || 55714
const USERNAME = 'Watchdog_Bot'
const VERSION = "1.26.14.1" // <--- ASEGURATE QUE SEA LA DE TU SERVER

let bot = null
let afkTimer = null

function log(msg) {
    const now = new Date()
    const time = now.toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City' })
    console.log(`[${time}] ${msg}`)
}

// ======================================
// RUTINA DE MOVIMIENTO COMPLETA
// ======================================
function iniciarAntiAfk() {
    if (afkTimer) clearInterval(afkTimer)
    
    afkTimer = setInterval(() => {
        if (!bot) return

        const accion = Math.floor(Math.random() * 5)
        
        // Siempre mirar a un lado nuevo
        bot.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.6)

        switch(accion) {
            case 0: // Saltar
                bot.setControlState('jump', true)
                setTimeout(() => bot.setControlState('jump', false), 1000)
                break
            case 1: // Caminar adelante
                bot.setControlState('forward', true)
                setTimeout(() => bot.setControlState('forward', false), 2000)
                break
            case 2: // Agacharse
                bot.setControlState('sneak', true)
                setTimeout(() => bot.setControlState('sneak', false), 1500)
                break
            case 3: // Moverse a los lados
                const dir = Math.random() > 0.5 ? 'left' : 'right'
                bot.setControlState(dir, true)
                setTimeout(() => bot.setControlState(dir, false), 1000)
                break
            case 4: // Mensaje al chat (Mantiene vivo Aternos)
                const msgs = ["Vigilando el área...", "Estado: Operacional", "Anti-AFK System activo", "Punto de control."]
                bot.chat(msgs[Math.floor(Math.random() * msgs.length)])
                break
        }
    }, 30000) // Cada 30 segundos hace algo nuevo
}

// ======================================
// LÓGICA DEL BOT
// ======================================
function createBot() {
    if (bot) return

    log(`→ Intentando conectar a ${HOST}:${PORT}...`)

    bot = mineflayer.createBot({
        host: HOST,
        port: PORT,
        username: USERNAME,
        version: VERSION,
        skipValidation: true,
        connectTimeout: 60000
    })

    bot.once('spawn', () => {
        log('✅ Bot en el servidor. Iniciando movimientos.')
        iniciarAntiAfk()
    })

    bot.on('end', (reason) => {
        log(`❌ Desconectado: ${reason}`)
        bot = null
        if (afkTimer) clearInterval(afkTimer)
        
        log('↻ Reconectando en 15 segundos...')
        setTimeout(createBot, 15000)
    })

    bot.on('error', (err) => {
        log(`⚠ Error de conexión: ${err.message}`)
        if (err.code === 'ECONNREFUSED') {
            log('El servidor parece estar OFFLINE.')
        }
    })

    bot.on('kicked', (reason) => {
        log(`Kick: ${reason}`)
    })
}

// Arrancar
createBot()
