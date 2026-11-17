import { describe, expect, it } from 'vitest';
import type { Candy, CandyColor, Grid, SpecialKind } from '../types/game';
import { ALL_COLORS } from '../types/game';
import { createBoard, newId, seeded } from './boardGenerator';
import { findMatches, findRuns, hasPossibleMove, specialForGroup, swapCells } from './matchDetector';
import { applyGravity, refill, shuffleBoard } from './gravity';
import { colorBombSwap, resolveStep } from './effects';

// Monta um tabuleiro a partir de texto: Y B G P O = cores, . = vazio, * = bomba colorida.
// Sufixos depois da letra: h = listrado deitado, v = listrado em pé, w = embalado, a = embalado armado.
const COR: Record<string, CandyColor> = { Y: 'yellow', B: 'blue', G: 'green', P: 'purple', O: 'orange' };
function tab(linhas: string[]): Grid {
  return linhas.map((l) =>
    l.trim().split(/\s+/).map((tok) => {
      if (tok === '.') return null;
      if (tok === '*') return { id: newId(), color: null, special: 'colorBomb' as SpecialKind };
      const doce: Candy = { id: newId(), color: COR[tok[0]] };
      const suf = tok[1];
      if (suf === 'h') doce.special = 'stripedH';
      if (suf === 'v') doce.special = 'stripedV';
      if (suf === 'w' || suf === 'a') doce.special = 'wrapped';
      if (suf === 'a') doce.armed = true;
      return doce;
    }),
  );
}
const conta = (g: Grid) => g.flat().filter(Boolean).length;

describe('geração do tabuleiro', () => {
  it('nunca começa com combinação pronta e sempre tem jogada', () => {
    for (let s = 1; s <= 60; s++) {
      const g = createBoard(9, 9, ALL_COLORS, seeded(s));
      expect(g.length).toBe(9);
      expect(g.every((l) => l.length === 9)).toBe(true);
      expect(findRuns(g)).toHaveLength(0);
      expect(hasPossibleMove(g)).toBe(true);
      expect(g.flat().every((d) => d && ALL_COLORS.includes(d.color!))).toBe(true);
    }
  });
  it('com a mesma semente sai o mesmo tabuleiro (cores)', () => {
    const cores = (g: Grid) => g.map((l) => l.map((d) => d!.color).join()).join('|');
    expect(cores(createBoard(8, 8, ALL_COLORS, seeded(7)))).toBe(cores(createBoard(8, 8, ALL_COLORS, seeded(7))));
  });
});

describe('detecção de combinações', () => {
  it('3 na horizontal e 3 na vertical', () => {
    const h = findMatches(tab(['Y Y Y B', 'B G P O']));
    expect(h).toHaveLength(1);
    expect(h[0]).toMatchObject({ color: 'yellow', shape: 'line3', dir: 'h' });
    const v = findMatches(tab(['G B', 'G O', 'G P']));
    expect(v[0]).toMatchObject({ color: 'green', shape: 'line3', dir: 'v' });
    expect(specialForGroup(v[0])).toBeNull();
  });
  it('4 em linha vira listrado (horizontal dá listras em pé, que limpam a coluna)', () => {
    const [g] = findMatches(tab(['B B B B O']));
    expect(g.shape).toBe('line4');
    expect(specialForGroup(g)).toBe('stripedV');
    const [v] = findMatches(tab(['P', 'P', 'P', 'P']));
    expect(specialForGroup(v)).toBe('stripedH');
  });
  it('5 em linha vira bomba colorida', () => {
    const [g] = findMatches(tab(['O O O O O']));
    expect(g.shape).toBe('line5');
    expect(specialForGroup(g)).toBe('colorBomb');
  });
  it('T e L viram embalado, com a esquina marcada', () => {
    const l = findMatches(tab(['G B O', 'G P O', 'G G G']));
    expect(l).toHaveLength(1);
    expect(l[0].shape).toBe('tl');
    expect(l[0].cells).toHaveLength(5);
    expect(l[0].corner).toEqual({ row: 2, col: 0 });
    expect(specialForGroup(l[0])).toBe('wrapped');
    const t = findMatches(tab(['Y Y Y', 'B Y O', 'O Y B']));
    expect(t[0].shape).toBe('tl');
    expect(t[0].corner).toEqual({ row: 0, col: 1 });
  });
  it('duas combinações separadas da mesma cor são dois grupos', () => {
    expect(findMatches(tab(['Y Y Y B Y Y Y']))).toHaveLength(2);
  });
  it('bomba colorida e vazio não combinam', () => {
    expect(findMatches(tab(['* * * B', '. . . O']))).toHaveLength(0);
  });
  it('sem jogada possível é detectado', () => {
    expect(hasPossibleMove(tab(['Y B G', 'O P Y', 'G Y B']))).toBe(false);
    expect(hasPossibleMove(tab(['Y Y B', 'O P Y']))).toBe(true);
    expect(hasPossibleMove(tab(['* B G', 'O P Y']))).toBe(true);
  });
});

describe('cascata: limpeza e especiais', () => {
  it('limpa o grupo e deixa buracos', () => {
    const r = resolveStep(tab(['Y Y Y', 'B G P']))!;
    expect(r.cleared).toHaveLength(3);
    expect(r.grid[0].every((c) => c === null)).toBe(true);
    expect(conta(r.grid)).toBe(3);
  });
  it('o especial nasce na célula trocada pelo jogador', () => {
    const r = resolveStep(tab(['B B B B']), { focus: [{ row: 0, col: 1 }] })!;
    expect(r.created).toHaveLength(1);
    expect(r.grid[0][1]).toMatchObject({ special: 'stripedV', color: 'blue' });
    expect(conta(r.grid)).toBe(1);
  });
  it('listrado deitado limpa a linha inteira', () => {
    const r = resolveStep(tab(['O G Bh G O', 'P O B Y G', 'Y P B O P']))!;
    expect(r.grid[0].every((c) => c === null)).toBe(true);
    expect(r.effects.some((e) => e.kind === 'stripedH')).toBe(true);
  });
  it('listrado em pé limpa a coluna inteira e dispara outro especial no caminho', () => {
    const g = tab(['Y Gh P', 'O B O', 'Y Bv G', 'O B Y']);
    const r = resolveStep(g)!;
    // coluna 1 inteira (pelo listrado em pé) e, por ela, a linha 0 inteira (o listrado deitado foi atingido)
    expect(r.grid.every((l) => l[1] === null)).toBe(true);
    expect(r.grid[0].every((c) => c === null)).toBe(true);
    expect(r.effects.map((e) => e.kind).sort()).toEqual(['stripedH', 'stripedV']);
  });
  it('embalado explode 3x3, fica armado e explode de novo no passo seguinte', () => {
    const g = tab(['P O Y G', 'O G Bw G', 'Y P B O', 'O Y B P']);
    const r1 = resolveStep(g)!;
    expect(r1.grid[1][2]).toMatchObject({ special: 'wrapped', armed: true });
    expect(r1.grid[0][1]).toBeNull();
    expect(r1.grid[2][3]).toBeNull();
    const caiu = applyGravity(r1.grid).grid;
    const r2 = resolveStep(caiu)!;
    expect(r2).not.toBeNull();
    expect(r2.cleared.some((c) => c.candy.special === 'wrapped')).toBe(true);
    expect(r2.grid.flat().some((d) => d?.armed)).toBe(false);
  });
  it('bomba colorida trocada com um doce apaga todos daquela cor', () => {
    const g = tab(['* G B', 'G O G', 'P G Y']);
    const troca = colorBombSwap(g, { row: 0, col: 0 }, { row: 0, col: 1 })!;
    const r = resolveStep(g, { extraClear: troca.clear, consumed: troca.consumed })!;
    expect(r.grid.flat().some((d) => d?.color === 'green')).toBe(false);
    expect(r.grid[0][0]).toBeNull();
    expect(r.grid.flat().filter(Boolean)).toHaveLength(4);
  });
  it('duas bombas trocadas limpam tudo', () => {
    const g = tab(['* * B', 'G O G']);
    const troca = colorBombSwap(g, { row: 0, col: 0 }, { row: 0, col: 1 })!;
    expect(conta(resolveStep(g, { extraClear: troca.clear, consumed: troca.consumed })!.grid)).toBe(0);
  });
  it('sem combinação, não há passo', () => {
    expect(resolveStep(tab(['Y B G', 'O P Y']))).toBeNull();
  });
});

describe('gravidade e reposição', () => {
  it('os doces descem mantendo a ordem e informam de onde vieram', () => {
    const g = tab(['Y B', '. G', 'O .', '. .']);
    const { grid, falls } = applyGravity(g);
    expect(grid.map((l) => l.map((d) => d?.color ?? '.').join(' '))).toEqual(['. .', '. .', 'yellow blue', 'orange green']);
    expect(falls.find((f) => f.id === g[0][0]!.id)).toEqual({ id: g[0][0]!.id, col: 0, fromRow: 0, toRow: 2 });
    expect(conta(grid)).toBe(conta(g));
  });
  it('a reposição enche tudo, com doces nascendo acima do tabuleiro', () => {
    const { grid } = applyGravity(tab(['Y .', '. G', 'O .']));
    const r = refill(grid, ALL_COLORS, seeded(3));
    expect(conta(r.grid)).toBe(6);
    expect(r.spawned).toHaveLength(3);
    expect(r.spawned.every((s) => s.fromRow < 0 && s.toRow >= 0)).toBe(true);
    const col1 = r.spawned.filter((s) => s.col === 1).sort((a, b) => a.toRow - b.toRow);
    expect(col1.map((s) => s.fromRow)).toEqual([-2, -1]);
  });
  it('cascata completa num tabuleiro real termina estável e cheio', () => {
    const rng = seeded(11);
    let g = createBoard(9, 9, ALL_COLORS, rng);
    // força uma combinação trocando até achar uma troca válida
    let feito = false;
    for (let r = 0; r < 9 && !feito; r++) for (let c = 0; c < 8 && !feito; c++) {
      const t = swapCells(g, { row: r, col: c }, { row: r, col: c + 1 });
      if (findMatches(t).length) { g = t; feito = true; }
    }
    expect(feito).toBe(true);
    for (let i = 0; i < 50; i++) {
      const passo = resolveStep(g, { rng });
      if (!passo) break;
      g = refill(applyGravity(passo.grid).grid, ALL_COLORS, rng).grid;
    }
    expect(conta(g)).toBe(81);
    expect(findMatches(g)).toHaveLength(0);
  });
  it('embaralhar mantém os mesmos doces, sem combinação pronta e com jogada', () => {
    const g = tab(['Y B G Y', 'O P Y B', 'G Y B O', 'B O G P']);
    const s = shuffleBoard(g, seeded(5));
    expect(s.flat().map((d) => d!.id).sort()).toEqual(g.flat().map((d) => d!.id).sort());
    expect(findRuns(s)).toHaveLength(0);
    expect(hasPossibleMove(s)).toBe(true);
  });
});
