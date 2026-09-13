import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  FLOWERS,
  SPECIAL_FLOWERS,
  flowerAvailable,
  readFlowers,
  takeFlowerSeed,
  rememberBloom,
} from '../lib/flowers.ts';
import { freshProgress, readProgress } from '../lib/learning.ts';
import { plantSeed, waterPlant, clearPlot } from '../lib/adventure.ts';
import { gardenVisitors } from '../lib/garden.ts';
import { createGardenPlant } from '../lib/garden-models.ts';
import { exportSave, parseSavedProgress } from '../lib/save-recovery.ts';
import script from '../lib/audio-data/adventure-script.json' with { type: 'json' };
import voices from '../lib/audio-data/voice-clips.json' with { type: 'json' };
const grow = (p, slot) =>
  waterPlant(waterPlant(waterPlant(p, slot), slot), slot);

test('old mature beds are remembered without awarding retrospective stars or losing planted crops', () => {
  const p = freshProgress();
  p.adventure.wallet = 19;
  p.adventure.earned = 20;
  p.adventure.plots[0] = { seed: 'sunflower', water: 3 };
  p.adventure.plots[1] = { seed: 'daisy', water: 2 };
  p.adventure.plots[2] = { seed: 'tomato', water: 3 };
  const raw = JSON.parse(JSON.stringify(p));
  delete raw.adventure.flowers;
  const read = readProgress(JSON.stringify(raw));
  assert.deepEqual(read.adventure.flowers, ['sunflower']);
  assert.equal(read.adventure.wallet, 19);
  assert.equal(read.adventure.earned, 20);
  assert.deepEqual(read.adventure.plots, p.adventure.plots);
  assert.deepEqual(
    readFlowers(
      ['tulip', 'tulip', 'tomato', '__proto__', null],
      p.adventure.plots,
    ),
    ['sunflower', 'tulip'],
  );
  assert.deepEqual(readFlowers({}, []), []);
});
test('only a newly grown flower awards a star and repeat gardening preserves the collection', () => {
  let p = freshProgress();
  assert.equal(rememberBloom(p, 'daisy'), p);
  p = plantSeed(p, 0, 'daisy');
  p = waterPlant(p, 0);
  p = waterPlant(p, 0);
  assert.equal(p.adventure.wallet, 0);
  assert.deepEqual(p.adventure.flowers, []);
  p = waterPlant(p, 0);
  assert.equal(p.adventure.wallet, 1);
  assert.equal(p.adventure.earned, 1);
  assert.deepEqual(p.adventure.flowers, ['daisy']);
  assert.equal(waterPlant(p, 0), p);
  assert.equal(rememberBloom(p, 'daisy'), p);
  p = clearPlot(p, 0);
  p = plantSeed(p, 0, 'daisy');
  p = grow(p, 0);
  assert.equal(p.adventure.wallet, 1);
  p = plantSeed(p, 1, 'tomato');
  p = grow(p, 1);
  assert.equal(p.adventure.wallet, 1);
  assert.deepEqual(p.practice, freshProgress().practice);
  assert.deepEqual(p.adventure.rounds, freshProgress().adventure.rounds);
  assert.deepEqual(parseSavedProgress(exportSave(p)), p);
});
test('every special packet requires its complete pictured pair and gives one free seed at a time', () => {
  for (const flower of SPECIAL_FLOWERS) {
    let p = freshProgress();
    assert.equal(takeFlowerSeed(p, flower.id), p);
    p.adventure.flowers = [flower.needs[0]];
    assert.equal(flowerAvailable(p, flower.id), false);
    assert.equal(takeFlowerSeed(p, flower.id), p);
    p.adventure.flowers = [...flower.needs];
    assert.equal(flowerAvailable(p, flower.id), true);
    p = takeFlowerSeed(p, flower.id);
    assert.equal(p.adventure.seeds[flower.id], 1);
    assert.equal(takeFlowerSeed(p, flower.id), p);
    assert.equal(p.adventure.wallet, 0);
    p = plantSeed(p, 0, flower.id);
    assert.equal(p.adventure.seeds[flower.id], 0);
    p = takeFlowerSeed(p, flower.id);
    assert.equal(p.adventure.seeds[flower.id], 1);
    p = grow(p, 0);
    assert.equal(p.adventure.wallet, 1);
    assert.ok(p.adventure.flowers.includes(flower.id));
    p = clearPlot(p, 0);
    p = plantSeed(p, 0, flower.id);
    p = grow(p, 0);
    assert.equal(p.adventure.wallet, 1);
    assert.deepEqual(readProgress(JSON.stringify(p)), p);
  }
  const p = freshProgress();
  assert.equal(takeFlowerSeed(p, 'daisy'), p);
  assert.equal(takeFlowerSeed(p, '__proto__'), p);
});
test('all six base-flower pairs lead to distinct varieties and collection stays capped at ten', () => {
  assert.equal(FLOWERS.length, 10);
  assert.equal(new Set(FLOWERS.map((f) => f.id)).size, 10);
  assert.equal(
    new Set(SPECIAL_FLOWERS.map((f) => [...f.needs].sort().join(','))).size,
    6,
  );
  assert.ok(
    SPECIAL_FLOWERS.every(
      (f) =>
        f.needs.length === 2 &&
        f.needs.every((id) =>
          FLOWERS.some((base) => base.id === id && base.needs.length === 0),
        ),
    ),
  );
  assert.equal(
    readFlowers([...FLOWERS.map((f) => f.id), ...FLOWERS.map((f) => f.id)], [])
      .length,
    10,
  );
});
test('saved special seeds are bounded and invalid slots or seed names cannot corrupt beds', () => {
  const p = freshProgress();
  p.adventure.seeds['golden-tulip'] = 200;
  p.adventure.seeds['imaginary'] = 4;
  p.adventure.seeds['apricot-daisy'] = -3;
  const read = readProgress(JSON.stringify(p));
  assert.equal(read.adventure.seeds['golden-tulip'], 99);
  assert.equal(read.adventure.seeds['apricot-daisy'], 0);
  assert.equal(read.adventure.seeds.imaginary, undefined);
  for (const slot of [-1, 6, 2.5, NaN, Infinity]) {
    assert.equal(plantSeed(p, slot, 'daisy'), p);
    assert.equal(waterPlant(p, slot), p);
    assert.equal(clearPlot(p, slot), p);
  }
  assert.equal(plantSeed(p, 0, 'imaginary'), p);
});
test('special flowers inherit the same helpful wildlife as their botanical toys', () => {
  for (const f of SPECIAL_FLOWERS) {
    assert.deepEqual(
      gardenVisitors([{ seed: f.id, water: 3 }]),
      gardenVisitors([{ seed: f.base, water: 3 }]),
    );
    assert.deepEqual(gardenVisitors([{ seed: f.id, water: 2 }]), {
      bee: false,
      butterfly: false,
      bird: false,
    });
  }
});
test('each flower has its advertised colours in finite shared 3D geometry at every growth stage', () => {
  for (const f of FLOWERS)
    for (let water = 0; water <= 3; water++) {
      const plant = createGardenPlant(f.id, water),
        colours = new Set();
      plant.root.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          assert.ok(
            [...o.geometry.getAttribute('position').array].every(
              Number.isFinite,
            ),
          );
          colours.add('#' + o.material.color.getHexString());
        }
      });
      if (water === 3) {
        assert.ok(colours.has(f.petals), f.id + ' petals');
        assert.ok(colours.has(f.centre), f.id + ' centre');
      }
      plant.animate(10, true);
      const still = plant.root.rotation.z;
      plant.animate(100, true);
      assert.equal(plant.root.rotation.z, still);
      plant.root.updateMatrixWorld(true);
      const size = new THREE.Box3()
        .setFromObject(plant.root)
        .getSize(new THREE.Vector3());
      assert.ok(size.toArray().every((n) => Number.isFinite(n) && n < 3));
    }
});
test('the flower book has recorded British guidance for every variety and makes no hybrid-breeding claim', () => {
  for (const id of [
    'flowers-intro',
    'flower-grown',
    'flower-seed-ready',
    'flower-garden-full',
    ...FLOWERS.map((f) => 'flower-' + f.id),
  ]) {
    assert.equal(script[id].voice, 'tilly');
    assert.match(voices[id].voice, /^bf_/);
    assert.equal(voices[id].text, script[id].text);
    assert.match(voices[id].path, /\.ogg$/);
  }
  assert.match(script['flower-moonflower'].text, /make-believe/);
  for (const f of SPECIAL_FLOWERS)
    assert.match(script['flower-' + f.id].text, /share a free packet/);
});
