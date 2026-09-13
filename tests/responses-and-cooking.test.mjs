import test from 'node:test';
import assert from 'node:assert/strict';
import { ActiveCountdown } from '../lib/active-countdown.ts';
import { ResponseRotation } from '../lib/response-rotation.ts';
import { AudioDirector } from '../lib/audio.ts';
import bank from '../lib/audio-data/response-bank.json' with { type: 'json' };
import script from '../lib/audio-data/adventure-script.json' with { type: 'json' };
import clips from '../lib/audio-data/voice-clips.json' with { type: 'json' };

test('cooking pauses indefinitely, resumes its remaining time and completes exactly once', () => {
  const timer = new ActiveCountdown(2200);
  for (let i = 0; i < 10; i++) assert.equal(timer.advance(100, true), false);
  for (let i = 0; i < 100; i++) assert.equal(timer.advance(1000, false), false);
  assert.equal(timer.elapsed, 1000);
  for (let i = 0; i < 11; i++) assert.equal(timer.advance(100, true), false);
  assert.equal(timer.advance(100, true), true);
  assert.equal(timer.elapsed, 2200);
  assert.equal(timer.advance(100, true), false);
  assert.equal(timer.advance(100, false), false);
});
test('invalid or stalled frames cannot instantly finish an oven', () => {
  const timer = new ActiveCountdown(2200);
  for (const n of [NaN, Infinity, -1, 0])
    assert.equal(timer.advance(n, true), false);
  assert.equal(timer.elapsed, 0);
  assert.equal(timer.advance(30000, true), false);
  assert.equal(timer.elapsed, 100);
});
test('responses exhaust each family before repeating and replay preserves the exact take', () => {
  const rotation = new ResponseRotation();
  for (const [key, choices] of Object.entries(bank)) {
    const spoken = [];
    for (let i = 0; i < choices.length; i++) {
      const next = rotation.choose(key);
      spoken.push(next);
      assert.equal(rotation.choose(key, true), next);
      assert.equal(rotation.choose(key, true), next);
    }
    assert.deepEqual(spoken, choices);
    assert.equal(new Set(spoken).size, choices.length);
    assert.equal(rotation.choose(key), choices[0]);
  }
  assert.equal(rotation.choose('pip-repair-3'), 'pip-repair-3');
  assert.equal(rotation.choose('number-2', true), 'number-2');
});
test('every response is a real short British recording, with consistent speakers and safe rover hints', () => {
  for (const [key, choices] of Object.entries(bank)) {
    const voice = script[choices[0]].voice;
    for (const id of choices) {
      assert.equal(script[id].voice, voice, key);
      assert.ok(clips[id], id);
      assert.match(clips[id].voice, /^b[fm]_/);
      assert.ok(script[id].text.split(/\s+/).length < 35, id);
    }
  }
  for (const key of ['rover-more', 'rover-fewer'])
    for (const id of bank[key])
      assert.doesNotMatch(script[id].text, /empty spaces|marked pictures/);
});
test('exact listening review bypasses response rotation and stopping an old take keeps newer speech busy', async () => {
  const previousWindow = globalThis.window,
    previousAudio = globalThis.Audio;
  const players = [];
  globalThis.window = { speechSynthesis: { cancel() {} } };
  globalThis.Audio = class {
    constructor(url) {
      this.url = url;
      players.push(this);
    }
    play() {
      return Promise.resolve();
    }
    pause() {}
  };
  const errors = [];
  const audio = new AudioDirector(
    () => ({}),
    (e) => errors.push(e),
  );
  try {
    const exact = audio.line('bramble-success');
    assert.equal(players.at(-1).url, clips['bramble-success'].path);
    const first = audio.response('bramble-success');
    await exact;
    assert.equal(players.at(-1).url, clips[bank['bramble-success'][0]].path);
    assert.equal(audio.busy, true);
    const replay = audio.response('bramble-success', true);
    await first;
    assert.equal(players.at(-1).url, clips[bank['bramble-success'][0]].path);
    players.at(-1).onended();
    await replay;
    assert.equal(audio.busy, false);
    assert.deepEqual(errors, []);
    const second = audio.response('bramble-success');
    assert.equal(players.at(-1).url, clips[bank['bramble-success'][1]].path);
    audio.stop();
    await second;
  } finally {
    audio.dispose();
    globalThis.window = previousWindow;
    globalThis.Audio = previousAudio;
  }
});
