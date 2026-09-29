export const generatorKinds = [
  'RangeMatrix',
  'DeckGrid',
  'Distribution',
  'MonteCarloScatter',
  'Halftone',
  'Dither',
  'SlitScan',
  'Ascii',
  'Barcode',
  'NoiseField',
] as const;
export type GeneratorKind = (typeof generatorKinds)[number];
export interface GraphicOptions {
  kind: GeneratorKind;
  seed?: string;
  variant?: string;
  width?: number;
  height?: number;
  dpr?: number;
  accent?: string;
  known?: readonly number[];
  text?: string;
  photo?: number;
  values?: readonly number[];
}
export interface Graphic {
  url: string;
  source: string;
  summary: string;
}
export const variants: Record<GeneratorKind, readonly string[]> = {
  RangeMatrix: ['filled', 'dots', 'outline'],
  DeckGrid: ['filled', 'outline'],
  Distribution: ['area', 'bars', 'scope'],
  MonteCarloScatter: ['cloud', 'bands'],
  Halftone: ['coarse', 'fine'],
  Dither: ['violet', 'light'],
  SlitScan: ['vertical', 'horizontal'],
  Ascii: ['dense', 'sparse'],
  Barcode: ['bars', 'compact'],
  NoiseField: ['flow', 'contours'],
};
