# Joguinhos

Dois jogos calminhos para crianças de 5 e 6 anos, para celular, tablet Android e PC:

- **Colorir**: galeria de desenhos de contorno para pintar e salvar como imagem.
- **Desviar**: corrida em 3 pistas, com gestos de dedo.

HTML5 Canvas e JavaScript puro, funciona offline (PWA). Sem coleta de dados e sem conta.

> README provisório (Fase 3). A versão final vem na última fase.

## Colorir (pronto)

- 500 desenhos em 6 categorias (dinossauros, gatinhos, cachorrinhos, heróis, bichinhos e natureza).
- São 50 bases desenhadas em código (`js/desenhos/`) e 9 variações de cada (rosto, acessório e cenário).
- Ferramentas: lápis, pincel, borracha e balde de tinta, com 3 tamanhos, 16 cores e seletor de cor livre.
- Desfazer, refazer, limpar e salvar como PNG 1024x1024 para imprimir.
- Duas camadas: a tinta fica por baixo e o contorno por cima.
- Lápis e pincel pintam só dentro das linhas (a região onde o dedo encostou primeiro). Dá para desligar no botão tracejado.

## Desviar (pronto)

- Corrida em 3 pistas, vista por trás, com dois personagens para escolher: Turbo (ouriço) e Bolinha (cãozinho bombeiro).
- Gestos: deslizar para os lados troca de pista, para cima pula, para baixo agacha. No PC: setas ou A, D, W, S.
- Obstáculos: pedra (pular ou desviar), barra alta (agachar), bloco (só desviando) e cerquinhas que ocupam as 3 pistas (pular ou agachar). Nenhuma linha fecha todas as saídas.
- Estrelas dão pontos, são 3 vidas, e a velocidade cresce devagar até um teto. Depois de bater há um tempinho sem perder outra vida.
- Recorde guardado só no aparelho (sem perfis, sem coleta de dados). O fim de jogo é suave, sem sustos.
- Visual calmo: cores suaves, sem flashes e sem tremida de tela.

Para conferir os desenhos a olho: `.venv\Scripts\python.exe tools\amostras.py saida.png "cat=dinos&v=0,3&col=3"`.

## Testar no computador

```powershell
cd "D:\Jogos Infantis para Filhos"
.\.venv\Scripts\python.exe tools\servir.py        # abre em http://127.0.0.1:8000
.\.venv\Scripts\python.exe tests\test_fase1.py    # menu, navegação e offline
.\.venv\Scripts\python.exe tests\test_fase2.py    # Colorir (leva uns 2 minutos)
.\.venv\Scripts\python.exe tests\test_fase3.py    # Desviar
```

Preparar o ambiente do zero:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install playwright
.\.venv\Scripts\python.exe -m playwright install chromium
```
