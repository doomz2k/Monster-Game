import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { freshProgress, readProgress } from '../lib/learning.ts';
import { SHOP_ITEMS, placeFurniture } from '../lib/adventure.ts';
import {
  furnitureSnapshot,
  readFurnitureTurns,
  restoreFurniture,
  rotateFurniture,
  furniturePosition,
} from '../lib/furniture-layout.ts';
import { createFurniture } from '../lib/furniture-model.ts';

test('furniture turns persist, follow moved items and reset cleared spaces', () => {
  let p = freshProgress();
  assert.equal(placeFurniture(p, 0, 'table'), p);
  assert.equal(rotateFurniture(p, 1), p);
  for (const i of [-1, 6, NaN, 0.5]) assert.equal(rotateFurniture(p, i), p);
  p = rotateFurniture(p, 0);
  p = placeFurniture(p, 4, 'table');
  assert.equal(p.adventure.furnitureTurns[0], 0);
  assert.equal(p.adventure.furnitureTurns[4], 1);
  assert.deepEqual(readProgress(JSON.stringify(p)), p);
  for (let i = 0; i < 3; i++) p = rotateFurniture(p, 4);
  assert.equal(p.adventure.furnitureTurns[4], 0);
  p = rotateFurniture(p, 4);
  p = placeFurniture(p, 4, null);
  assert.deepEqual(p.adventure.furnitureTurns, [0, 0, 0, 0, 0, 0]);
});
test('undo changes only the furniture layout, leaving rewards and other play intact', () => {
  const original = freshProgress(),
    snapshot = furnitureSnapshot(original);
  const p = rotateFurniture(placeFurniture(original, 2, 'table'), 2);
  p.adventure.wallet = 7;
  p.preferences.daylight = 'evening';
  p.adventure.companion = null;
  p.adventure.plots[0] = { seed: 'daisy', water: 1 };
  const restored = restoreFurniture(p, snapshot);
  assert.deepEqual(restored.adventure.furniture, original.adventure.furniture);
  assert.deepEqual(
    restored.adventure.furnitureTurns,
    original.adventure.furnitureTurns,
  );
  assert.equal(restored.adventure.wallet, 7);
  assert.equal(restored.preferences.daylight, 'evening');
  assert.equal(restored.adventure.companion, null);
  assert.equal(restored.adventure.plots[0].water, 1);
  const checked = restoreFurniture(p, {
    furniture: ['table', 'table', 'invented'],
    furnitureTurns: [3, 2, 1],
  });
  assert.deepEqual(checked.adventure.furniture, [
    'table',
    null,
    null,
    null,
    null,
    null,
  ]);
  assert.deepEqual(checked.adventure.furnitureTurns, [3, 0, 0, 0, 0, 0]);
});
test('old saves retain placement while invalid rotation data is normalised', () => {
  const p = freshProgress();
  delete p.adventure.furnitureTurns;
  const restored = readProgress(JSON.stringify(p));
  assert.deepEqual(restored.adventure.furniture, p.adventure.furniture);
  assert.deepEqual(restored.adventure.furnitureTurns, [0, 0, 0, 0, 0, 0]);
  assert.deepEqual(
    readFurnitureTurns(
      [4, -1, 0.5, NaN, Infinity, '2'],
      Array(6).fill('table'),
    ),
    [0, 0, 0, 0, 0, 0],
  );
});
test('garden decorating has its own spaces and cannot replace indoor furniture', () => {
  let p = freshProgress();
  p.adventure.inventory.push('lantern');
  p = placeFurniture(p, 0, 'lantern');
  assert.equal(p.adventure.furniture[0], 'table');
  assert.equal(p.adventure.gardenFurniture[0], 'lantern');
  assert.equal(placeFurniture(p, 0, 'lantern', 'house'), p);
  assert.equal(placeFurniture(p, 0, 'table', 'garden'), p);
  p = rotateFurniture(p, 0, 'garden');
  assert.equal(p.adventure.furnitureTurns[0], 0);
  assert.equal(p.adventure.gardenTurns[0], 1);
  const snapshot = furnitureSnapshot(p);
  p = placeFurniture(p, 0, null, 'garden');
  assert.equal(p.adventure.furniture[0], 'table');
  p = restoreFurniture(p, snapshot);
  assert.equal(p.adventure.gardenFurniture[0], 'lantern');
  assert.equal(p.adventure.gardenTurns[0], 1);
  assert.deepEqual(readProgress(JSON.stringify(p)), p);
});
test('old mixed layouts move garden pieces into matching outdoor spaces without losing turns', () => {
  const p = freshProgress();
  p.adventure.inventory.push('lantern', 'sofa');
  p.adventure.furniture = ['table', 'lantern', null, null, 'sofa', null];
  p.adventure.furnitureTurns = [0, 2, 0, 0, 1, 0];
  delete p.adventure.gardenFurniture;
  delete p.adventure.gardenTurns;
  const next = readProgress(JSON.stringify(p));
  assert.deepEqual(next.adventure.furniture, [
    'table',
    null,
    null,
    null,
    'sofa',
    null,
  ]);
  assert.deepEqual(next.adventure.gardenFurniture, [
    null,
    'lantern',
    null,
    null,
    null,
    null,
  ]);
  assert.equal(next.adventure.furnitureTurns[4], 1);
  assert.equal(next.adventure.gardenTurns[1], 2);
  assert.deepEqual(next.adventure.inventory, p.adventure.inventory);
});
test('every shop furnishing has bounded finite geometry and fits its rotated grid cells', () => {
  for (const item of SHOP_ITEMS.filter((i) => i.kind !== 'seed')) {
    const model = createFurniture(item.id, item.colour);
    assert.ok(model.root.children.length > 0, item.id);
    for (let i = 0; i < 80; i++) model.animate(i * 0.1, false);
    model.animate(0, true);
    for (let turn = 0; turn < 4; turn++) {
      model.root.rotation.y = (turn * Math.PI) / 2;
      model.root.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model.root),
        size = bounds.getSize(new THREE.Vector3());
      assert.ok(
        size.x < (item.kind === 'garden' ? 2.3 : 2.1),
        item.id + ' width',
      );
      assert.ok(
        size.z < (item.kind === 'garden' ? 2.3 : 2),
        item.id + ' depth',
      );
      assert.ok(
        bounds.min.y > -0.05 && bounds.max.y < 2.1,
        item.id + ' height',
      );
    }
    model.root.traverse((o) => {
      assert.ok(o.matrixWorld.elements.every(Number.isFinite));
      if (o instanceof THREE.Mesh)
        assert.ok(
          [...o.geometry.attributes.position.array].every(Number.isFinite),
        );
    });
  }
  for (const garden of [false, true]) {
    const points = Array.from({ length: 6 }, (_, i) =>
      furniturePosition(i, garden),
    );
    assert.equal(new Set(points.map((p) => p.x + ',' + p.z)).size, 6);
    assert.ok(points.every((p) => Math.abs(p.x) < 3 && p.z < 10));
  }
});
