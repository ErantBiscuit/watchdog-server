function createBot() {
    bot = mineflayer.createBot({
        host: HOST,
        port: PORT,
        username: 'Watchdog_Bot',
        auth: 'offline',           // ← FIX: Agregar esto
        version: false,            // ← FIX: Cambiar
        connectTimeout: 30000,     // ← FIX: Reducir
        checkTimeoutInterval: 10000
    });

    bot.once('spawn', () => {
        console.log('🤖 Bot en posición. Iniciando rutina anti-afk...');
        
        setInterval(() => {
            if (!bot) return;  // ← IMPORTANTE: verificar
            
            bot.setControlState('jump', true);
            setTimeout(() => {
                if (!bot) return;
                bot.setControlState('jump', false);
            }, 500);

            const yaw = Math.random() * Math.PI * 2;
            const pitch = (Math.random() - 0.5) * Math.PI;
            bot.look(yaw, pitch);

            if (bot && bot.entity) {  // ← Verificar antes de chatear
                const mensajes = ["Vigilando...", "Todo en orden.", "Actividad detectada.", "Ping"];
                bot.chat(mensajes[Math.floor(Math.random() * mensajes.length)]);
            }
        }, 40000); 
    });

    // ← AGREGAR estos eventos:
    bot.on('error', (err) => {
        console.error('⚠ Error:', err.message);
    });

    bot.on('end', (reason) => {
        console.log('✗ Desconectado:', reason);
        bot = null;
        setTimeout(createBot, 5000);
    });

    bot.on('kicked', (reason) => {
        console.log('✗ Kick:', reason);
    });
}
