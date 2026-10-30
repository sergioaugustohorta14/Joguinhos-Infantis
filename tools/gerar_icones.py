"""Gera os PNGs do ícone a partir de icons/icon.svg (usa o Chromium do Playwright)."""
import socket
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
ICONES = RAIZ / "icons"


def porta_livre():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def main():
    porta = porta_livre()
    srv = subprocess.Popen([sys.executable, str(RAIZ / "tools" / "servir.py"), str(porta)])
    time.sleep(1)
    try:
        with sync_playwright() as p:
            nav = p.chromium.launch()
            # (arquivo, tamanho, margem interna em %) - o "maskable" precisa de margem de segurança
            for nome, tam, margem in [("icon-192.png", 192, 0), ("icon-512.png", 512, 0), ("icon-maskable-512.png", 512, 12)]:
                pag = nav.new_page(viewport={"width": tam, "height": tam})
                pag.set_content(
                    f'<body style="margin:0;background:#f4efe4;display:grid;place-items:center;height:100vh">'
                    f'<img src="http://127.0.0.1:{porta}/icons/icon.svg" style="width:{100 - 2 * margem}%;height:{100 - 2 * margem}%">'
                    f"</body>"
                )
                pag.wait_for_load_state("networkidle")
                pag.screenshot(path=str(ICONES / nome))
                pag.close()
            nav.close()
    finally:
        srv.terminate()
    print("Ícones gerados em", ICONES)


if __name__ == "__main__":
    main()
