import { GRAPHICS_MODES, type GraphicsMode } from './graphics-quality';
import { DAYLIGHT_MODES, type DaylightMode } from './daylight';
export type GamePreferences = {
  motion: 'system' | 'reduced';
  contrast: 'standard' | 'high';
  textSize: 'standard' | 'large';
  calm: boolean;
  speechVolume: number;
  environmentVolume: number;
  camera: 'gentle' | 'fixed';
  graphics: GraphicsMode;
  daylight: DaylightMode;
};
export const defaultPreferences = (): GamePreferences => ({
  motion: 'system',
  contrast: 'standard',
  textSize: 'standard',
  calm: false,
  speechVolume: 1,
  environmentVolume: 0.65,
  camera: 'gentle',
  graphics: 'auto',
  daylight: 'cycle',
});
export function readPreferences(raw: unknown): GamePreferences {
  const p = defaultPreferences();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return p;
  const value = raw as Record<string, unknown>;
  if (DAYLIGHT_MODES.includes(value.daylight as DaylightMode))
    p.daylight = value.daylight as DaylightMode;
  if (GRAPHICS_MODES.includes(value.graphics as GraphicsMode))
    p.graphics = value.graphics as GraphicsMode;
  for (const key of ['motion', 'contrast', 'textSize', 'camera'] as const) {
    const options = {
      motion: ['system', 'reduced'],
      contrast: ['standard', 'high'],
      textSize: ['standard', 'large'],
      camera: ['gentle', 'fixed'],
    }[key];
    if (options.includes(value[key] as string))
      Object.assign(p, { [key]: value[key] });
  }
  p.calm = value.calm === true;
  for (const key of ['speechVolume', 'environmentVolume'] as const)
    if (typeof value[key] === 'number' && Number.isFinite(value[key]))
      p[key] = Math.min(1, Math.max(0, value[key]));
  return p;
}
