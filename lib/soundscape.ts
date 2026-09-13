import { placeFor, type Region } from './adventure';
export type SoundScene = {
  active: boolean;
  region: Region;
  x: number;
  z: number;
  moving: boolean;
  driving?: boolean;
  rain?: number;
  puddle?: boolean;
  splash?: number;
};
export function environmentalMix(scene: SoundScene) {
  const source = (
    id: 'woods' | 'cove' | 'meadow' | 'rocket' | 'moon',
    radius: number,
  ) => {
    const place = placeFor(id),
      dx = place.x - scene.x,
      distance = Math.hypot(dx, place.z - scene.z);
    return {
      gain: scene.active ? Math.max(0, 1 - distance / radius) ** 2 : 0,
      pan: Math.max(-0.85, Math.min(0.85, dx / 20)),
    };
  };
  return {
    rain: {
      gain:
        scene.active && scene.region === 'island' && Number.isFinite(scene.rain)
          ? Math.max(0, Math.min(1, scene.rain!))
          : 0,
      pan: 0,
    },
    shore: scene.region === 'island' ? source('cove', 58) : { gain: 0, pan: 0 },
    birds:
      scene.region === 'island' ? source('woods', 45) : { gain: 0, pan: 0 },
    oven:
      scene.region === 'island' ? source('meadow', 20) : { gain: 0, pan: 0 },
    machine:
      scene.driving && scene.region === 'moon'
        ? { gain: scene.active && scene.moving ? 0.75 : 0, pan: 0 }
        : source(scene.region === 'moon' ? 'moon' : 'rocket', 24),
  };
}
/** Quiet original procedural foley. Shares the narration context, mute and lifecycle. */
export class Soundscape {
  private volume = 0.65;
  setVolume(value: number) {
    this.volume = value;
    this.tick();
  }
  private scene: SoundScene = {
    active: false,
    region: 'island',
    x: 0,
    z: 0,
    moving: false,
  };
  private master: GainNode;
  private nodes: AudioNode[] = [];
  private sources: (AudioBufferSourceNode | OscillatorNode)[] = [];
  private timer: ReturnType<typeof setInterval>;
  private lastStep = 0;
  private nextBird = 0;
  private lastSplash = 0;
  private loops: Record<
    'shore' | 'oven' | 'machine' | 'rain',
    { gain: GainNode; pan: StereoPannerNode }
  >;
  private noise: AudioBuffer;
  constructor(
    private ctx: AudioContext,
    private quiet: () => boolean,
  ) {
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    let smooth = 0;
    for (let i = 0; i < data.length; i++) {
      smooth = 0.985 * smooth + (Math.random() * 2 - 1) * 0.015;
      data[i] = smooth * 5;
    }
    const loop = (frequency: number, machine = false) => {
      const gain = ctx.createGain(),
        pan = ctx.createStereoPanner(),
        filter = ctx.createBiquadFilter();
      gain.gain.value = 0;
      filter.type = 'lowpass';
      filter.frequency.value = frequency;
      let source: AudioBufferSourceNode | OscillatorNode;
      if (machine) {
        const oscillator = ctx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = 92;
        source = oscillator;
      } else {
        const noise = ctx.createBufferSource();
        noise.buffer = this.noise;
        noise.loop = true;
        source = noise;
      }
      source.connect(filter).connect(gain).connect(pan).connect(this.master);
      source.start();
      this.sources.push(source);
      this.nodes.push(source, filter, gain, pan);
      return { gain, pan };
    };
    this.loops = {
      shore: loop(1100),
      oven: loop(370),
      machine: loop(170, true),
      rain: loop(2400),
    };
    this.timer = setInterval(() => this.tick(), 120);
  }
  update(scene: SoundScene) {
    this.scene = scene;
    this.tick();
  }
  private tick() {
    const { ctx, scene } = this,
      t = ctx.currentTime;
    // Complete silence during speech keeps phonemes and words easy to hear.
    const active = scene.active && !this.quiet() && !document.hidden;
    if (active) this.master.gain.setTargetAtTime(this.volume, t, 0.08);
    else {
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setValueAtTime(0, t);
    }
    const mix = environmentalMix(scene);
    for (const key of ['shore', 'oven', 'machine', 'rain'] as const) {
      const wave =
        key === 'shore'
          ? 0.5 + 0.5 * Math.sin(t * 0.6) ** 2
          : key === 'oven'
            ? 0.65 + 0.35 * Math.sin(t * 3.7) ** 2
            : 1;
      this.loops[key].gain.gain.setTargetAtTime(
        mix[key].gain *
          wave *
          (key === 'machine' ? 0.018 : key === 'rain' ? 0.09 : 0.11),
        t,
        0.3,
      );
      this.loops[key].pan.pan.setTargetAtTime(mix[key].pan, t, 0.3);
    }
    const splashed = (scene.splash ?? 0) !== this.lastSplash;
    this.lastSplash = scene.splash ?? 0;
    if (!active) return;
    if (splashed && scene.region === 'island' && scene.puddle)
      this.puff(1800, 0.12, 0.22);
    if (scene.moving && !scene.driving && t - this.lastStep > 0.36) {
      this.lastStep = t;
      const wet = scene.region === 'island' && scene.puddle;
      this.puff(
        scene.region === 'moon' ? 170 : wet ? 1400 : 310,
        0.075,
        wet ? 0.12 : 0.075,
      );
    }
    if (mix.birds.gain > 0.05 && t > this.nextBird) {
      this.nextBird = t + 3 + Math.random() * 5;
      for (let i = 0; i < 2; i++)
        this.chirp(t + i * 0.19, mix.birds.gain, mix.birds.pan);
    }
    if (mix.oven.gain > 0.1 && Math.random() < 0.08)
      this.puff(550, mix.oven.gain * 0.045, 0.12, mix.oven.pan);
  }
  private puff(frequency: number, level: number, duration: number, stereo = 0) {
    const ctx = this.ctx,
      t = ctx.currentTime,
      source = ctx.createBufferSource(),
      gain = ctx.createGain(),
      filter = ctx.createBiquadFilter(),
      pan = ctx.createStereoPanner();
    source.buffer = this.noise;
    filter.type = 'lowpass';
    filter.frequency.value = frequency;
    pan.pan.value = stereo;
    gain.gain.setValueAtTime(level, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    source.connect(filter).connect(gain).connect(pan).connect(this.master);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
      pan.disconnect();
    };
    source.start();
    source.stop(t + duration);
  }
  private chirp(t: number, level: number, stereo: number) {
    const ctx = this.ctx,
      source = ctx.createOscillator(),
      gain = ctx.createGain(),
      pan = ctx.createStereoPanner();
    source.frequency.setValueAtTime(1900, t);
    source.frequency.exponentialRampToValueAtTime(3100, t + 0.07);
    source.frequency.exponentialRampToValueAtTime(2300, t + 0.13);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level * 0.012, t + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    pan.pan.value = stereo;
    source.connect(gain).connect(pan).connect(this.master);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      pan.disconnect();
    };
    source.start(t);
    source.stop(t + 0.15);
  }
  dispose() {
    clearInterval(this.timer);
    this.sources.forEach((n) => n.stop());
    this.nodes.forEach((n) => n.disconnect());
    this.master.disconnect();
  }
}
