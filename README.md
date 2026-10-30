# Joguinhos

Dois jogos calminhos para crianças de 5 e 6 anos, para celular, tablet Android e PC:

- **Colorir**: galeria de desenhos de contorno para pintar e salvar como imagem.
- **Desviar**: corrida em 3 pistas, com gestos de dedo.

HTML5 Canvas e JavaScript puro, funciona offline (PWA). Sem coleta de dados e sem conta.

> README provisório (Fase 2). A versão final vem na última fase.

## Colorir (pronto)

- 500 desenhos em 6 categorias (dinossauros, gatinhos, cachorrinhos, heróis, bichinhos e natureza).
- São 50 bases desenhadas em código (`js/desenhos/`) e 9 variações de cada (rosto, acessório e cenário).
- Ferramentas: lápis, pincel, borracha e balde de tinta, com 3 tamanhos, 16 cores e seletor de cor livre.
- Desfazer, refazer, limpar e salvar como PNG 1024x1024 para imprimir.
- Duas camadas: a tinta fica por baixo e o contorno por cima.

Para conferir os desenhos a olho: `.venv\Scripts\python.exe toolsmostras.py saida.png "cat=dinos&v=0,3&col=3"`.

## Testar no computador

```powershell
cd "D:\Jogos Infantis para Filhos"
.\.venv\Scripts\python.exe tools\servir.py        # abre em http://127.0.0.1:8000
.\.venv\Scripts\python.exe tests\test_fase1.py    # testes com Playwright
```

Preparar o ambiente do zero:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install playwright
.\.venv\Scripts\python.exe -m playwright install chromium
```
