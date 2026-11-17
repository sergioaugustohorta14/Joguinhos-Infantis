// Geração do tabuleiro: começa sem nenhuma combinação pronta e sempre com pelo menos uma jogada possível.
import type { Candy, CandyColor, Grid } from '../types/game';
import { hasPossibleMove } from './matchDetector';

export type Rng = () => number;

/** Gerador de números com semente (o mesmo tabuleiro sai igual em testes). */
export function seeded(seed: number): Rng {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let proximoId = 1;
/** Cada doce criado ganha um id novo; o React usa o id para animar o mesmo doce de um lugar para outro. */
export function newId(): number {
  return proximoId++;
}

export function randomCandy(colors: readonly CandyColor[], rng: Rng): Candy {
  return { id: newId(), color: colors[Math.floor(rng() * colors.length)] };
}

/** Preenche linha por linha, escolhendo uma cor que não feche 3 iguais com os dois vizinhos já colocados. */
function tentarCriar(rows: number, cols: number, colors: readonly CandyColor[], rng: Rng): Grid {
  const g: Grid = [];
  for (let r = 0; r < rows; r++) {
    const linha: Grid[number] = [];
    for (let c = 0; c < cols; c++) {
      const proibidas = new Set<CandyColor>();
      if (c >= 2 && linha[c - 1]?.color && linha[c - 1]!.color === linha[c - 2]?.color) proibidas.add(linha[c - 1]!.color!);
      if (r >= 2 && g[r - 1][c]?.color && g[r - 1][c]!.color === g[r - 2][c]?.color) proibidas.add(g[r - 1][c]!.color!);
      const opcoes = colors.filter((cor) => !proibidas.has(cor));
      linha.push({ id: newId(), color: opcoes[Math.floor(rng() * opcoes.length)] });
    }
    g.push(linha);
  }
  return g;
}

export function createBoard(rows: number, cols: number, colors: readonly CandyColor[], rng: Rng = Math.random): Grid {
  for (let tentativa = 0; tentativa < 200; tentativa++) {
    const g = tentarCriar(rows, cols, colors, rng);
    if (hasPossibleMove(g)) return g;
  }
  throw new Error('Não consegui gerar um tabuleiro com jogada possível');
}
