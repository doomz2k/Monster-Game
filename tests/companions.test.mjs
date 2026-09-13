import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { freshProgress, readProgress } from '../lib/learning.ts';
import {
  COMPANIONS,
  CompanionMotion,
  companionSpot,
  companionAvailable,
  chooseCompanion,
} from '../lib/companion.ts';
import { createCompanion } from '../lib/companion-model.ts';
import clips from '../lib/audio-data/voice-clips.json' with { type: 'json' };

test('companions unlock through permanent quest progress and never spend stars', () => {
  const p = freshProgress();
  assert.equal(p.adventure.companion, 'sprig');
  assert.equal(chooseCompanion(p, 'puff'), p);
  assert.equal(chooseCompanion(p, 'twinkle'), p);
  p.adventure.rounds.garden = 1;
  const puff = chooseCompanion(p, 'puff');
  assert.notEqual(puff, p);
  assert.equal(puff.adventure.wallet, p.adventure.wallet);
  assert.equal(p.adventure.companion, 'sprig');
  puff.adventure.plots = puff.adventure.plots.map(() => null);
  assert.equal(companionAvailable('puff', puff.adventure), true);
  puff.adventure.rounds.rocket = 3;
  const twinkle = chooseCompanion(puff, 'twinkle');
  assert.equal(twinkle.adventure.companion, 'twinkle');
  assert.equal(chooseCompanion(twinkle, 'twinkle'), twinkle);
  assert.equal(chooseCompanion(twinkle, 'invented'), twinkle);
});
test('companions preserve saves, old adventures and the choice to explore alone', () => {
  for (const selected of ['sprig', 'puff', 'twinkle', null]) {
    const p = freshProgress();
    p.adventure.rounds.garden = 1;
    p.adventure.rounds.rocket = 3;
    const next = chooseCompanion(p, selected);
    assert.deepEqual(readProgress(JSON.stringify(next)), next);
  }
  const old = freshProgress();
  delete old.adventure.companion;
  assert.equal(readProgress(JSON.stringify(old)).adventure.companion, 'sprig');
  old.adventure.companion = 'twinkle';
  assert.equal(readProgress(JSON.stringify(old)).adventure.companion, 'sprig');
});
test('companion motion pauses, rejoins after travel and chooses clear shoulder space', () => {
  const obstacles = [{ x: 1.7, z: -1.5, r: 0.8 }];
  const spot = companionSpot({ x: 0, z: 0 }, 0, obstacles);
  assert.ok(spot.x < 0);
  const motion = new CompanionMotion();
  motion.update(spot, 0.016, true, obstacles);
  const before = { x: motion.x, z: motion.z };
  motion.update({ x: 2, z: 3 }, 0.05, false, []);
  assert.deepEqual({ x: motion.x, z: motion.z }, before);
  motion.update({ x: 2, z: 3 }, NaN, true, []);
  assert.deepEqual({ x: motion.x, z: motion.z }, before);
  for (let i = 0; i < 120; i++) motion.update({ x: 2, z: 3 }, 0.016, true, []);
  assert.ok(Math.hypot(motion.x - 2, motion.z - 3) < 0.001);
  motion.update({ x: 40, z: -28 }, 0.016, true, []);
  assert.equal(motion.x, 40);
  assert.equal(motion.z, -28);
  motion.update({ x: Infinity, z: NaN }, 0.05, true, []);
  assert.ok(Number.isFinite(motion.x));
  const crowded = companionSpot({ x: 0, z: 0 }, 0, [{ x: 0, z: 0, r: 9 }]);
  assert.deepEqual(crowded, { x: 0, z: 0 });
});
test('all companion rigs stay finite through flight, rest and reduced motion', () => {
  for (const { id } of COMPANIONS) {
    const model = createCompanion(id);
    for (let i = 0; i < 500; i++)
      model.animate(i * 0.017, i % 2, i % 3 === 0, i % 5 === 0, i % 7 === 0);
    model.animate(0, 0, false, true);
    model.root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model.root);
    assert.ok(bounds.min.y > -1 && bounds.max.y < 1);
    assert.ok(bounds.max.x - bounds.min.x < 2.2);
    model.root.traverse((o) => {
      assert.ok(o.matrixWorld.elements.every(Number.isFinite));
      if (o instanceof THREE.Mesh)
        assert.ok(
          [...o.geometry.attributes.position.array].every(Number.isFinite),
        );
    });
  }
});
test('companion instructions are complete British recordings', () => {
  for (const id of [
    'companions',
    'companion-rest',
    'companion-puff-locked',
    'companion-twinkle-locked',
    ...COMPANIONS.map((c) => 'companion-' + c.id),
  ]) {
    assert.ok(clips[id]);
    assert.match(clips[id].voice, /^b[fm]_/);
    assert.match(clips[id].path, /\.ogg$/);
  }
});
