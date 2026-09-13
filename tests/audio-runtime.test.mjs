import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import runtime from '../lib/audio-data/audio-runtime.json' with { type: 'json' };
import audit from '../lib/audio-data/audio-audit.json' with { type: 'json' };
import voices from '../lib/audio-data/voice-clips.json' with { type: 'json' };
import phonemes from '../lib/audio-data/phonemes.json' with { type: 'json' };
import {
  AudioDirector,
  candidatePath,
  approvedPath,
  reviewSource,
} from '../lib/audio.ts';

test('the compact playback index preserves every recorded path, exact fingerprint and technical block', () => {
  assert.deepEqual(Object.keys(runtime.voices), Object.keys(voices));
  assert.deepEqual(Object.keys(runtime.phonemes), Object.keys(phonemes));
  for (const [id, clip] of Object.entries(voices))
    assert.equal(runtime.voices[id], clip.path);
  for (const [g, clip] of Object.entries(phonemes)) {
    assert.deepEqual(runtime.phonemes[g], {
      path: clip.path,
      sha256: audit.phonemes[g].sha256,
      blocked: audit.phonemes[g].warnings.includes('near-clipping'),
    });
    assert.equal(candidatePath(g, {}), clip.path);
    assert.equal(reviewSource(g, {}), audit.phonemes[g].sha256);
    assert.equal(approvedPath(g, {}), null);
  }
});
test('moving audit data out of play preserves the named exact-recording approval gate for every sound', () => {
  for (const [g, clip] of Object.entries(runtime.phonemes)) {
    const review = {
      approved: true,
      standard: 'rwi-set1-v2',
      reviewer: 'Unit test reviewer',
      approvedSource: clip.sha256,
    };
    assert.equal(
      approvedPath(g, { [g]: review }),
      clip.blocked ? null : clip.path,
    );
    assert.equal(approvedPath(g, { [g]: { ...review, reviewer: '' } }), null);
    assert.equal(
      approvedPath(g, {
        [g]: { ...review, approvedSource: 'old fingerprint' },
      }),
      null,
    );
    assert.equal(
      approvedPath(g, { [g]: { ...review, standard: 'british-pure-v1' } }),
      null,
    );
    const data = 'data:audio/wav;base64,TEST_BYTES';
    assert.equal(
      approvedPath(g, { [g]: { ...review, data, approvedSource: data } }),
      data,
    );
    assert.equal(
      approvedPath(g, {
        [g]: { ...review, data, approvedSource: clip.sha256 },
      }),
      null,
    );
  }
  assert.equal(approvedPath('not-a-sound', {}), null);
  assert.equal(runtime.phonemes.nk.blocked, true);
});
test('the runtime index remains substantially smaller than the review manifests', () => {
  const size = (name) =>
    readFileSync(new URL('../lib/audio-data/' + name, import.meta.url)).length;
  assert.ok(
    size('audio-runtime.json') <
      (size('audio-audit.json') + size('voice-clips.json')) * 0.4,
  );
  assert.ok(!Object.hasOwn(runtime, 'method'));
});

test('normal narration, exact lines and ordered clips keep the same recording requests without a synthetic fallback', async () => {
  const previousWindow = globalThis.window,
    previousAudio = globalThis.Audio,
    requested = [],
    errors = [];
  globalThis.window = { speechSynthesis: { cancel() {} } };
  globalThis.Audio = class {
    constructor(url) {
      requested.push(url);
    }
    play() {
      queueMicrotask(() => this.onended?.());
      return Promise.resolve();
    }
    pause() {}
  };
  const director = new AudioDirector(
    () => ({}),
    (error) => errors.push(error),
  );
  try {
    const id = 'flower-golden-tulip';
    await director.say(voices[id].text.toUpperCase());
    await director.line(id);
    await director.lines(['observatory-fact-earth', 'visit-move-clap']);
    assert.deepEqual(requested, [
      voices[id].path,
      voices[id].path,
      voices['observatory-fact-earth'].path,
      voices['visit-move-clap'].path,
    ]);
    assert.deepEqual(errors, []);
    await director.say('An unrecorded instruction');
    assert.deepEqual(errors, ['An unrecorded instruction']);
    assert.equal(requested.length, 4);
  } finally {
    director.dispose();
    globalThis.window = previousWindow;
    globalThis.Audio = previousAudio;
  }
});
