// Gravidade e reposição: os doces caem para preencher os buracos e doces novos entram por cima.
import type { CandyColor, Grid } from '../types/game';
import { findRuns, hasPossibleMove } from './matchDetector';
import { randomCandy, type Rng } from './boardGenerator';

/** Movimento de um doce numa coluna (fromRow negativo = nasceu acima do tabuleiro). */
export interface Fall {
  id: number;
  col: number;
  fromRow: number;
  toRow: number;
}

/** Em cada coluna, os doces descem até encostar no de baixo, mantendo a ordem. */
export function applyGravity(g: Grid): { grid: Grid; falls: Fall[] } {
  const rows = g.length;
  const cols = g[0]?.length ?? 0;
  const out: Grid = Array.from({ length: rows }, () => Array<Grid[number][number]>(cols).fill(null));
  const falls: Fall[] = [];
  for (let c = 0; c < cols; c++) {
    let destino = rows - 1;
    for (let r = rows - 1; r >= 0; r--) {
      const doce = g[r][c];
      if (!doce) continue;
      out[destino][c] = doce;
      if (destino !== r) falls.push({ id: doce.id, col: c, fromRow: r, toRow: destino });
      destino--;
    }
  }
  return { grid: out, falls };
}

/**
 * Preenche os buracos do alto de cada coluna com doces novos.
 * Eles nascem empilhados logo acima do tabuleiro (fromRow -1, -2, ...) para cair juntos, em fila.
 */
export function refill(g: Grid, colors: readonly CandyColor[], rng: Rng): { grid: Grid; spawned: Fall[] } {
  const out = g.map((linha) => linha.slice());
  const spawned: Fall[] = [];
  const cols = g[0]?.length ?? 0;
  for (let c = 0; c < cols; c++) {
    let vazias = 0;
    while (vazias < g.length && !out[vazias][c]) vazias++;
    for (let r = 0; r < vazias; r++) {
      const doce = randomCandy(colors, rng);
      out[r][c] = doce;
      spawned.push({ id: doce.id, col: c, fromRow: r - vazias, toRow: r });
    }
  }
  return { grid: out, spawned };
}

/** Embaralha os mesmos doces (sem criar novos) até não haver combinação pronta e existir jogada. */
export function shuffleBoard(g: Grid, rng: Rng): Grid {
  const doces = g.flat().filter((d): d is NonNullable<typeof d> => d !== null);
  for (let tentativa = 0; tentativa < 300; tentativa++) {
    const sorteados = doces.slice();
    for (let i = sorteados.length - 1; i > 0; i--) {
      const k = Math.floor(rng() * (i + 1));
      [sorteados[i], sorteados[k]] = [sorteados[k], sorteados[i]];
    }
    let i = 0;
    const out = g.map((linha) => linha.map((cel) => (cel ? sorteados[i++] : null)));
    if (!findRuns(out).length && hasPossibleMove(out)) return out;
  }
  return g;
}
