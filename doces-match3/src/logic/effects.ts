// Um passo da cascata: tira os grupos combinados, cria os doces especiais e dispara os efeitos
// (listrado limpa linha/coluna, embalado explode 3x3, bomba colorida apaga uma cor), em cadeia.
import type { Candy, Grid, MatchGroup, Position, SpecialKind } from '../types/game';
import { findMatches, inBounds, posKey, specialForGroup } from './matchDetector';
import { newId, type Rng } from './boardGenerator';

export interface StepResult {
  /** Tabuleiro depois do passo: buracos (null) onde os doces sumiram, especiais novos já no lugar. */
  grid: Grid;
  cleared: { pos: Position; candy: Candy }[];
  created: { pos: Position; candy: Candy }[];
  groups: MatchGroup[];
  /** Especiais que dispararam neste passo (para efeitos visuais). */
  effects: { pos: Position; kind: SpecialKind }[];
}

export interface StepOptions {
  /** Células trocadas pelo jogador: o especial nasce numa delas, se fizer parte do grupo. */
  focus?: Position[];
  /** Células a limpar além dos grupos (ex.: tudo que a bomba colorida pegou). */
  extraClear?: Position[];
  /** Células limpas sem disparar o próprio efeito (ex.: a bomba colorida que acabou de ser usada). */
  consumed?: Position[];
  rng?: Rng;
}

const parse = (k: string): Position => {
  const [row, col] = k.split(',').map(Number);
  return { row, col };
};

function escolherNascimento(grupo: MatchGroup, focus: Position[] | undefined): Position {
  const doFoco = focus?.find((f) => grupo.cells.some((c) => c.row === f.row && c.col === f.col));
  if (doFoco) return doFoco;
  if (grupo.corner) return grupo.corner;
  const ordenadas = grupo.cells.slice().sort((a, b) => a.row - b.row || a.col - b.col);
  return ordenadas[Math.floor(ordenadas.length / 2)];
}

/** Cor mais comum no tabuleiro (é a que a bomba colorida apaga quando explode sem ter sido trocada). */
function corMaisComum(g: Grid, rng: Rng): string | null {
  const conta = new Map<string, number>();
  g.flat().forEach((d) => { if (d?.color) conta.set(d.color, (conta.get(d.color) ?? 0) + 1); });
  let melhor: string | null = null;
  let max = -1;
  conta.forEach((n, cor) => { if (n > max || (n === max && rng() < 0.5)) { max = n; melhor = cor; } });
  return melhor;
}

/** Células atingidas quando um especial dispara. */
function areaDoEfeito(g: Grid, pos: Position, doce: Candy, rng: Rng): Position[] {
  const rows = g.length;
  const cols = g[0]?.length ?? 0;
  const area: Position[] = [];
  switch (doce.special) {
    case 'stripedH':
      for (let c = 0; c < cols; c++) area.push({ row: pos.row, col: c });
      break;
    case 'stripedV':
      for (let r = 0; r < rows; r++) area.push({ row: r, col: pos.col });
      break;
    case 'wrapped':
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const p = { row: pos.row + dr, col: pos.col + dc };
        if (inBounds(g, p)) area.push(p);
      }
      break;
    case 'colorBomb': {
      const cor = corMaisComum(g, rng);
      g.forEach((linha, r) => linha.forEach((d, c) => { if (d && d.color === cor) area.push({ row: r, col: c }); }));
      area.push(pos);
      break;
    }
  }
  return area;
}

/**
 * Bomba colorida trocada pelo jogador: o que ela apaga.
 * Com um doce, todos daquela cor; com outra bomba, o tabuleiro inteiro. Devolve null se nenhuma das duas é bomba.
 */
export function colorBombSwap(g: Grid, a: Position, b: Position): { clear: Position[]; consumed: Position[] } | null {
  const da = g[a.row][a.col];
  const db = g[b.row][b.col];
  if (!da || !db) return null;
  const bombaA = da.special === 'colorBomb';
  const bombaB = db.special === 'colorBomb';
  if (!bombaA && !bombaB) return null;
  const clear: Position[] = [];
  if (bombaA && bombaB) {
    g.forEach((linha, r) => linha.forEach((d, c) => { if (d) clear.push({ row: r, col: c }); }));
    return { clear, consumed: [a, b] };
  }
  const bomba = bombaA ? a : b;
  const alvo = bombaA ? db : da;
  g.forEach((linha, r) => linha.forEach((d, c) => { if (d && d.color === alvo.color) clear.push({ row: r, col: c }); }));
  clear.push(bomba);
  return { clear, consumed: [bomba] };
}

/** Executa um passo da cascata. Devolve null se não há nada para limpar. */
export function resolveStep(g: Grid, opts: StepOptions = {}): StepResult | null {
  const rng = opts.rng ?? Math.random;
  const groups = findMatches(g);
  const armados: Position[] = [];
  g.forEach((linha, r) => linha.forEach((d, c) => { if (d?.armed) armados.push({ row: r, col: c }); }));
  if (!groups.length && !opts.extraClear?.length && !armados.length) return null;

  const limpar = new Set<string>();
  groups.forEach((gr) => gr.cells.forEach((p) => limpar.add(posKey(p))));
  opts.extraClear?.forEach((p) => limpar.add(posKey(p)));
  armados.forEach((p) => limpar.add(posKey(p)));

  // especiais que nascem neste passo
  const created: StepResult['created'] = [];
  const nascimentos = new Set<string>();
  groups.forEach((gr) => {
    const tipo = specialForGroup(gr);
    if (!tipo) return;
    const pos = escolherNascimento(gr, opts.focus);
    if (nascimentos.has(posKey(pos))) return;
    nascimentos.add(posKey(pos));
    created.push({ pos, candy: { id: newId(), color: tipo === 'colorBomb' ? null : gr.color, special: tipo } });
  });

  // efeitos em cadeia: cada especial atingido dispara e pode atingir outros especiais
  const disparados = new Set<string>(opts.consumed?.map(posKey) ?? []);
  const effects: StepResult['effects'] = [];
  const reArmar = new Set<string>();
  const fila = [...limpar];
  while (fila.length) {
    const k = fila.shift()!;
    if (disparados.has(k)) continue;
    const pos = parse(k);
    const doce = g[pos.row]?.[pos.col];
    if (!doce?.special) continue;
    disparados.add(k);
    effects.push({ pos, kind: doce.special });
    // embalado: na primeira vez explode e fica no lugar, armado, para explodir de novo depois de cair
    if (doce.special === 'wrapped' && !doce.armed && !nascimentos.has(k)) reArmar.add(k);
    areaDoEfeito(g, pos, doce, rng).forEach((p) => {
      const kp = posKey(p);
      if (!limpar.has(kp)) {
        limpar.add(kp);
        fila.push(kp);
      }
    });
  }

  const out = g.map((linha) => linha.slice());
  const cleared: StepResult['cleared'] = [];
  limpar.forEach((k) => {
    const pos = parse(k);
    const doce = g[pos.row]?.[pos.col];
    if (!doce) return;
    if (reArmar.has(k)) {
      out[pos.row][pos.col] = { ...doce, armed: true };
      return;
    }
    cleared.push({ pos, candy: doce });
    out[pos.row][pos.col] = null;
  });
  created.forEach(({ pos, candy }) => { out[pos.row][pos.col] = candy; });

  return { grid: out, cleared, created, groups, effects };
}
