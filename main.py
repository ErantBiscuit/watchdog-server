import requests
import time
import threading
from flask import Flask
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def hello():
    return 'Watchdog OK'

def get_time():
    return '[' + datetime.now().strftime('%H:%M:%S') + ']'

def check_server():
    while True:
        try:
            print(get_time() + ' Verificando servidor...')
            
            response = requests.get('https://api.aternos.org/servers/status', timeout=10)
            
            if response.status_code == 200:
                print(get_time() + ' Servidor activo')
            else:
                print(get_time() + ' Servidor inactivo - intenta conectar')
                try_connect_server()
            
        except Exception as e:
            print(get_time() + ' Error: ' + str(e))
        
        time.sleep(120)

def try_connect_server():
    try:
        print(get_time() + ' Intentando conectar a ZorrosLand...')
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex(('ZorrosLand.aternos.me', 55714))
        sock.close()
        
        if result == 0:
            print(get_time() + ' Conexion exitosa!')
        else:
            print(get_time() + ' No se pudo conectar')
            
    except Exception as e:
        print(get_time() + ' Error: ' + str(e))

thread = threading.Thread(target=check_server, daemon=True)
thread.start()

if __name__ == '__main__':
    print(get_time() + ' Watchdog iniciado')
    app.run(host='0.0.0.0', port=3000, debug=False)
