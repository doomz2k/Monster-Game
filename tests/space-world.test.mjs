import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  SPACE_DECK_SIZE,
  SPACE_OBJECTS,
  spaceCard,
} from '../lib/space-learning.ts';
import {
  PLAY_RADIUS,
  WORLD_SCALE,
  clampToPlayArea,
  groundHeight,
} from '../lib/world-layout.ts';
import { PLACES, missionFor } from '../lib/adventure.ts';
import { freshProgress } from '../lib/learning.ts';
const script = JSON.parse(
  readFileSync(
    new URL('../lib/audio-data/adventure-script.json', import.meta.url),
  ),
);

test('space visits exhaust 48 distinct activities before repeating, including after save/resume', () => {
  assert.equal(SPACE_DECK_SIZE, 48);
  for (let cycle = 0; cycle < 12; cycle++) {
    const deck = Array.from({ length: 48 }, (_, i) =>
      spaceCard(cycle * 48 + i),
    );
    assert.equal(new Set(deck.map((c) => c.id)).size, 48);
    assert.equal(deck.filter((c) => c.kind === 'space').length, 32);
    assert.equal(deck.filter((c) => c.kind === 'pack').length, 8);
    assert.equal(deck.filter((c) => c.kind === 'pattern').length, 8);
    if (cycle) assert.notEqual(deck[0].id, spaceCard(cycle * 48 - 1).id);
    assert.deepEqual(spaceCard(cycle * 48 + 19), deck[19]);
  }
});

test('every space activity has a British recorded instruction, one correct choice and valid visuals', () => {
  for (const max of [5, 10])
    for (let i = 0; i < 144; i++) {
      const p = freshProgress();
      p.mathsMax = max;
      p.adventure.rounds.moon = i;
      const m = missionFor('moon', p),
        c = spaceCard(i);
      assert.equal(m.prompt, c.id);
      assert.equal(script[m.prompt].voice, 'nova');
      if (m.kind === 'pack') assert.ok(m.target > 0 && m.target <= max);
      else {
        assert.equal(m.choices.filter((x) => x === m.answer).length, 1);
        assert.equal(new Set(m.choices).size, m.choices.length);
        if (m.kind === 'space')
          m.choices.forEach((id) => assert.ok(SPACE_OBJECTS[id], id));
        if (m.kind === 'pattern') {
          const sequence = [...m.sequence, m.answer];
          const period = m.sequence[0] === m.sequence[1] ? 3 : 2;
          sequence.forEach((value, index) =>
            assert.equal(value, sequence[index % period]),
          );
        }
      }
    }
  const slots = new Set(
    Array.from({ length: 144 }, (_, i) => spaceCard(i))
      .filter((c) => c.kind === 'space')
      .map((c) => c.choices.indexOf(c.answer)),
  );
  assert.equal(slots.size, 3);
});

test('expanded travel destinations remain reachable and boundaries contain arbitrary movement', () => {
  assert.equal(WORLD_SCALE, 1.6);
  assert.ok((PLAY_RADIUS / 49) ** 2 > 2.6);
  PLACES.forEach((p) =>
    assert.ok(Math.hypot(p.x, p.z) + 5 < PLAY_RADIUS, p.id),
  );
  for (let i = 0; i < 1000; i++) {
    const x = Math.sin(i) * 150,
      z = Math.cos(i * 0.37) * 150;
    const point = clampToPlayArea(x, z);
    assert.ok(Math.hypot(point.x, point.z) <= PLAY_RADIUS + 1e-10);
    assert.ok(Number.isFinite(groundHeight(point.x, point.z)));
    if (Math.hypot(x, z) <= PLAY_RADIUS) assert.deepEqual(point, { x, z });
  }
});
