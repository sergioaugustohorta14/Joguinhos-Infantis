// Detecção de combinações: sequências de 3+ doces da mesma cor, em linha ou coluna.
// Sequências que se cruzam (mesma cor) viram um grupo só, para reconhecer T e L.
import type { CandyColor, Grid, MatchGroup, Position, SpecialKind } from '../types/game';

interface Run {
  color: CandyColor;
  dir: 'h' | 'v';
  cells: Position[];
}

export const posKey = (p: Position): string => `${p.row},${p.col}`;

export function inBounds(g: Grid, p: Position): boolean {
  return p.row >= 0 && p.row < g.length && p.col >= 0 && p.col < (g[0]?.length ?? 0);
}

export function isAdjacent(a: Position, b: Position): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

/** Cor do doce na célula (a bomba colorida e as células vazias não têm cor e nunca combinam). */
function colorAt(g: Grid, row: number, col: number): CandyColor | null {
  return g[row]?.[col]?.color ?? null;
}

/** Todas as sequências de 3 ou mais doces iguais, horizontais e verticais. */
export function findRuns(g: Grid): Run[] {
  const rows = g.length;
  const cols = g[0]?.length ?? 0;
  const runs: Run[] = [];
  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      const color = colorAt(g, r, c);
      let end = c + 1;
      if (color) {
        while (end < cols && colorAt(g, r, end) === color) end++;
        if (end - c >= 3) {
          const cells: Position[] = [];
          for (let x = c; x < end; x++) cells.push({ row: r, col: x });
          runs.push({ color, dir: 'h', cells });
        }
      }
      c = end;
    }
  }
  for (let c = 0; c < cols; c++) {
    let r = 0;
    while (r < rows) {
      const color = colorAt(g, r, c);
      let end = r + 1;
      if (color) {
        while (end < rows && colorAt(g, end, c) === color) end++;
        if (end - r >= 3) {
          const cells: Position[] = [];
          for (let y = r; y < end; y++) cells.push({ row: y, col: c });
          runs.push({ color, dir: 'v', cells });
        }
      }
      r = end;
    }
  }
  return runs;
}

/** Junta as sequências que dividem alguma célula e classifica cada grupo (3, 4, 5 em linha, ou T/L). */
export function findMatches(g: Grid): MatchGroup[] {
  const runs = findRuns(g);
  if (!runs.length) return [];

  // união-busca simples entre sequências que se tocam
  const pai = runs.map((_, i) => i);
  const raiz = (i: number): number => (pai[i] === i ? i : (pai[i] = raiz(pai[i])));
  const donoDaCelula = new Map<string, number>();
  runs.forEach((run, i) => {
    run.cells.forEach((p) => {
      const k = posKey(p);
      const outro = donoDaCelula.get(k);
      if (outro === undefined) donoDaCelula.set(k, i);
      else pai[raiz(i)] = raiz(outro);
    });
  });

  const porRaiz = new Map<number, Run[]>();
  runs.forEach((run, i) => {
    const r = raiz(i);
    if (!porRaiz.has(r)) porRaiz.set(r, []);
    porRaiz.get(r)!.push(run);
  });

  const grupos: MatchGroup[] = [];
  porRaiz.forEach((grupo) => {
    const vistas = new Map<string, Position>();
    grupo.forEach((run) => run.cells.forEach((p) => vistas.set(posKey(p), p)));
    const maior = grupo.reduce((a, b) => (b.cells.length > a.cells.length ? b : a));
    const temH = grupo.some((r) => r.dir === 'h');
    const temV = grupo.some((r) => r.dir === 'v');
    let corner: Position | undefined;
    if (temH && temV) {
      const emH = new Set(grupo.filter((r) => r.dir === 'h').flatMap((r) => r.cells.map(posKey)));
      const cruz = grupo.filter((r) => r.dir === 'v').flatMap((r) => r.cells).find((p) => emH.has(posKey(p)));
      corner = cruz;
    }
    const shape = maior.cells.length >= 5 ? 'line5' : temH && temV ? 'tl' : maior.cells.length === 4 ? 'line4' : 'line3';
    grupos.push({ color: maior.color, cells: [...vistas.values()], shape, dir: maior.dir, corner });
  });
  return grupos;
}

/**
 * Doce especial que nasce de cada formato:
 * 5 em linha vira bomba colorida; T ou L vira embalado; 4 em linha vira listrado.
 * 4 na horizontal dá listras em pé (limpa a coluna); 4 na vertical dá listras deitadas (limpa a linha).
 */
export function specialForGroup(g: MatchGroup): SpecialKind | null {
  switch (g.shape) {
    case 'line5': return 'colorBomb';
    case 'tl': return 'wrapped';
    case 'line4': return g.dir === 'h' ? 'stripedV' : 'stripedH';
    default: return null;
  }
}

export function swapCells(g: Grid, a: Position, b: Position): Grid {
  const out = g.map((linha) => linha.slice());
  const t = out[a.row][a.col];
  out[a.row][a.col] = out[b.row][b.col];
  out[b.row][b.col] = t;
  return out;
}

/** Ainda existe alguma troca que dá combinação (ou alguma bomba colorida para usar)? */
export function hasPossibleMove(g: Grid): boolean {
  const rows = g.length;
  const cols = g[0]?.length ?? 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!g[r][c]) continue;
      const vizinhos: Position[] = [{ row: r, col: c + 1 }, { row: r + 1, col: c }];
      for (const v of vizinhos) {
        if (!inBounds(g, v) || !g[v.row][v.col]) continue;
        if (g[r][c]!.special === 'colorBomb' || g[v.row][v.col]!.special === 'colorBomb') return true;
        if (findRuns(swapCells(g, { row: r, col: c }, v)).length) return true;
      }
    }
  }
  return false;
}
