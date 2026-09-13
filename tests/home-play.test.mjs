import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  HOME_ACTIVITIES,
  homeActivity,
  toggleFurnitureLight,
} from '../lib/home-play.ts';
import { freshProgress, readProgress } from '../lib/learning.ts';
import { SHOP_ITEMS, placeFurniture } from '../lib/adventure.ts';
import { createFurniture } from '../lib/furniture-model.ts';
import { createMonster } from '../lib/monster-model.ts';
import { defaultAppearance, LOOK_OPTIONS } from '../lib/appearance.ts';
import { furniturePosition } from '../lib/furniture-layout.ts';
import script from '../lib/audio-data/adventure-script.json' with { type: 'json' };

test('home activities only use owned furniture in an actual placed space', () => {
  const p = freshProgress();
  assert.equal(homeActivity(p.adventure, 'house', 0).action, 'picnic');
  for (const slot of [-1, 6, 0.5, NaN])
    assert.equal(homeActivity(p.adventure, 'house', slot), null);
  assert.equal(homeActivity(p.adventure, 'garden', 0), null);
  p.adventure.furniture[1] = 'sofa';
  assert.equal(homeActivity(p.adventure, 'house', 1), null);
  p.adventure.inventory.push('sofa');
  assert.equal(homeActivity(p.adventure, 'house', 1).action, 'sit');
  for (const item of SHOP_ITEMS.filter((i) => i.kind !== 'seed'))
    assert.ok(HOME_ACTIVITIES[item.id]);
});
test('lamp switches persist through old saves and affect neither wallet nor layout', () => {
  let p = freshProgress();
  p.adventure.inventory.push('lamp', 'lantern');
  assert.equal(toggleFurnitureLight(p, 'lamp'), p);
  p = placeFurniture(p, 1, 'lamp');
  p = placeFurniture(p, 0, 'lantern');
  p = toggleFurnitureLight(p, 'lamp');
  p = toggleFurnitureLight(p, 'lantern');
  assert.deepEqual(p.adventure.unlit, ['lamp', 'lantern']);
  assert.deepEqual(readProgress(JSON.stringify(p)), p);
  const on = toggleFurnitureLight(p, 'lamp');
  assert.deepEqual(on.adventure.unlit, ['lantern']);
  assert.equal(on.adventure.wallet, p.adventure.wallet);
  assert.equal(on.adventure.furniture, p.adventure.furniture);
  assert.equal(toggleFurnitureLight(p, 'table'), p);
  p.adventure.unlit = ['invented', 'lamp', 'lamp', null];
  assert.deepEqual(readProgress(JSON.stringify(p)).adventure.unlit, ['lamp']);
  delete p.adventure.unlit;
  assert.deepEqual(readProgress(JSON.stringify(p)).adventure.unlit, []);
});
test('furniture interaction anchors follow each placed rotation and the moving swing seat', () => {
  for (const item of SHOP_ITEMS.filter((i) => i.kind !== 'seed')) {
    const m = createFurniture(item.id, item.colour),
      at = furniturePosition(4, item.kind === 'garden');
    m.root.position.set(at.x, at.y, at.z);
    for (let turn = 0; turn < 4; turn++) {
      m.root.rotation.y = (turn * Math.PI) / 2;
      for (const t of [0, 0.7, 3, 30, 10000]) {
        m.animate(t, false, true);
        m.root.updateMatrixWorld(true);
        const v = m.seat.getWorldPosition(new THREE.Vector3());
        assert.ok(v.toArray().every(Number.isFinite));
        assert.ok(Math.hypot(v.x - at.x, v.z - at.z) < 1.1, item.id);
        assert.ok(v.y >= at.y && v.y < at.y + 1.1, item.id);
      }
    }
    m.animate(1, true, true);
    m.root.updateMatrixWorld(true);
    const calm = m.seat.matrixWorld.clone();
    m.animate(8, true, true);
    m.root.updateMatrixWorld(true);
    assert.deepEqual(m.seat.matrixWorld.elements, calm.elements);
  }
  const lamp = createFurniture('lamp', '#eab747');
  const emissions = () => {
    const result = [];
    lamp.root.traverse((o) => {
      if (
        o instanceof THREE.Mesh &&
        o.material instanceof THREE.MeshStandardMaterial
      )
        result.push(o.material.emissiveIntensity);
    });
    return result;
  };
  lamp.setLit(false);
  const off = emissions();
  lamp.setLit(true);
  const on = emissions();
  assert.ok(on.some((n, i) => n > off[i]));
});
test('every body shape can play, rest and return to walking without pose drift', () => {
  for (const shape of LOOK_OPTIONS.shape) {
    const m = createMonster({ ...defaultAppearance(), shape });
    const base = {
      delta: 0.03,
      time: 0,
      speed: 0,
      airborne: 0,
      celebrating: false,
      greeting: false,
      reducedMotion: false,
    };
    for (const action of new Set(
      Object.values(HOME_ACTIVITIES).map((a) => a.action),
    )) {
      for (let i = 0; i < 90; i++)
        m.animate({ ...base, time: i * 0.04, homeActivity: action });
      m.root.updateMatrixWorld(true);
      m.root.traverse((o) =>
        assert.ok(
          o.matrixWorld.elements.every(Number.isFinite),
          shape + ' ' + action,
        ),
      );
      if (action === 'sleep')
        assert.ok(Math.abs(m.root.rotation.x + Math.PI / 2) < 0.001);
      m.animate({ ...base, reducedMotion: true, homeActivity: action });
      m.root.updateMatrixWorld(true);
      const calm = m.root.matrixWorld.clone();
      m.animate({
        ...base,
        time: 123,
        reducedMotion: true,
        homeActivity: action,
      });
      m.root.updateMatrixWorld(true);
      assert.deepEqual(m.root.matrixWorld.elements, calm.elements);
      m.animate({ ...base, time: 0, reducedMotion: true });
      assert.equal(m.root.rotation.x, 0);
      assert.equal(m.feet[0].position.z, 0.04);
      assert.equal(m.eyes[0].upper.rotation.x, -1.24);
    }
  }
});
test('all home play actions have bundled instruction scripts without phoneme synthesis', () => {
  for (const a of Object.values(HOME_ACTIVITIES)) {
    if (a.action === 'light') continue;
    assert.equal(script['home-' + a.action]?.voice, 'narrator');
  }
  for (const id of ['home-play', 'home-light-on', 'home-light-off'])
    assert.ok(script[id]?.text);
});
