"""Gera uma folha de amostras para conferir os desenhos a olho.
Uso: python tools/amostras.py <saida.png> "cat=dinos&v=0,3&col=3" [largura]
     python tools/amostras.py <saida.png> "ids=trex-0,trex-4&col=2"
"""
import socket
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent


def porta_livre():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def main():
    saida, consulta = sys.argv[1], sys.argv[2]
    largura = int(sys.argv[3]) if len(sys.argv) > 3 else 1500
    porta = porta_livre()
    srv = subprocess.Popen([sys.executable, str(RAIZ / "tools" / "servir.py"), str(porta)])
    time.sleep(1)
    try:
        with sync_playwright() as p:
            nav = p.chromium.launch()
            pag = nav.new_page(viewport={"width": largura, "height": 800})
            erros = []
            pag.on("pageerror", lambda e: erros.append(str(e)))
            pag.goto(f"http://127.0.0.1:{porta}/tools/amostras.html?{consulta}")
            pag.wait_for_load_state("networkidle")
            pag.wait_for_timeout(500)
            pag.screenshot(path=saida, full_page=True)
            nav.close()
            if erros:
                print("ERROS:", erros)
    finally:
        srv.terminate()


if __name__ == "__main__":
    main()
