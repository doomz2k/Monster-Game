export type GamePreferences = {
  motion: 'system' | 'reduced';
  contrast: 'standard' | 'high';
  textSize: 'standard' | 'large';
  calm: boolean;
  speechVolume: number;
  environmentVolume: number;
  camera: 'gentle' | 'fixed';
};
export const defaultPreferences = (): GamePreferences => ({
  motion: 'system',
  contrast: 'standard',
  textSize: 'standard',
  calm: false,
  speechVolume: 1,
  environmentVolume: 0.65,
  camera: 'gentle',
});
export function readPreferences(raw: unknown): GamePreferences {
  const p = defaultPreferences();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return p;
  const value = raw as Record<string, unknown>;
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
