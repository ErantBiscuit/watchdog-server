const mineflayer = require('mineflayer')
const express = require('express')
const mc = require('minecraft-protocol')

const app = express()

app.get('/', (req, res) => {
    res.send('Watchdog activo')
})

app.listen(3000)

const HOST = 'ErantBiscuit91-nHIh.aternos.me'
const PORT = 26881

let bot = null
let connecting = false

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function activeHours() {

    const now = new Date()

    // UTC-6 México
    const mexicoHour =
        (now.getUTCHours() - 6 + 24) % 24

    console.log('Hora México:', mexicoHour)

    return mexicoHour >= 6 && mexicoHour < 24
}

async function watchdogLoop() {

    if (!activeHours()) {

        console.log('Horario inactivo')

        setTimeout(watchdogLoop, 5 * 60 * 1000)

        return
    }

    if (bot || connecting) {

        setTimeout(watchdogLoop, random(15, 30) * 1000)

        return
    }

    console.log('Verificando servidor...')

    mc.ping({
        host: HOST,
        port: PORT
    }, (err, res) => {

        if (err) {

            console.log('Servidor apagado o iniciando')

            createBot()

        } else {

            console.log('Servidor detectado')

            createBot()
        }

        setTimeout(
            watchdogLoop,
            random(15, 25) * 1000
        )
    })
}

function createBot() {

    if (connecting) return

    connecting = true

    console.log('Intentando conexión agresiva...')

    bot = mineflayer.createBot({
        host: HOST,
        port: PORT,

        username: 'WatchdogBot',

        version: false,

        connectTimeout: 10000
    })

    bot.once('login', () => {

        console.log('Login exitoso')

        connecting = false
    })

    bot.once('spawn', () => {

        console.log('Spawn completado')

        antiAfkLoop()

        randomDisconnectLoop()
    })

    bot.on('end', () => {

        console.log('Conexión terminada')

        bot = null
        connecting = false

        // REINTENTO RÁPIDO
        setTimeout(() => {

            createBot()

        }, random(3000, 7000))
    })

    bot.on('error', err => {

        console.log('Error:', err.message)

    })

    bot.on('kicked', reason => {

        console.log('Kick:', reason)

    })
}function createBot() {

    if (connecting) return

    connecting = true

    console.log('Intentando conexión agresiva...')

    bot = mineflayer.createBot({
        host: HOST,
        port: PORT,

        username: 'WatchdogBot',

        version: false,

        connectTimeout: 10000
    })

    bot.once('login', () => {

        console.log('Login exitoso')

        connecting = false
    })

    bot.once('spawn', () => {

        console.log('Spawn completado')

        antiAfkLoop()

        randomDisconnectLoop()
    })

    bot.on('end', () => {

        console.log('Conexión terminada')

        bot = null
        connecting = false

        // REINTENTO RÁPIDO
        setTimeout(() => {

            createBot()

        }, random(3000, 7000))
    })

    bot.on('error', err => {

        console.log('Error:', err.message)

    })

    bot.on('kicked', reason => {

        console.log('Kick:', reason)

    })
}function createBot() {

    if (connecting) return

    connecting = true

    console.log('Intentando conexión agresiva...')

    bot = mineflayer.createBot({
        host: HOST,
        port: PORT,

        username: 'WatchdogBot',

        version: false,

        connectTimeout: 10000
    })

    bot.once('login', () => {

        console.log('Login exitoso')

        connecting = false
    })

    bot.once('spawn', () => {

        console.log('Spawn completado')

        antiAfkLoop()

        randomDisconnectLoop()
    })

    bot.on('end', () => {

        console.log('Conexión terminada')

        bot = null
        connecting = false

        // REINTENTO RÁPIDO
        setTimeout(() => {

            createBot()

        }, random(3000, 7000))
    })

    bot.on('error', err => {

        console.log('Error:', err.message)

    })

    bot.on('kicked', reason => {

        console.log('Kick:', reason)

    })
}function createBot() {

    if (connecting) return

    connecting = true

    console.log('Intentando conexión agresiva...')

    bot = mineflayer.createBot({
        host: HOST,
        port: PORT,

        username: 'WatchdogBot',

        version: false,

        connectTimeout: 10000
    })

    bot.once('login', () => {

        console.log('Login exitoso')

        connecting = false
    })

    bot.once('spawn', () => {

        console.log('Spawn completado')

        antiAfkLoop()

        randomDisconnectLoop()
    })

    bot.on('end', () => {

        console.log('Conexión terminada')

        bot = null
        connecting = false

        // REINTENTO RÁPIDO
        setTimeout(() => {

            createBot()

        }, random(3000, 7000))
    })

    bot.on('error', err => {

        console.log('Error:', err.message)

    })

    bot.on('kicked', reason => {

        console.log('Kick:', reason)

    })
}function createBot() {

    if (connecting) return

    connecting = true

    console.log('Intentando conexión agresiva...')

    bot = mineflayer.createBot({
        host: HOST,
        port: PORT,

        username: 'WatchdogBot',

        version: false,

        connectTimeout: 10000
    })

    bot.once('login', () => {

        console.log('Login exitoso')

        connecting = false
    })

    bot.once('spawn', () => {

        console.log('Spawn completado')

        antiAfkLoop()

        randomDisconnectLoop()
    })

    bot.on('end', () => {

        console.log('Conexión terminada')

        bot = null
        connecting = false

        // REINTENTO RÁPIDO
        setTimeout(() => {

            createBot()

        }, random(3000, 7000))
    })

    bot.on('error', err => {

        console.log('Error:', err.message)

    })

    bot.on('kicked', reason => {

        console.log('Kick:', reason)

    })
}function createBot() {

    if (connecting) return

    connecting = true

    console.log('Intentando conexión agresiva...')

    bot = mineflayer.createBot({
        host: HOST,
        port: PORT,

        username: 'WatchdogBot',

        version: false,

        connectTimeout: 10000
    })

    bot.once('login', () => {

        console.log('Login exitoso')

        connecting = false
    })

    bot.once('spawn', () => {

        console.log('Spawn completado')

        antiAfkLoop()

        randomDisconnectLoop()
    })

    bot.on('end', () => {

        console.log('Conexión terminada')

        bot = null
        connecting = false

        // REINTENTO RÁPIDO
        setTimeout(() => {

            createBot()

        }, random(3000, 7000))
    })

    bot.on('error', err => {

        console.log('Error:', err.message)

    })

    bot.on('kicked', reason => {

        console.log('Kick:', reason)

    })
}
function createBot() {

    if (connecting) return

    connecting = true

    console.log('Intentando conexión agresiva...')

    bot = mineflayer.createBot({
        host: HOST,
        port: PORT,

        username: 'WatchdogBot',

        version: false,

        connectTimeout: 10000
    })

    bot.once('login', () => {

        console.log('Login exitoso')

        connecting = false
    })

    bot.once('spawn', () => {

        console.log('Spawn completado')

        antiAfkLoop()

        randomDisconnectLoop()
    })

    bot.on('end', () => {

        console.log('Conexión terminada')

        bot = null
        connecting = false

        // REINTENTO RÁPIDO
        setTimeout(() => {

            createBot()

        }, random(3000, 7000))
    })

    bot.on('error', err => {

        console.log('Error:', err.message)

    })

    bot.on('kicked', reason => {

        console.log('Kick:', reason)
    })
}

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

    bot.look(
        Math.random() * Math.PI * 2,
        Math.random() * 0.8,
        true
    )

    if (action === 'jump') {

        bot.setControlState('jump', true)

        setTimeout(() => {

            if (bot)
                bot.setControlState('jump', false)

        }, random(300, 1200))

    } else if (action === 'sprint') {

        bot.setControlState('forward', true)
        bot.setControlState('sprint', true)

        setTimeout(() => {

            if (!bot) return

            bot.setControlState('forward', false)
            bot.setControlState('sprint', false)

        }, random(1000, 4000))

    } else {

        bot.setControlState(action, true)

        setTimeout(() => {

            if (bot)
                bot.setControlState(action, false)

        }, random(1000, 5000))
    }

    // Miradas humanas
    setTimeout(() => {

        if (bot) {

            bot.look(
                Math.random() * Math.PI * 2,
                Math.random() * 0.8,
                true
            )

        }

    }, random(2000, 7000))

    // Pausas aleatorias
    setTimeout(
        antiAfkLoop,
        random(15000, 60000)
    )
}

function randomDisconnectLoop() {

    if (!bot) return

    const disconnectTime =
        random(45, 120) * 60 * 1000

    setTimeout(() => {

        if (bot) {

            console.log('Desconexión humana')

            bot.quit()

        }

    }, disconnectTime)
}

watchdogLoop()
