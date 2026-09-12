import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  COSMETICS,
  OUTFIT_SLOTS,
  equipItem,
  isUnlocked,
  itemsFor,
  moveWardrobeSelection,
  newlyUnlocked,
  readOutfit,
  starterOutfit,
} from '../lib/wardrobe.ts';
import {
  freshProgress,
  readProgress,
  award,
  questionFor,
} from '../lib/learning.ts';
import { createCostume } from '../lib/monster-outfit.ts';

test('expanded wardrobe offers starter choices and rewards in independent slots', () => {
  assert.ok(
    COSMETICS.filter((item) => item.stars === 0 && !item.id.startsWith('no-'))
      .length >= 35,
  );
  assert.ok(COSMETICS.filter((item) => item.stars > 0).length >= 10);
  assert.equal(
    new Set(COSMETICS.map((item) => item.id)).size,
    COSMETICS.length,
  );
  for (const slot of OUTFIT_SLOTS)
    assert.ok(
      itemsFor(slot).some(
        (item) => item.id === starterOutfit()[slot] && isUnlocked(item, 0),
      ),
    );
});
test('milestone rewards unlock exactly at their star threshold, once', () => {
  for (const reward of COSMETICS.filter((item) => item.stars > 0)) {
    assert.equal(isUnlocked(reward, reward.stars - 1), false);
    assert.ok(newlyUnlocked(reward.stars - 1, reward.stars).includes(reward));
    assert.ok(!newlyUnlocked(reward.stars, reward.stars).includes(reward));
    assert.ok(!newlyUnlocked(reward.stars, reward.stars + 1).includes(reward));
  }
  const p = freshProgress(),
    question = questionFor('garden', p),
    first = award(p, 'garden', question),
    replay = award(first, 'garden', question);
  assert.deepEqual(
    newlyUnlocked(first.completed.length, replay.completed.length),
    [],
  );
});
test('equipping preserves the other slot and cannot equip locked or unknown items', () => {
  const initial = starterOutfit();
  assert.equal(equipItem(initial, 'crown', 15), initial);
  assert.equal(equipItem(initial, 'missing', 99), initial);
  assert.deepEqual(equipItem(initial, 'crown', 16), {
    ...initial,
    hat: 'crown',
    accessory: initial.accessory,
  });
  assert.deepEqual(equipItem(initial, 'scarf', 0), {
    ...initial,
    hat: initial.hat,
    accessory: 'scarf',
  });
  assert.deepEqual(equipItem(initial, 'no-hat', 0), {
    ...initial,
    hat: 'no-hat',
    accessory: initial.accessory,
  });
});
test('old saves migrate and outfits survive a round trip without unlocking unearned items', () => {
  const old = {
    ...freshProgress(),
    completed: ['first-star'],
    knownSounds: ['m'],
  };
  delete old.outfit;
  const migrated = readProgress(JSON.stringify(old));
  assert.deepEqual(migrated.outfit, starterOutfit());
  assert.deepEqual(migrated.knownSounds, ['m']);
  assert.deepEqual(migrated.completed, ['first-star']);
  const p = {
    ...freshProgress(),
    completed: Array.from({ length: 24 }, (_, i) => 'challenge-' + i),
    outfit: { hat: 'crown', accessory: 'medal' },
  };
  assert.deepEqual(readProgress(JSON.stringify(p)).outfit, {
    ...starterOutfit(),
    hat: 'crown',
    badge: 'medal',
  });
  assert.deepEqual(
    readOutfit({ hat: 'crown', accessory: 'medal' }, 0),
    starterOutfit(),
  );
  assert.deepEqual(
    readOutfit({ hat: 'bow', accessory: 'party' }, 99),
    starterOutfit(),
  );
  for (const bad of [null, [], 'beanie', { hat: '__proto__' }])
    assert.deepEqual(readOutfit(bad, 0), starterOutfit());
});
test('controller grid movement reaches every item and the done button without leaving bounds', () => {
  for (const direction of ['left', 'right', 'up', 'down'])
    for (let i = 0; i <= 6; i++) {
      const next = moveWardrobeSelection(i, direction, 6);
      assert.ok(next >= 0 && next <= 6);
    }
  assert.equal(moveWardrobeSelection(2, 'down', 6), 5);
  assert.equal(moveWardrobeSelection(5, 'down', 6), 6);
  assert.equal(moveWardrobeSelection(6, 'up', 6), 3);
});
test('every wearable item has finite 3D geometry attached within the monster rig', () => {
  for (const item of COSMETICS) {
    const model = createCostume(item.id);
    assert.equal(model.name, item.id);
    if (item.id.startsWith('no-')) assert.equal(model.children.length, 0);
    else {
      assert.ok(model.children.length > 0, item.id);
      const bounds = new THREE.Box3().setFromObject(model);
      for (const v of [...bounds.min.toArray(), ...bounds.max.toArray()])
        assert.ok(Number.isFinite(v), item.id);
      assert.ok(bounds.min.y > 0 && bounds.max.y < 3.5, item.id);
    }
    const materials = new Set();
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        materials.add(object.material);
      }
    });
    materials.forEach((material) => material.dispose());
  }
});
