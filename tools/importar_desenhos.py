"""Importa desenhos prontos (PNG, JPG ou WEBP, preto no branco) para a galeria do Colorir.

Como usar:
  1. Coloque as imagens em desenhos-novos/<categoria>/   (categorias: dinos, gatinhos, cachorrinhos,
     herois, unicornios, bichinhos, natureza, bobbie)
  2. .venv\\Scripts\\python.exe tools\\importar_desenhos.py
  3. Rode os testes, abra no navegador, commite e faça o git push.

O que o script faz com cada imagem: tira as margens brancas, centraliza num quadrado de 1024x1024,
deixa o traço bem preto e o fundo bem branco (assim o balde e o "pintar dentro das linhas" funcionam),
cria a miniatura da galeria, atualiza desenhos/lista.js e aumenta a VERSAO do sw.js
(para os aparelhos baixarem os desenhos novos).
"""
import argparse
import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path

from PIL import Image

CATEGORIAS = ["dinos", "gatinhos", "cachorrinhos", "herois", "unicornios", "bichinhos", "natureza", "bobbie"]
LADO = 1024
MARGEM = 36
MINI = 240
EXT = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}


def slug(texto):
    t = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-") or "desenho"


def abrir_em_cinza(caminho):
    img = Image.open(caminho)
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        img = img.convert("RGBA")
        fundo = Image.new("RGBA", img.size, (255, 255, 255, 255))
        fundo.alpha_composite(img)
        img = fundo
    return img.convert("L")


def curva(img):
    """Traço vira preto de verdade e o papel vira branco de verdade (suave nas bordas)."""
    tabela = [max(0, min(255, int((v - 90) * 255 / 100))) for v in range(256)]
    return img.point(tabela)


def preparar(caminho, aparar, engrossar):
    img = abrir_em_cinza(caminho)
    w, h = img.size
    t, b, e, d = aparar
    img = img.crop((int(w * e), int(h * t), int(w * (1 - d)), int(h * (1 - b))))
    escuro = img.point(lambda v: 255 if v < 170 else 0)
    caixa = escuro.getbbox()
    if not caixa:
        return None
    x0, y0, x1, y1 = caixa
    folga = 8
    img = img.crop((max(0, x0 - folga), max(0, y0 - folga), min(img.width, x1 + folga), min(img.height, y1 + folga)))
    alvo = LADO - 2 * MARGEM
    k = min(alvo / img.width, alvo / img.height)
    img = img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS)
    img = curva(img)
    if engrossar:
        from PIL import ImageFilter
        img = img.filter(ImageFilter.MinFilter(3))
    tela = Image.new("L", (LADO, LADO), 255)
    tela.paste(img, ((LADO - img.width) // 2, (LADO - img.height) // 2))
    return tela


def atualizar_lista(raiz):
    pasta = raiz / "desenhos"
    itens = []
    for cat in CATEGORIAS:
        for arq in sorted((pasta / cat).glob("*.png")) if (pasta / cat).is_dir() else []:
            if arq.stem.endswith("-m"):
                continue
            mini = arq.with_name(arq.stem + "-m.png")
            if not mini.exists():
                continue
            itens.append({"id": arq.stem, "cat": cat, "arq": f"desenhos/{cat}/{arq.name}", "mini": f"desenhos/{cat}/{mini.name}"})
    texto = ("/* Gerado por tools/importar_desenhos.py: não edite à mão. */\n"
             "var DESENHOS_IMAGENS = " + json.dumps(itens, ensure_ascii=False, indent=1) + ";\n")
    (pasta / "lista.js").write_text(texto, encoding="utf-8")
    return itens


def subir_versao(raiz):
    sw = raiz / "sw.js"
    if not sw.exists():
        return None
    s = sw.read_text(encoding="utf-8")
    m = re.search(r"joguinhos-v(\d+)", s)
    if not m:
        return None
    nova = f"joguinhos-v{int(m.group(1)) + 1}"
    sw.write_text(s.replace(m.group(0), nova, 1), encoding="utf-8")
    return nova


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--raiz", default=str(Path(__file__).resolve().parent.parent), help="pasta do projeto")
    ap.add_argument("--origem", default=None, help="pasta com as imagens (padrão: desenhos-novos dentro do projeto)")
    ap.add_argument("--aparar", default="0,0,0,0", help="fração a cortar antes de tudo: topo,base,esquerda,direita (ex.: 0.06,0,0,0 tira marca d'água de cima)")
    ap.add_argument("--engrossar", action="store_true", help="engrossa o traço em 1 pixel (fecha furinhos)")
    ap.add_argument("--sem-versao", action="store_true", help="não mexe na VERSAO do sw.js")
    a = ap.parse_args()

    raiz = Path(a.raiz)
    origem = Path(a.origem) if a.origem else raiz / "desenhos-novos"
    aparar = tuple(float(x) for x in a.aparar.split(","))
    if len(aparar) != 4:
        sys.exit("--aparar precisa de 4 números")
    if not origem.is_dir():
        sys.exit(f"Não achei a pasta {origem}. Crie-a e coloque as imagens em subpastas por categoria: {', '.join(CATEGORIAS)}")

    novos = 0
    for cat in CATEGORIAS:
        pasta_cat = origem / cat
        if not pasta_cat.is_dir():
            continue
        saida = raiz / "desenhos" / cat
        saida.mkdir(parents=True, exist_ok=True)
        for arq in sorted(pasta_cat.iterdir()):
            if arq.suffix.lower() not in EXT:
                continue
            tela = preparar(arq, aparar, a.engrossar)
            if tela is None:
                print(f"  pulei {arq.name}: não achei traço escuro nessa imagem")
                continue
            sufixo = hashlib.sha1(arq.read_bytes()).hexdigest()[:6]
            nome = f"{slug(arq.stem)[:40]}-{sufixo}"
            tela.save(saida / f"{nome}.png", optimize=True)
            tela.resize((MINI, MINI), Image.LANCZOS).save(saida / f"{nome}-m.png", optimize=True)
            novos += 1
            print(f"  {cat}/{arq.name} -> desenhos/{cat}/{nome}.png")

    itens = atualizar_lista(raiz)
    versao = None if a.sem_versao or not novos else subir_versao(raiz)
    por_cat = {c: sum(1 for i in itens if i["cat"] == c) for c in CATEGORIAS}
    print(f"\nImportados agora: {novos}. Na galeria: {len(itens)} desenhos de imagem ({por_cat}).")
    if versao:
        print(f"sw.js agora está na versão {versao}.")


if __name__ == "__main__":
    main()
