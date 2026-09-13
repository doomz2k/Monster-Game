import {
  MusicTransport,
  musicTheme,
  type MusicInstrument,
  type MusicNote,
} from './music-score';
import type { SoundScene } from './soundscape';

/** Small Web Audio instruments with a bounded voice pool and no external recordings. */
export class IslandMusic {
  private scene: SoundScene = {
    active: false,
    region: 'island',
    x: 0,
    z: 0,
    moving: false,
  };
  private volume = 0.35;
  private transport = new MusicTransport();
  private master: GainNode;
  private tone: BiquadFilterNode;
  private echo: DelayNode;
  private echoLevel: GainNode;
  private timer: ReturnType<typeof setInterval>;
  private sources = new Set<OscillatorNode>();
  private waves: Record<MusicInstrument, PeriodicWave>;
  private audible = false;
  constructor(
    private ctx: AudioContext,
    private quiet: () => boolean,
  ) {
    const wave = (partials: number[]) =>
      ctx.createPeriodicWave(
        new Float32Array(partials.length + 1),
        new Float32Array([0, ...partials]),
      );
    this.waves = {
      felt: wave([1, 0.24, 0.075, 0.025, 0.009]),
      wood: wave([1, 0.035, 0.15, 0.008, 0.02]),
      glass: wave([1, 0.06, 0.12, 0.016, 0.045]),
      pad: wave([1, 0.13, 0.035]),
    };
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    this.tone = ctx.createBiquadFilter();
    this.tone.type = 'lowpass';
    this.tone.frequency.value = 2400;
    this.tone.Q.value = 0.35;
    this.echo = ctx.createDelay(0.5);
    this.echo.delayTime.value = 0.225;
    this.echoLevel = ctx.createGain();
    this.echoLevel.gain.value = 0.12;
    this.tone.connect(this.master);
    this.tone.connect(this.echo).connect(this.echoLevel).connect(this.master);
    this.timer = setInterval(() => this.tick(), 25);
  }
  update(scene: SoundScene) {
    this.scene = scene;
    this.tick();
  }
  setVolume(volume: number) {
    this.volume = Number.isFinite(volume)
      ? Math.max(0, Math.min(1, volume))
      : 0.35;
    this.tick();
  }
  private tick() {
    const now = this.ctx.currentTime,
      active =
        this.scene.active &&
        !this.quiet() &&
        !document.hidden &&
        this.volume > 0;
    const notes = this.transport.poll(
      now,
      active,
      musicTheme(this.scene, this.transport.theme),
    );
    if (!active) {
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(0, now);
      if (this.audible) {
        for (const source of this.sources) {
          try {
            source.stop(now);
          } catch {
            /* Already ended. */
          }
        }
      }
      this.audible = false;
      return;
    }
    this.audible = true;
    this.master.gain.setTargetAtTime(this.volume * 0.75, now, 0.25);
    for (const note of notes) this.note(note, now + note.delay + 0.01);
  }
  private note(note: MusicNote, at: number) {
    if (this.sources.size >= 24) return;
    const ctx = this.ctx,
      osc = ctx.createOscillator(),
      gain = ctx.createGain(),
      pan = ctx.createStereoPanner();
    osc.setPeriodicWave(this.waves[note.instrument]);
    osc.frequency.value = 440 * 2 ** ((note.midi - 69) / 12);
    pan.pan.value = note.pan;
    const soft = note.instrument === 'pad',
      attack = soft ? 0.2 : 0.016;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(note.level, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + note.duration);
    osc.connect(gain).connect(pan).connect(this.tone);
    this.sources.add(osc);
    osc.onended = () => {
      this.sources.delete(osc);
      osc.disconnect();
      gain.disconnect();
      pan.disconnect();
    };
    osc.start(at);
    osc.stop(at + note.duration + 0.02);
  }
  dispose() {
    clearInterval(this.timer);
    this.master.gain.setValueAtTime(0, this.ctx.currentTime);
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        /* Already ended. */
      }
      source.disconnect();
    }
    this.sources.clear();
    this.tone.disconnect();
    this.echo.disconnect();
    this.echoLevel.disconnect();
    this.master.disconnect();
  }
}
