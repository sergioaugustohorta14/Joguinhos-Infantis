"""Instalar o app: botão no menu, aviso do navegador (beforeinstallprompt), passo a passo (iPhone e outros),
app já instalado e "agora não". Rodar: .venv\\Scripts\\python.exe tests\\test_instalar.py
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

# o Chromium do teste pode disparar o aviso de verdade; aqui só valem os avisos que o teste cria
BLOQUEIA_AVISO_REAL = "window.addEventListener('beforeinstallprompt', e => { if (!e.__falso) e.stopImmediatePropagation(); }, true);"
AVISO_FALSO = """() => {
  const e = new Event('beforeinstallprompt', { cancelable: true });
  e.__falso = true;
  e.prompt = () => { window.__prompted = true; };
  e.userChoice = Promise.resolve({ outcome: window.__resultado || 'accepted' });
  window.dispatchEvent(e);
}"""
SIMULA_INSTALADO = """
const original = window.matchMedia.bind(window);
window.matchMedia = q => q.includes('display-mode') ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : original(q);
"""


def confere(cond, msg):
    print(("OK    " if cond else "FALHA ") + msg)
    if not cond:
        falhas.append(msg)


def porta_livre():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def novo(p, base, script=None, **ctx_args):
    nav = p.chromium.launch()
    ctx = nav.new_context(**ctx_args)
    if script:
        ctx.add_init_script(script)
    pag = ctx.new_page()
    erros = []
    pag.on("pageerror", lambda e: erros.append(str(e)))
    pag.on("console", lambda m: erros.append(m.text) if m.type == "error" else None)
    pag.goto(base)
    pag.wait_for_load_state("networkidle")
    return nav, ctx, pag, erros


def visivel(pag, seletor):
    return pag.locator(seletor).is_visible()


def main():
    porta = porta_livre()
    srv = subprocess.Popen([sys.executable, str(RAIZ / "tools" / "servir.py"), str(porta)])
    time.sleep(1)
    base = f"http://127.0.0.1:{porta}/"
    try:
        with sync_playwright() as p:
            celular = p.devices["Pixel 7"]

            print("\n== Android: o navegador avisa que dá para instalar ==")
            nav, ctx, pag, erros = novo(p, base, BLOQUEIA_AVISO_REAL, **celular)
            confere(visivel(pag, "#btn-instalar"), "o botão de instalar aparece no menu")
            caixa = pag.evaluate("""() => { const r = id => document.getElementById(id).getBoundingClientRect();
                const a = r('btn-instalar'), b = r('btn-som'); const cartoes = [...document.querySelectorAll('.cartao')].map(c => c.getBoundingClientRect());
                return { w: a.width, h: a.height, sobreSom: a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top,
                         sobreCartao: cartoes.some(c => a.left < c.right && a.right > c.left && a.top < c.bottom && a.bottom > c.top) }; }""")
            confere(caixa["w"] >= 88 and caixa["h"] >= 88, "botão grande para o dedo")
            confere(not caixa["sobreSom"] and not caixa["sobreCartao"], "botão não cobre o som nem os cartões")
            pag.evaluate(AVISO_FALSO)
            pag.wait_for_timeout(1300)
            confere(visivel(pag, "#instalar-folha") and visivel(pag, "#instalar-agora") and not visivel(pag, "#instalar-passos"), "a folha de instalar aparece sozinha, com o botão Instalar")
            pag.screenshot(path=str(CAPTURAS / "celular-instalar-folha.png"))
            pag.locator("#instalar-agora").tap()
            pag.wait_for_timeout(200)
            confere(pag.evaluate("window.__prompted === true"), "Instalar chama o aviso de instalação do navegador")
            confere(not visivel(pag, "#instalar-folha"), "a folha fecha")
            confere(not erros, f"sem erros no console ({erros})")
            nav.close()

            print("\n== 'Agora não' ==")
            nav, ctx, pag, erros = novo(p, base, BLOQUEIA_AVISO_REAL, **celular)
            pag.evaluate(AVISO_FALSO)
            pag.wait_for_timeout(1300)
            pag.locator("#instalar-depois").tap()
            pag.wait_for_timeout(200)
            confere(not visivel(pag, "#instalar-folha") and pag.evaluate("!!localStorage.getItem('joguinhos.instalar.adiado')"), "fecha e lembra de não insistir")
            pag.reload()
            pag.wait_for_load_state("networkidle")
            pag.evaluate(AVISO_FALSO)
            pag.wait_for_timeout(3200)
            confere(not visivel(pag, "#instalar-folha"), "depois de 'agora não', não aparece sozinha de novo")
            confere(visivel(pag, "#btn-instalar"), "mas o botão do menu continua lá")
            pag.locator("#btn-instalar").tap()
            pag.wait_for_timeout(200)
            confere(visivel(pag, "#instalar-folha"), "tocando no botão, a folha abre")
            nav.close()

            print("\n== sem aviso do navegador (passo a passo) ==")
            nav, ctx, pag, erros = novo(p, base, BLOQUEIA_AVISO_REAL, **celular)
            pag.wait_for_timeout(3200)
            confere(visivel(pag, "#instalar-folha") and visivel(pag, "#instalar-passos") and not visivel(pag, "#instalar-agora"), "mostra o passo a passo")
            confere("três pontinhos" in pag.locator("#instalar-passos").text_content(), "no Android: menu do navegador")
            pag.screenshot(path=str(CAPTURAS / "celular-instalar-passos.png"))
            nav.close()

            print("\n== iPhone ==")
            nav, ctx, pag, erros = novo(p, base, BLOQUEIA_AVISO_REAL, **p.devices["iPhone 13"])
            pag.wait_for_timeout(3200)
            passos = pag.locator("#instalar-passos").text_content()
            confere(visivel(pag, "#instalar-passos") and "Compartilhar" in passos and "Adicionar à Tela de Início" in passos, "no iPhone: Compartilhar e Adicionar à Tela de Início")
            confere("Role a lista" in passos and "Editar Ações" in passos and "iPad" in passos, "explica a rolagem da lista, o Editar Ações e onde fica o botão no iPad")
            nav.close()

            print("\n== app já instalado ==")
            nav, ctx, pag, erros = novo(p, base, BLOQUEIA_AVISO_REAL + SIMULA_INSTALADO, **celular)
            pag.evaluate(AVISO_FALSO)
            pag.wait_for_timeout(3200)
            confere(not visivel(pag, "#btn-instalar") and not visivel(pag, "#instalar-folha"), "instalado: sem botão e sem folha")
            nav.close()

            print("\n== dentro de um jogo não aparece ==")
            nav, ctx, pag, erros = novo(p, base, BLOQUEIA_AVISO_REAL, **celular)
            pag.locator(".cartao-desviar").tap()
            pag.wait_for_timeout(3200)
            confere(not visivel(pag, "#instalar-folha"), "a folha não aparece no meio de um jogo")
            pag.locator("#tela-desviar .btn-voltar").tap()
            pag.wait_for_timeout(600)
            confere(visivel(pag, "#tela-menu"), "e a casinha continua funcionando")
            nav.close()
    finally:
        srv.terminate()
    print("\n" + ("TUDO CERTO" if not falhas else f"{len(falhas)} FALHA(S)"))
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main()
