"""Fase 2: galeria de 560 desenhos e editor de colorir (toque, balde, borracha, desfazer, salvar).
Rodar: .venv\\Scripts\\python.exe tests\\test_fase2.py
"""
import socket
import struct
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


JS_ALFA = """() => {
  const c = document.getElementById('cv-tinta');
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
  return n;
}"""
JS_PIXEL = """([x, y]) => {
  const c = document.getElementById('cv-tinta');
  return Array.from(c.getContext('2d').getImageData(x, y, 1, 1).data);
}"""


class Ator:
    """Desenha com toque de verdade (CDP) em aparelho com touch, ou com mouse no PC."""

    def __init__(self, ctx, pag, toque):
        self.pag, self.toque = pag, toque
        self.cdp = ctx.new_cdp_session(pag) if toque else None

    def caixa(self):
        return self.pag.locator("#ed-pagina").bounding_box()

    def tela(self, x, y):  # coordenadas do desenho (0-1000) -> pixels da tela
        b = self.caixa()
        return b["x"] + x / 1000 * b["width"], b["y"] + y / 1000 * b["height"]

    def toca(self, x, y):
        px, py = self.tela(x, y)
        if self.toque:
            self.pag.touchscreen.tap(px, py)
        else:
            self.pag.mouse.click(px, py)

    def arrasta(self, pts):
        ps = [self.tela(x, y) for x, y in pts]
        if self.toque:
            self.cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": ps[0][0], "y": ps[0][1]}]})
            for px, py in ps[1:]:
                self.cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": px, "y": py}]})
            self.cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
            # o simulador de toque do Chromium "engole" o primeiro toque depois de um arrasto:
            # um toque descartável no vazio (fora de qualquer botão) zera esse estado
            self.cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": 2, "y": 2}]})
            self.cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
            self.pag.wait_for_timeout(250)
        else:
            self.pag.mouse.move(*ps[0])
            self.pag.mouse.down()
            for px, py in ps[1:]:
                self.pag.mouse.move(px, py)
            self.pag.mouse.up()
        self.pag.wait_for_timeout(80)


def botao(pag, seletor, toque):
    b = pag.locator(seletor).first
    b.tap() if toque else b.click()
    pag.wait_for_timeout(120)


def testar(p, base, nome, **ctx_args):
    print(f"\n== {nome} ==")
    toque = bool(ctx_args.get("has_touch"))
    nav = p.chromium.launch()
    ctx = nav.new_context(accept_downloads=True, **ctx_args)
    pag = ctx.new_page()
    erros = []
    pag.on("pageerror", lambda e: erros.append(str(e)))
    pag.on("console", lambda m: erros.append(m.text) if m.type == "error" else None)
    pag.goto(base)
    pag.wait_for_load_state("networkidle")

    # ---- galeria ----
    botao(pag, ".cartao-colorir", toque)
    pag.wait_for_timeout(600)
    confere(pag.locator("#col-galeria").is_visible(), "galeria abre")
    confere(pag.locator(".aba").count() == 7, "7 categorias na galeria")
    pag.screenshot(path=str(CAPTURAS / f"{nome}-galeria.png"))

    # trocar de categoria
    botao(pag, '.aba[data-cat="gatinhos"]', toque)
    pag.wait_for_timeout(500)
    confere(pag.locator(".tile").count() == 70, f"gatinhos tem 70 desenhos ({pag.locator('.tile').count()})")
    botao(pag, '.aba[data-cat="dinos"]', toque)
    pag.wait_for_timeout(500)
    confere(pag.locator(".tile").count() == 90, "dinossauros tem 90 desenhos")
    # miniaturas carregam sem precisar rolar tudo
    pag.wait_for_timeout(500)
    carregadas = pag.evaluate("[...document.querySelectorAll('.tile img')].filter(i => i.src && i.complete && i.naturalWidth > 0).length")
    confere(carregadas >= 4, f"miniaturas visíveis carregadas ({carregadas})")

    # ---- abrir desenho (trex-0) ----
    pag.locator('.tile[data-id="trex-0"]').first.scroll_into_view_if_needed()
    botao(pag, '.tile[data-id="trex-0"]', toque)
    pag.wait_for_function("window.Jogos.colorir._estado.pronto === true", timeout=8000)
    confere(pag.locator("#col-editor").is_visible(), "editor abre ao tocar no desenho")
    pag.wait_for_timeout(400)
    pag.screenshot(path=str(CAPTURAS / f"{nome}-editor-vazio.png"))

    # tamanho dos botões do editor
    pequenos = pag.evaluate(
        """() => [...document.querySelectorAll('#col-editor button, #col-editor .cor')]
            .filter(b => b.offsetParent !== null)
            .map(b => { const r = b.getBoundingClientRect(); return [b.getAttribute('aria-label'), Math.round(r.width), Math.round(r.height)]; })
            .filter(([_, w, h]) => w < 36 || h < 36)"""
    )
    confere(not pequenos, f"botões do editor com pelo menos 36px (menores: {pequenos})")
    menor = pag.evaluate(
        """() => Math.min(...[...document.querySelectorAll('#col-editor button')].filter(b => b.offsetParent !== null)
            .map(b => Math.round(b.getBoundingClientRect().width)))"""
    )
    print(f"      menor botão de ferramenta: {menor}px")
    confere(pag.evaluate("document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight"), "editor sem rolagem")
    # nada se sobrepõe ao desenho
    sobre = pag.evaluate(
        """() => {
          const a = document.getElementById('ed-pagina').getBoundingClientRect();
          return [...document.querySelectorAll('#col-editor button, #col-editor .cor')].filter(b => {
            const r = b.getBoundingClientRect();
            return r.width > 0 && a.left < r.right - 1 && a.right > r.left + 1 && a.top < r.bottom - 1 && a.bottom > r.top + 1;
          }).length;
        }"""
    )
    confere(sobre == 0, f"nenhum botão em cima do desenho ({sobre})")

    ator = Ator(ctx, pag, toque)

    # ---- pincel: risco com o dedo ----
    botao(pag, '.cor[data-cor="#e45b5b"]', toque)
    botao(pag, '[data-ferr="pincel"]', toque)
    ator.arrasta([(80, 60), (200, 120), (350, 80), (500, 130)])
    a1 = pag.evaluate(JS_ALFA)
    confere(a1 > 3000, f"pincel pinta ao arrastar ({a1} pixels)")

    # ---- desfazer / refazer ----
    botao(pag, "#ed-desfazer", toque)
    confere(pag.evaluate(JS_ALFA) == 0, "desfazer apaga o risco")
    confere(pag.locator("#ed-desfazer").is_disabled(), "desfazer fica desligado sem histórico")
    botao(pag, "#ed-refazer", toque)
    confere(pag.evaluate(JS_ALFA) == a1, "refazer traz o risco de volta")

    # ---- borracha ----
    botao(pag, '[data-ferr="borracha"]', toque)
    botao(pag, '[data-tam="2"]', toque)
    ator.arrasta([(60, 70), (520, 70), (520, 140), (60, 140)])
    a2 = pag.evaluate(JS_ALFA)
    confere(a2 < a1 * 0.2, f"borracha apaga a tinta ({a1} -> {a2})")

    # ---- lápis ----
    botao(pag, '.cor[data-cor="#3f6fd1"]', toque)
    botao(pag, '[data-ferr="lapis"]', toque)
    botao(pag, '[data-tam="0"]', toque)
    antes = pag.evaluate(JS_ALFA)
    ator.arrasta([(800, 80), (900, 140), (820, 200)])
    confere(pag.evaluate(JS_ALFA) > antes, "lápis pinta")

    if toque:
        # palma da mão apoiada (contato largo) não pinta; o dedo logo depois pinta normalmente
        antes = pag.evaluate(JS_ALFA)
        px, py = ator.tela(400, 700)
        ator.cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": px, "y": py, "radiusX": 80, "radiusY": 80}]})
        ator.cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": px + 30, "y": py + 10, "radiusX": 80, "radiusY": 80}]})
        ator.cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
        ator.cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": 2, "y": 2}]})
        ator.cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
        pag.wait_for_timeout(200)
        confere(pag.evaluate(JS_ALFA) == antes, "palma da mão apoiada na tela não pinta")
        ator.arrasta([(400, 700), (480, 740)])
        confere(pag.evaluate(JS_ALFA) > antes, "dedo normal pinta logo depois")

    # ---- pintar só dentro das linhas (padrão) ----
    botao(pag, "#ed-limpar", toque)
    confere(pag.locator("#ed-dentro").get_attribute("aria-pressed") == "true", "'dentro das linhas' vem ligado")
    botao(pag, '.cor[data-cor="#e45b5b"]', toque)
    botao(pag, '[data-ferr="pincel"]', toque)
    botao(pag, '[data-tam="2"]', toque)
    ator.arrasta([(500, 700), (500, 760), (500, 600), (500, 330), (500, 150), (60, 30)])  # barriga -> cabeça -> fundo
    confere(pag.evaluate(JS_PIXEL, [512, 752])[3] == 255, "traço pinta a barriga (onde começou)")
    confere(pag.evaluate(JS_PIXEL, [512, 360])[3] == 0, "traço não passa para a cabeça")
    confere(pag.evaluate(JS_PIXEL, [512, 100])[3] == 0 and pag.evaluate(JS_PIXEL, [60, 40])[3] == 0, "traço não vaza para o fundo")
    # começar no fundo: pinta o fundo, mas não entra no personagem
    botao(pag, "#ed-limpar", toque)
    ator.arrasta([(60, 60), (60, 500), (500, 500), (940, 500)])
    confere(pag.evaluate(JS_PIXEL, [61, 100])[3] == 255, "traço pinta o fundo onde começou")
    confere(pag.evaluate(JS_PIXEL, [512, 500])[3] == 0, "traço do fundo não entra no personagem")
    # desligando, o traço fica livre
    botao(pag, "#ed-dentro", toque)
    confere(pag.locator("#ed-dentro").get_attribute("aria-pressed") == "false", "botão desliga o 'dentro das linhas'")
    botao(pag, "#ed-limpar", toque)
    ator.arrasta([(500, 700), (500, 330)])
    confere(pag.evaluate(JS_PIXEL, [512, 360])[3] == 255, "desligado: o traço passa livre para a cabeça")
    botao(pag, "#ed-dentro", toque)
    # desfazer funciona com o traço recortado
    botao(pag, "#ed-limpar", toque)
    ator.arrasta([(500, 700), (500, 760)])
    botao(pag, "#ed-desfazer", toque)
    confere(pag.evaluate(JS_ALFA) == 0, "desfazer apaga o traço recortado")
    ator.arrasta([(500, 700), (500, 760)])  # deixa algo no desenho para o teste de "limpar" abaixo

    # ---- balde: pinta só a barriga, sem vazar ----
    botao(pag, "#ed-limpar", toque)
    confere(pag.evaluate(JS_ALFA) == 0, "limpar apaga tudo")
    botao(pag, "#ed-desfazer", toque)
    confere(pag.evaluate(JS_ALFA) > 0, "desfazer traz de volta depois de limpar")
    botao(pag, "#ed-limpar", toque)
    botao(pag, '.cor[data-cor="#f6c945"]', toque)
    botao(pag, '[data-ferr="balde"]', toque)
    t0 = time.time()
    ator.toca(500, 735)
    pag.wait_for_timeout(150)
    dur = time.time() - t0
    px_barriga = pag.evaluate(JS_PIXEL, [512, 752])
    px_fundo = pag.evaluate(JS_PIXEL, [30, 30])
    px_cabeca = pag.evaluate(JS_PIXEL, [512, 360])
    n_fill = pag.evaluate(JS_ALFA)
    confere(px_barriga[:3] == [246, 201, 69] and px_barriga[3] == 255, f"balde pinta a barriga na cor escolhida {px_barriga}")
    confere(px_fundo[3] == 0 and px_cabeca[3] == 0, "balde não vaza para o fundo nem para a cabeça")
    confere(30000 < n_fill < 400000, f"área pintada razoável ({n_fill} pixels)")
    print(f"      balde levou ~{int(dur * 1000)} ms (incluindo a espera)")
    # tocar de novo com outra cor troca a cor da mesma região
    botao(pag, '.cor[data-cor="#5aaee8"]', toque)
    botao(pag, '[data-ferr="balde"]', toque)
    ator.toca(500, 735)
    px2 = pag.evaluate(JS_PIXEL, [512, 752])
    confere(px2[:3] == [90, 174, 232], f"balde troca a cor da região {px2}")
    # caiu em cima da linha: procura vizinho livre
    botao(pag, '.cor[data-cor="#4caf6a"]', toque)
    botao(pag, '[data-ferr="balde"]', toque)
    ator.toca(500, 395)  # cabeça
    confere(pag.evaluate(JS_PIXEL, [512, 405])[3] == 255, "balde pinta a cabeça")

    # pintar por fora das linhas com o pincel fica por baixo do contorno
    pag.wait_for_timeout(200)
    pag.screenshot(path=str(CAPTURAS / f"{nome}-editor-pintado.png"))

    # ---- salvar ----
    with pag.expect_download(timeout=8000) as dl:
        botao(pag, "#ed-salvar", toque)
    arq = dl.value
    confere(arq.suggested_filename == "desenho-trex-0.png", f"nome do arquivo ({arq.suggested_filename})")
    dados = Path(arq.path()).read_bytes()
    confere(dados[:8] == b"\x89PNG\r\n\x1a\n", "arquivo é PNG")
    larg, alt = struct.unpack(">II", dados[16:24])
    confere((larg, alt) == (1024, 1024), f"PNG com 1024x1024 ({larg}x{alt})")
    confere(pag.locator("#ed-aviso").is_visible(), "aviso 'salvo' aparece")

    # ---- voltar para a galeria e retomar pelo menu ----
    botao(pag, "#ed-galeria", toque)
    pag.wait_for_timeout(300)
    confere(pag.locator("#col-galeria").is_visible(), "botão da galeria volta para os desenhos")
    botao(pag, '.aba[data-cat="gatinhos"]', toque)
    pag.wait_for_timeout(300)
    botao(pag, '.tile[data-id="gato1-3"]', toque)
    pag.wait_for_function("window.Jogos.colorir._estado.pronto === true", timeout=8000)
    confere(pag.evaluate(JS_ALFA) == 0, "novo desenho abre em branco")
    botao(pag, '#col-editor [data-ir="menu"]', toque)
    pag.wait_for_timeout(400)
    confere(pag.locator("#tela-menu").is_visible(), "casinha volta para o menu")
    botao(pag, ".cartao-colorir", toque)
    pag.wait_for_timeout(400)
    confere(pag.locator("#col-editor").is_visible(), "ao voltar em Colorir, retoma o desenho")

    confere(not erros, f"sem erros no console ({erros})")
    ctx.close()
    nav.close()


def checar_catalogo(p, base):
    print("\n== catálogo ==")
    nav = p.chromium.launch()
    pag = nav.new_page()
    erros = []
    pag.on("pageerror", lambda e: erros.append(str(e)))
    pag.goto(base)
    pag.wait_for_load_state("networkidle")
    r = pag.evaluate(
        """() => {
          const t = Desenhos.todos();
          const ids = new Set(t.map(d => d.id));
          const porCat = {};
          t.forEach(d => porCat[d.cat] = (porCat[d.cat] || 0) + 1);
          const svgs = new Set(t.map(d => Desenhos.svgTexto(d, '#000')));
          return { total: t.length, unicos: ids.size, svgsUnicos: svgs.size, porCat, bases: Desenhos.bases().length };
        }"""
    )
    confere(r["bases"] == 56, f"56 bases desenhadas ({r['bases']})")
    confere(r["total"] == 560 and r["unicos"] == 560, f"560 desenhos com ids únicos ({r['total']}/{r['unicos']})")
    confere(r["svgsUnicos"] == 560, f"560 imagens diferentes entre si ({r['svgsUnicos']})")
    print("      por categoria:", r["porCat"])
    confere(not erros, f"catálogo sem erros ({erros})")
    nav.close()


def checar_vazamento(p, base):
    """Para cada desenho: confere que há várias regiões e que o fundo não engoliu o personagem."""
    print("\n== vazamento do balde (todos os 560) ==")
    nav = p.chromium.launch()
    pag = nav.new_page()
    pag.goto(base)
    pag.wait_for_load_state("networkidle")
    res = pag.evaluate(
        """async () => {
          const N = 256, ruins = [];
          const cv = document.createElement('canvas'); cv.width = cv.height = N;
          const cx = cv.getContext('2d', { willReadFrequently: true });
          const todos = Desenhos.todos();
          for (const d of todos) {
            const img = new Image();
            await new Promise(ok => { img.onload = ok; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(Desenhos.svgTexto(d, '#000')); });
            cx.fillStyle = '#fff'; cx.fillRect(0, 0, N, N); cx.drawImage(img, 0, 0, N, N);
            const px = cx.getImageData(0, 0, N, N).data;
            const bar = new Uint8Array(N * N);
            for (let i = 0; i < N * N; i++) bar[i] = (255 - px[i * 4]) >= 200 ? 1 : 0;
            const lab = new Int32Array(N * N); let n = 0, maior = 0, minimas = 0, bg = 0;
            const pilha = [];
            for (let s = 0; s < N * N; s++) {
              if (bar[s] || lab[s]) continue;
              n++; let tam = 0; pilha.push(s); lab[s] = n;
              while (pilha.length) {
                const q = pilha.pop(); tam++;
                const x = q % N, y = (q / N) | 0;
                if (x > 0 && !bar[q - 1] && !lab[q - 1]) { lab[q - 1] = n; pilha.push(q - 1); }
                if (x < N - 1 && !bar[q + 1] && !lab[q + 1]) { lab[q + 1] = n; pilha.push(q + 1); }
                if (y > 0 && !bar[q - N] && !lab[q - N]) { lab[q - N] = n; pilha.push(q - N); }
                if (y < N - 1 && !bar[q + N] && !lab[q + N]) { lab[q + N] = n; pilha.push(q + N); }
              }
              if (tam > maior) maior = tam;
              if (tam < 12) minimas++;
            }
            const frac = maior / (N * N);
            if (frac > 0.9 || n < 5) ruins.push(d.id + ' fundo=' + frac.toFixed(2) + ' regioes=' + n);
          }
          return ruins;
        }"""
    )
    confere(not res, f"nenhum desenho com a tinta vazando ({len(res)} suspeitos: {res[:12]})")
    nav.close()


def main():
    porta = porta_livre()
    srv = subprocess.Popen([sys.executable, str(RAIZ / "tools" / "servir.py"), str(porta)])
    time.sleep(1)
    base = f"http://127.0.0.1:{porta}/"
    try:
        with sync_playwright() as p:
            checar_catalogo(p, base)
            checar_vazamento(p, base)
            testar(p, base, "celular-paisagem", **p.devices["Pixel 7 landscape"])
            testar(p, base, "celular-retrato", **p.devices["Pixel 7"])
            testar(p, base, "tablet-android", **p.devices["Galaxy Tab S4 landscape"])
            testar(p, base, "pc", viewport={"width": 1366, "height": 768})
    finally:
        srv.terminate()
    print("\n" + ("TUDO CERTO" if not falhas else f"{len(falhas)} FALHA(S)"))
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main()
