"""Teste no navegador (Playwright): toque de verdade, animações, especiais e fim de partida.
Rodar (depois de `npm run build`):  ..\\.venv\\Scripts\\python.exe tests\\test_navegador.py
"""
import socket
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
CAPTURAS = RAIZ / "tests" / "capturas"
CAPTURAS.mkdir(exist_ok=True)
NODE = r"C:\Program Files\nodejs\node.exe"
falhas = []


def confere(cond, msg):
    print(("OK    " if cond else "FALHA ") + msg)
    if not cond:
        falhas.append(msg)


def porta_livre():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


GRID = "window.__doces.grid()"


def cores(pag):
    return pag.evaluate(f"{GRID}.map(l => l.map(d => d ? (d.special === 'colorBomb' ? '*' : d.color) : null))")


def ids(pag):
    return pag.evaluate(f"{GRID}.map(l => l.map(d => d ? d.id : null))")


def tem_sequencia(m):
    linhas, colunas = len(m), len(m[0])
    for r in range(linhas):
        for c in range(colunas - 2):
            if m[r][c] and m[r][c] != "*" and m[r][c] == m[r][c + 1] == m[r][c + 2]:
                return True
    for c in range(colunas):
        for r in range(linhas - 2):
            if m[r][c] and m[r][c] != "*" and m[r][c] == m[r + 1][c] == m[r + 2][c]:
                return True
    return False


def achar_troca(m, valida=True):
    for r in range(len(m)):
        for c in range(len(m[0])):
            for dr, dc in ((0, 1), (1, 0)):
                r2, c2 = r + dr, c + dc
                if r2 >= len(m) or c2 >= len(m[0]):
                    continue
                t = [linha[:] for linha in m]
                t[r][c], t[r2][c2] = t[r2][c2], t[r][c]
                if tem_sequencia(t) == valida and "*" not in (m[r][c], m[r2][c2]):
                    return (r, c), (r2, c2)
    return None


def esperar_livre(pag, limite=15000):
    pag.wait_for_function("!window.__doces.ocupado()", timeout=limite)
    pag.wait_for_timeout(150)


def centro(pag, pos):
    b = pag.locator("[data-tabuleiro]").bounding_box()
    tam = b["width"] / 9
    return b["x"] + (pos[1] + 0.5) * tam, b["y"] + (pos[0] + 0.5) * tam, tam


def jogadas(pag):
    return int(pag.locator("header span.text-4xl").text_content())


def pontos(pag):
    return int(pag.locator("header span.text-3xl").text_content().replace(".", ""))


def testar(p, base, nome, toque, **ctx_args):
    print(f"\n== {nome} ==")
    nav = p.chromium.launch()
    ctx = nav.new_context(**ctx_args)
    pag = ctx.new_page()
    erros = []
    pag.on("pageerror", lambda e: erros.append(str(e)))
    pag.on("console", lambda m: erros.append(m.text) if m.type == "error" else None)
    pag.goto(base + "?teste&semente=7")
    pag.wait_for_function("!!window.__doces", timeout=10000)
    pag.wait_for_timeout(700)
    m = cores(pag)
    confere(len(m) == 9 and all(len(l) == 9 and all(l) for l in m), "tabuleiro 9x9 cheio")
    confere(not tem_sequencia(m), "começa sem combinação pronta")
    confere(jogadas(pag) == 25 and pontos(pag) == 0, "25 jogadas e 0 pontos")
    confere(pag.evaluate("document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight"), "cabe na tela sem rolagem")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-inicio.png"))

    # ---- troca válida arrastando o dedo ----
    a, b = achar_troca(m, True)
    x0, y0, tam = centro(pag, a)
    x1, y1, _ = centro(pag, b)
    if toque:
        cdp = ctx.new_cdp_session(pag)
        cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x0, "y": y0}]})
        for i in range(1, 5):
            cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x0 + (x1 - x0) * i / 4, "y": y0 + (y1 - y0) * i / 4}]})
        cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    else:
        pag.mouse.move(x0, y0)
        pag.mouse.down()
        pag.mouse.move(x1, y1, steps=4)
        pag.mouse.up()
    pag.wait_for_timeout(330)
    pag.screenshot(path=str(CAPTURAS / f"{nome}-estourando.png"))
    pag.wait_for_timeout(260)
    pag.screenshot(path=str(CAPTURAS / f"{nome}-caindo.png"))
    esperar_livre(pag)
    m2 = cores(pag)
    confere(jogadas(pag) == 24, "arrastar para o vizinho faz a troca e gasta 1 jogada")
    confere(pontos(pag) > 0, f"pontuou ({pontos(pag)})")
    confere(all(all(l) for l in m2) and not tem_sequencia(m2), "depois da cascata: cheio e sem combinação sobrando")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-depois.png"))

    # ---- troca inválida volta para o lugar ----
    antes = ids(pag)
    a, b = achar_troca(cores(pag), False)
    pag.evaluate("([a, b]) => window.__doces.trocar({ row: a[0], col: a[1] }, { row: b[0], col: b[1] })", [list(a), list(b)])
    esperar_livre(pag)
    confere(ids(pag) == antes and jogadas(pag) == 24, "troca sem combinação volta e não gasta jogada")

    # ---- dois toques: seleciona e depois toca no vizinho ----
    a, b = achar_troca(cores(pag), True)
    xa, ya, _ = centro(pag, a)
    xb, yb, _ = centro(pag, b)
    if toque:
        pag.touchscreen.tap(xa, ya)
    else:
        pag.mouse.click(xa, ya)
    pag.wait_for_timeout(250)
    confere(pag.locator('[data-doce] .ring-4').count() == 1, "o primeiro toque seleciona o doce")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-selecionado.png"))
    if toque:
        pag.touchscreen.tap(xb, yb)
    else:
        pag.mouse.click(xb, yb)
    pag.wait_for_timeout(100)
    esperar_livre(pag)
    confere(jogadas(pag) == 23, "tocando no vizinho, troca")

    # ---- especiais: 5 em linha cria bomba colorida; bomba trocada apaga a cor ----
    pag.evaluate("""() => {
      const C = ['yellow','blue','green','purple','orange'];
      let id = 900000;
      const g = [];
      for (let r = 0; r < 9; r++) { const l = []; for (let c = 0; c < 9; c++) l.push({ id: id++, color: C[(r * 2 + c * 3 + (r % 2)) % 5] }); g.push(l); }
      // linha 4: azul azul [verde] azul azul, e um azul logo abaixo do verde: trocar forma 5 em linha
      [0,1,3,4].forEach(c => g[4][c] = { id: id++, color: 'blue' });
      g[4][2] = { id: id++, color: 'green' }; g[5][2] = { id: id++, color: 'blue' };
      // mostruário dos outros especiais
      g[0][6] = { id: id++, color: 'purple', special: 'stripedH' };
      g[0][7] = { id: id++, color: 'orange', special: 'stripedV' };
      g[0][8] = { id: id++, color: 'green', special: 'wrapped' };
      window.__doces.definir(g);
    }""")
    pag.wait_for_timeout(500)
    pag.screenshot(path=str(CAPTURAS / f"{nome}-especiais.png"))
    pag.evaluate("window.__doces.trocar({ row: 4, col: 2 }, { row: 5, col: 2 })")
    pag.wait_for_timeout(320)
    criou = pag.evaluate(f"{GRID}.flat().some(d => d && d.special === 'colorBomb')")
    confere(criou, "5 em linha cria a bomba colorida")
    esperar_livre(pag)
    pag.screenshot(path=str(CAPTURAS / f"{nome}-bomba.png"))
    bomba = pag.evaluate(f"(() => {{ const g = {GRID}; for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (g[r][c] && g[r][c].special === 'colorBomb') return [r, c]; return null; }})()")
    if bomba:
        r, c = bomba
        viz = [r, c + 1] if c < 8 else [r, c - 1]
        cor_alvo = pag.evaluate(f"{GRID}[{viz[0]}][{viz[1]}].color")
        alvos = pag.evaluate(f"{GRID}.flat().filter(d => d && d.color === '{cor_alvo}').map(d => d.id)")
        # sem esperar a jogada acabar, para fotografar a explosão
        pag.evaluate(f"() => {{ window.__doces.trocar({{ row: {r}, col: {c} }}, {{ row: {viz[0]}, col: {viz[1]} }}); }}")
        pag.wait_for_timeout(330)
        pag.screenshot(path=str(CAPTURAS / f"{nome}-bomba-explodindo.png"))
        esperar_livre(pag)
        sobrou = pag.evaluate(f"(ids) => {GRID}.flat().filter(d => d && ids.includes(d.id)).length", alvos)
        confere(len(alvos) >= 8 and sobrou == 0, f"a bomba trocada apaga todos os doces daquela cor ({len(alvos)} apagados, sobraram {sobrou})")

    # ---- jogar até acabar as jogadas ----
    for _ in range(30):
        if pag.locator("text=Jogar de novo").count():
            break
        t = achar_troca(cores(pag), True)
        if not t:
            break
        pag.evaluate("([a, b]) => window.__doces.trocar({ row: a[0], col: a[1] }, { row: b[0], col: b[1] })", [list(t[0]), list(t[1])])
        esperar_livre(pag, 30000)
    pag.wait_for_timeout(800)
    confere(pag.locator("text=Jogar de novo").is_visible() and jogadas(pag) == 0, "acabando as jogadas, aparece o fim da partida")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-fim.png"))
    pag.locator("text=Jogar de novo").click()
    pag.wait_for_timeout(700)
    confere(jogadas(pag) == 25 and pontos(pag) == 0 and not pag.locator("text=Jogar de novo").count(), "jogar de novo recomeça")
    confere(not erros, f"sem erros no console ({erros[:3]})")
    nav.close()


def main():
    porta = porta_livre()
    srv = subprocess.Popen([NODE, "node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", str(porta), "--strictPort"], cwd=RAIZ,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2.5)
    base = f"http://127.0.0.1:{porta}/"
    try:
        with sync_playwright() as p:
            testar(p, base, "celular", True, **p.devices["Pixel 7"])
            testar(p, base, "tablet", True, **p.devices["Galaxy Tab S4 landscape"])
            testar(p, base, "pc", False, viewport={"width": 1366, "height": 768})
    finally:
        srv.terminate()
    print("\n" + ("TUDO CERTO" if not falhas else f"{len(falhas)} FALHA(S)"))
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main()
