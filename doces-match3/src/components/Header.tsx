// Placar do alto: jogadas restantes, pontos e a barra de estrelas.
import { motion } from 'motion/react';

interface HeaderProps {
  score: number;
  movesLeft: number;
  starScores: [number, number, number];
}

function Estrela({ acesa }: { acesa: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
      <path
        d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.1 6.1 20.3l1.3-6.5L2.5 9.3l6.6-.8z"
        fill={acesa ? '#ffd84a' : 'rgba(255,255,255,0.25)'}
        stroke={acesa ? '#c2780c' : 'rgba(255,255,255,0.45)'}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Header({ score, movesLeft, starScores }: HeaderProps) {
  const max = starScores[2];
  const progresso = Math.min(1, score / max);
  return (
    <header className="flex w-full max-w-[640px] items-stretch gap-3 px-3">
      <div className="flex min-w-[92px] flex-col items-center justify-center rounded-3xl border border-white/25 bg-gradient-to-b from-fuchsia-500/80 to-purple-700/80 px-3 py-2 shadow-[0_6px_0_rgba(40,0,70,0.6),inset_0_2px_0_rgba(255,255,255,0.35)]">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/85">Jogadas</span>
        <motion.span
          key={movesLeft}
          className="texto-contorno text-4xl font-bold leading-none"
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', visualDuration: 0.3, bounce: 0.5 }}
        >
          {movesLeft}
        </motion.span>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-1.5 rounded-3xl border border-white/20 bg-white/12 px-4 py-2 shadow-[0_10px_24px_rgba(10,0,30,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/75">Pontos</span>
          <motion.span
            key={score}
            className="texto-contorno text-3xl font-bold leading-none text-amber-100"
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            {score.toLocaleString('pt-BR')}
          </motion.span>
        </div>
        {/* barra de estrelas: as marcas ficam na proporção de cada meta */}
        <div className="relative mt-2 h-3.5 rounded-full bg-black/35 shadow-[inset_0_2px_3px_rgba(0,0,0,0.5)]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-300 to-pink-400 shadow-[0_0_10px_rgba(255,220,120,0.7)]"
            animate={{ width: `${progresso * 100}%` }}
            transition={{ type: 'spring', visualDuration: 0.5, bounce: 0.15 }}
          />
          {starScores.map((meta, i) => (
            <div key={i} className="absolute -top-[7px]" style={{ left: `calc(${(meta / max) * 100}% - 12px)` }}>
              <Estrela acesa={score >= meta} />
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
