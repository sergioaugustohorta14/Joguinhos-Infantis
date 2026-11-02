"""Desenhos de imagem: importador (tools/importar_desenhos.py) + galeria + balde de tinta + pincel.
Trabalha numa cópia temporária do projeto, então não mexe nos arquivos de verdade.
Rodar: .venv\\Scripts\\python.exe tests\\test_imagens.py
"""
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
falhas = []


def confere(cond, msg):
    print(("OK    " if cond else "FALHA ") + msg)
    if not cond:
        falhas.append(msg)


def porta_livre():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def desenho_de_teste(caminho, formato):
    """Carinha com margem branca grande, em JPEG (com os borrões típicos) ou PNG."""
    img = Image.new("RGB", (900, 700), "white")
    d = ImageDraw.Draw(img)
    d.ellipse((250, 150, 650, 550), outline="black", width=7)       # rosto
    d.ellipse((330, 290, 390, 350), outline="black", width=6)       # olho esquerdo
    d.ellipse((510, 290, 570, 350), outline="black", width=6)       # olho direito
    d.arc((340, 360, 560, 500), 20, 160, fill="black", width=6)     # sorriso
    img.save(caminho, formato, **({"quality": 60} if formato == "JPEG" else {}))


ALFA = """() => { const c = document.getElementById('cv-tinta'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; }"""
PIXEL = """([x, y]) => { const c = document.getElementById('cv-tinta'); return c.getContext('2d').getImageData(x, y, 1, 1).data[3]; }"""


def main():
    tmp = Path(tempfile.mkdtemp(prefix="joguinhos-teste-"))
    copia = tmp / "app"
    shutil.copytree(RAIZ, copia, ignore=shutil.ignore_patterns(".venv", ".git", "tests", "desenhos-novos", "__pycache__", ".claude"))
    # começa sem nenhum desenho de imagem
    (copia / "desenhos" / "lista.js").write_text("var DESENHOS_IMAGENS = [];\n", encoding="utf-8")
    for cat, nome, fmt in [("bobbie", "carinha.jpg", "JPEG"), ("dinos", "outra carinha.png", "PNG")]:
        pasta = copia / "desenhos-novos" / cat
        pasta.mkdir(parents=True)
        desenho_de_teste(pasta / nome, fmt)
    versao_antes = re.search(r"joguinhos-v(\d+)", (copia / "sw.js").read_text(encoding="utf-8")).group(1)

    print("\n== importador ==")
    script = str(copia / "tools" / "importar_desenhos.py")
    r = subprocess.run([sys.executable, script, "--raiz", str(copia)], capture_output=True, text=True, encoding="utf-8", errors="replace")
    confere(r.returncode == 0, f"o script termina sem erro ({r.stderr[-200:]})")
    pngs = sorted((copia / "desenhos").glob("*/*.png"))
    confere(len(pngs) == 4, f"cada imagem gera o desenho e a miniatura ({len(pngs)} arquivos)")
    grande = next(p for p in pngs if not p.stem.endswith("-m"))
    im = Image.open(grande)
    confere(im.size == (1024, 1024) and im.mode == "L", f"desenho sai em 1024x1024 cinza ({im.size}, {im.mode})")
    ext = im.getextrema()
    confere(ext == (0, 255), "tem traço preto e papel branco")
    lista = (copia / "desenhos" / "lista.js").read_text(encoding="utf-8")
    confere(lista.count('"cat"') == 2, "lista.js tem os 2 desenhos")
    versao_depois = re.search(r"joguinhos-v(\d+)", (copia / "sw.js").read_text(encoding="utf-8")).group(1)
    confere(int(versao_depois) == int(versao_antes) + 1, f"sw.js subiu de versão ({versao_antes} -> {versao_depois})")
    r2 = subprocess.run([sys.executable, script, "--raiz", str(copia), "--sem-versao"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    confere(r2.returncode == 0 and (copia / "desenhos" / "lista.js").read_text(encoding="utf-8").count('"cat"') == 2, "importar de novo não duplica")

    porta = porta_livre()
    srv = subprocess.Popen([sys.executable, str(copia / "tools" / "servir.py"), str(porta)])
    time.sleep(1)
    try:
        with sync_playwright() as p:
            nav = p.chromium.launch()
            ctx = nav.new_context(**p.devices["Pixel 7"])
            pag = ctx.new_page()
            erros = []
            pag.on("pageerror", lambda e: erros.append(str(e)))
            pag.on("console", lambda m: erros.append(m.text) if m.type == "error" else None)
            pag.goto(f"http://127.0.0.1:{porta}/")
            pag.wait_for_load_state("networkidle")
            print("\n== galeria e editor ==")
            pag.locator(".cartao-colorir").tap()
            pag.wait_for_timeout(700)
            confere(pag.locator(".aba").count() == 8, f"a aba Bobbie Goods aparece quando há desenho ({pag.locator('.aba').count()} abas)")
            pag.locator('.aba[data-cat="bobbie"]').tap()
            pag.wait_for_timeout(600)
            confere(pag.locator(".tile").count() == 1, "Bobbie Goods tem 1 desenho")
            src = pag.evaluate("document.querySelector('.tile img').getAttribute('src')")
            confere(src.endswith("-m.png") and not src.startswith("data:"), f"a miniatura vem do arquivo pequeno ({src[:50]})")
            pag.locator('.aba[data-cat="dinos"]').tap()
            pag.wait_for_timeout(600)
            primeiro = pag.evaluate("document.querySelector('.tile').getAttribute('data-id')")
            confere(pag.locator(".tile").count() == 91 and primeiro.startswith("outra-carinha"), f"em Dinossauros o desenho de imagem vem primeiro, antes dos 90 feitos em código ({primeiro})")
            pag.locator('.aba[data-cat="bobbie"]').tap()
            pag.wait_for_timeout(400)
            pag.locator(".tile").first.tap()
            pag.wait_for_function("window.Jogos.colorir._estado.pronto === true", timeout=8000)
            pag.wait_for_timeout(300)

            box = pag.locator("#ed-pagina").bounding_box()
            pag.locator('[data-ferr="balde"]').tap()
            pag.locator('.cor[data-cor="#e45b5b"]').tap()
            # no rosto (que ocupa boa parte do desenho), entre os olhos e acima do sorriso
            pag.touchscreen.tap(box["x"] + box["width"] * 0.5, box["y"] + box["height"] * 0.42)
            pag.wait_for_timeout(200)
            n = pag.evaluate(ALFA)
            total = 1024 * 1024
            confere(0.30 * total < n < 0.75 * total, f"o balde enche só o rosto, sem vazar ({n / total:.0%} do desenho)")
            confere(pag.evaluate(PIXEL, [20, 20]) == 0, "o fundo fora do rosto continua sem tinta")
            confere(pag.evaluate(PIXEL, [512, 420]) > 0, "o rosto ficou pintado")

            # pincel com "dentro das linhas": um risco que começa no rosto e sai pela lateral não passa do contorno
            pag.locator('[data-ferr="pincel"]').tap()
            pag.locator('.cor[data-cor="#5aaee8"]').tap()
            pag.locator('[data-tam="2"]').tap()
            cdp = ctx.new_cdp_session(pag)
            pontos = [(0.30, 0.60), (0.55, 0.62), (0.80, 0.62), (0.97, 0.62)]
            xy = lambda fx, fy: {"x": box["x"] + box["width"] * fx, "y": box["y"] + box["height"] * fy}
            cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [xy(*pontos[0])]})
            for pt in pontos[1:]:
                cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [xy(*pt)]})
            cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
            pag.wait_for_timeout(300)
            confere(pag.evaluate(PIXEL, [990, 635]) == 0, "o pincel não passa da linha do rosto")
            confere(not erros, f"sem erros no console ({erros})")
            nav.close()
    finally:
        srv.terminate()
        shutil.rmtree(tmp, ignore_errors=True)
    print("\n" + ("TUDO CERTO" if not falhas else f"{len(falhas)} FALHA(S)"))
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main()
