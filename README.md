# Joguinhos

Dois jogos calminhos para crianças de 5 e 6 anos, feitos para celular, tablet Android e computador.

- **Colorir**: 560 desenhos de contorno para pintar, com lápis, pincel, borracha e balde de tinta.
- **Desviar**: corrida em 3 pistas em que a criança desvia, pula e agacha com o dedo.

Funciona sem internet depois da primeira abertura (PWA). **Não coleta nenhum dado**: sem conta, sem anúncios, sem rastreadores. Só guarda no próprio aparelho o recorde, a preferência de som e a opção de pintar dentro das linhas.

Feito com HTML, CSS e JavaScript puros, sem bibliotecas e sem etapa de compilação.

## Como jogar

### Colorir
1. Escolha o tipo de desenho no alto (dinossauros, gatinhos, cachorrinhos, heróis, unicórnios, bichinhos ou natureza) e toque no desenho.
2. Escolha a ferramenta, o tamanho e a cor, e pinte com o dedo.
3. O botão tracejado liga e desliga o "pintar só dentro das linhas". Ele vem ligado: o traço fica na região onde o dedo encostou primeiro.
4. Desfazer, refazer, limpar tudo e salvar (vira um PNG de 1024x1024 na pasta Downloads, bom para imprimir).

### Desviar
1. Toque no Turbo (ouriço) ou no Bolinha (cãozinho bombeiro).
2. **Deslize o dedo**: para os lados troca de pista, para cima pula, para baixo agacha. No computador: setas do teclado ou A, D, W, S.
3. Desvie dos obstáculos e pegue as estrelas. São 3 vidas, e o recorde fica guardado no aparelho.

| Obstáculo | O que fazer |
|---|---|
| Pedra | pular ou trocar de pista |
| Barra alta | agachar ou trocar de pista |
| Bloco de madeira | trocar de pista |
| Cerquinha baixa nas 3 pistas | pular |
| Barra alta nas 3 pistas | agachar |

Nenhuma fileira de obstáculos fecha todas as saídas.

## Instalar no Android
1. Abra o endereço do jogo no Chrome, com internet.
2. Toque em Colorir e abra um desenho, para o aparelho guardar tudo.
3. Menu do Chrome (três pontinhos), depois **Adicionar à tela inicial** (ou "Instalar app").
4. Pronto: o ícone abre em tela cheia e funciona sem internet.

## Desenvolvimento

Requer Python 3 (só para servir os arquivos e rodar os testes).

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install playwright
.\.venv\Scripts\python.exe -m playwright install chromium

.\.venv\Scripts\python.exe tools\servir.py          # abre em http://127.0.0.1:8000
```

### Testes (Playwright, com toque simulado)

```powershell
.\.venv\Scripts\python.exe tests\test_fase1.py      # menu, navegação, som e offline
.\.venv\Scripts\python.exe tests\test_fase2.py      # Colorir: 560 desenhos, balde sem vazar, desfazer, salvar (uns 2 min)
.\.venv\Scripts\python.exe tests\test_fase3.py      # Desviar: gestos, obstáculos, vidas, recorde, fim de jogo
```

Os testes rodam em celular em pé e deitado, tablet Android e PC, e guardam capturas de tela em `tests/capturas/` (pasta não versionada).

### Estrutura

```
index.html            as três telas (menu, Colorir, Desviar)
manifest.webmanifest  dados do app instalável
sw.js                 funcionamento sem internet (rede primeiro, cache de reserva)
css/                  style.css (base e menu), colorir.css, desviar.css
js/app.js             navegação entre telas, botão de som, registro do sw.js
js/som.js             sons gerados no código (Web Audio), sem arquivos de áudio
js/icones.js          ícones dos botões
js/colorir.js         galeria e editor de pintura
js/desviar.js         jogo de corrida
js/desenhos/          os 560 desenhos (56 bases + variações)
icons/                ícone do app
tools/                servidor local, gerador de ícones, folha de amostras dos desenhos
tests/                testes automáticos
```

### Como os desenhos funcionam
Cada uma das 56 bases (`js/desenhos/dinos.js`, `gatos.js`, `caes.js`, `herois.js`, `unicornios.js`, `bichinhos.js`, `natureza.js`) é um desenho em SVG feito em código, com contornos fechados. O motor (`motor.js`) cria 9 variações de cada uma, combinando expressão do rosto, acessório e cenário, sempre iguais em qualquer aparelho. No editor, o contorno vira uma camada que fica por cima da tinta, e o balde e o "pintar dentro das linhas" usam esse contorno como parede.

Para ver os desenhos a olho: `.\.venv\Scripts\python.exe tools\amostras.py saida.png "cat=dinos&v=0,3&col=3"`.

**Adicionar uma base nova:** crie um `Desenhos.add({...})` no arquivo da categoria, com `corpo()` (as formas), `cara` (`[x, y, escala]` do rosto) e `cabeca` (`[x, y, raio]`, onde os acessórios se apoiam). Todo contorno deve ser fechado, senão a tinta do balde vaza. O teste `test_fase2.py` confere o vazamento de todos os desenhos. O total de desenhos é sempre 10 por base.

### Ajustar a dificuldade do Desviar
No começo de `js/desviar.js` há um bloco com os números: velocidade inicial e máxima, quanto ela sobe por segundo, o tempo entre obstáculos, as vidas e o tempo sem perder vida depois de bater.

## Publicar no GitHub Pages
1. Envie o código para um repositório público (`git push`).
2. No repositório: **Settings → Pages → Deploy from a branch → main / (root) → Save**.
3. **A cada entrega, aumente o número em `VERSAO` no `sw.js`** (por exemplo `joguinhos-v5` para `joguinhos-v6`) e inclua arquivos novos na lista `ARQUIVOS`.

Todos os caminhos são relativos, então funciona em qualquer endereço (inclusive em subpasta, como o do GitHub Pages).

## Direitos e privacidade
Os desenhos e os personagens foram criados para este projeto. Os personagens são originais, apenas inspirados em estilos infantis conhecidos. Nenhuma informação de criança, conta ou localização é pedida ou guardada.
