"""Basquete: arremesso, chuá, sequências (fogo e elétrico), tempo, fim de jogo, desafios, vestiário e conquistas.
Rodar: .venv\\Scripts\\python.exe tests\\test_basquete.py
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
falhas = []
T = "window.Jogos.basquete._teste"


def confere(cond, msg):
    print(("OK    " if cond else "FALHA ") + msg)
    if not cond:
        falhas.append(msg)


def porta_livre():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def ev(pag, expr):
    return pag.evaluate(f"() => {{ const j = {T}.jogo(); const d = {T}.dados(); return {expr}; }}")


def avancar(pag, seg):
    pag.evaluate(f"{T}.avancar({seg})")


def chua(pag, t=1.35):
    """Faz um arremesso perfeito (pelo centro do aro) e espera a bola resolver."""
    pag.evaluate(f"() => {{ const v = {T}.mirar({t}); {T}.lancar(v[0], v[1]); }}")
    avancar(pag, 1.6)
    pag.evaluate(f"{T}.avancar(0.7)")


def testar(p, base, nome, **ctx_args):
    print(f"\n== {nome} ==")
    toque = bool(ctx_args.get("has_touch"))
    nav = p.chromium.launch()
    ctx = nav.new_context(**ctx_args)
    pag = ctx.new_page()
    erros = []
    pag.on("pageerror", lambda e: erros.append(str(e)))
    pag.on("console", lambda m: erros.append(m.text) if m.type == "error" else None)
    pag.goto(base)
    pag.wait_for_load_state("networkidle")
    pag.evaluate("localStorage.removeItem('joguinhos.basquete')")

    def tocar(seletor):
        loc = pag.locator(seletor).first
        loc.tap() if toque else loc.click()
        pag.wait_for_timeout(150)

    tocar(".cartao-basquete")
    pag.wait_for_timeout(700)
    confere(pag.locator("#tela-basquete").is_visible() and pag.locator("#bk-menu").is_visible(), "o cartão abre o menu do Basquete")
    pag.evaluate(f"{T}.congelar(true)")
    pequenos = pag.evaluate(
        """() => [...document.querySelectorAll('#tela-basquete button')].filter(b => b.offsetParent !== null)
           .map(b => { const r = b.getBoundingClientRect(); return [b.getAttribute('aria-label') || b.textContent.trim().slice(0, 12), Math.round(r.width), Math.round(r.height)]; })
           .filter(([_, w, h]) => w < 60 || h < 60)"""
    )
    confere(not pequenos, f"botões grandes no menu ({pequenos})")
    confere(pag.evaluate("document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight"), "sem rolagem da página")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-basquete-menu.png"))

    # ---- desafios do dia ----
    tocar('.bk-aba[data-aba="desafios"]')
    confere(pag.locator("#bk-painel-corpo .bk-linha").count() == 3, "3 desafios do dia")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-basquete-desafios.png"))
    tocar("#bk-painel-voltar")

    confere("Por tempo" in pag.locator("#bk-modo-minuto").text_content(), "o segundo modo se chama Por tempo")

    # ---- começar: contra o relógio ----
    tocar("#bk-modo-relogio")
    confere(pag.evaluate(f"{T}.tela()") == "jogando" and ev(pag, "j.modo") == "relogio", "começa o modo Contra o relógio")
    pag.evaluate(f"{T}.congelar(true)")
    confere(abs(ev(pag, "j.tempo") - 30) < 0.01, "Contra o relógio começa com 30 segundos")
    avancar(pag, 2)
    confere(abs(ev(pag, "j.tempo") - 30) < 0.01, "o relógio só corre depois do primeiro arremesso")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-basquete-inicio.png"))

    # ---- chuá: 2 pontos + 3 s ----
    chua(pag)
    confere(ev(pag, "j.pontos") == 2 and ev(pag, "j.chuas") == 1 and ev(pag, "j.cestas") == 1, "chuá vale 2 pontos")
    confere(ev(pag, "j.tempo") > 30, f"chuá dá tempo extra ({ev(pag, 'j.tempo'):.1f} s)")
    confere(ev(pag, "j.seq") == 1, "sequência 1")
    chua(pag)
    chua(pag)
    confere(ev(pag, "j.chuaSeq") == 3 and ev(pag, "j.eletricoUsou"), "3 chuás seguidos ativam o Elétrico")
    confere(ev(pag, "j.pontos") == 2 + 2 + 6, f"o terceiro chuá vale o triplo ({ev(pag, 'j.pontos')} pontos)")
    pag.evaluate(f"{T}.desenhar()")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-basquete-eletrico.png"))
    chua(pag)
    chua(pag)
    confere(ev(pag, "j.seq") == 5 and ev(pag, "j.fogoUsou"), "5 cestas seguidas ativam o Pegando fogo")

    # ---- bola nova logo depois do tiro; o aro só muda quando nada está no ar ----
    pag.evaluate(f"() => {{ const v = {T}.mirar(); {T}.lancar(v[0], v[1]); }}")
    alvo0 = ev(pag, "j.aro.alvo")
    avancar(pag, 0.5)
    confere(ev(pag, "j.pronta !== null") and ev(pag, "j.bolas.some(b => !b.feita && !b.errou)"), "a bola nova já fica pronta com a anterior ainda no ar")
    confere(ev(pag, "j.aro.alvo") == alvo0, "o aro não muda de lugar com a bola no ar")
    avancar(pag, 2.5)

    # ---- ajuda de mira: tiro quase certo é puxado para o centro do aro ----
    pag.evaluate(f"() => {{ const v = {T}.mirar(1.5); const b = {T}.jogo().pronta; window.__v = v; window.__r = [{T}.assistir(b.x, b.y, v[0] + 90, v[1]), {T}.assistir(b.x, b.y, v[0] + 600, v[1])]; }}")
    perto = pag.evaluate("() => Math.hypot(window.__r[0][0] - window.__v[0], window.__r[0][1] - window.__v[1])")
    longe = pag.evaluate("() => Math.hypot(window.__r[1][0] - (window.__v[0] + 600), window.__r[1][1] - window.__v[1])")
    confere(perto < 90 * 0.8, f"a ajuda de mira corrige um tiro que erra um pouco (erro de 90 para {perto:.0f})")
    confere(longe < 1, "e não mexe num tiro que erra muito")

    # ---- errar zera a sequência ----
    pag.evaluate(f"() => {{ const b = {T}.jogo().pronta; {T}.lancar(60, -900); }}")
    avancar(pag, 3)
    confere(ev(pag, "j.seq") == 0 and ev(pag, "j.chuaSeq") == 0, "errar zera a sequência")

    # ---- bater no aro: cesta mas não é chuá ----
    antes = ev(pag, "j.cestas")
    chuas0 = ev(pag, "j.chuas")
    tentou = False
    for t in (1.35, 1.3, 1.4, 1.25, 1.45, 1.2, 1.5, 1.15):
        pag.evaluate(f"() => {{ const g = {T}.geo(); const b = {T}.jogo().pronta; const v = {T}.mirar({t}); {T}.lancar(v[0] + (g.x1 - g.x0) * 0.34 / {t}, v[1]); }}")
        avancar(pag, 2.2)
        if ev(pag, "j.cestas") > antes and ev(pag, "j.chuas") == chuas0:
            tentou = True
            break
        antes = ev(pag, "j.cestas"); chuas0 = ev(pag, "j.chuas")
    confere(tentou, "cesta que encosta no aro vale, mas sem chuá")

    # ---- fim de tempo ----
    pag.evaluate(f"{T}.jogo().tempo = 0.3")
    pag.evaluate(f"{T}.avancar(8)")
    pag.wait_for_timeout(1000)
    confere(pag.evaluate(f"{T}.tela()") == "fim" and pag.locator("#bk-fim").is_visible(), "acabando o tempo, aparece o fim de jogo")
    pontos = ev(pag, "j.pontos")
    confere(pag.locator("#bk-fim-pontos").text_content() == str(pontos), "mostra os pontos da partida")
    confere("Novo recorde" in pag.locator("#bk-fim-rec").text_content(), "primeira partida é recorde")
    confere(pag.locator("#bk-fim-estrelas").text_content().startswith("+"), "mostra as estrelas ganhas")
    confere(ev(pag, "d.rec.relogio") == pontos and ev(pag, "d.estrelas") > 0, "recorde e estrelas ficam guardados")
    confere(ev(pag, "d.conquistas.primeira") != undefined_js(), "ganha a conquista Primeira cesta")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-basquete-fim.png"))
    tocar("#bk-fim-menu")
    confere(pag.locator("#bk-menu").is_visible() and pag.locator("#bk-rec-relogio").text_content() == str(pontos), "volta ao menu mostrando o recorde")

    # ---- vestiário ----
    pag.evaluate(f"() => {{ {T}.dados().estrelas = 100; }}")
    tocar('.bk-aba[data-aba="vestiario"]')
    confere(pag.locator(".bk-item").count() == 10, f"vestiário com 6 bolas e 4 quadras ({pag.locator('.bk-item').count()})")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-basquete-vestiario.png"))
    antes = ev(pag, "d.estrelas")
    tocar(".bk-item >> nth=1")     # Streetball, 60 estrelas
    confere(ev(pag, "d.bola") == "street" and ev(pag, "d.estrelas") == antes - 60 + 25, "comprar e usar uma bola desconta as estrelas (e dá a conquista Estilo, +25)")
    tocar(".bk-item >> nth=5")     # Dourada, 350: não dá
    confere(ev(pag, "d.bola") == "street", "sem estrelas, não compra")
    tocar("#bk-painel-voltar")

    # ---- recordes e conquistas ----
    tocar('.bk-aba[data-aba="recordes"]')
    confere(pag.locator("#bk-painel-corpo .bk-linha").count() == 1, "o recorde aparece na lista")
    tocar("#bk-painel-voltar")
    tocar('.bk-aba[data-aba="conquistas"]')
    confere(pag.locator("#bk-painel-corpo .bk-linha").count() == 10, "10 conquistas")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-basquete-conquistas.png"))
    tocar("#bk-painel-voltar")

    # ---- arremesso com o dedo de verdade: arrastar para trás e soltar ----
    tocar("#bk-modo-minuto")
    pag.evaluate(f"{T}.congelar(true)")
    confere(abs(ev(pag, "j.tempo") - 90) < 0.01, "Por tempo começa com 90 segundos")
    vp = pag.viewport_size
    x0, y0 = vp["width"] * 0.5, vp["height"] * 0.7
    if toque:
        cdp = ctx.new_cdp_session(pag)
        cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x0, "y": y0}]})
        for i in range(1, 6):
            cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x0 - 6 * i, "y": y0 + 20 * i}]})
        cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    else:
        pag.mouse.move(x0, y0); pag.mouse.down()
        for i in range(1, 6):
            pag.mouse.move(x0 - 6 * i, y0 + 20 * i)
        pag.mouse.up()
    pag.wait_for_timeout(100)
    confere(ev(pag, "j.bolas.length") == 1 and ev(pag, "j.comecou"), "arrastar para trás e soltar arremessa a bola")
    confere(ev(pag, "j.bolas[0].vy") < 0, "a bola sobe")
    if toque:
        # palma da mão (contato largo) não começa a mira
        cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x0, "y": y0, "radiusX": 80, "radiusY": 80}]})
        pag.wait_for_timeout(60)
        confere(ev(pag, "j.puxando === null"), "a palma da mão apoiada não começa a mira")
        cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
        cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": 2, "y": 2}]})
        cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
        pag.wait_for_timeout(150)
    # um toque simples (sem arrastar) não arremessa
    pag.wait_for_timeout(50)
    avancar(pag, 4)
    n0 = ev(pag, "j.bolas.length")
    if toque:
        pag.touchscreen.tap(x0, y0)
    else:
        pag.mouse.click(x0, y0)
    confere(ev(pag, "j.bolas.length") == n0, "um toque simples não arremessa")
    # arrastar para cima não vale
    if toque:
        cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x0, "y": y0}]})
        for i in range(1, 6):
            cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x0, "y": y0 - 20 * i}]})
        cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    else:
        pag.mouse.move(x0, y0); pag.mouse.down()
        for i in range(1, 6):
            pag.mouse.move(x0, y0 - 20 * i)
        pag.mouse.up()
    pag.wait_for_timeout(100)
    confere(ev(pag, "j.bolas.length") == n0, "arrastar para cima não arremessa")

    # ---- mira pontilhada aparece enquanto arrasta (captura) ----
    avancar(pag, 4)
    if toque:
        cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x0, "y": y0}]})
        for i in range(1, 6):
            cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x0 - 8 * i, "y": y0 + 22 * i}]})
        pag.evaluate(f"{T}.desenhar()")
        pag.screenshot(path=str(CAPTURAS / f"{nome}-basquete-mira.png"))
        cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    else:
        pag.mouse.move(x0, y0); pag.mouse.down()
        for i in range(1, 6):
            pag.mouse.move(x0 - 8 * i, y0 + 22 * i)
        pag.evaluate(f"{T}.desenhar()")
        pag.screenshot(path=str(CAPTURAS / f"{nome}-basquete-mira.png"))
        pag.mouse.up()

    # ---- casinha ----
    h = pag.locator("#tela-basquete .btn-voltar")
    h.tap() if toque else h.click()
    pag.wait_for_timeout(300)
    confere(pag.locator("#tela-menu").is_visible(), "a casinha volta ao menu principal")
    confere(not erros, f"sem erros no console ({erros})")
    ctx.close()
    nav.close()


def undefined_js():
    return None


def main():
    porta = porta_livre()
    srv = subprocess.Popen([sys.executable, str(RAIZ / "tools" / "servir.py"), str(porta)])
    time.sleep(1)
    base = f"http://127.0.0.1:{porta}/"
    try:
        with sync_playwright() as p:
            testar(p, base, "celular-retrato", **p.devices["Pixel 7"])
            testar(p, base, "celular-paisagem", **p.devices["Pixel 7 landscape"])
            testar(p, base, "tablet-android", **p.devices["Galaxy Tab S4 landscape"])
            testar(p, base, "pc", viewport={"width": 1366, "height": 768})
    finally:
        srv.terminate()
    print("\n" + ("TUDO CERTO" if not falhas else f"{len(falhas)} FALHA(S)"))
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main()
