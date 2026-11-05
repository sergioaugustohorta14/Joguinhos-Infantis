"""Bolinhas: níveis sempre com solução, toque nos blocos, esteira, bandejas, vitória e derrota.
Rodar: .venv\\Scripts\\python.exe tests\\test_bolinhas.py
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
T = "window.Jogos.bolinhas._teste"


def confere(cond, msg):
    print(("OK    " if cond else "FALHA ") + msg)
    if not cond:
        falhas.append(msg)


def porta_livre():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def passo(pag, seg, dt=1 / 60):
    pag.evaluate(f"({{seg, dt}}) => {{ for (let t = 0; t < seg; t += dt) {T}.passo(dt); {T}.desenhar(); }}", {"seg": seg, "dt": dt})


def jg(pag, expr):
    return pag.evaluate(f"() => {{ const j = {T}.jogo(); return {expr}; }}")


def tocar_no_mundo(pag, toque, x, y):
    """Toca (ou clica) num ponto do mundo do jogo, usando a posição real na tela."""
    px, py = pag.evaluate(f"({{x, y}}) => {{ const r = document.getElementById('cv-bolinhas').getBoundingClientRect(); const p = {T}.mundoParaTela(x, y); return [r.left + p[0], r.top + p[1]]; }}", {"x": x, "y": y})
    if toque:
        pag.touchscreen.tap(px, py)
    else:
        pag.mouse.click(px, py)
    pag.wait_for_timeout(60)


def niveis(p, base):
    print("\n== níveis (geração e solução automática) ==")
    nav = p.chromium.launch()
    pag = nav.new_page(viewport={"width": 412, "height": 915})
    pag.goto(base)
    pag.wait_for_load_state("networkidle")
    pag.click(".cartao-bolinhas")
    pag.wait_for_timeout(500)
    pag.evaluate(f"{T}.congelar(true)")
    ruins = pag.evaluate(
        f"""() => {{
          const ruins = [];
          for (let n = 1; n <= 80; n++) {{
            const d = {T}.gerarNivel(n);
            if (d.tentativa > 0) ruins.push('retry:' + n + '=' + d.tentativa);
            const blocos = {{}}, bandejas = {{}};
            d.celulas.forEach(col => col.forEach(c => blocos[c] = (blocos[c] || 0) + 1));
            d.filas.forEach(f => f.forEach(b => bandejas[b.cor] = (bandejas[b.cor] || 0) + 1));
            const cores = Object.keys(blocos);
            if (cores.some(c => bandejas[c] !== blocos[c] * 3)) ruins.push(n + ': bandejas != 3 x blocos');
            if (Object.keys(bandejas).length !== cores.length) ruins.push(n + ': cores diferentes');
            if (d.filas.reduce((s, f) => s + f.length, 0) !== d.total * 3) ruins.push(n + ': total de bandejas');
            if (d.filas.some(f => f.length && f[0].oculta)) ruins.push(n + ': bandeja da frente escondida');
            if (d.nCores !== cores.length) ruins.push(n + ': nCores');
          }}
          return ruins;
        }}"""
    )
    confere(not [r for r in ruins if not r.startswith("retry")], f"80 níveis bem formados (3 bandejas por bloco, cores iguais) {ruins[:3]}")
    print(f"      níveis que precisaram de outra variação para ter solução: {[r for r in ruins if r.startswith(chr(114)+chr(101)+chr(116))]}")
    mesmo = pag.evaluate(f"JSON.stringify({T}.gerarNivel(17)) === JSON.stringify({T}.gerarNivel(17))")
    confere(mesmo, "o mesmo nível sai sempre igual")
    diferente = pag.evaluate(f"JSON.stringify({T}.gerarNivel(17).celulas) !== JSON.stringify({T}.gerarNivel(18).celulas)")
    confere(diferente, "níveis diferentes são diferentes")
    resultado = pag.evaluate(
        f"""() => {{
          const falhou = [], tempos = [];
          for (let n = 1; n <= 40; n++) {{
            {T}.nivel(n);
            const t = {T}.resolver(900);
            if (t < 0) falhou.push(n); else tempos.push(Math.round(t));
          }}
          return {{ falhou, tempos }};
        }}"""
    )
    confere(not resultado["falhou"], f"os níveis 1 a 40 têm solução e o jogo a conclui ({resultado['falhou']})")
    print(f"      tempo da solução automática (s): nível 1 = {resultado['tempos'][0]}, nível 10 = {resultado['tempos'][9]}, nível 40 = {resultado['tempos'][-1]}")
    nav.close()


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
    pag.evaluate("localStorage.removeItem('joguinhos.bolinhas.nivel')")

    c = pag.locator(".cartao-bolinhas")
    c.tap() if toque else c.click()
    pag.wait_for_timeout(600)
    confere(pag.locator("#tela-bolinhas").is_visible() and not pag.locator("#tela-menu").is_visible(), "o cartão Bolinhas abre o jogo")
    confere(pag.locator("#bo-niveis").is_visible() and pag.locator(".bo-nivel-btn").count() == 1, "ao entrar, aparece a escolha de nível (só o nível 1 liberado)")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-bolinhas-niveis.png"))
    b = pag.locator("#bo-continuar")
    b.tap() if toque else b.click()
    pag.wait_for_timeout(300)
    confere(pag.locator("#bo-n").text_content() == "1" and not pag.locator("#bo-niveis").is_visible(), "Continuar começa no nível 1")
    pag.evaluate(f"{T}.congelar(true)")
    confere(pag.evaluate("document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight"), "sem rolagem")
    grandes = pag.evaluate(
        """() => [...document.querySelectorAll('#tela-bolinhas button')].filter(b => b.offsetParent !== null)
           .map(b => { const r = b.getBoundingClientRect(); return [b.getAttribute('aria-label'), Math.round(r.width), Math.round(r.height)]; })
           .filter(([_, w, h]) => w < 60 || h < 60)"""
    )
    confere(not grandes, f"botões grandes ({grandes})")
    passo(pag, 0.3)
    pag.screenshot(path=str(CAPTURAS / f"{nome}-bolinhas-inicio.png"))

    # ---- tocar numa coluna solta o bloco da frente ----
    k = pag.evaluate(f"{T}.constantes()")
    geo = pag.evaluate(f"{T}.geo()")
    antes = jg(pag, "j.restantes")
    x_col1 = geo["gx0"] + (k["CS"] + k["GAP"]) * 1 + k["CS"] / 2
    tocar_no_mundo(pag, toque, x_col1, geo["gridBottom"] - 40)
    confere(jg(pag, "j.restantes") == antes - 1, "tocar numa coluna solta um bloco")
    confere(jg(pag, "j.funil.length") == k["POR_BLOCO"], f"o bloco solta {k['POR_BLOCO']} bolinhas no funil")
    tocar_no_mundo(pag, toque, 20, 5)
    confere(jg(pag, "j.restantes") == antes - 1, "tocar fora do quadro não faz nada")
    # um toque no alto da coluna também vale (dedinho que errou a altura)
    tocar_no_mundo(pag, toque, geo["gx0"] + k["CS"] / 2, geo["gridTop"] + 10)
    confere(jg(pag, "j.restantes") == antes - 2, "tocar no alto da coluna solta o bloco da frente dela")
    passo(pag, 1.0)
    confere(jg(pag, "j.esteira.filter(b => b).length") > 0, "as bolinhas sobem na esteira")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-bolinhas-esteira.png"))
    passo(pag, 12)
    cheias = jg(pag, "j.filas.reduce((s, f) => s + f.reduce((t, b) => t + b.enchido, 0), 0)")
    print(f"      buracos preenchidos depois de soltar 2 blocos fora de ordem: {cheias}")

    # ---- vitória: joga sozinho seguindo a ordem e confere a tela ----
    pag.evaluate(f"{T}.nivel(1)")
    pag.evaluate(f"{T}.resolver(900)")
    confere(jg(pag, "j.fase") == "ganhou", "esvaziar as filas ganha o nível")
    passo(pag, 1.2)
    confere(pag.locator("#bo-fim").is_visible() and pag.locator("#bo-proximo").is_visible(), "aparece a tela de vitória com o botão de próximo")
    confere(pag.evaluate("localStorage.getItem('joguinhos.bolinhas.nivel')") == "2", "o próximo nível fica guardado")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-bolinhas-vitoria.png"))
    b = pag.locator("#bo-proximo")
    b.tap() if toque else b.click()
    pag.wait_for_timeout(200)
    confere(pag.locator("#bo-n").text_content() == "2" and not pag.locator("#bo-fim").is_visible(), "o botão leva ao nível 2")

    # ---- voltar para as opções (escolha de nível) sem sair do jogo ----
    sobrepoe = pag.evaluate("""() => { const a = document.querySelector('#tela-bolinhas .btn-voltar').getBoundingClientRect(), b = document.getElementById('bo-opcoes').getBoundingClientRect();
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; }""")
    confere(pag.locator("#bo-opcoes").is_visible() and not sobrepoe, "o botão de voltar às opções aparece e não cobre a casinha")
    b = pag.locator("#bo-opcoes")
    b.tap() if toque else b.click()
    pag.wait_for_timeout(300)
    confere(pag.locator("#bo-niveis").is_visible() and pag.locator(".bo-nivel-btn").count() == 2 and not pag.locator("#bo-opcoes").is_visible(), "voltar mostra a escolha de nível (1 e 2)")
    confere(pag.locator("#tela-bolinhas").is_visible() and not pag.locator("#tela-menu").is_visible(), "continua dentro do jogo")
    b = pag.locator('.bo-nivel-btn[data-n="1"]')
    b.tap() if toque else b.click()
    pag.wait_for_timeout(300)
    confere(pag.locator("#bo-n").text_content() == "1" and not pag.locator("#bo-niveis").is_visible(), "escolher o nível 1 volta a ele")
    pag.evaluate(f"{T}.resolver(900)")
    confere(pag.evaluate("localStorage.getItem('joguinhos.bolinhas.nivel')") == "2", "vencer um nível antigo não faz perder o avanço")

    # ---- cena de um nível mais difícil, no meio do jogo ----
    pag.evaluate(f"{T}.congelar(true); {T}.nivel(14)")
    for col in range(5):
        pag.evaluate(f"{T}.liberar({col})")
    passo(pag, 2.2)
    pag.screenshot(path=str(CAPTURAS / f"{nome}-bolinhas-nivel14.png"))

    # ---- derrota: ninguém quer as bolinhas ----
    pag.evaluate(f"{T}.nivel(1)")
    pag.evaluate(
        f"""() => {{
          const j = {T}.jogo();
          const usadas = new Set(j.dados.ordemCores);
          let livre = 0; while (usadas.has(livre)) livre++;
          j.filas.forEach(f => f.forEach(b => {{ b.cor = livre; }}));
          for (let c = 0; c < j.dados.cols; c++) for (let i = 0; i < 4; i++) {T}.liberar(c);
        }}"""
    )
    passo(pag, 25)
    confere(jg(pag, "j.fase") == "perdeu", "esteira cheia de bolinhas que ninguém quer faz perder")
    passo(pag, 1.0)
    confere(pag.locator("#bo-fim").is_visible() and not pag.locator("#bo-proximo").is_visible(), "tela de derrota só oferece tentar de novo")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-bolinhas-derrota.png"))
    b = pag.locator("#bo-denovo")
    b.tap() if toque else b.click()
    pag.wait_for_timeout(200)
    confere(jg(pag, "j.fase") == "jogando" and jg(pag, "j.restantes") == jg(pag, "j.dados.total"), "tentar de novo recomeça o nível")
    r = pag.locator("#bo-reiniciar")
    pag.evaluate(f"{T}.liberar(0)")
    r.tap() if toque else r.click()
    pag.wait_for_timeout(200)
    confere(jg(pag, "j.restantes") == jg(pag, "j.dados.total"), "o botão de recomeçar volta ao início do nível")

    # ---- casinha ----
    h = pag.locator("#tela-bolinhas .btn-voltar")
    h.tap() if toque else h.click()
    pag.wait_for_timeout(300)
    confere(pag.locator("#tela-menu").is_visible(), "a casinha volta ao menu")
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
            niveis(p, base)
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
