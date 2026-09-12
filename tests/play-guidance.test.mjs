import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ArrivalGuide,
  explorationSpeech,
  movePictureSelection,
} from '../lib/play-guidance.ts';
import { AudioDirector } from '../lib/audio.ts';

test('arrival waits for a settled approach, retries busy audio, and never nags while lingering', () => {
  const guide = new ArrivalGuide();
  assert.equal(guide.offer('meadow', 0), null);
  assert.equal(guide.offer('meadow', 500), null);
  assert.equal(guide.offer(null, 600), null);
  assert.equal(guide.offer('meadow', 700), null);
  assert.equal(guide.offer('meadow', 1400), 'meadow');
  // No acknowledgement means narration was busy: the invitation is still available.
  assert.equal(guide.offer('meadow', 1500), 'meadow');
  guide.acknowledge('meadow', 1500);
  assert.equal(guide.offer('meadow', 60000), null);
  guide.offer(null, 60100);
  guide.offer('meadow', 61000);
  assert.equal(guide.offer('meadow', 61700), 'meadow');
  guide.acknowledge('meadow', 61700);
  guide.offer(null, 61800);
  guide.offer('meadow', 62000);
  assert.equal(guide.offer('meadow', 63000), null);
  assert.equal(guide.offer('meadow', 100000), null);
  guide.offer('woods', 100100);
  assert.equal(guide.offer('woods', 100800), 'woods');
});

test('manual travel suppresses a duplicate arrival and guidance describes the nearby activity', () => {
  const guide = new ArrivalGuide();
  guide.acknowledge('cove', 1000);
  guide.offer('cove', 1100);
  assert.equal(guide.offer('cove', 2000), null);
  assert.match(explorationSpeech('cove', 'woods'), /treasures by the sea/);
  assert.doesNotMatch(explorationSpeech('cove', 'woods'), /Whispering/);
  assert.match(explorationSpeech(null, 'woods'), /Whispering Woods/);
});

test('picture menus navigate visual rows and wrap safely with an Xbox D-pad', () => {
  for (const length of [4, 6]) {
    assert.equal(movePictureSelection(0, 'down', length), 2);
    assert.equal(movePictureSelection(1, 'down', length), 3);
    assert.equal(movePictureSelection(2, 'up', length), 0);
    assert.equal(movePictureSelection(0, 'left', length), length - 1);
    for (let i = 0; i < length; i++) {
      assert.equal(
        movePictureSelection(
          movePictureSelection(i, 'down', length),
          'up',
          length,
        ),
        i,
      );
    }
  }
});

test('optional narration cannot interrupt a lesson, superseding prompt, or muted audio', async () => {
  const previousWindow = globalThis.window;
  const previousAudio = globalThis.Audio;
  const players = [];
  globalThis.window = { speechSynthesis: { cancel() {} } };
  globalThis.Audio = class {
    constructor() {
      players.push(this);
    }
    play() {
      return Promise.resolve();
    }
    pause() {}
  };
  const director = new AudioDirector(
    () => ({}),
    () => {},
  );
  try {
    const lesson = director.run([{ type: 'clip', url: '/lesson.ogg' }]);
    assert.equal(director.trySay('1'), false);
    const replacement = director.run([
      { type: 'clip', url: '/replacement.ogg' },
    ]);
    await lesson;
    assert.equal(
      director.trySay('1'),
      false,
      'old completion must not clear newer busy state',
    );
    players.at(-1).onended();
    await replacement;
    assert.equal(director.trySay('1.'), true);
    assert.equal(director.trySay('2.'), false);
    director.setMuted(true);
    assert.equal(director.trySay('1'), false);
    director.muted = false;
    assert.equal(director.trySay('1.'), true);
  } finally {
    director.dispose();
    globalThis.window = previousWindow;
    globalThis.Audio = previousAudio;
  }
});
