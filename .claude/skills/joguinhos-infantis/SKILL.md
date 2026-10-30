---
name: joguinhos-infantis
description: Guia do projeto Joguinhos (PWA com os jogos Colorir e Desviar para crianças de 5 e 6 anos, HTML5 Canvas e JavaScript puro). Use SEMPRE que for alterar, testar, corrigir, publicar ou ampliar este projeto - adicionar desenhos ou personagens, ajustar a dificuldade do Desviar, mexer no editor de pintura, no service worker ou no GitHub Pages, ou rodar os testes com Playwright.
---

# Joguinhos: guia do projeto

Projeto **particular** (não é da Sport Labs): dois jogos calminhos para crianças de 5 e 6 anos, para celular e tablet Android e PC. Roda no navegador, funciona offline (PWA) e é publicado no GitHub Pages. Repositório pode ser público: **nunca colocar dados pessoais, de crianças ou da clínica no código, nos commits ou nos desenhos.**

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
| `js/desenhos/motor.js` | formas, rosto, acessórios, cenários e as 9 variações por base |
| `js/desenhos/*.js` | as 50 bases por categoria (dinos 9, gatos 7, cães 7, heróis 6, bichinhos 12, natureza 9) |
| `sw.js` | rede primeiro, cache de reserva; lista `ARQUIVOS` e `VERSAO` |
| `tools/` | `servir.py` (servidor com threads), `amostras.py` (folha de desenhos), `gerar_icones.py` |
| `tests/` | `test_fase1.py` (menu/offline), `test_fase2.py` (Colorir), `test_fase3.py` (Desviar) |

## Rotina de toda alteração
1. Editar o código.
2. Se mexeu em arquivos do app: **aumentar `VERSAO` em `sw.js`** e, se criou arquivo novo, incluí-lo em `ARQUIVOS`. Se criou script novo, incluí-lo em `index.html`.
3. Rodar os testes (venv do projeto): `.\.venv\Scripts\python.exe tests\test_faseN.py`. Rodar os três quando mudar algo compartilhado (CSS base, `app.js`, `sw.js`).
4. Olhar as capturas em `tests/capturas/` (pasta ignorada pelo Git).
5. Commitar em português. O dono faz o `git push`.

Ambiente: `python -m venv .venv`, depois `pip install playwright` e `playwright install chromium`. Para o shell: no Git Bash, evite `python - <<EOF` com muitas aspas e barras invertidas; grave um `.py` e rode. Barra invertida em strings pode virar caractere de controle (`\a`, `\v`).

## Adicionar um desenho (base nova)
- Em `js/desenhos/<categoria>.js`: `Desenhos.add({ id, cat, nome, cara:[x,y,escala], cabeca:[x,y,raio], corpo(){...} })`.
- Tela de 1000x1000. O que fica na frente esconde o traço de trás (formas com preenchimento branco).
- `cara` é onde o motor desenha olhos, boca e bochechas (olhos em `y`, nariz em `y+10k`, boca em `y+24k`; `k` = escala). `cabeca` é onde chapéus, laço e óculos se apoiam. `pescoco:[x,y,escala]` opcional para gravata e cachecol. `semChapeu:true` se já usa chapéu; `semBoca:true` se não tem boca (coruja).
- **Todo contorno precisa ser fechado**, senão a tinta do balde vaza. O teste de vazamento do `test_fase2.py` cobre todos os desenhos.
- Cada base gera 10 desenhos; o catálogo tem de fechar em 10 por base (hoje 50 bases e 500). Se mudar o número de bases, ajustar as contas dos testes e do README.
- Conferir a olho: `.\.venv\Scripts\python.exe tools\amostras.py saida.png "cat=dinos&v=0,3&col=3"` (ou `"ids=trex-0,trex-4&col=2"`) e abrir a imagem.
- Personagens **originais**: inspirados em estilos, nunca cópias de marcas conhecidas.

## Ajustar o Desviar
Constantes no começo de `js/desviar.js`: `VEL_INICIAL`, `VEL_MAXIMA`, `VEL_SOBE`, `ENTRE_LINHAS_INICIO/FIM`, `INVULNERAVEL`, `VIDAS`. Obstáculos: pedra (pular/desviar), alta (agachar), bloco (só desviar), `baixaTodas` (pular), `altaTodas` (agachar). A geração garante que nenhuma linha fecha as 3 pistas. Para os testes há ganchos em `Jogos.desviar._teste` (`congelar`, `passo`, `itemNovo`, `estrelaNova`, `limpar`).

## Pegadinhas conhecidas
- **Cache do aparelho:** versões antigas do `sw.js` serviam o cache primeiro. Quem já tinha o app precisa recarregar uma ou duas vezes. Hoje o `sw.js` busca a rede primeiro (com `cache: 'no-cache'`, porque o GitHub Pages guarda 10 minutos).
- **Simulador de toque do Chromium:** depois de um arrasto por CDP (`Input.dispatchTouchEvent`), o primeiro toque seguinte é engolido. Os testes dão um toque descartável no canto (2,2) depois de cada arrasto.
- `[hidden]` precisa de `display:none !important` (regras como `display:grid` vencem o atributo).
- `padding` em `%` conta sobre a largura do contêiner do botão, não do botão (flex/grid). Em linha de botões, usar padding fixo.
- O servidor de teste precisa ser com threads (`ThreadingHTTPServer`); o de uma conexão só recusa pedidos do navegador.
- No editor o tamanho dos botões é limitado pela tela (celular deitado: cerca de 41px). No menu e no Desviar os botões têm 88px ou mais.

## Publicação (GitHub Pages)
Repositório público, `Settings → Pages → Deploy from a branch → main / (root)`. Funciona em subpasta porque todos os caminhos são relativos. Depois de cada `git push` o site atualiza em 1 a 2 minutos. Conferir de fora: abrir o site em um navegador limpo (Playwright serve) e testar Colorir e Desviar.
