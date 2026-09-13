import test from 'node:test';
import assert from 'node:assert/strict';
import { freshProgress, readProgress } from '../lib/learning.ts';
import { defaultPreferences, readPreferences } from '../lib/preferences.ts';
import { placeFor } from '../lib/adventure.ts';
import {
  MUSIC_THEMES,
  musicTheme,
  musicNotes,
  MusicTransport,
} from '../lib/music-score.ts';
import { IslandMusic } from '../lib/music.ts';
import { AudioDirector } from '../lib/audio.ts';
const scene = { active: true, region: 'island', x: 0, z: 0, moving: false };

test('music follows the Moon and island districts with a stable boundary margin', () => {
  assert.equal(musicTheme({ ...scene, region: 'moon' }), 'moon');
  assert.equal(musicTheme({ ...scene, x: NaN }), 'home');
  for (const [id, theme] of [
    ['woods', 'woods'],
    ['cove', 'harbour'],
  ]) {
    const place = placeFor(id);
    assert.equal(musicTheme({ ...scene, x: place.x, z: place.z }), theme);
    assert.equal(
      musicTheme({ ...scene, x: place.x, z: place.z + 26 }, theme),
      theme,
    );
    assert.equal(
      musicTheme({ ...scene, x: place.x, z: place.z + 26 }, 'home'),
      'home',
    );
    assert.equal(
      musicTheme({ ...scene, x: place.x, z: place.z + 31 }, theme),
      'home',
    );
  }
});
test('all four original scores have bounded pitch, dynamics and polyphony with breathing space and phrase variation', () => {
  const distinct = new Set();
  for (const theme of MUSIC_THEMES) {
    let rests = 0;
    const events = [];
    for (let step = 0; step < 128; step++) {
      const notes = musicNotes(theme, step);
      if (!notes.length) rests++;
      assert.ok(notes.length <= 3);
      for (const note of notes) {
        assert.ok(
          Number.isInteger(note.midi) && note.midi >= 40 && note.midi <= 84,
        );
        assert.ok(note.duration > 0 && note.duration <= 3.2);
        assert.ok(note.level > 0 && note.level <= 0.075);
        assert.ok(Math.abs(note.pan) <= 0.3);
        events.push({ ...note, at: step * 0.45 });
      }
    }
    assert.ok(rests >= 64);
    for (let t = 0; t < 57.6; t += 0.1)
      assert.ok(
        events.filter((n) => n.at <= t && n.at + n.duration + 0.02 > t).length <
          24,
      );
    distinct.add(JSON.stringify(events));
    assert.notDeepEqual(
      Array.from({ length: 64 }, (_, i) => musicNotes(theme, i)),
      Array.from({ length: 64 }, (_, i) => musicNotes(theme, i + 64)),
    );
    for (const bad of [-1, 1.5, NaN, Infinity])
      assert.deepEqual(musicNotes(theme, bad), []);
  }
  assert.equal(distinct.size, 4);
});
test('transport changes themes only at phrase boundaries and never catches up a paused or stalled clock', () => {
  const clock = new MusicTransport();
  assert.ok(clock.poll(0, true, 'home').every((n) => n.theme === 'home'));
  const notes = [];
  for (let t = 0.025; t < 7.3; t += 0.025)
    notes.push(...clock.poll(t, true, 'woods'));
  assert.ok(notes.filter((n) => n.step < 16).every((n) => n.theme === 'home'));
  assert.ok(notes.some((n) => n.step === 16 && n.theme === 'woods'));
  assert.ok(notes.every((n) => n.delay >= 0 && n.delay <= 0.101));
  assert.deepEqual(clock.poll(10000, false, 'moon'), []);
  assert.deepEqual(clock.poll(NaN, true, 'moon'), []);
  const wake = clock.poll(10000.025, true, 'moon');
  assert.ok(wake.every((n) => n.step < 19));
  assert.ok(clock.poll(20000, true, 'moon').length <= 3);
});
test('music volume migrates independently, round-trips and cannot change rewards or speech levels', () => {
  const p = freshProgress(),
    old = structuredClone(p);
  delete old.preferences.musicVolume;
  assert.deepEqual(readProgress(JSON.stringify(old)), p);
  assert.equal(defaultPreferences().musicVolume, 0.35);
  for (const [raw, wanted] of [
    [0, 0],
    [0.7, 0.7],
    [8, 1],
    [-1, 0],
    [NaN, 0.35],
    ['1', 0.35],
  ])
    assert.equal(readPreferences({ musicVolume: raw }).musicVolume, wanted);
  p.preferences.musicVolume = 0;
  p.preferences.speechVolume = 0.8;
  const saved = readProgress(JSON.stringify(p));
  assert.deepEqual(saved, p);
  assert.equal(saved.preferences.environmentVolume, 0.65);
});

class Param {
  value = 0;
  events = [];
  setValueAtTime(value, at) {
    this.events.push({ method: 'set', value, at });
    this.value = value;
  }
  setTargetAtTime(value, at, time) {
    this.events.push({ method: 'target', value, at, time });
    this.value = value;
  }
  linearRampToValueAtTime(value, at) {
    this.events.push({ method: 'ramp', value, at });
  }
  exponentialRampToValueAtTime(value, at) {
    this.events.push({ method: 'decay', value, at });
  }
  cancelScheduledValues(at) {
    this.events.push({ method: 'cancel', at });
  }
}
class Node {
  gain = new Param();
  frequency = new Param();
  pan = new Param();
  delayTime = new Param();
  Q = new Param();
  stopped = [];
  disconnected = false;
  connect(to) {
    return to;
  }
  disconnect() {
    this.disconnected = true;
  }
  setPeriodicWave(wave) {
    this.wave = wave;
  }
  start(at) {
    this.started = at;
  }
  stop(at) {
    this.stopped.push(at);
  }
}
class Context {
  currentTime = 0;
  destination = {};
  gains = [];
  sources = [];
  nodes = [];
  node() {
    const node = new Node();
    this.nodes.push(node);
    return node;
  }
  createGain() {
    const node = this.node();
    this.gains.push(node);
    return node;
  }
  createBiquadFilter() {
    return this.node();
  }
  createDelay() {
    return this.node();
  }
  createStereoPanner() {
    return this.node();
  }
  createPeriodicWave(real, imag) {
    return { real, imag };
  }
  createOscillator() {
    const node = this.node();
    this.sources.push(node);
    return node;
  }
}
test('the real audio director gates music before a recorded instruction starts and keeps mute and music level independent', async () => {
  const old = {
    document: globalThis.document,
    window: globalThis.window,
    Audio: globalThis.Audio,
    AudioContext: globalThis.AudioContext,
  };
  let context, clip, levelAtSpeech;
  globalThis.document = { hidden: false };
  globalThis.window = { speechSynthesis: { cancel() {} } };
  globalThis.AudioContext = class extends Context {
    sampleRate = 1000;
    waveCount = 0;
    constructor() {
      super();
      context = this;
    }
    createPeriodicWave(real, imag) {
      this.waveCount++;
      return super.createPeriodicWave(real, imag);
    }
    createGain() {
      const node = super.createGain();
      if (this.waveCount === 4 && !this.musicBus) this.musicBus = node;
      return node;
    }
    createBuffer(_channels, length) {
      return { getChannelData: () => new Float32Array(length) };
    }
    createBufferSource() {
      return this.node();
    }
    resume() {
      return Promise.resolve();
    }
    close() {
      return Promise.resolve();
    }
  };
  globalThis.Audio = class {
    constructor() {
      clip = this;
    }
    play() {
      levelAtSpeech = context.musicBus.gain.value;
      return Promise.resolve();
    }
    pause() {}
  };
  const director = new AudioDirector(
    () => ({}),
    () => {},
  );
  try {
    director.setScene(scene);
    director.unlock();
    assert.ok(context.musicBus.gain.value > 0);
    const spoken = director.line('workshop-intro');
    assert.equal(director.busy, true);
    assert.equal(levelAtSpeech, 0);
    clip.onended();
    await spoken;
    director.setScene(scene);
    assert.ok(context.musicBus.gain.value > 0);
    director.setLevels(0.8, 0.65, 0);
    assert.equal(context.musicBus.gain.value, 0);
    const again = director.line('workshop-help');
    assert.equal(clip.volume, 0.8);
    clip.onended();
    await again;
    director.setLevels(0.8, 0.65, 0.35);
    director.setMuted(true);
    assert.equal(context.musicBus.gain.value, 0);
  } finally {
    director.dispose();
    Object.assign(globalThis, old);
  }
});
test('speech, hidden pages, parent pause and music-off silence the whole bus and cancel queued notes; disposal releases voices', () => {
  const oldDocument = globalThis.document;
  globalThis.document = { hidden: false };
  const ctx = new Context();
  let quiet = false;
  const music = new IslandMusic(ctx, () => quiet);
  try {
    music.update(scene);
    assert.ok(ctx.sources.length > 0);
    assert.ok(ctx.gains[0].gain.value > 0);
    for (const source of ctx.sources)
      assert.ok(source.frequency.value > 50 && source.frequency.value < 1000);
    quiet = true;
    music.update(scene);
    assert.equal(ctx.gains[0].gain.value, 0);
    assert.ok(ctx.sources.every((n) => n.stopped.includes(0)));
    const count = ctx.sources.length;
    for (let t = 1; t <= 20; t++) {
      ctx.currentTime = t;
      music.update(scene);
    }
    assert.equal(ctx.sources.length, count);
    ctx.sources.forEach((s) => s.onended());
    quiet = false;
    ctx.currentTime += 0.2;
    music.update(scene);
    assert.ok(ctx.gains[0].gain.value > 0);
    music.update({ ...scene, active: false });
    assert.equal(ctx.gains[0].gain.value, 0);
    globalThis.document.hidden = true;
    music.update(scene);
    assert.equal(ctx.gains[0].gain.value, 0);
    globalThis.document.hidden = false;
    music.setVolume(0);
    music.update(scene);
    assert.equal(ctx.gains[0].gain.value, 0);
    music.setVolume(0.2);
    assert.ok(ctx.gains[0].gain.value > 0);
    music.dispose();
    assert.equal(ctx.gains[0].gain.value, 0);
    assert.ok(ctx.sources.every((s) => s.stopped.length && s.disconnected));
  } finally {
    music.dispose();
    globalThis.document = oldDocument;
  }
});
