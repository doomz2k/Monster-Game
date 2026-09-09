import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SOUNDS, decodableWords, soundChoices } from '../lib/phonics.ts';
import {
  questionFor,
  award,
  freshProgress,
  readProgress,
  clampToIsland,
  deadzone,
} from '../lib/learning.ts';
import { approvedPath, candidatePath, AudioDirector } from '../lib/audio.ts';

test('Set 1 uses the published order and distinct grapheme entries', () => {
  assert.equal(
    SOUNDS.map((s) => s.grapheme).join(' '),
    'm a s d t i n p g o c k u b f e l h r j v y w z x sh th ch qu ng nk ck',
  );
  assert.equal(new Set(SOUNDS.map((s) => s.grapheme)).size, SOUNDS.length);
});
test('decoding never introduces a sound before it is known', () => {
  assert.deepEqual(decodableWords(['m', 'a']), []);
  assert.ok(
    decodableWords(['m', 'a', 's', 'd', 't']).every((w) =>
      w.parts.every((g) => ['m', 'a', 's', 'd', 't'].includes(g)),
    ),
  );
  assert.ok(
    !decodableWords(['s', 'h', 'i', 'p']).some((w) => w.word === 'ship'),
  );
  assert.ok(decodableWords(['sh', 'i', 'p']).some((w) => w.word === 'ship'));
});
test('identical phonemes are never competing answers', () => {
  for (const g of ['c', 'k', 'ck']) {
    const options = soundChoices(
      g,
      SOUNDS.map((s) => s.grapheme),
    );
    assert.equal(options.filter((x) => ['c', 'k', 'ck'].includes(x)).length, 1);
  }
});
test('phonics introduction, review and blending respect the selected sound limit', () => {
  for (const cap of [5, 8, 12, 16, 19, 25, 32]) {
    let p = { ...freshProgress(), soundLimit: cap };
    for (let r = 0; r < 100; r++) {
      const q = questionFor('woods', p);
      if (q.introduce) {
        assert.equal(
          q.introduce,
          SOUNDS.find((s) => !p.knownSounds.includes(s.grapheme)).grapheme,
        );
        p.knownSounds.push(q.introduce);
      }
      assert.ok(q.parts.every((g) => p.knownSounds.includes(g)));
      assert.ok(
        q.parts.every((g) =>
          SOUNDS.slice(0, cap).some((s) => s.grapheme === g),
        ),
      );
      assert.ok(q.options.includes(q.answer));
      if (q.kind === 'blend')
        assert.ok(
          q.options.every((w) =>
            decodableWords(p.knownSounds).some((x) => x.word === w),
          ),
        );
      p = award(p, 'woods', q);
    }
    assert.equal(p.knownSounds.length, cap);
  }
});
test('every maths question is solvable, unambiguous and in the selected range', () => {
  for (const max of [5, 10])
    for (const zone of ['meadow', 'cove', 'garden'])
      for (let round = 0; round < 400; round++) {
        const p = freshProgress();
        p.mathsMax = max;
        p.rounds[zone] = round;
        const q = questionFor(zone, p);
        assert.ok(q.options.includes(q.answer));
        assert.equal(new Set(q.options).size, q.options.length);
        if (q.kind === 'add') {
          assert.equal(Number(q.answer), q.amount + q.second);
          assert.ok(q.amount >= 1 && q.amount <= 6);
          assert.ok(q.second >= 1 && q.second <= 6);
        }
        if (q.kind === 'subtract')
          assert.equal(Number(q.answer), q.amount - q.second);
        if (q.kind === 'count') assert.equal(Number(q.answer), q.amount);
        if (['add', 'subtract', 'count'].includes(q.kind)) {
          assert.ok(Number(q.answer) >= 0 && Number(q.answer) <= max);
          assert.ok(q.options.every((o) => Number(o) >= 0 && Number(o) <= max));
        }
        if (q.kind === 'compare') {
          const left = q.amount,
            right = q.second;
          assert.notEqual(left, right);
          assert.equal(
            q.answer,
            q.title.includes('more')
              ? left > right
                ? 'left'
                : 'right'
              : left < right
                ? 'left'
                : 'right',
          );
        }
      }
});
test('replaying awards no duplicate stars and updates only the chosen zone', () => {
  const p = freshProgress(),
    q = questionFor('garden', p),
    first = award(p, 'garden', q),
    second = award(first, 'garden', q);
  assert.equal(second.completed.length, 1);
  assert.equal(second.rounds.garden, 2);
  assert.equal(second.rounds.woods, 0);
  assert.equal(p.completed.length, 0);
});
test('corrupt or malicious local progress is contained', () => {
  assert.deepEqual(readProgress('{broken'), freshProgress());
  assert.deepEqual(readProgress('{"version":2}'), freshProgress());
  const p = readProgress(
    JSON.stringify({
      version: 1,
      rounds: { meadow: -99, cove: Infinity },
      knownSounds: ['m', 'invalid', 'm'],
      soundLimit: 999,
      mathsMax: 900,
      completed: ['abc', 'abc', 3],
    }),
  );
  assert.deepEqual(p.knownSounds, ['m']);
  assert.deepEqual(p.completed, ['abc']);
  assert.equal(p.soundLimit, 5);
  assert.equal(p.mathsMax, 5);
  assert.equal(p.rounds.meadow, 0);
});
test('world boundaries keep Clo on the island and controller drift stays still', () => {
  for (let i = 0; i < 100; i++) {
    const p = clampToIsland(Math.sin(i) * 100, Math.cos(i) * 100);
    assert.ok(Math.hypot(p.x, p.z) <= 38.000001);
  }
  assert.deepEqual(clampToIsland(0, 0), { x: 0, z: 0 });
  assert.equal(deadzone(0.12), 0);
  assert.equal(deadzone(-0.1), 0);
  assert.equal(deadzone(1), 1);
  assert.equal(deadzone(-1), -1);
});
test('candidates cannot become teaching audio without explicit review', () => {
  assert.ok(candidatePath('m', {}));
  assert.equal(approvedPath('m', {}), null);
  assert.equal(approvedPath('m', { m: { approved: false } }), null);
  assert.equal(
    approvedPath('m', { m: { approved: true } }),
    '/audio/phonemes/m.ogg',
  );
  assert.equal(approvedPath('j', { j: { approved: true } }), null);
  assert.equal(
    approvedPath('j', {
      j: { approved: true, data: 'data:audio/wav;base64,AAA' },
    }),
    'data:audio/wav;base64,AAA',
  );
});
test('missing phonemes never fall through to text-to-speech', async () => {
  let spoken = 0,
    error = '';
  globalThis.window = {
    speechSynthesis: {
      cancel() {},
      speak() {
        spoken++;
      },
      getVoices() {
        return [];
      },
    },
  };
  const director = new AudioDirector(
    () => ({}),
    (m) => (error = m),
  );
  await director.run([{ type: 'phoneme', grapheme: 'm' }]);
  assert.equal(spoken, 0);
  assert.match(error, /grown-up/);
  director.dispose();
  delete globalThis.window;
});
test('copied phoneme candidates are real Ogg files, all flagged unreviewed', () => {
  const manifest = JSON.parse(fs.readFileSync('public/audio/phonemes.json'));
  assert.equal(Object.keys(manifest).length, 26);
  for (const value of Object.values(manifest)) {
    const bytes = fs.readFileSync('public' + value.path);
    assert.equal(bytes.subarray(0, 4).toString(), 'OggS');
    assert.ok(bytes.length > 1000);
    assert.equal(value.reviewed, false);
  }
});
