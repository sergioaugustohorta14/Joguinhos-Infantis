---
name: joguinhos-infantis
description: Guia do projeto Joguinhos (PWA com os jogos Colorir e Desviar para crianças de 5 e 6 anos, HTML5 Canvas e JavaScript puro). Use SEMPRE que for alterar, testar, corrigir, publicar ou ampliar este projeto - adicionar desenhos ou personagens, ajustar a dificuldade do Desviar, mexer no editor de pintura, no service worker ou no GitHub Pages, ou rodar os testes com Playwright.
---

# Joguinhos: guia do projeto

Projeto **particular** (não é da Sport Labs): quatro jogos (Colorir, Desviar, Bolinhas e Basquete) para crianças de 5 e 6 anos, para celular e tablet Android e PC. Roda no navegador, funciona offline (PWA) e é publicado no GitHub Pages. Repositório pode ser público: **nunca colocar dados pessoais, de crianças ou da clínica no código, nos commits ou nos desenhos.**

## Regras de trabalho com o dono do projeto
- Sempre em **português do Brasil**, inclusive comentários, mensagens de commit e textos do jogo.
- **Perguntar antes de iniciar cada fase** de um trabalho maior.
- **Commitar sem perguntar**; o `git push` é sempre do dono do projeto (ele roda no PowerShell dele). Identidade do Git neutra, só neste repositório ("Joguinhos").
- Testar com **Playwright** (simular toque, tirar captura de tela e olhar a imagem). Não dar uma tela como pronta sem olhar a captura.
- Botões **grandes para toque**; baixo estímulo visual (sem flashes, sem tremida, animações lentas, cores suaves); quase sem texto.
- Sem coleta de dados. Só `localStorage` para recorde, som mudo e "pintar dentro das linhas", sempre dentro de `try/catch`.
- Tecnologia fixa: HTML5 Canvas, JavaScript puro (scripts clássicos, sem módulos nem bibliotecas), Pointer Events, `touch-action: none`, **sem Streamlit**.

## Mapa do código
| Arquivo | Para quê |
|---|---|
| `index.html` | as três telas: menu, Colorir, Desviar |
| `js/app.js` | navegação por `#/colorir`, `#/desviar`; botão de som; registra o `sw.js`; recarrega sozinho ao atualizar (só no menu) |
| `js/som.js` | sons gerados com Web Audio (`Som.tocar('nome')`) |
| `js/icones.js` | ícones SVG dos botões do editor |
| `js/colorir.js` | galeria + editor: duas camadas, histórico por retângulo, balde, "pintar dentro das linhas", salvar PNG |
| `js/desviar.js` | corrida em perspectiva; constantes de dificuldade no topo |
| `js/basquete.js` | arremessos de basquete: física, chuá/fogo/elétrico, estrelas, desafios do dia, vestiário, conquistas |
| `js/bolinhas.js` | jogo da esteira: geração dos níveis, simulação, desenho; constantes no topo |
| `js/desenhos/motor.js` | formas, rosto, acessórios, cenários e as 9 variações por base |
| `js/desenhos/*.js` | as 56 bases por categoria (dinos 9, gatos 7, cães 7, heróis 6, unicórnios 6, bichinhos 12, natureza 9) |
| `sw.js` | rede primeiro, cache de reserva; lista `ARQUIVOS` e `VERSAO` |
| `tools/` | `servir.py` (servidor com threads), `amostras.py` (folha de desenhos), `gerar_icones.py` |
| `tests/` | `test_fase1.py` (menu/offline), `test_fase2.py` (Colorir), `test_fase3.py` (Desviar), `test_bolinhas.py` (Bolinhas), `test_basquete.py` (Basquete) |

## Rotina de toda alteração
1. Editar o código.
2. Se mexeu em arquivos do app: **aumentar `VERSAO` em `sw.js`** e, se criou arquivo novo, incluí-lo em `ARQUIVOS`. Se criou script novo, incluí-lo em `index.html`.
3. Rodar os testes (venv do projeto): `.\.venv\Scripts\python.exe tests\test_faseN.py`. Rodar os três quando mudar algo compartilhado (CSS base, `app.js`, `sw.js`).
4. Olhar as capturas em `tests/capturas/` (pasta ignorada pelo Git).
5. Commitar em português. O dono faz o `git push`.

Ambiente: `python -m venv .venv`, depois `pip install playwright` e `playwright install chromium`. Para o shell: no Git Bash, evite `python - <<EOF` com muitas aspas e barras invertidas; grave um `.py` e rode. Barra invertida em strings pode virar caractere de controle (`\a`, `\v`).

## Desenhos de imagem (qualidade de livro de colorir)
- Os desenhos em código são simples; os bons vêm de imagens. `tools/importar_desenhos.py` lê `desenhos-novos/<categoria>/` (ignorada pelo Git), corta margens, centraliza em 1024x1024, deixa traço preto e papel branco, cria miniatura `-m.png`, regrava `desenhos/lista.js` e **sobe a VERSAO do `sw.js`**. Categorias: dinos, gatinhos, cachorrinhos, herois, unicornios, bichinhos, natureza, bobbie (Bobbie Goods, só aparece se tiver desenho).
- No app: `motor.js` coloca os desenhos de imagem **antes** dos de código (`{id, cat, url, mini}`); `colorir.js` usa `d.mini` na galeria e `d.url` no editor (o contorno é extraído do mesmo jeito, `alfa = 255 - R`). O `sw.js` lê `desenhos/lista.js` com `importScripts` e guarda tudo para o modo sem internet.
- Teste: `tests/test_imagens.py` (cópia temporária do projeto, não suja a pasta). Imagens de terceiros (marca d'água, banco de imagens) **não** vão para o repositório público.
- O traço dos desenhos em código ficou fino (`SW0 = 6` em `motor.js`). O teste de vazamento do `test_fase2.py` roda em 512 px.

## Adicionar um desenho (base nova)
- Em `js/desenhos/<categoria>.js`: `Desenhos.add({ id, cat, nome, cara:[x,y,escala], cabeca:[x,y,raio], corpo(){...} })`.
- Tela de 1000x1000. O que fica na frente esconde o traço de trás (formas com preenchimento branco).
- `cara` é onde o motor desenha olhos, boca e bochechas (olhos em `y`, nariz em `y+10k`, boca em `y+24k`; `k` = escala). `cabeca` é onde chapéus, laço e óculos se apoiam. `pescoco:[x,y,escala]` opcional para gravata e cachecol. `semChapeu:true` se já usa chapéu; `semBoca:true` se não tem boca (coruja).
- **Todo contorno precisa ser fechado**, senão a tinta do balde vaza. O teste de vazamento do `test_fase2.py` cobre todos os desenhos.
- Cada base gera 10 desenhos; o catálogo tem de fechar em 10 por base (hoje 56 bases e 560). Se mudar o número de bases, ajustar as contas dos testes e do README.
- Conferir a olho: `.\.venv\Scripts\python.exe tools\amostras.py saida.png "cat=dinos&v=0,3&col=3"` (ou `"ids=trex-0,trex-4&col=2"`) e abrir a imagem.
- Personagens **originais**: inspirados em estilos, nunca cópias de marcas conhecidas.

## Ajustar o Desviar
Constantes no começo de `js/desviar.js`: `VEL_INICIAL`, `VEL_MAXIMA`, `VEL_SOBE`, `ENTRE_LINHAS_INICIO/FIM`, `INVULNERAVEL`, `VIDAS`. Obstáculos: pedra (pular/desviar), alta (agachar), bloco (só desviar), `baixaTodas` (pular), `altaTodas` (agachar). A geração garante que nenhuma linha fecha as 3 pistas. **Fases:** `FASE_TEMPO` (20 s), `FASE_TRANSICAO`, `FASE_BONUS` e a lista `TEMAS` (5 temas: cores do cenário misturadas devagar, tipos de cenário, forma e cor dos obstáculos, que ficam com o tema em que nasceram via `skin`). Para uma fase nova, acrescente um item em `TEMAS` (e, se precisar de forma nova, um `case` em `pedraDaFase`/`desenharCenario`). **Toque:** `TOQUE_SIMPLES` (toquinho: esquerda/direita/meio), `limiar()` (deslize curto), `FILA_PULO`; os testes desligam o toquinho com `_teste.toqueSimples(false)` antes de usar o toque descartável no canto (2,2), que senão viraria um toquinho. No Colorir, `PALMA` ignora toque largo (palma da mão) e o balde procura a região até 30 px do traço. Para os testes há ganchos em `Jogos.desviar._teste` (`congelar`, `passo`, `itemNovo`, `estrelaNova`, `limpar`).

## Ajustar o Basquete
- Inspirado em jogos de arremesso contra o relógio (nome e visual próprios, sem a marca de nenhum jogo). Constantes no topo de `js/basquete.js`: gravidade `G`, `K_PUXAR` (força), `PUXAR_MAX`, `ARO_LARG` (abertura do aro, generosa), `TEMPOS` (Contra o relógio 30 s; Por tempo 90 s), `FOGO_SEQ`, `ELETRICO_SEQ`, e de toque: `K_PUXAR`, `PUXAR_MIN_PX`, `ASSISTE_MIRA` (0 desliga a ajuda de mira), `ASSISTE_ALCANCE`, `PALMA_PX`.
- Mundo de 540 de largura (no máximo 640) escalado e centralizado; em tela larga o jogo fica numa coluna no meio. O placar é desenhado em pixels da tela.
- Pontos: cesta 1, chuá 2; vezes 2 no fogo e vezes 3 no elétrico. Tempo extra (só Contra o relógio): cesta +2 s, chuá +3 s, fogo +1, elétrico +2. Estrelas ao fim: cestas + chuás + 5 se bater o recorde; desafio do dia +20; conquista +25.
- A bola nova fica pronta 0,3 s depois do tiro; o aro novo só aparece quando nenhuma bola está no ar (não muda no meio do arremesso). `assistir()` empurra a velocidade do tiro para um tiro de arco alto que passa pelo centro do aro, só se o erro for pequeno; a mira pontilhada usa o mesmo valor. Toque largo (palma) não começa a mira. Depois de 15 pontos o aro passa a balançar um pouco.
- Dados salvos em `localStorage` (`joguinhos.basquete`): estrelas, recordes e 5 melhores, vestiário, conquistas, desafios do dia (sorteados pela data). Sem ranking online e sem anúncios, de propósito (nenhum dado sai do aparelho).
- Visual: tudo é desenhado no canvas (placar de LEDs, cartão de vidro de pontos, medidor de fogo que enche com a sequência, tabela de vidro, mira luminosa). Casinha em bolha de vidro e abas com ícones coloridos vêm do `css/basquete.css` e do `index.html`.
- Teste: `test_basquete.py` usa `_teste.mirar()` (velocidade que passa pelo centro do aro, com arco alto: arcos baixos batem no aro na subida), `lancar`, `avancar`.

## Ajustar o Bolinhas
- Inspirado em jogos do tipo "Marble Sort": blocos no quadro soltam 9 bolinhas numa esteira em oval; bandejas de 3 buracos em 3 ou 4 filas pegam as bolinhas da mesma cor que passam na frente delas.
- Tudo é desenhado num mundo de 720 de largura e escalado (`medir`). Constantes no topo de `js/bolinhas.js` (`TEMPO_VOLTA` da esteira, `TRAVA_SEG`, tamanhos).
- `criarNivel(n, tentativa)`: colunas, linhas, cores (2 + n/3, até 8), filas (3 até o nível 2, depois 4), tamanho da esteira `K` (28 caindo até 18) e chance de bandeja escondida ("?") crescem com o nível. As cores dos blocos seguem uma sequência sem repetir cor nos vizinhos (se repetir, uma bandeja fica esperando e trava a fila).
- `gerarNivel(n)` confere cada nível jogando sozinho (`jogarSozinho`, sem som e sem gravar nada); se não vencer, tenta a próxima variação. Isso garante que todo nível tem solução.
- Derrota: esteira cheia (ou sem blocos) e nenhuma bolinha serve para nenhuma bandeja da frente, por `TRAVA_SEG` segundos.
- Nível atual guardado em `localStorage` (`joguinhos.bolinhas.nivel`). Ganchos de teste em `Jogos.bolinhas._teste`.
- Em celular deitado e tablet o jogo fica pequeno (a tela é em pé, como o jogo de referência).

## Botão "voltar às opções" de cada jogo
- `.btn-opcoes` (em `style.css`): seta que leva às opções do próprio jogo, sem ir ao menu geral. Desviar (`#dv-opcoes`) volta à escolha do personagem; Bolinhas (`#bo-opcoes`) à escolha de nível (`#bo-niveis`: "Continuar" + grade dos níveis liberados; entrar no jogo já abre essa tela); Basquete (`#bk-opcoes`, embaixo à direita) ao menu de modos. Colorir já tem o seu (`#ed-galeria`, volta à galeria).
- Em pé fica embaixo da casinha; **deitado fica ao lado dela** e o placar (`.dv-hud`, `.bo-hud`) é deslocado, porque no Desviar a lateral esquerda da tela é zona de toque para jogar (um botão ali faria a criança sair da corrida sem querer). Cada jogo mostra o botão só durante a partida.
- Vencer um nível antigo no Bolinhas não faz perder o avanço (`gravarNivel(Math.max(...))`).

## Pegadinhas conhecidas
- **Cache do aparelho:** versões antigas do `sw.js` serviam o cache primeiro. Quem já tinha o app precisa recarregar uma ou duas vezes. Hoje o `sw.js` busca a rede primeiro (com `cache: 'no-cache'`, porque o GitHub Pages guarda 10 minutos).
- **Simulador de toque do Chromium:** depois de um arrasto por CDP (`Input.dispatchTouchEvent`), o primeiro toque seguinte é engolido. Os testes dão um toque descartável no canto (2,2) depois de cada arrasto.
- `[hidden]` precisa de `display:none !important` (regras como `display:grid` vencem o atributo).
- `padding` em `%` conta sobre a largura do contêiner do botão, não do botão (flex/grid). Em linha de botões, usar padding fixo.
- O servidor de teste precisa ser com threads (`ThreadingHTTPServer`); o de uma conexão só recusa pedidos do navegador.
- No editor o tamanho dos botões é limitado pela tela (celular deitado: cerca de 41px). No menu e no Desviar os botões têm 88px ou mais.

## Publicação (GitHub Pages)
Repositório público, `Settings → Pages → Deploy from a branch → main / (root)`. Funciona em subpasta porque todos os caminhos são relativos. Depois de cada `git push` o site atualiza em 1 a 2 minutos. Conferir de fora: abrir o site em um navegador limpo (Playwright serve) e testar Colorir e Desviar.
