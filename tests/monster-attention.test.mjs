import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { MonsterAttention, nearbyAttention } from '../lib/monster-attention.ts';
import { createMonster } from '../lib/monster-model.ts';
import { createNeighbour } from '../lib/neighbours.ts';
import { placeFor } from '../lib/adventure.ts';
const flower = { id: 'flower-0', x: 60, z: 40 },
  butterfly = { id: 'butterfly-1', x: 61, z: 41 };
const target = { id: 'friend-woods', kind: 'wave', x: 1, z: 2 };
const input = {
  active: true,
  moving: false,
  blocked: false,
  reduced: false,
  target,
  x: 0,
  z: 0,
  facing: 0,
};
const pose = (attention, extra = {}) => ({
  delta: 1 / 60,
  time: 2,
  speed: 0,
  airborne: 0,
  celebrating: false,
  greeting: false,
  reducedMotion: false,
  attention,
  ...extra,
});

test('attention finds actual nearby friends, flowers and butterflies within their correct region', () => {
  for (const id of [
    'meadow',
    'woods',
    'cove',
    'garden',
    'shop',
    'rocket',
    'moon',
  ]) {
    const p = placeFor(id),
      region = id === 'moon' ? 'moon' : 'island';
    assert.equal(
      nearbyAttention(p.x, p.z + 3, region, [], [])?.id,
      'friend-' + id,
    );
  }
  assert.equal(
    nearbyAttention(60, 40, 'island', [flower], [butterfly])?.kind,
    'sniff',
  );
  assert.equal(
    nearbyAttention(60, 40, 'island', [], [butterfly])?.kind,
    'watch',
  );
  assert.equal(nearbyAttention(60, 40, 'moon', [flower], [butterfly]), null);
  assert.equal(nearbyAttention(70, 50, 'island', [flower], [butterfly]), null);
  assert.equal(nearbyAttention(NaN, 0, 'island', [], []), null);
});
test('a reaction waits for a short idle, blends in and out and respects per-target cooldowns', () => {
  const attention = new MonsterAttention(),
    moments = [];
  for (let i = 0; i < 600; i++) {
    const value = attention.update(0.02, input);
    if (value) moments.push({ at: i * 0.02, ...value });
  }
  assert.ok(moments[0].at >= 0.88);
  assert.ok(moments.at(-1).at < 4.4);
  assert.ok(moments[0].weight < 0.01 && moments.at(-1).weight < 0.01);
  assert.ok(moments.some((m) => m.weight > 0.99));
  assert.ok(
    moments.every(
      (m) => m.weight >= 0 && m.weight <= 1 && Math.abs(m.lookX) <= 1,
    ),
  );
  const other = { ...input, target: { ...target, id: 'friend-garden' } };
  let response = null;
  for (let i = 0; i < 50; i++)
    response = attention.update(0.02, other) ?? response;
  assert.ok(response, 'Another friend can receive an independent greeting');
});
test('moving, jumping/carrying, target loss and reduced motion cancel reactions; menus pause their clock', () => {
  for (const override of [
    { moving: true },
    { blocked: true },
    { reduced: true },
    { target: null },
  ]) {
    const attention = new MonsterAttention();
    for (let i = 0; i < 80; i++) attention.update(0.02, input);
    assert.equal(attention.update(0.02, { ...input, ...override }), null);
    assert.equal(attention.update(0.02, input), null);
  }
  const attention = new MonsterAttention();
  let previous;
  for (let i = 0; i < 80; i++) previous = attention.update(0.02, input);
  for (let i = 0; i < 100; i++)
    assert.equal(attention.update(500, { ...input, active: false }), null);
  const resumed = attention.update(0.02, input);
  assert.ok(Math.abs(resumed.age - previous.age - 0.02) < 1e-8);
  const fresh = new MonsterAttention();
  for (const dt of [NaN, Infinity, -1, 1000])
    assert.equal(fresh.update(dt, input), null);
});
test('all contextual poses keep Monster and outfits finite and leave the eye whites in place', () => {
  const monster = createMonster(),
    white = monster.root.getObjectByName('Eye white left'),
    original = white.position.clone();
  for (const kind of ['wave', 'sniff', 'watch'])
    for (let i = 0; i < 240; i++) {
      monster.animate(
        pose({
          kind,
          age: i / 60,
          weight: Math.sin((i / 240) * Math.PI) ** 2,
          lookX: 0.9,
          lookY: kind === 'sniff' ? -0.75 : 0.65,
        }),
      );
      monster.root.updateMatrixWorld(true);
      monster.root.traverse((o) =>
        assert.ok(o.matrixWorld.elements.every(Number.isFinite)),
      );
      assert.ok(white.position.equals(original));
    }
  monster.animate(
    pose({ kind: 'wave', age: 1, weight: 1, lookX: 0, lookY: 0 }),
  );
  assert.ok(monster.arms[1].rotation.z < -1.7);
  monster.animate(
    pose({ kind: 'sniff', age: 1, weight: 1, lookX: 0, lookY: -0.75 }),
  );
  assert.ok(monster.root.rotation.x > 0.1);
  for (const override of [
    { reducedMotion: true },
    { carrying: true },
    { airborne: 0.1 },
    { celebrating: true },
    { speed: 1 },
    { homeActivity: 'read' },
  ]) {
    const reference = createMonster();
    reference.animate(pose(null, override));
    monster.animate(
      pose({ kind: 'wave', age: 1, weight: 1, lookX: 1, lookY: 1 }, override),
    );
    assert.deepEqual(
      monster.arms.map((a) => a.rotation.toArray()),
      reference.arms.map((a) => a.rotation.toArray()),
    );
  }
  monster.animate(
    pose({ kind: 'watch', age: NaN, weight: NaN, lookX: NaN, lookY: NaN }),
  );
  const bounds = new THREE.Box3().setFromObject(monster.root);
  assert.ok(bounds.min.toArray().every(Number.isFinite));
});
test('all neighbours return a blended greeting and keep their arms at rest when motion is reduced', () => {
  for (const id of [
    'meadow',
    'woods',
    'cove',
    'garden',
    'shop',
    'rocket',
    'moon',
  ]) {
    const npc = createNeighbour(id);
    npc.animate(5, true, false, false, 0, { age: 1, weight: 1 });
    assert.ok(Math.abs(npc.arms[0].rotation.z) > 1.8);
    npc.animate(5, true, false, false, 0, { age: 2, weight: 0 });
    assert.ok(Math.abs(npc.arms[0].rotation.z) < 0.3);
    npc.animate(5, true, false, true, 0, { age: 1, weight: 1 });
    assert.ok(Math.abs(npc.arms[0].rotation.z) < 0.3);
  }
});
