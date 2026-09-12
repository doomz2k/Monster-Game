import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { freshProgress, readProgress } from '../lib/learning.ts';
import {
  plantSeed,
  waterPlant,
  finishMission,
  missionFor,
  SHOP_ITEMS,
} from '../lib/adventure.ts';
import { harvestPlant, gardenVisitors, readPantry } from '../lib/garden.ts';
import {
  createGardenPlant,
  createGardenWildlife,
} from '../lib/garden-models.ts';

test('a seed grows into repeatable baskets without granting stars or deleting the plant', () => {
  let p = freshProgress();
  p = plantSeed(p, 0, 'tomato');
  assert.equal(p.adventure.seeds.tomato, 0);
  assert.equal(harvestPlant(p, 0), p);
  for (let i = 0; i < 3; i++) p = waterPlant(p, 0);
  const grown = p;
  p = harvestPlant(p, 0);
  assert.equal(p.adventure.pantry.tomato, 1);
  assert.equal(p.adventure.plots[0].seed, 'tomato');
  assert.equal(p.adventure.plots[0].water, 1);
  assert.equal(p.adventure.wallet, grown.adventure.wallet);
  assert.equal(harvestPlant(p, 0), p);
  assert.equal(harvestPlant(p, NaN), p);
  assert.equal(harvestPlant(p, 7), p);
  p = waterPlant(waterPlant(p, 0), 0);
  p = harvestPlant(p, 0);
  assert.equal(p.adventure.pantry.tomato, 2);
  assert.deepEqual(readProgress(JSON.stringify(p)).adventure, p.adventure);
});
test('a full pantry preserves ready crops and migrated values are bounded', () => {
  const p = freshProgress();
  p.adventure.plots[0] = { seed: 'pepper', water: 3 };
  p.adventure.pantry.pepper = 99;
  assert.equal(harvestPlant(p, 0), p);
  assert.deepEqual(readPantry({ tomato: 500, pepper: -2 }), {
    tomato: 99,
    pepper: 0,
  });
  assert.deepEqual(readPantry({ tomato: NaN, pepper: 1.5 }), {
    tomato: 0,
    pepper: 0,
  });
  const old = JSON.parse(JSON.stringify(p));
  delete old.adventure.pantry;
  assert.deepEqual(readProgress(JSON.stringify(old)).adventure.pantry, {
    tomato: 0,
    pepper: 0,
  });
});
test('only a completed matching pizza uses produce; replay and other activities do not spend baskets', () => {
  for (let round = 0; round < 25; round++) {
    const p = freshProgress();
    p.adventure.rounds.meadow = round;
    p.adventure.pantry = { tomato: 3, pepper: 3 };
    const mission = missionFor('meadow', p),
      q = finishMission(p, mission),
      used = mission.gardenIngredients;
    assert.equal(q.adventure.wallet, 2 + used.length);
    for (const id of ['tomato', 'pepper'])
      assert.equal(q.adventure.pantry[id], 3 - (used.includes(id) ? 1 : 0));
    assert.equal(finishMission(q, mission), q);
    assert.deepEqual(
      finishMission(p, missionFor('garden', p)).adventure.pantry,
      p.adventure.pantry,
    );
    const ordinary = freshProgress();
    ordinary.adventure.rounds.meadow = round;
    assert.equal(
      finishMission(ordinary, missionFor('meadow', ordinary)).adventure.wallet,
      2,
    );
  }
});
test('garden wildlife responds to mature varieties and never needs a clock or consumes flowers', () => {
  assert.deepEqual(gardenVisitors([{ seed: 'daisy', water: 2 }]), {
    bee: false,
    butterfly: false,
    bird: false,
  });
  assert.deepEqual(
    gardenVisitors([
      { seed: 'sunflower', water: 3 },
      { seed: 'moonflower', water: 3 },
    ]),
    { bee: true, butterfly: true, bird: true },
  );
  const flowers = [{ seed: 'daisy', water: 3 }],
    before = JSON.stringify(flowers);
  gardenVisitors(flowers);
  assert.equal(JSON.stringify(flowers), before);
});
test('every plant stage has finite bounded geometry and wildlife respects reduced motion', () => {
  for (const seed of SHOP_ITEMS.filter((i) => i.kind === 'seed').map(
    (i) => i.id,
  ))
    for (const water of [0, 1, 2, 3, NaN]) {
      const m = createGardenPlant(seed, water);
      m.animate(27, true);
      assert.equal(m.root.rotation.z, 0);
      m.root.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(m.root);
      assert.ok(bounds.max.y < 2.2);
      assert.ok(bounds.min.x > -0.8 && bounds.max.x < 0.8);
      m.root.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          assert.ok(
            Array.from(o.geometry.attributes.position.array).every(
              Number.isFinite,
            ),
          );
          assert.ok(o.matrixWorld.elements.every(Number.isFinite));
        }
      });
    }
  const w = createGardenWildlife([
    { seed: 'sunflower', water: 3 },
    { seed: 'daisy', water: 3 },
  ]);
  w.animate(1, true);
  const pose = w.root.children.map((c) => c.position.toArray());
  w.animate(500, true);
  assert.deepEqual(
    w.root.children.map((c) => c.position.toArray()),
    pose,
  );
});
