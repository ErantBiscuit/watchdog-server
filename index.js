const mineflayer = require('mineflayer')
const express = require('express')
const mc = require('minecraft-protocol')

const app = express()

app.get('/', (req, res) => {
    res.send('Watchdog activo')
})

app.listen(3000)


// ======================================
// CONFIGURACIÓN
// ======================================

// IMPORTANTE:
// Usa SIEMPRE la dirección JAVA de Aternos
// NO uses la IP Bedrock

const HOST = 'ErantBiscuit91-nHIh.aternos.me'

// Puerto JAVA
const PORT = 25565

// Nombre del bot
const USERNAME = 'WatchdogBot'


// ======================================
// VARIABLES
// ======================================

let bot = null
let connecting = false


// ======================================
// UTILIDADES
// ======================================

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}


// Horario México UTC-6
function activeHours() {

    const now = new Date()

    const mexicoHour =
        (now.getUTCHours() - 6 + 24) % 24

    console.log('Hora México:', mexicoHour)

    // Activo de 6 AM a 12 AM
    return mexicoHour >= 6 && mexicoHour < 24
}


// ======================================
// WATCHDOG PRINCIPAL
// ======================================

async function watchdogLoop() {

    // Desactivar esto temporalmente
    // si quieres probar 24/7:
    /*
    if (!activeHours()) {

        console.log('Horario inactivo')

        setTimeout(watchdogLoop, 5 * 60 * 1000)

        return
    }
    */

    if (bot || connecting) {

        setTimeout(
            watchdogLoop,
            random(10000, 20000)
        )

        return
    }

    console.log('Verificando servidor...')

    mc.ping({
        host: HOST,
        port: PORT
    }, (err, res) => {

        if (err) {

            console.log('Servidor apagado o iniciando')

        } else {

            console.log('Servidor detectado')
        }

        // SIEMPRE intenta conectar
        // para despertar Aternos
        createBot()

        setTimeout(
            watchdogLoop,
            random(15000, 25000)
        )
    })
}


// ======================================
// CREAR BOT
// ======================================

function createBot() {

    if (connecting || bot) return

    connecting = true

    console.log('Intentando conexión agresiva...')

    bot = mineflayer.createBot({

        host: HOST,
        port: PORT,

        username: USERNAME,

        version: false,

        connectTimeout: 10000
    })


    // LOGIN EXITOSO
    bot.once('login', () => {

        console.log('Login exitoso')

        connecting = false
    })


    // BOT DENTRO DEL SERVER
    bot.once('spawn', () => {

        console.log('Spawn completado')

        antiAfkLoop()

        randomDisconnectLoop()
    })


    // DESCONEXIÓN
    bot.on('end', () => {

        console.log('Conexión terminada')

        bot = null
        connecting = false

        // REINTENTO RÁPIDO
        setTimeout(() => {

            createBot()

        }, random(3000, 7000))
    })


    // ERRORES
    bot.on('error', err => {

        console.log('Error:', err.message)
    })


    // KICKS
    bot.on('kicked', reason => {

        console.log('Kick:', reason)
    })
}


// ======================================
// ANTI AFK HUMANO
// ======================================

function antiAfkLoop() {

    if (!bot) return

    const actions = [
        'forward',
        'back',
        'left',
        'right',
        'jump',
        'sprint',
        'sneak'
    ]

    const action =
        actions[random(0, actions.length - 1)]

    // Mirada humana aleatoria
    bot.look(
        Math.random() * Math.PI * 2,
        Math.random() * 0.8,
        true
    )


    // SALTO
    if (action === 'jump') {

        bot.setControlState('jump', true)

        setTimeout(() => {

            if (bot)
                bot.setControlState('jump', false)

        }, random(300, 1200))
    }


    // SPRINT
    else if (action === 'sprint') {

        bot.setControlState('forward', true)
        bot.setControlState('sprint', true)

        setTimeout(() => {

            if (!bot) return

            bot.setControlState('forward', false)
            bot.setControlState('sprint', false)

        }, random(1000, 4000))
    }


    // MOVIMIENTO NORMAL
    else {

        bot.setControlState(action, true)

        setTimeout(() => {

            if (bot)
                bot.setControlState(action, false)

        }, random(1000, 5000))
    }


    // Segunda mirada humana
    setTimeout(() => {

        if (bot) {

            bot.look(
                Math.random() * Math.PI * 2,
                Math.random() * 0.8,
                true
            )
        }

    }, random(2000, 7000))


    // Pausas irregulares
    setTimeout(
        antiAfkLoop,
        random(15000, 60000)
    )
}


// ======================================
// DESCONEXIÓN HUMANA
// ======================================

function randomDisconnectLoop() {

    if (!bot) return

    // 45–120 minutos conectado
    const disconnectTime =
        random(45, 120) * 60 * 1000

    setTimeout(() => {

        if (bot) {

            console.log('Desconexión humana')

            bot.quit()
        }

    }, disconnectTime)
}


// ======================================
// INICIAR WATCHDOG
// ======================================

watchdogLoop()
