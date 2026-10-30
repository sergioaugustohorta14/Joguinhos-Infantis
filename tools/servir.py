"""Servidor local para desenvolver e testar: python tools/servir.py [porta]"""
import http.server
import socketserver
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PORTA = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(RAIZ), **kwargs)

    def end_headers(self):
        # sem cache do navegador em desenvolvimento (o service worker cuida do offline)
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORTA), Handler) as httpd:
        print(f"Servindo {RAIZ} em http://127.0.0.1:{PORTA}")
        httpd.serve_forever()
