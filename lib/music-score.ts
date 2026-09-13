import { placeFor } from './adventure';
import type { SoundScene } from './soundscape';
export type MusicTheme = 'home' | 'woods' | 'harbour' | 'moon';
export type MusicInstrument = 'felt' | 'wood' | 'glass' | 'pad';
export type MusicNote = {
  midi: number;
  duration: number;
  level: number;
  pan: number;
  instrument: MusicInstrument;
};
export const MUSIC_STEP = 0.45;
export const MUSIC_THEMES: MusicTheme[] = ['home', 'woods', 'harbour', 'moon'];
const melodies: Record<MusicTheme, (number | null)[][]> = {
  home: [
    [66, 69, 71, null, 69, 66, 64, 62],
    [66, 64, 62, null, 64, 66, 69, null],
    [67, 69, 71, 74, null, 71, 69, 67],
    [69, 66, 64, null, 62, null, 64, null],
  ],
  woods: [
    [71, null, 69, 66, null, 64, 66, null],
    [66, 69, null, 71, 69, null, 66, 64],
    [67, null, 71, 74, null, 71, 69, null],
    [69, 64, null, 66, 64, null, 62, null],
  ],
  harbour: [
    [62, 66, null, 69, 66, null, 64, 62],
    [62, null, 64, 66, 69, 66, null, 64],
    [67, 71, null, 74, 71, null, 69, 67],
    [69, null, 66, 64, 62, null, 64, null],
  ],
  moon: [
    [74, null, 78, null, 81, null, 78, null],
    [78, null, 74, null, 73, null, 71, null],
    [79, null, 78, null, 74, null, 71, null],
    [76, null, 73, null, 74, null, null, null],
  ],
};
const harmony = [
  [50, 57, 62, 66],
  [47, 54, 59, 62],
  [43, 55, 59, 62],
  [45, 57, 61, 64],
];
export function musicTheme(
  scene: SoundScene,
  current: MusicTheme = 'home',
): MusicTheme {
  if (scene.region === 'moon') return 'moon';
  if (![scene.x, scene.z].every(Number.isFinite)) return 'home';
  const distance = (id: 'woods' | 'cove') =>
    Math.hypot(scene.x - placeFor(id).x, scene.z - placeFor(id).z);
  // A broad exit radius prevents repeated theme changes at a district boundary.
  if (current === 'woods' && distance('woods') < 30) return 'woods';
  if (current === 'harbour' && distance('cove') < 30) return 'harbour';
  if (distance('woods') < 24) return 'woods';
  if (distance('cove') < 24) return 'harbour';
  return 'home';
}
/** Original, deliberately spacious eight-phrase scores. MIDI is pitch, not a sample source. */
export function musicNotes(theme: MusicTheme, step: number): MusicNote[] {
  if (!Number.isSafeInteger(step) || step < 0) return [];
  const phrase = Math.floor(step / 16) % 8,
    position = step % 16,
    chord = harmony[phrase % 4];
  const notes: MusicNote[] = [];
  if (position % 2 === 0) {
    const index = position / 2,
      melody = melodies[theme][phrase % 4];
    // The second pass leaves additional breathing room and answers the first phrase.
    const pitch = melody[phrase >= 4 && index >= 4 ? 11 - index : index];
    if (pitch !== null && !(phrase >= 4 && index === 3))
      notes.push({
        midi: pitch,
        duration: theme === 'moon' ? 2.8 : 1.8,
        level: 0.075,
        pan: theme === 'woods' ? -0.18 : theme === 'harbour' ? 0.18 : 0,
        instrument:
          theme === 'moon' ? 'glass' : theme === 'woods' ? 'wood' : 'felt',
      });
  }
  if (position === 0 || position === 8)
    notes.push({
      midi: chord[position === 0 ? 0 : 1],
      duration: 3.2,
      level: 0.055,
      pan: -0.12,
      instrument: 'pad',
    });
  if (position === 4 || position === 12)
    for (const [i, pitch] of chord.slice(2).entries())
      notes.push({
        midi: pitch,
        duration: 2.7,
        level: 0.028,
        pan: i ? 0.26 : -0.26,
        instrument: 'felt',
      });
  return notes;
}
export class MusicTransport {
  private last: number | null = null;
  private age = 0;
  private step = 0;
  theme: MusicTheme = 'home';
  poll(now: number, active: boolean, requested: MusicTheme) {
    if (!Number.isFinite(now)) return [];
    const dt =
      this.last === null ? 0 : Math.max(0, Math.min(0.25, now - this.last));
    this.last = now;
    if (!active) return [];
    this.age += dt;
    const result: (MusicNote & {
      delay: number;
      theme: MusicTheme;
      step: number;
    })[] = [];
    while (this.step * MUSIC_STEP <= this.age + 0.1) {
      if (this.step % 16 === 0) this.theme = requested;
      for (const note of musicNotes(this.theme, this.step))
        result.push({
          ...note,
          delay: Math.max(0, this.step * MUSIC_STEP - this.age),
          theme: this.theme,
          step: this.step,
        });
      this.step++;
    }
    return result;
  }
}
