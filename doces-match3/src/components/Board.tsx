// Tabuleiro: desenha a grade e os doces, recebe o toque (arrastar ou tocar em dois vizinhos)
// e conduz a sequência troca → limpeza → queda → reposição → cascata, esperando cada animação.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimate } from 'motion/react';
import type { Grid, LevelConfig, Position } from '../types/game';
import { createBoard, seeded, type Rng } from '../logic/boardGenerator';
import { findMatches, hasPossibleMove, inBounds, isAdjacent, swapCells } from '../logic/matchDetector';
import { applyGravity, refill, shuffleBoard } from '../logic/gravity';
import { colorBombSwap, resolveStep, type StepOptions, type StepResult } from '../logic/effects';
import { Tile } from './Tile';
import { CandyDefs, corDaParticula } from './Candy';

// tempos de espera entre as etapas (ms); as animações dos doces foram feitas para caber neles
const T_TROCA = 200;
const T_VOLTA = 240;
const T_LIMPAR = 270;
const T_QUEDA_BASE = 300;
const T_QUEDA_POR_LINHA = 48;

const FRASES = ['', '', 'Doce!', 'Delícia!', 'Divino!', 'Açucarado!', 'Explosão de açúcar!'];
const espera = (ms: number) => new Promise<void>((ok) => setTimeout(ok, ms));

export interface ScoreEvent {
  points: number;
  cascade: number;
  cleared: number;
}

interface BoardProps {
  level: LevelConfig;
  size: number;
  disabled?: boolean;
  seed?: number;
  onScore?: (e: ScoreEvent) => void;
  onMoveUsed?: () => void;
  /** Chamado quando a jogada inteira (com todas as cascatas) terminou. */
  onIdle?: () => void;
}

interface Particula { id: number; x: number; y: number; cor: string; ang: number; dist: number; tam: number }
interface Texto { id: number; texto: string; x: number; y: number; grande: boolean }

declare global {
  interface Window {
    __doces?: { grid: () => Grid; trocar: (a: Position, b: Position) => Promise<void>; ocupado: () => boolean; definir: (g: Grid) => void };
  }
}

let proximoEfeito = 1;

export function Board({ level, size, disabled = false, seed, onScore, onMoveUsed, onIdle }: BoardProps) {
  const rng: Rng = useMemo(() => (seed !== undefined ? seeded(seed) : Math.random), [seed]);
  const [grid, setGridState] = useState<Grid>(() => createBoard(level.rows, level.cols, level.colors, rng));
  const gridRef = useRef(grid);
  const setGrid = useCallback((g: Grid) => { gridRef.current = g; setGridState(g); }, []);
  const [nascimento, setNascimento] = useState<Map<number, number>>(new Map());
  const [selecionado, setSelecionado] = useState<Position | null>(null);
  const [particulas, setParticulas] = useState<Particula[]>([]);
  const [textos, setTextos] = useState<Texto[]>([]);
  const ocupado = useRef(false);
  const arrasto = useRef<{ id: number; pos: Position; x: number; y: number; usado: boolean } | null>(null);
  const [escopo, animar] = useAnimate();
  const propsRef = useRef({ disabled, onScore, onMoveUsed, onIdle });
  propsRef.current = { disabled, onScore, onMoveUsed, onIdle };

  const largura = level.cols * size;
  const altura = level.rows * size;

  // ---------- efeitos visuais ----------
  const estourar = useCallback((passo: StepResult) => {
    const novas: Particula[] = [];
    const limite = Math.max(2, Math.floor(70 / Math.max(1, passo.cleared.length)));
    passo.cleared.forEach(({ pos, candy }) => {
      for (let i = 0; i < Math.min(5, limite); i++) {
        novas.push({
          id: proximoEfeito++, x: (pos.col + 0.5) * size, y: (pos.row + 0.5) * size, cor: corDaParticula(candy.color),
          ang: (i / 5) * Math.PI * 2 + Math.random() * 0.8, dist: size * (0.55 + Math.random() * 0.6), tam: Math.max(4, size * 0.12),
        });
      }
    });
    setParticulas((p) => [...p, ...novas]);
    const ids = new Set(novas.map((n) => n.id));
    setTimeout(() => setParticulas((p) => p.filter((x) => !ids.has(x.id))), 700);
  }, [size]);

  const mostrarTexto = useCallback((texto: string, x: number, y: number, grande: boolean) => {
    const id = proximoEfeito++;
    setTextos((t) => [...t, { id, texto, x, y, grande }]);
    setTimeout(() => setTextos((t) => t.filter((x2) => x2.id !== id)), grande ? 1100 : 800);
  }, []);

  const tremer = useCallback((forte: boolean) => {
    if (!escopo.current) return;
    const a = forte ? 9 : 5;
    animar(escopo.current, { x: [0, -a, a, -a * 0.6, a * 0.6, 0], y: [0, a * 0.4, -a * 0.4, 0] }, { duration: 0.38 });
  }, [animar, escopo]);

  // ---------- cascata ----------
  const cascata = useCallback(async (inicio: Grid, primeiro: StepOptions) => {
    let atual = inicio;
    let opcoes: StepOptions = primeiro;
    let nivel = 0;
    for (let volta = 0; volta < 60; volta++) {
      const passo = resolveStep(atual, { ...opcoes, rng });
      if (!passo) break;
      nivel++;
      // pontos: 20 por doce, bônus por especial criado ou disparado, tudo multiplicado pela cascata
      const bonus = passo.created.reduce((s, c) => s + (c.candy.special === 'colorBomb' ? 200 : c.candy.special === 'wrapped' ? 120 : 60), 0)
        + passo.effects.length * 40;
      const pontos = (passo.cleared.length * 20 + bonus) * nivel;
      propsRef.current.onScore?.({ points: pontos, cascade: nivel, cleared: passo.cleared.length });
      estourar(passo);
      if (passo.cleared.length) {
        const cx = passo.cleared.reduce((s, c) => s + c.pos.col + 0.5, 0) / passo.cleared.length * size;
        const cy = passo.cleared.reduce((s, c) => s + c.pos.row + 0.5, 0) / passo.cleared.length * size;
        mostrarTexto(`+${pontos}`, cx, cy, false);
      }
      if (nivel >= 2) mostrarTexto(FRASES[Math.min(nivel, FRASES.length - 1)], largura / 2, altura * 0.42, true);
      if (passo.effects.length || passo.cleared.length >= 9) tremer(passo.effects.length > 1 || passo.cleared.length >= 15);
      setGrid(passo.grid);
      await espera(T_LIMPAR);

      const { grid: caiu, falls } = applyGravity(passo.grid);
      const { grid: cheio, spawned } = refill(caiu, level.colors, rng);
      setNascimento(new Map(spawned.map((s) => [s.id, s.fromRow])));
      setGrid(cheio);
      const maior = Math.max(0, ...falls.map((f) => f.toRow - f.fromRow), ...spawned.map((s) => s.toRow - s.fromRow));
      await espera(T_QUEDA_BASE + maior * T_QUEDA_POR_LINHA);
      atual = cheio;
      opcoes = {};
    }
    if (!hasPossibleMove(atual)) {
      mostrarTexto('Embaralhando...', largura / 2, altura * 0.42, true);
      await espera(500);
      setGrid(shuffleBoard(atual, rng));
      await espera(450);
    }
  }, [altura, estourar, largura, level.colors, mostrarTexto, rng, setGrid, size, tremer]);

  // ---------- troca ----------
  const trocar = useCallback(async (a: Position, b: Position) => {
    const g0 = gridRef.current;
    if (ocupado.current || propsRef.current.disabled) return;
    if (!inBounds(g0, a) || !inBounds(g0, b) || !isAdjacent(a, b) || !g0[a.row][a.col] || !g0[b.row][b.col]) return;
    ocupado.current = true;
    setSelecionado(null);
    try {
      const g1 = swapCells(g0, a, b);
      setGrid(g1);
      await espera(T_TROCA);
      const bomba = colorBombSwap(g1, a, b);
      if (!bomba && !findMatches(g1).length) {
        setGrid(g0); // não combinou: volta com a mola
        await espera(T_VOLTA);
        return;
      }
      propsRef.current.onMoveUsed?.();
      await cascata(g1, { focus: [a, b], extraClear: bomba?.clear, consumed: bomba?.consumed });
      propsRef.current.onIdle?.();
    } finally {
      ocupado.current = false;
    }
  }, [cascata, setGrid]);

  // ganchos para testes automáticos (só com ?teste no endereço)
  useEffect(() => {
    if (!new URLSearchParams(location.search).has('teste')) return;
    window.__doces = { grid: () => gridRef.current, trocar, ocupado: () => ocupado.current, definir: setGrid };
    return () => { delete window.__doces; };
  }, [trocar, setGrid]);

  // ---------- toque: arrastar para o lado, ou tocar em dois doces vizinhos ----------
  const celulaDe = (ev: React.PointerEvent): Position => {
    const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    return { row: Math.floor((ev.clientY - r.top) / size), col: Math.floor((ev.clientX - r.left) / size) };
  };
  const aoPressionar = (ev: React.PointerEvent) => {
    if (ocupado.current || disabled || arrasto.current) return;
    const pos = celulaDe(ev);
    if (!inBounds(gridRef.current, pos)) return;
    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
    arrasto.current = { id: ev.pointerId, pos, x: ev.clientX, y: ev.clientY, usado: false };
  };
  const aoMover = (ev: React.PointerEvent) => {
    const a = arrasto.current;
    if (!a || a.usado || ev.pointerId !== a.id) return;
    const dx = ev.clientX - a.x;
    const dy = ev.clientY - a.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < size * 0.3) return;
    a.usado = true;
    const alvo = Math.abs(dx) > Math.abs(dy)
      ? { row: a.pos.row, col: a.pos.col + Math.sign(dx) }
      : { row: a.pos.row + Math.sign(dy), col: a.pos.col };
    void trocar(a.pos, alvo);
  };
  const aoSoltar = (ev: React.PointerEvent) => {
    const a = arrasto.current;
    if (!a || ev.pointerId !== a.id) return;
    arrasto.current = null;
    if (a.usado || ev.type === 'pointercancel') return;
    // toque simples: seleciona; tocando num vizinho do selecionado, troca
    if (selecionado && isAdjacent(selecionado, a.pos)) void trocar(selecionado, a.pos);
    else if (selecionado && selecionado.row === a.pos.row && selecionado.col === a.pos.col) setSelecionado(null);
    else setSelecionado(a.pos);
  };

  const pecas = grid.flatMap((linha, r) => linha.map((doce, c) => (doce ? { doce, r, c } : null))).filter((x) => x !== null);

  return (
    <div
      ref={escopo}
      className="relative rounded-[28px] border border-white/20 bg-white/10 p-2.5 shadow-[0_18px_40px_rgba(10,0,30,0.55),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md"
    >
      <CandyDefs />
      <div
        className="relative touch-none select-none"
        style={{ width: largura, height: altura }}
        onPointerDown={aoPressionar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
        data-tabuleiro
      >
        {/* casas do tabuleiro, em xadrez bem suave */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          {Array.from({ length: level.rows * level.cols }, (_, i) => {
            const r = Math.floor(i / level.cols);
            const c = i % level.cols;
            return (
              <div
                key={i}
                className={(r + c) % 2 ? 'absolute bg-indigo-950/45' : 'absolute bg-indigo-900/35'}
                style={{ left: c * size, top: r * size, width: size, height: size }}
              />
            );
          })}
        </div>

        {/* doces (o recorte esconde os que estão nascendo acima do tabuleiro) */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <AnimatePresence>
            {pecas.map(({ doce, r, c }) => (
              <Tile
                key={doce.id}
                candy={doce}
                row={r}
                col={c}
                size={size}
                selected={!!selecionado && selecionado.row === r && selecionado.col === c}
                spawnFromRow={nascimento.get(doce.id)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* partículas dos doces que estouraram */}
        <div className="pointer-events-none absolute inset-0">
          {particulas.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{ left: p.x - p.tam / 2, top: p.y - p.tam / 2, width: p.tam, height: p.tam, background: p.cor, boxShadow: `0 0 8px ${p.cor}` }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: Math.cos(p.ang) * p.dist, y: Math.sin(p.ang) * p.dist + size * 0.25, opacity: 0, scale: 0.3 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          ))}
        </div>

        {/* pontos e frases de cascata */}
        <div className="pointer-events-none absolute inset-0">
          <AnimatePresence>
            {textos.map((t) => (
              <motion.div
                key={t.id}
                className={`texto-contorno absolute whitespace-nowrap font-bold ${t.grande ? 'text-amber-200' : 'text-white'}`}
                style={{ left: t.x, top: t.y, fontSize: t.grande ? Math.max(30, size * 0.8) : Math.max(18, size * 0.42) }}
                initial={{ x: '-50%', y: '-50%', scale: 0.3, opacity: 0 }}
                animate={{ x: '-50%', y: t.grande ? '-50%' : '-120%', scale: 1, opacity: 1 }}
                exit={{ opacity: 0, scale: t.grande ? 1.3 : 0.9, transition: { duration: 0.3 } }}
                transition={{ type: 'spring', visualDuration: 0.35, bounce: 0.5 }}
              >
                {t.texto}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
