const mineflayer = require('mineflayer')
const express = require('express')
const mc = require('minecraft-protocol')
const app = express()

// Variables de entorno (Se configuran en Render después)
const HOST = process.env.SERVER_IP 
const PORT = parseInt(process.env.SERVER_PORT) || 25565
const VERSION = "1.21.11" // AJUSTA A TU VERSIÓN

app.get('/', (req, res) => res.send('Watchdog Funcionando ✅'))
app.listen(process.env.PORT || 3000)

let bot = null

function checkServer() {
    console.log(`[${new Date().toLocaleTimeString()}] Verificando ${HOST}...`)
    
    mc.ping({ host: HOST, port: PORT }, (err, res) => {
        if (err) {
            console.log('❌ Server offline. Reintentando...');
            bot = null;
            setTimeout(checkServer, 1 * 60 * 1000)
            return
        }
        console.log(`✅ Server online.`);
        if (!bot) createBot()
        setTimeout(checkServer, 3 * 60 * 1000)
    })
}

function createBot() {
    if (bot) return
    bot = mineflayer.createBot({
        host: HOST,
        port: PORT,
        username: 'Watchdog_Bot',
        version: VERSION,
        skipValidation: true, 
        connectTimeout: 60000
    })

    bot.on('spawn', () => {
        console.log('🤖 Bot conectado.');
        setInterval(() => {
            if (bot) {
                bot.setControlState('jump', true)
                setTimeout(() => bot.setControlState('jump', false), 500)
            }
        }, 60000)
    })

    bot.on('end', () => { bot = null })
    bot.on('error', (err) => console.log('🔥 Error:', err.message))
}

checkServer()
