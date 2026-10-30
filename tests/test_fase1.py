"""Fase 1: menu, navegação por toque, som, tamanho dos botões e funcionamento offline.
Rodar: .venv\\Scripts\\python.exe tests\\test_fase1.py
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


def confere(cond, msg):
    print(("OK    " if cond else "FALHA ") + msg)
    if not cond:
        falhas.append(msg)


def porta_livre():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def visivel(pag, id_tela):
    return pag.locator(f"#tela-{id_tela}").is_visible()


def testar(p, base, nome, **ctx_args):
    print(f"\n== {nome} ==")
    nav = p.chromium.launch()
    ctx = nav.new_context(**ctx_args)
    pag = ctx.new_page()
    erros = []
    pag.on("pageerror", lambda e: erros.append(str(e)))
    pag.on("console", lambda m: erros.append(m.text) if m.type == "error" else None)

    pag.goto(base)
    pag.wait_for_load_state("networkidle")
    confere(visivel(pag, "menu"), "menu aparece ao abrir")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-menu.png"))

    # todo botão precisa ter pelo menos 88px nos dois lados
    menores = pag.evaluate(
        """() => [...document.querySelectorAll('button')]
              .filter(b => b.offsetParent !== null)
              .map(b => { const r = b.getBoundingClientRect(); return [b.getAttribute('aria-label'), Math.round(r.width), Math.round(r.height)]; })
              .filter(([_, w, h]) => w < 88 || h < 88)"""
    )
    confere(not menores, f"botões visíveis com 88px ou mais (menores: {menores})")

    # o botão de som não pode encostar nos cartões
    sobrepoe = pag.evaluate(
        """() => {
            const a = document.getElementById('btn-som').getBoundingClientRect();
            return [...document.querySelectorAll('.cartao')].some(c => {
                const b = c.getBoundingClientRect();
                return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
            });
        }"""
    )
    confere(not sobrepoe, "botão de som não encosta nos cartões")

    # toque em Colorir -> volta -> toque em Desviar -> volta
    for rotulo, tela in [("Colorir", "colorir"), ("Desviar", "desviar")]:
        cartao = pag.locator(f".cartao-{tela}")
        cartao.tap() if ctx_args.get("has_touch") else cartao.click()
        pag.wait_for_timeout(500)
        confere(visivel(pag, tela) and not visivel(pag, "menu"), f"toque abre {rotulo}")
        pag.screenshot(path=str(CAPTURAS / f"{nome}-{tela}.png"))
        voltar = pag.locator(f"#tela-{tela} .btn-voltar")
        voltar.tap() if ctx_args.get("has_touch") else voltar.click()
        pag.wait_for_timeout(500)
        confere(visivel(pag, "menu"), f"voltar de {rotulo} leva ao menu")

    # botão de som alterna e lembra
    btn = pag.locator("#btn-som")
    antes = btn.get_attribute("aria-pressed")
    btn.tap() if ctx_args.get("has_touch") else btn.click()
    depois = btn.get_attribute("aria-pressed")
    confere(antes != depois, f"botão de som alterna ({antes} -> {depois})")
    pag.reload()
    pag.wait_for_load_state("networkidle")
    confere(pag.locator("#btn-som").get_attribute("aria-pressed") == depois, "escolha de som é lembrada após recarregar")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-menu-mudo.png"))

    # sem barra de rolagem
    sem_rolagem = pag.evaluate("document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight")
    confere(sem_rolagem, "página sem rolagem")

    # offline: service worker ativo e página abre sem rede
    pag.evaluate("navigator.serviceWorker.ready.then(() => true)")
    pag.wait_for_timeout(800)
    ctx.set_offline(True)
    pag.reload()
    pag.wait_for_load_state("domcontentloaded")
    confere(visivel(pag, "menu"), "abre offline (sem rede)")
    ctx.set_offline(False)

    confere(not erros, f"sem erros no console ({erros})")
    ctx.close()
    nav.close()


def main():
    porta = porta_livre()
    srv = subprocess.Popen([sys.executable, str(RAIZ / "tools" / "servir.py"), str(porta)])
    time.sleep(1)
    base = f"http://127.0.0.1:{porta}/"
    try:
        with sync_playwright() as p:
            testar(p, base, "celular-retrato", **p.devices["Pixel 7"])
            testar(p, base, "celular-paisagem", **{**p.devices["Pixel 7 landscape"]})
            testar(p, base, "tablet-android", **p.devices["Galaxy Tab S4 landscape"])
            testar(p, base, "pc", viewport={"width": 1366, "height": 768})
    finally:
        srv.terminate()
    print("\n" + ("TUDO CERTO" if not falhas else f"{len(falhas)} FALHA(S)"))
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main()
