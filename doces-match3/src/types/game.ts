// Tipos do jogo Match-3.

/** As cinco cores (e formas) de doce normal. */
export type CandyColor = 'yellow' | 'blue' | 'green' | 'purple' | 'orange';
export const ALL_COLORS: readonly CandyColor[] = ['yellow', 'blue', 'green', 'purple', 'orange'];

/**
 * Doces especiais.
 * - stripedH: listras deitadas, limpa a LINHA inteira.
 * - stripedV: listras em pé, limpa a COLUNA inteira.
 * - wrapped: embalado (bombom), explode 3x3 duas vezes (a segunda depois de cair).
 * - colorBomb: bomba colorida, não tem cor; trocada com um doce, apaga todos daquela cor.
 */
export type SpecialKind = 'stripedH' | 'stripedV' | 'wrapped' | 'colorBomb';

export interface Candy {
  /** Identidade estável: é o que permite animar o mesmo doce trocando de lugar e caindo. */
  id: number;
  /** null só na bomba colorida. */
  color: CandyColor | null;
  special?: SpecialKind;
  /** Embalado que já explodiu uma vez e vai explodir de novo depois de cair. */
  armed?: boolean;
}

export type Cell = Candy | null;
/** grid[linha][coluna]; a linha 0 é a de cima. */
export type Grid = Cell[][];

export interface Position {
  row: number;
  col: number;
}

export interface BoardState {
  grid: Grid;
  rows: number;
  cols: number;
}

export interface LevelConfig {
  id: number;
  rows: number;
  cols: number;
  moves: number;
  colors: CandyColor[];
  /** Pontos para 1, 2 e 3 estrelas. */
  starScores: [number, number, number];
}

export type MatchShape = 'line3' | 'line4' | 'line5' | 'tl';

/** Um grupo de doces iguais que vai sumir (uma linha, ou um T/L juntando linha e coluna). */
export interface MatchGroup {
  color: CandyColor;
  cells: Position[];
  shape: MatchShape;
  /** Direção da sequência mais longa do grupo. */
  dir: 'h' | 'v';
  /** No T/L: a célula onde a linha e a coluna se cruzam. */
  corner?: Position;
}
