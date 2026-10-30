"""Fase 3: jogo Desviar (escolha do personagem, gestos, obstáculos, vidas, recorde, game over).
Rodar: .venv\\Scripts\\python.exe tests\\test_fase3.py
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


T = "window.Jogos.desviar._teste"


def passo(pag, seg, dt=1 / 60):
    """Avança a simulação sem esperar em tempo real."""
    pag.evaluate(f"({{seg, dt}}) => {{ for (let t = 0; t < seg; t += dt) {T}.passo(dt); {T}.desenhar(); }}", {"seg": seg, "dt": dt})


def jg(pag, expr):
    return pag.evaluate(f"() => {{ const j = {T}.jogo(); return {expr}; }}")


class Dedo:
    def __init__(self, ctx, pag, toque):
        self.pag, self.toque = pag, toque
        self.cdp = ctx.new_cdp_session(pag) if toque else None

    def deslizar(self, dx, dy):
        vp = self.pag.viewport_size
        x0, y0 = vp["width"] / 2, vp["height"] * 0.55
        x1, y1 = x0 + dx, y0 + dy
        if self.toque:
            self.cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x0, "y": y0}]})
            for i in range(1, 6):
                self.cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x0 + (x1 - x0) * i / 5, "y": y0 + (y1 - y0) * i / 5}]})
            self.cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
            # o simulador de toque do Chromium engole o 1o toque depois de um arrasto:
            # um toque descartavel no canto zera esse estado
            self.cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": 2, "y": 2}]})
            self.cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
            self.pag.wait_for_timeout(200)
        else:
            self.pag.mouse.move(x0, y0)
            self.pag.mouse.down()
            for i in range(1, 6):
                self.pag.mouse.move(x0 + (x1 - x0) * i / 5, y0 + (y1 - y0) * i / 5)
            self.pag.mouse.up()
        self.pag.wait_for_timeout(60)


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

    def tocar(seletor):
        loc = pag.locator(seletor).first
        loc.tap() if toque else loc.click()
        pag.wait_for_timeout(120)

    # ---- escolha do personagem ----
    tocar(".cartao-desviar")
    pag.wait_for_timeout(700)
    confere(pag.locator("#dv-escolha").is_visible(), "tela de escolha aparece")
    confere(pag.locator(".dv-card").count() == 2, "dois personagens para escolher")
    pequenos = pag.evaluate(
        """() => [...document.querySelectorAll('#tela-desviar button')].filter(b => b.offsetParent !== null)
           .map(b => { const r = b.getBoundingClientRect(); return [b.getAttribute('aria-label'), Math.round(r.width), Math.round(r.height)]; })
           .filter(([_, w, h]) => w < 60 || h < 60)"""
    )
    confere(not pequenos, f"botões da escolha grandes (menores que 60px: {pequenos})")
    confere(pag.evaluate("document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight"), "sem rolagem")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-desviar-escolha.png"))
    # a casinha precisa estar livre para tocar (nada por cima dela)
    topo = pag.evaluate("""() => { const r = document.querySelector('#tela-desviar .btn-voltar').getBoundingClientRect();
        return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2).closest('button') === document.querySelector('#tela-desviar .btn-voltar'); }""")
    confere(topo, "casinha acessível na tela de escolha")

    # ---- começar com o ouriço ----
    tocar('.dv-card[data-heroi="ourico"]')
    pag.wait_for_timeout(200)
    confere(pag.evaluate(f"{T}.estado().fase") == "jogando", "jogo começa ao tocar no personagem")
    confere(pag.locator("#dv-hud").is_visible() and pag.locator("#dv-vidas .vida").count() == 3, "placar e 3 vidas aparecem")
    confere(jg(pag, "j.vidas") == 3 and jg(pag, "j.faixa") == 1, "começa com 3 vidas na pista do meio")
    pag.evaluate(f"{T}.limpar(); {T}.congelar(true)")  # relógio parado: só avança com passo()

    dedo = Dedo(ctx, pag, toque)
    # ---- gestos ----
    dedo.deslizar(-150, 0)
    confere(jg(pag, "j.faixa") == 0, "deslizar para a esquerda vai para a pista da esquerda")
    dedo.deslizar(-150, 0)
    confere(jg(pag, "j.faixa") == 0, "não sai da pista da esquerda")
    dedo.deslizar(150, 0)
    dedo.deslizar(150, 0)
    confere(jg(pag, "j.faixa") == 2, "deslizar para a direita vai até a pista da direita")
    dedo.deslizar(-150, 0)
    confere(jg(pag, "j.faixa") == 1, "volta para o meio")
    dedo.deslizar(0, -150)
    confere(jg(pag, "j.pulo") >= 0, "deslizar para cima pula")
    pag.evaluate(f"{T}.jogo().pulo = 0.39")  # meio do pulo (o jogo também anda em tempo real durante o gesto)
    confere(pag.evaluate(f"{T}.altura()") > 0.9, "no meio do pulo, o personagem está no alto")
    passo(pag, 1.0)
    confere(jg(pag, "j.pulo") < 0, "o pulo termina sozinho")
    dedo.deslizar(0, 150)
    confere(jg(pag, "j.agacha") > 0, "deslizar para baixo agacha")
    passo(pag, 0.9)
    confere(jg(pag, "j.agacha") == 0, "agachar termina sozinho")
    passo(pag, 0.5)

    # ---- obstáculos: desviar de pista, pular, agachar ----
    def tenta(tipo, lane, preparo):
        pag.evaluate(f"{T}.limpar(); {T}.jogo().invul = 0; {T}.jogo().faixa = 1; {T}.jogo().xl = 1; {T}.jogo().pulo = -1; {T}.jogo().agacha = 0;")
        v0 = jg(pag, "j.vidas")
        pag.evaluate(f"{T}.itemNovo('{tipo}', {lane!r}, 6)")
        preparo()
        passo(pag, 1.4)
        return v0 - jg(pag, "j.vidas")

    confere(tenta("pedra", 1, lambda: None) == 1, "bater numa pedra tira 1 vida")
    pag.evaluate(f"{T}.jogo().vidas = 3")
    confere(tenta("pedra", 1, lambda: dedo.deslizar(-150, 0)) == 0, "trocar de pista desvia da pedra")
    confere(tenta("pedra", 1, lambda: (passo(pag, 0.4), dedo.deslizar(0, -150))) == 0, "pular passa por cima da pedra")
    pag.evaluate(f"{T}.jogo().vidas = 3")
    confere(tenta("alta", 1, lambda: None) == 1, "bater na barra alta tira 1 vida")
    pag.evaluate(f"{T}.jogo().vidas = 3")
    confere(tenta("alta", 1, lambda: (passo(pag, 0.45), dedo.deslizar(0, 150))) == 0, "agachar passa por baixo da barra")
    pag.evaluate(f"{T}.jogo().vidas = 3")
    confere(tenta("bloco", 1, lambda: dedo.deslizar(150, 0)) == 0, "trocar de pista desvia do bloco")
    pag.evaluate(f"{T}.jogo().vidas = 3")
    confere(tenta("bloco", 1, lambda: (passo(pag, 0.4), dedo.deslizar(0, -150))) == 1, "bloco não dá para pular")
    pag.evaluate(f"{T}.jogo().vidas = 3")
    confere(tenta("baixaTodas", "todas", lambda: (passo(pag, 0.4), dedo.deslizar(0, -150))) == 0, "pular a cerquinha de todas as pistas")
    pag.evaluate(f"{T}.jogo().vidas = 3")
    confere(tenta("altaTodas", "todas", lambda: (passo(pag, 0.45), dedo.deslizar(0, 150))) == 0, "agachar sob a barra de todas as pistas")
    pag.evaluate(f"{T}.jogo().vidas = 3")
    confere(tenta("baixaTodas", "todas", lambda: dedo.deslizar(-150, 0)) == 1, "cerquinha de todas as pistas não dá para desviar de lado")

    # ---- depois de bater, ganha um tempinho sem perder outra vida ----
    pag.evaluate(f"{T}.limpar(); {T}.jogo().vidas = 3; {T}.jogo().invul = 0; {T}.jogo().faixa = 1; {T}.jogo().xl = 1;")
    pag.evaluate(f"{T}.itemNovo('bloco', 1, 5); {T}.itemNovo('bloco', 1, 7.5)")
    passo(pag, 1.5)
    confere(jg(pag, "j.vidas") == 2, "logo depois de bater, não perde duas vidas seguidas")
    confere(jg(pag, "j.lento") > 0, "depois de bater, o jogo desacelera um pouco")

    # ---- estrelas e pontos ----
    pag.evaluate(f"{T}.limpar(); {T}.jogo().pontos = 0; {T}.jogo().invul = 0;")
    pag.evaluate(f"{T}.estrelaNova(1, 5); {T}.estrelaNova(0, 5)")
    passo(pag, 1.0)
    confere(jg(pag, "j.pontos") == 5, "pegar estrela da pista onde está dá 5 pontos (e só dessa pista)")
    confere(pag.locator("#dv-n").text_content() == "5", "placar mostra os pontos")

    # ---- velocidade cresce devagar ----
    pag.evaluate(f"{T}.limpar(); {T}.jogo().invul = 0; {T}.jogo().vidas = 3;")
    v1 = jg(pag, "j.v")
    pag.evaluate(f"({{}}) => {{ const j = {T}.jogo(); for (let i = 0; i < 60 * 40; i++) {{ j.itens = []; {T}.passo(1/60); }} }}", {})
    v2 = jg(pag, "j.v")
    confere(v2 > v1 + 2 and v2 <= 15.01, f"a velocidade aumenta com o tempo, com teto ({v1:.1f} -> {v2:.1f})")

    # ---- o jogo gera obstáculos e estrelas sozinho, sempre com saída ----
    pag.evaluate(f"{T}.jogo().proxima = 0; {T}.jogo().t = 20;")
    seguidos = pag.evaluate(
        f"""() => {{
          const j = {T}.jogo(); let semSaida = 0, linhas = 0;
          for (let n = 0; n < 400; n++) {{
            j.proxima = 0; j.itens = [];
            {T}.passo(1/60);
            const ocupadas = new Set(); let todas = false;
            j.itens.forEach(i => {{ if (i.lane === 'todas') todas = true; else ocupadas.add(i.lane); }});
            if (j.itens.length) linhas++;
            if (!todas && ocupadas.size >= 3) semSaida++;
          }}
          return [linhas, semSaida];
        }}"""
    )
    confere(seguidos[0] > 300 and seguidos[1] == 0, f"nenhuma linha fecha as 3 pistas sem saída ({seguidos[0]} linhas testadas)")

    pag.evaluate(f"{T}.jogo().vidas = 3; {T}.jogo().invul = 0; {T}.jogo().pontos = 17; {T}.limpar()")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-desviar-jogando-vazio.png"))
    # cena movimentada para olhar
    pag.evaluate(
        f"""() => {{ {T}.limpar(); const j = {T}.jogo();
          {T}.itemNovo('pedra', 0, 14); {T}.itemNovo('alta', 2, 11); {T}.itemNovo('bloco', 1, 7);
          {T}.estrelaNova(0, 9); {T}.estrelaNova(0, 10.5); {T}.estrelaNova(0, 12); j.pulo = 0.3; }}"""
    )
    pag.evaluate(f"{T}.desenhar()")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-desviar-cena.png"))
    pag.evaluate(f"{T}.limpar()")

    # ---- game over e recorde ----
    pag.evaluate("localStorage.removeItem('joguinhos.desviar.recorde')")
    pag.evaluate(f"{T}.jogo().pontos = 23; {T}.jogo().vidas = 1; {T}.jogo().invul = 0; {T}.jogo().faixa = 1; {T}.jogo().xl = 1; {T}.itemNovo('bloco', 1, 3)")
    passo(pag, 0.8)
    confere(pag.evaluate(f"{T}.estado().fase") == "fim", "sem vidas, o jogo termina")
    pag.wait_for_timeout(1500)
    confere(pag.locator("#dv-fim").is_visible(), "tela de fim aparece suavemente")
    confere(pag.locator("#dv-final").text_content() == "23", "mostra os pontos da partida")
    confere(pag.locator("#dv-novo").is_visible(), "avisa 'Novo recorde!'")
    confere(pag.evaluate("localStorage.getItem('joguinhos.desviar.recorde')") == "23", "recorde guardado no aparelho")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-desviar-fim.png"))
    topo = pag.evaluate("""() => { const r = document.querySelector('#tela-desviar .btn-voltar').getBoundingClientRect();
        return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2).closest('button') === document.querySelector('#tela-desviar .btn-voltar'); }""")
    confere(topo, "casinha acessível na tela de fim")
    icones = pag.evaluate("[...document.querySelectorAll('#dv-fim .dv-btn svg')].map(s => Math.round(s.getBoundingClientRect().width))")
    confere(len(icones) == 3 and min(icones) >= 28, f"ícones dos botões do fim aparecem ({icones})")

    # ---- jogar de novo mantém o personagem; pontos menores não trocam o recorde ----
    tocar("#dv-denovo")
    confere(pag.evaluate(f"{T}.estado().fase") == "jogando" and jg(pag, "j.vidas") == 3 and jg(pag, "j.pontos") == 0, "jogar de novo recomeça do zero")
    pag.evaluate(f"{T}.limpar(); {T}.jogo().pontos = 4; {T}.jogo().vidas = 1; {T}.itemNovo('bloco', 1, 3)")
    passo(pag, 0.8)
    pag.wait_for_timeout(1500)
    confere(not pag.locator("#dv-novo").is_visible(), "sem recorde novo, não comemora")
    confere(pag.locator("#dv-recorde-fim").text_content() == "23", "recorde continua 23")
    tocar("#dv-trocar")
    confere(pag.locator("#dv-escolha").is_visible() and pag.locator("#dv-rec").text_content() == "23", "trocar de personagem volta à escolha mostrando o recorde")

    # ---- o outro personagem ----
    tocar('.dv-card[data-heroi="cao"]')
    confere(pag.evaluate(f"{T}.estado().heroi") == "cao", "escolhe o cãozinho")
    pag.evaluate(f"{T}.limpar(); {T}.itemNovo('pedra', 2, 10); {T}.estrelaNova(1, 8); {T}.jogo().faixa = 1;")
    passo(pag, 0.2)
    pag.screenshot(path=str(CAPTURAS / f"{nome}-desviar-cao.png"))

    # ---- sair no meio do jogo e voltar ----
    tocar('#tela-desviar .btn-voltar')
    pag.wait_for_timeout(300)
    confere(pag.locator("#tela-menu").is_visible(), "casinha volta para o menu durante o jogo")
    tocar(".cartao-desviar")
    pag.wait_for_timeout(400)
    confere(pag.evaluate(f"{T}.estado().fase") == "escolha", "ao voltar em Desviar, abre na escolha")

    confere(not erros, f"sem erros no console ({erros})")
    ctx.close()
    nav.close()


def teclado(p, base):
    print("\n== teclado (PC) ==")
    nav = p.chromium.launch()
    pag = nav.new_page(viewport={"width": 1366, "height": 768})
    pag.goto(base)
    pag.wait_for_load_state("networkidle")
    pag.click(".cartao-desviar")
    pag.wait_for_timeout(500)
    pag.click('.dv-card[data-heroi="ourico"]')
    pag.evaluate(f"{T}.limpar()")
    pag.keyboard.press("ArrowLeft")
    confere(jg(pag, "j.faixa") == 0, "seta para a esquerda troca de pista")
    pag.keyboard.press("d")
    confere(jg(pag, "j.faixa") == 1, "tecla D vai para a direita")
    pag.keyboard.press("ArrowUp")
    confere(jg(pag, "j.pulo") >= 0, "seta para cima pula")
    passo(pag, 1.0)
    pag.keyboard.press("ArrowDown")
    confere(jg(pag, "j.agacha") > 0, "seta para baixo agacha")
    # corrida real em tempo real: nada quebra e o quadro anda
    pag.evaluate(f"{T}.jogo().vidas = 99")
    pag.wait_for_timeout(2500)
    confere(jg(pag, "j.t") > 1.5 and jg(pag, "j.itens.length + j.cenario.length") > 0, "o jogo roda em tempo real")
    pag.screenshot(path=str(CAPTURAS / "pc-desviar-corrida.png"))
    nav.close()


def main():
    porta = porta_livre()
    srv = subprocess.Popen([sys.executable, str(RAIZ / "tools" / "servir.py"), str(porta)])
    time.sleep(1)
    base = f"http://127.0.0.1:{porta}/"
    try:
        with sync_playwright() as p:
            testar(p, base, "celular-paisagem", **p.devices["Pixel 7 landscape"])
            testar(p, base, "celular-retrato", **p.devices["Pixel 7"])
            testar(p, base, "tablet-android", **p.devices["Galaxy Tab S4 landscape"])
            testar(p, base, "pc", viewport={"width": 1366, "height": 768})
            teclado(p, base)
    finally:
        srv.terminate()
    print("\n" + ("TUDO CERTO" if not falhas else f"{len(falhas)} FALHA(S)"))
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main()
