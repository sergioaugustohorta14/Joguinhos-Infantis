# Doces Estelares (Match-3)

Jogo de combinar 3 ou mais doces iguais, em React + TypeScript + Tailwind CSS, com animações pelo Motion (o antigo Framer Motion). É o 5º jogo dos Joguinhos (cartão **Doces** no menu). Fica numa pasta própria porque, diferente dos outros jogos (JavaScript puro, sem compilação), este precisa ser compilado: o código fica aqui e a versão compilada vai para `../doces/`, que é o que o site publica.

Nome, doces e frases são próprios: o jogo é inspirado no gênero, sem usar marca, personagens ou textos de nenhum jogo existente.

## O que já funciona (etapa 1: tabuleiro, combinações e gravidade)
- **Tabuleiro 9x9** que começa sem nenhuma combinação pronta e sempre com pelo menos uma jogada possível.
- **Troca** arrastando o dedo (ou o mouse) para o vizinho, ou tocando num doce e depois no vizinho. Troca que não combina volta com uma mola e não gasta jogada.
- **Combinações**: 3, 4 e 5 em linha, e formatos em T e L.
- **Doces especiais**:
  - 4 em linha vira **listrado** (na horizontal limpa a coluna; na vertical, a linha).
  - T ou L vira **embalado**, que explode 3x3, cai e explode de novo.
  - 5 em linha vira **bomba colorida**, que trocada com um doce apaga todos daquela cor (duas bombas trocadas apagam tudo).
  - Um especial atingido por outro também dispara, em cadeia.
- **Gravidade e reposição**: os doces caem com duração proporcional à distância e quicam ao pousar; os novos entram por cima, em fila.
- **Cascata**: novas combinações depois da queda continuam sozinhas, com pontos multiplicados e as frases "Doce!", "Delícia!", "Divino!", "Açucarado!" e "Explosão de açúcar!".
- **Efeitos**: partículas da cor do doce, pontos que sobem, tremida da tela em explosões grandes e embaralhamento automático quando não sobra jogada.
- **Placar**: jogadas restantes, pontos e barra com 3 estrelas. Acabando as jogadas, aparece um fim simples com "Jogar de novo".

## Próximas etapas (ainda não feitas)
Bloqueadores (gelatina, alcaçuz, gaiolas, chaves), barra de ajudas (mãozinha, martelo, embaralhar, bomba), telas completas de vitória, derrota e pausa, níveis com metas, mapa de fases, vidas e sons.

## Como rodar
Requer o Node.js (instalado em `C:\Program Files\nodejs`). Se o terminal não achar o `npm`, feche e abra o VS Code de novo.

```powershell
cd "D:\Jogos Infantis para Filhos\doces-match3"
npm install          # só na primeira vez
npm run dev          # abre em http://localhost:5173 (atualiza sozinho ao salvar)
npm test             # testes da lógica (Vitest)
npm run build        # gera ../doces (o que o site publica), a lista do modo sem internet e sobe a VERSAO do ../sw.js
```

Teste no navegador (abre pelo site dos Joguinhos: cartão do menu, casinha, sem internet, toque de verdade, animações, especiais e fim de partida), depois do `npm run build`:

```powershell
..\.venv\Scripts\python.exe tests\test_navegador.py
```

Endereço com `?teste` liga ganchos de teste (`window.__doces`); com `&semente=7` o tabuleiro sai sempre igual.

## Estrutura
```
src/
  App.tsx                 estado da partida: pontos, jogadas, fim
  components/
    Board.tsx             tabuleiro: toque, sequência troca → limpeza → queda → cascata, efeitos
    Tile.tsx              um doce, com as animações de troca, queda, nascimento e estouro
    Candy.tsx             desenho dos doces em SVG (5 formas + especiais)
    Header.tsx            jogadas, pontos e barra de estrelas
  logic/                  funções puras, testadas em logic.test.ts
    matchDetector.ts      sequências, grupos (3/4/5/T/L), que especial nasce, jogada possível
    boardGenerator.ts     tabuleiro inicial sem combinação, gerador com semente, ids
    effects.ts            um passo da cascata: limpa, cria especiais, dispara efeitos em cadeia
    gravity.ts            queda, reposição pelo topo, embaralhar
  types/game.ts           Candy, Position, Grid, BoardState, LevelConfig, MatchGroup
scripts/pos-build.mjs     depois do build: lista os arquivos para o modo sem internet e sobe a versão do sw.js
tests/test_navegador.py   teste no navegador (Playwright)
```

## Ajustes rápidos
- Tempos entre as etapas: `T_TROCA`, `T_LIMPAR`, `T_QUEDA_*` no topo de `Board.tsx`.
- Velocidade e quique da queda: `transicaoY` em `Tile.tsx`.
- Pontos: dentro de `cascata` em `Board.tsx` (20 por doce, bônus por especial, vezes o nível da cascata).
- Nível (tamanho, jogadas, metas das estrelas): `NIVEL` em `App.tsx`.

## Leveza no celular (não desfazer sem medir)
Em 18/11/2026 o toque tinha um atraso perceptível. Medido com o processador 6x mais lento (perto de um celular simples): o doce levava 120 a 240 ms para começar a andar e 27% dos quadros saíam lentos; depois dos ajustes, 50 a 93 ms e 5%. O que fez diferença:
- `LazyMotion` com `domAnimation` (em `main.tsx`) e `m.div` no lugar de `motion.div`: sem o sistema de layout do Motion, que media todos os doces a cada mudança. Por isso nada de `layout`/`layoutId` (o `strict` acusa se alguém usar `motion.`).
- Sem `AnimatePresence` nos 81 doces: ele fazia todos se redesenharem a cada mudança. Quem sai do tabuleiro vai para a camada de estouro (`Estouro` em `Tile.tsx`, ligada pelo `setGrid` do `Board.tsx`).
- Casas e doces dentro de `useMemo`, e `Board` com `memo`: o placar mudar não redesenha o tabuleiro.
- Partículas, seleção e pulsos em CSS puro (`index.css`), fora do JavaScript.
- Cada doce com `will-change: transform` (andar não repinta a sombra do desenho); o filtro de brilho só no doce armado; sem `backdrop-blur` no tabuleiro e no placar (as estrelas piscando atrás obrigavam a refazer o desfoque o tempo todo); barra de estrelas por `clip-path`, não por `width`.
