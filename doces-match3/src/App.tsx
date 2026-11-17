// Estado geral da partida: pontos, jogadas e o fim do nível.
// (Mapa de fases, vidas, barra de ajudas e as telas completas de vitória/derrota entram nas próximas etapas.)
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { LevelConfig } from './types/game';
import { ALL_COLORS } from './types/game';
import { Board, type ScoreEvent } from './components/Board';
import { Header } from './components/Header';

const NIVEL: LevelConfig = {
  id: 1,
  rows: 9,
  cols: 9,
  moves: 25,
  colors: [...ALL_COLORS],
  starScores: [3000, 6000, 10000],
};

const calcularCasa = (rows: number, cols: number) =>
  Math.floor(Math.min((window.innerWidth - 44) / cols, (window.innerHeight - 190) / rows, 66));

/** Tamanho de cada casa: cabe na tela, deixando espaço para o placar. */
function useTamanhoCasa(rows: number, cols: number): number {
  const [tam, setTam] = useState(() => calcularCasa(rows, cols));
  useEffect(() => {
    const aoMudar = () => setTam(calcularCasa(rows, cols));
    window.addEventListener('resize', aoMudar);
    return () => window.removeEventListener('resize', aoMudar);
  }, [rows, cols]);
  return Math.max(26, tam);
}

export default function App() {
  const [partida, setPartida] = useState(1);
  const [pontos, setPontos] = useState(0);
  const [jogadas, setJogadas] = useState(NIVEL.moves);
  const jogadasRef = useRef(NIVEL.moves);
  jogadasRef.current = jogadas;
  const [fim, setFim] = useState(false);
  const tam = useTamanhoCasa(NIVEL.rows, NIVEL.cols);
  const semente = new URLSearchParams(location.search).get('semente');

  const aoPontuar = useCallback((e: ScoreEvent) => setPontos((p) => p + e.points), []);
  const aoJogar = useCallback(() => setJogadas((j) => j - 1), []);
  // a jogada (com todas as cascatas) acabou: se não sobrou nenhuma, fim do nível
  const aoTerminarJogada = useCallback(() => { if (jogadasRef.current <= 0) setFim(true); }, []);

  const recomecar = () => {
    setPontos(0);
    setJogadas(NIVEL.moves);
    setFim(false);
    setPartida((n) => n + 1);
  };
  const estrelas = NIVEL.starScores.filter((m) => pontos >= m).length;

  return (
    <main className="relative flex h-full flex-col items-center justify-center gap-4 overflow-hidden px-2 py-3">
      <div className="estrelas" />
      <Header score={pontos} movesLeft={jogadas} starScores={NIVEL.starScores} />
      <Board
        key={partida}
        level={NIVEL}
        size={tam}
        seed={semente ? Number(semente) + partida - 1 : undefined}
        disabled={jogadas <= 0}
        onScore={aoPontuar}
        onMoveUsed={aoJogar}
        onIdle={aoTerminarJogada}
      />

      <AnimatePresence>
        {fim && (
          <motion.div
            className="absolute inset-0 z-10 flex items-center justify-center bg-[#12061f]/60 p-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex w-full max-w-sm flex-col items-center gap-3 rounded-[32px] border border-white/25 bg-white/15 px-6 py-7 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md"
              initial={{ scale: 0.6, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', visualDuration: 0.4, bounce: 0.45 }}
            >
              <h2 className="texto-contorno text-4xl font-bold text-amber-200">{estrelas ? 'Muito bem!' : 'Acabaram as jogadas'}</h2>
              <p className="text-lg text-white/85">
                {'★'.repeat(estrelas)}{'☆'.repeat(3 - estrelas)}  ·  {pontos.toLocaleString('pt-BR')} pontos
              </p>
              <button
                type="button"
                onClick={recomecar}
                className="mt-2 rounded-full bg-gradient-to-b from-[#f9d423] to-[#ff4e50] px-10 py-3.5 text-2xl font-bold text-white shadow-[0_6px_0_#a3262a,inset_0_2px_0_rgba(255,255,255,0.5)] active:translate-y-1 active:shadow-[0_2px_0_#a3262a]"
              >
                Jogar de novo
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
