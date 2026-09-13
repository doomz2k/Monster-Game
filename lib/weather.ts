import type { daylightPalette } from './daylight';

export const WEATHER_MODES = ['cycle', 'sunny', 'drizzle', 'rainbow'] as const;
export type WeatherMode = (typeof WEATHER_MODES)[number];
export const WEATHER_LENGTH = 600;
export type WeatherSample = {
  cloud: number;
  rain: number;
  wet: number;
  rainbow: number;
};
const clear: WeatherSample = { cloud: 0, rain: 0, wet: 0, rainbow: 0 };
const frames: Array<WeatherSample & { time: number }> = [
  { time: 0, ...clear },
  { time: 180, ...clear },
  { time: 225, cloud: 0.55, rain: 0, wet: 0, rainbow: 0 },
  { time: 255, cloud: 0.65, rain: 0.7, wet: 0.4, rainbow: 0 },
  { time: 360, cloud: 0.65, rain: 0.7, wet: 1, rainbow: 0 },
  { time: 405, cloud: 0.1, rain: 0, wet: 1, rainbow: 1 },
  { time: 480, cloud: 0, rain: 0, wet: 0.6, rainbow: 0 },
  { time: 560, ...clear },
  { time: WEATHER_LENGTH, ...clear },
];
const unit = (v: number) =>
  Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
export function weatherAt(seconds: number): WeatherSample {
  const t = Number.isFinite(seconds)
    ? ((seconds % WEATHER_LENGTH) + WEATHER_LENGTH) % WEATHER_LENGTH
    : 0;
  const i = frames.findLastIndex((f) => f.time <= t),
    a = frames[i],
    b = frames[i + 1],
    fraction = (t - a.time) / (b.time - a.time),
    smooth = fraction * fraction * (3 - 2 * fraction);
  return Object.fromEntries(
    ['cloud', 'rain', 'wet', 'rainbow'].map((key) => {
      const k = key as keyof WeatherSample;
      return [key, a[k] + (b[k] - a[k]) * smooth];
    }),
  ) as WeatherSample;
}
export class IslandWeather {
  elapsed = 0;
  advance(seconds: number, active: boolean) {
    if (active && Number.isFinite(seconds) && seconds > 0)
      this.elapsed = (this.elapsed + Math.min(0.1, seconds)) % WEATHER_LENGTH;
  }
  sample(mode: WeatherMode, calm = false, reduced = false): WeatherSample {
    const value =
      calm || mode === 'sunny'
        ? { ...clear }
        : mode === 'drizzle'
          ? { cloud: 0.65, rain: 0.7, wet: 1, rainbow: 0 }
          : mode === 'rainbow'
            ? { cloud: 0.1, rain: 0, wet: 1, rainbow: 1 }
            : weatherAt(this.elapsed);
    if (reduced) value.rain = 0;
    return value;
  }
}
const colour = (from: string, to: string, amount: number) =>
  '#' +
  [1, 3, 5]
    .map((i) =>
      Math.round(
        parseInt(from.slice(i, i + 2), 16) * (1 - amount) +
          parseInt(to.slice(i, i + 2), 16) * amount,
      )
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');
export function weatherPalette(
  p: ReturnType<typeof daylightPalette>,
  weather: WeatherSample,
) {
  const c = unit(weather.cloud);
  return {
    ...p,
    top: colour(p.top, '#a0bdc9', c * 0.58),
    horizon: colour(p.horizon, '#d0dfdd', c * 0.35),
    fog: colour(p.fog, '#bad0d2', c * 0.25),
    sunlight: p.sunlight * (1 - c * 0.25),
    ambient: p.ambient + c * 0.08,
  };
}

// Open ground beside familiar routes; no puddle blocks a doorway or quest giver.
export const PUDDLES = [
  { x: 0, z: 6, radius: 1.9, stretch: 0.8 },
  { x: 10, z: 16, radius: 1.65, stretch: 0.75 },
  { x: -13, z: -7, radius: 1.7, stretch: 0.85 },
  { x: 24, z: -3, radius: 1.6, stretch: 0.8 },
  { x: -23, z: 24, radius: 1.8, stretch: 0.7 },
  { x: 31, z: 28, radius: 1.7, stretch: 0.8 },
  { x: -9, z: -22, radius: 1.5, stretch: 0.85 },
  { x: 7, z: 34, radius: 1.85, stretch: 0.7 },
] as const;
export function puddleAt(x: number, z: number, wet: number) {
  if (!Number.isFinite(x) || !Number.isFinite(z) || unit(wet) < 0.12) return -1;
  // Match the visible drying footprint; the edge is slightly irregular in the shader.
  const scale = 0.65 + unit(wet) * 0.35;
  return PUDDLES.findIndex(
    (p) =>
      Math.hypot((x - p.x) / p.radius, (z - p.z) / (p.radius * p.stretch)) <
      scale * 0.9,
  );
}
export class PuddleSteps {
  private ready = false;
  private x = 0;
  private z = 0;
  private wasAirborne = false;
  private cooldown = 0;
  update(
    dt: number,
    x: number,
    z: number,
    airborne: boolean,
    wet: number,
    active: boolean,
  ) {
    if (!active || !Number.isFinite(x) || !Number.isFinite(z)) {
      this.ready = false;
      return null;
    }
    if (!this.ready) {
      this.x = x;
      this.z = z;
      this.wasAirborne = airborne;
      this.ready = true;
      return null;
    }
    this.cooldown = Math.max(
      0,
      this.cooldown - Math.max(0, Math.min(0.1, Number.isFinite(dt) ? dt : 0)),
    );
    const landed = this.wasAirborne && !airborne,
      distance = Math.hypot(x - this.x, z - this.z),
      index = puddleAt(x, z, wet);
    this.wasAirborne = airborne;
    if (distance > 5) {
      this.x = x;
      this.z = z;
      return null;
    }
    if (!airborne && this.cooldown === 0 && (landed || distance > 0.65)) {
      this.x = x;
      this.z = z;
      this.cooldown = 0.25;
      if (index >= 0) return { index, x, z, landed };
    }
    return null;
  }
}
