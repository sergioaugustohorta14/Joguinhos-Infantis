// Desenho dos doces em SVG: cinco formas e cores, mais os especiais (listrado, embalado, bomba colorida).
import type { Candy, CandyColor } from '../types/game';

const PALETA: Record<CandyColor, { claro: string; base: string; escuro: string }> = {
  yellow: { claro: '#fff6a8', base: '#ffd21f', escuro: '#d97f00' },
  blue: { claro: '#c4e9ff', base: '#2f9bff', escuro: '#1446b8' },
  green: { claro: '#dcffb8', base: '#4ccf3a', escuro: '#1b7d27' },
  purple: { claro: '#f3d0ff', base: '#b44dff', escuro: '#5e1599' },
  orange: { claro: '#ffd9ad', base: '#ff8a1f', escuro: '#b84204' },
};

/** Cor usada nas partículas quando o doce estoura. */
export const corDaParticula = (c: CandyColor | null): string => (c ? PALETA[c].base : '#ffffff');

// estrela arredondada (goma laranja), gerada uma vez
const ESTRELA = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 19 : 38;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(1)},${(53 + Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(' ');
})();

/** A forma de cada cor (desenhada com preenchimento e contorno passados). */
function Forma({ cor, fill, stroke, strokeWidth }: { cor: CandyColor; fill: string; stroke: string; strokeWidth: number }) {
  const p = { fill, stroke, strokeWidth, strokeLinejoin: 'round' as const };
  switch (cor) {
    case 'yellow': // gota
      return <path d="M50 8 C60 26 83 44 83 64 A33 33 0 0 1 17 64 C17 44 40 26 50 8 Z" {...p} />;
    case 'blue': // esfera
      return <circle cx="50" cy="52" r="37" {...p} />;
    case 'green': // quadrado
      return <rect x="15" y="16" width="70" height="70" rx="18" {...p} />;
    case 'purple': // jujuba sextavada
      return <polygon points="50,12 83,31 83,71 50,90 17,71 17,31" {...p} strokeWidth={strokeWidth + 10} stroke={fill === 'none' ? stroke : fill} />;
    case 'orange': // goma em estrela
      return <polygon points={ESTRELA} {...p} strokeWidth={strokeWidth + 12} stroke={fill === 'none' ? stroke : fill} />;
  }
}

/** Gradientes e recortes compartilhados por todos os doces (renderizado uma vez no tabuleiro). */
export function CandyDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        {(Object.keys(PALETA) as CandyColor[]).map((cor) => (
          <radialGradient key={cor} id={`doce-${cor}`} cx="36%" cy="30%" r="75%">
            <stop offset="0%" stopColor={PALETA[cor].claro} />
            <stop offset="45%" stopColor={PALETA[cor].base} />
            <stop offset="100%" stopColor={PALETA[cor].escuro} />
          </radialGradient>
        ))}
        {(Object.keys(PALETA) as CandyColor[]).map((cor) => (
          <clipPath key={cor} id={`recorte-${cor}`}>
            <Forma cor={cor} fill="#000" stroke="#000" strokeWidth={0} />
          </clipPath>
        ))}
        <radialGradient id="doce-bomba" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#8a5a3c" />
          <stop offset="55%" stopColor="#4a2816" />
          <stop offset="100%" stopColor="#24110a" />
        </radialGradient>
      </defs>
    </svg>
  );
}

const CONFEITOS = [
  [32, 34, '#ffd21f', 20], [58, 28, '#2f9bff', -30], [70, 50, '#4ccf3a', 60], [44, 52, '#ff5aa8', 10],
  [30, 64, '#b44dff', -50], [56, 70, '#ff8a1f', 35], [68, 34, '#ffffff', 80], [42, 78, '#2f9bff', -15],
] as const;

export function CandySvg({ candy }: { candy: Candy }) {
  if (candy.special === 'colorBomb') {
    return (
      <svg viewBox="0 0 100 100" className="block h-full w-full drop-shadow-[0_3px_3px_rgba(0,0,0,0.45)]">
        <circle cx="50" cy="52" r="38" fill="url(#doce-bomba)" stroke="#1a0a05" strokeWidth="3" />
        {CONFEITOS.map(([x, y, cor, giro], i) => (
          <rect key={i} x={x - 6} y={y - 2.5} width="12" height="5" rx="2.5" fill={cor} transform={`rotate(${giro} ${x} ${y})`} />
        ))}
        <ellipse cx="38" cy="30" rx="12" ry="7" fill="rgba(255,255,255,0.35)" transform="rotate(-25 38 30)" />
      </svg>
    );
  }
  const cor = candy.color!;
  const pal = PALETA[cor];
  const embalado = candy.special === 'wrapped';
  return (
    <svg viewBox="0 0 100 100" className="block h-full w-full drop-shadow-[0_3px_3px_rgba(0,0,0,0.4)]">
      {embalado && (
        // pontas da embalagem (laço dos dois lados)
        <g fill={pal.claro} stroke={pal.escuro} strokeWidth="3" strokeLinejoin="round">
          <path d="M22 50 L4 34 L8 50 L4 66 Z" />
          <path d="M78 50 L96 34 L92 50 L96 66 Z" />
        </g>
      )}
      <g transform={embalado ? 'translate(50 52) scale(0.8) translate(-50 -52)' : undefined}>
        <Forma cor={cor} fill={`url(#doce-${cor})`} stroke={pal.escuro} strokeWidth={3} />
        {(candy.special === 'stripedH' || candy.special === 'stripedV') && (
          <g clipPath={`url(#recorte-${cor})`} fill="rgba(255,255,255,0.78)">
            {[30, 48, 66].map((v) =>
              candy.special === 'stripedH'
                ? <rect key={v} x="0" y={v - 4} width="100" height="8" />
                : <rect key={v} x={v - 4} y="0" width="8" height="100" />,
            )}
          </g>
        )}
        {embalado && (
          <g clipPath={`url(#recorte-${cor})`} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="5">
            <path d="M14 40 Q50 58 86 40" />
            <path d="M14 66 Q50 84 86 66" />
          </g>
        )}
        <ellipse cx="37" cy="33" rx="13" ry="7.5" fill="rgba(255,255,255,0.55)" transform="rotate(-25 37 33)" />
      </g>
    </svg>
  );
}
