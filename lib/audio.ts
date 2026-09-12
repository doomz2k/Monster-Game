import { SOUNDS } from './phonics';
import builtIn from './audio-data/phonemes.json';
import voiceClips from './audio-data/voice-clips.json';
import adventureScript from './audio-data/adventure-script.json';
export type SoundReview = {
  approved: boolean;
  data?: string;
  checkedAt?: string;
  standard?: 'british-pure-v1';
};
export type SoundReviews = Record<string, SoundReview>;
const STORAGE = 'monster-game-sounds-v1';
export function loadReviews(): SoundReviews {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE) ?? '{}');
    const out: SoundReviews = {};
    for (const s of SOUNDS) {
      const v = raw[s.grapheme];
      if (v && typeof v.approved === 'boolean')
        out[s.grapheme] = {
          approved: v.approved && v.standard === 'british-pure-v1',
          standard: v.standard === 'british-pure-v1' ? v.standard : undefined,
          data:
            typeof v.data === 'string' &&
            v.data.startsWith('data:audio/') &&
            v.data.length < 2800000
              ? v.data
              : undefined,
          checkedAt: typeof v.checkedAt === 'string' ? v.checkedAt : undefined,
        };
    }
    return out;
  } catch {
    return {};
  }
}
export function saveReviews(reviews: SoundReviews) {
  localStorage.setItem(STORAGE, JSON.stringify(reviews));
}
export function candidatePath(g: string, reviews: SoundReviews): string | null {
  return (
    reviews[g]?.data ??
    (builtIn as Record<string, { path: string }>)[g]?.path ??
    null
  );
}
export function approvedPath(g: string, reviews: SoundReviews): string | null {
  return reviews[g]?.approved && reviews[g]?.standard === 'british-pure-v1'
    ? candidatePath(g, reviews)
    : null;
}
export async function importRecording(file: File): Promise<string> {
  if (file.size > 2_000_000)
    throw new Error('Please choose a sound recording smaller than 2 MB.');
  if (
    !file.type.startsWith('audio/') &&
    !/\.(wav|mp3|ogg|m4a|webm)$/i.test(file.name)
  )
    throw new Error('Please choose an audio recording.');
  const bytes = await file.arrayBuffer();
  const ctx = new AudioContext();
  try {
    const decoded = await ctx.decodeAudioData(bytes.slice(0));
    if (decoded.duration < 0.05 || decoded.duration > 5)
      throw new Error(
        'Choose a single sound lasting between 0.05 and 5 seconds.',
      );
  } finally {
    await ctx.close();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not read the recording.'));
        return;
      }
      resolve(
        reader.result.replace(
          /^data:[^;]+;/,
          'data:audio/' + (file.type.split('/')[1] || 'wav') + ';',
        ),
      );
    };
    reader.onerror = () => reject(new Error('Could not read the recording.'));
    reader.readAsDataURL(file);
  });
}
export type AudioStep =
  | { type: 'narration'; text: string }
  | { type: 'phoneme'; grapheme: string }
  | { type: 'clip'; url: string };
export class AudioDirector {
  private generation = 0;
  private playingGeneration: number | null = null;
  private player: HTMLAudioElement | null = null;
  private settle: (() => void) | null = null;
  private context: AudioContext | null = null;
  public muted = false;
  setMuted(value: boolean) {
    this.muted = value;
    this.stop();
    if (!value) this.unlock();
  }
  constructor(
    private reviews: () => SoundReviews,
    private error: (message: string) => void,
  ) {}
  setReviews(reviews: SoundReviews) {
    this.reviews = () => reviews;
  }
  unlock() {
    try {
      this.context ??= new AudioContext();
      void this.context.resume();
    } catch {
      /* Spoken and visual instructions still work. */
    }
  }
  stop() {
    this.generation++;
    this.playingGeneration = null;
    this.player?.pause();
    this.player = null;
    window.speechSynthesis?.cancel();
    this.settle?.();
    this.settle = null;
  }
  async run(steps: AudioStep[]) {
    this.stop();
    if (this.muted) return;
    const generation = this.generation;
    this.playingGeneration = generation;
    try {
      for (const step of steps) {
        if (generation !== this.generation || this.muted) return;
        try {
          if (step.type === 'phoneme') {
            const path = approvedPath(step.grapheme, this.reviews());
            if (!path)
              throw new Error(
                'This sound needs a grown-up to say it. Check or add its recording in Grown-ups → Sound studio.',
              );
            await this.clip(path, generation);
          } else if (step.type === 'clip') {
            await this.clip(step.url, generation);
          } else {
            const path = Object.values(voiceClips).find(
              (line) => line.text.toLowerCase() === step.text.toLowerCase(),
            )?.path;
            if (path) await this.clip(path, generation);
            else this.error(step.text);
          }
        } catch (e) {
          if (generation === this.generation)
            this.error(
              e instanceof Error
                ? e.message
                : 'The audio could not play. Try Listen again.',
            );
          return;
        }
      }
    } finally {
      if (this.playingGeneration === generation) this.playingGeneration = null;
    }
  }
  say(text: string) {
    return this.run([{ type: 'narration', text }]);
  }
  line(id: string) {
    const clip = (voiceClips as Record<string, { path: string }>)[id];
    if (clip) return this.run([{ type: 'clip', url: clip.path }]);
    // Missing recordings stay visible; never replace the natural voice bank with a robotic voice.
    this.stop();
    const line = (adventureScript as Record<string, { text: string }>)[id];
    if (line && !this.muted) this.error(line.text);
    return Promise.resolve();
  }
  lines(ids: string[], phonemes: string[] = []) {
    const steps: AudioStep[] = [];
    for (const id of ids) {
      const clip = (voiceClips as Record<string, { path: string }>)[id];
      if (!clip) {
        this.stop();
        this.error(
          'This instruction recording is unavailable. Please try again.',
        );
        return Promise.resolve();
      }
      steps.push({ type: 'clip', url: clip.path });
    }
    steps.push(
      ...phonemes.map((grapheme): AudioStep => ({ type: 'phoneme', grapheme })),
    );
    return this.run(steps);
  }
  get busy() {
    return this.playingGeneration !== null;
  }
  /** Optional world guidance must never interrupt a lesson or another prompt. */
  trySay(text: string) {
    if (this.playingGeneration !== null || this.muted) return false;
    void this.say(text);
    return true;
  }
  private clip(url: string, generation: number) {
    return new Promise<void>((resolve, reject) => {
      if (generation !== this.generation) {
        resolve();
        return;
      }
      const audio = new Audio(url);
      this.player = audio;
      let finished = false;
      const end = (err?: Error) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
        if (this.player === audio) this.player = null;
        this.settle = null;
        if (err) reject(err);
        else resolve();
      };
      this.settle = () => end();
      audio.onended = () => end();
      audio.onerror = () =>
        end(
          new Error(
            'That recording could not play. Please try another audio file in Sound studio.',
          ),
        );
      const timer = setTimeout(
        () =>
          end(
            new Error('Audio took too long to load. Please try Listen again.'),
          ),
        15000,
      );
      audio
        .play()
        .catch(() =>
          end(new Error('Tap Listen once to enable sound in this browser.')),
        );
    });
  }
  chime() {
    if (this.muted || !this.context) return;
    const ctx = this.context,
      t = ctx.currentTime;
    [523, 659, 784, 1047].forEach((frequency, i) => {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = frequency;
      g.gain.setValueAtTime(0, t + i * 0.1);
      g.gain.linearRampToValueAtTime(0.045, t + i * 0.1 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.38);
      o.connect(g).connect(ctx.destination);
      o.start(t + i * 0.1);
      o.stop(t + i * 0.1 + 0.4);
    });
  }
  dispose() {
    this.stop();
    void this.context?.close();
    this.context = null;
  }
}
