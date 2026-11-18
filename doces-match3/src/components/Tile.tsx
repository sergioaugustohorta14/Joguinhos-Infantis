// Um doce no tabuleiro. A posição é animada pelo Motion: trocas com mola curta,
// quedas com duração proporcional à distância e um quique leve ao pousar.
// Leveza: cada doce é uma camada própria (will-change), então andar não repinta o desenho;
// o brilho (filter) só existe no doce armado, e o estouro é desenhado à parte (Estouro).
import { memo, useEffect, useRef } from 'react';
import { m } from 'motion/react';
import type { Candy } from '../types/game';
import { CandySvg } from './Candy';

interface TileProps {
  candy: Candy;
  row: number;
  col: number;
  size: number;
  selected: boolean;
  /** Linha de onde o doce nasce (negativa = acima do tabuleiro). Só vale na primeira aparição. */
  spawnFromRow?: number;
}

export const Tile = memo(function Tile({ candy, row, col, size, selected, spawnFromRow }: TileProps) {
  const nasceuCaindo = spawnFromRow !== undefined;
  const linhaAnterior = useRef(spawnFromRow ?? row);
  const queda = row - linhaAnterior.current;
  useEffect(() => {
    linhaAnterior.current = row;
  }, [row]);

  // caindo: quanto mais longe, mais tempo; trocando de lugar: mola curta
  const transicaoY = queda > 0
    ? { type: 'spring' as const, visualDuration: 0.2 + 0.045 * queda, bounce: 0.3 }
    : { type: 'spring' as const, visualDuration: 0.16, bounce: 0.2 };

  return (
    <m.div
      className="absolute left-0 top-0"
      style={{ width: size, height: size, willChange: 'transform' }}
      initial={{ x: col * size, y: (spawnFromRow ?? row) * size, scale: nasceuCaindo ? 1 : 0.3, opacity: nasceuCaindo ? 1 : 0 }}
      animate={{ x: col * size, y: row * size, scale: 1, opacity: 1 }}
      transition={{
        x: { type: 'spring', visualDuration: 0.16, bounce: 0.2 },
        y: transicaoY,
        scale: { type: 'spring', visualDuration: 0.25, bounce: 0.45 },
        opacity: { duration: 0.15 },
      }}
      data-doce={candy.id}
    >
      {selected && <div className="doce-selecao absolute inset-[2%] rounded-2xl bg-white/20 ring-4 ring-amber-200/90 shadow-[0_0_20px_rgba(255,226,120,0.9)]" />}
      <div className={`relative h-full w-full p-[7%] ${selected ? 'doce-pulsar' : candy.armed ? 'doce-armado' : ''}`}>
        <CandySvg candy={candy} />
      </div>
    </m.div>
  );
});

/** Cópia do doce que acabou de sair do tabuleiro: cresce, gira e some. */
export const Estouro = memo(function Estouro({ candy, row, col, size }: { candy: Candy; row: number; col: number; size: number }) {
  return (
    <m.div
      className="pointer-events-none absolute left-0 top-0"
      style={{ width: size, height: size, x: col * size, y: row * size }}
      initial={{ scale: 1, opacity: 1, rotate: 0 }}
      animate={{ scale: [1, 1.3, 0], opacity: [1, 1, 0], rotate: 20 }}
      transition={{ duration: 0.26, ease: 'easeOut' }}
    >
      <div className="relative h-full w-full p-[7%]">
        <CandySvg candy={candy} />
      </div>
    </m.div>
  );
});
