export const DAYLIGHT_MODES = ['cycle', 'day', 'sunset', 'evening'] as const;
export type DaylightMode = (typeof DAYLIGHT_MODES)[number];
export const DAY_LENGTH = 720;
const frames = [
  {
    phase: 0,
    top: '#95cce5',
    horizon: '#c3e2d8',
    fog: '#b9dbdf',
    sun: '#ffedc6',
    sky: '#c9edff',
    ground: '#557348',
    sea: '#ffffff',
    sunlight: 2.35,
    ambient: 0.95,
    environment: 0.2,
    evening: 0,
  },
  {
    phase: 0.32,
    top: '#91bdd8',
    horizon: '#f6d8ae',
    fog: '#dccebd',
    sun: '#ffe1a8',
    sky: '#c9dbee',
    ground: '#627251',
    sea: '#e3e6e0',
    sunlight: 2.15,
    ambient: 1,
    environment: 0.24,
    evening: 0,
  },
  {
    phase: 0.52,
    top: '#887eac',
    horizon: '#eac7a5',
    fog: '#c1acc0',
    sun: '#ffbc93',
    sky: '#c2c7ea',
    ground: '#77728a',
    sea: '#b6a9c4',
    sunlight: 1.55,
    ambient: 0.95,
    environment: 0.3,
    evening: 0.55,
  },
  {
    phase: 0.7,
    top: '#374367',
    horizon: '#8d9abf',
    fog: '#848eaf',
    sun: '#8fa7ef',
    sky: '#849dd7',
    ground: '#505e8a',
    sea: '#8a98bb',
    sunlight: 0.72,
    ambient: 0.78,
    environment: 0.25,
    evening: 1,
  },
  {
    phase: 0.85,
    top: '#849dbe',
    horizon: '#ebcfb7',
    fog: '#bccdd0',
    sun: '#ffdcad',
    sky: '#c9d7e6',
    ground: '#63755b',
    sea: '#b8c8d0',
    sunlight: 1.7,
    ambient: 1,
    environment: 0.27,
    evening: 0.3,
  },
] as const;
type Palette = Omit<(typeof frames)[number], 'phase'>;
const mixColour = (a: string, b: string, f: number) =>
  '#' +
  [1, 3, 5]
    .map((i) =>
      Math.round(
        parseInt(a.slice(i, i + 2), 16) * (1 - f) +
          parseInt(b.slice(i, i + 2), 16) * f,
      )
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');
export function daylightPalette(phase: number): {
  [K in keyof Palette]: Palette[K] extends string ? string : number;
} {
  const p = Number.isFinite(phase) ? ((phase % 1) + 1) % 1 : 0;
  const index = frames.findLastIndex((frame) => frame.phase <= p),
    a = frames[index],
    b = frames[(index + 1) % frames.length];
  const end = index === frames.length - 1 ? 1 : b.phase,
    f = (p - a.phase) / (end - a.phase);
  const smooth = f * f * (3 - 2 * f);
  return {
    top: mixColour(a.top, b.top, smooth),
    horizon: mixColour(a.horizon, b.horizon, smooth),
    fog: mixColour(a.fog, b.fog, smooth),
    sun: mixColour(a.sun, b.sun, smooth),
    sky: mixColour(a.sky, b.sky, smooth),
    ground: mixColour(a.ground, b.ground, smooth),
    sea: mixColour(a.sea, b.sea, smooth),
    sunlight: a.sunlight + (b.sunlight - a.sunlight) * smooth,
    ambient: a.ambient + (b.ambient - a.ambient) * smooth,
    environment: a.environment + (b.environment - a.environment) * smooth,
    evening: a.evening + (b.evening - a.evening) * smooth,
  };
}
export class IslandDay {
  elapsed = 0;
  advance(seconds: number, active: boolean) {
    if (active && Number.isFinite(seconds) && seconds > 0)
      this.elapsed = (this.elapsed + Math.min(0.1, seconds)) % DAY_LENGTH;
  }
  phase(mode: DaylightMode) {
    return mode === 'cycle'
      ? this.elapsed / DAY_LENGTH
      : mode === 'sunset'
        ? 0.52
        : mode === 'evening'
          ? 0.7
          : 0;
  }
}
