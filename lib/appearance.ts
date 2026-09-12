export const LOOK_OPTIONS = {
  shape: ['classic', 'round', 'tall', 'squishy', 'bean'],
  eyes: ['two', 'one', 'three'],
  eyeSize: ['little', 'medium', 'big'],
  horns: ['curved', 'spikes', 'antennae', 'none'],
  ears: ['round', 'long', 'none'],
  tail: ['curly', 'long', 'none'],
  pattern: ['plain', 'spots', 'stripes', 'diamonds', 'confetti'],
  texture: ['plush', 'smooth', 'scales', 'shiny'],
  face: ['freckles', 'rosy', 'plain'],
} as const;
export const PALETTE = [
  '#f8c83e',
  '#ff9052',
  '#ed668e',
  '#bb7ce5',
  '#7672ec',
  '#4aabe0',
  '#55c9bd',
  '#7db94f',
  '#f4e9d3',
  '#ad7b53',
  '#596681',
  '#2f354d',
];
export type Appearance = {
  [K in keyof typeof LOOK_OPTIONS]: (typeof LOOK_OPTIONS)[K][number];
} & { colour: string; accent: string; iris: string };
export const defaultAppearance = (): Appearance => ({
  shape: 'classic',
  eyes: 'two',
  eyeSize: 'medium',
  horns: 'curved',
  ears: 'round',
  tail: 'curly',
  pattern: 'plain',
  texture: 'plush',
  face: 'freckles',
  colour: '#f8c83e',
  accent: '#fff0b8',
  iris: '#976631',
});
export function readAppearance(raw: unknown): Appearance {
  const result = defaultAppearance();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;
  const values = raw as Record<string, unknown>;
  for (const key of Object.keys(
    LOOK_OPTIONS,
  ) as (keyof typeof LOOK_OPTIONS)[]) {
    if ((LOOK_OPTIONS[key] as readonly unknown[]).includes(values[key]))
      Object.assign(result, { [key]: values[key] });
  }
  for (const key of ['colour', 'accent', 'iris'] as const)
    if (typeof values[key] === 'string' && /^#[0-9a-f]{6}$/i.test(values[key]))
      result[key] = values[key];
  return result;
}
export const BODY_SCALE: Record<Appearance['shape'], [number, number, number]> =
  {
    classic: [1, 1, 1],
    round: [1.15, 0.85, 1.12],
    tall: [0.82, 1.17, 0.9],
    squishy: [1.25, 0.76, 1.04],
    bean: [0.86, 1.08, 0.84],
  };
