import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createNeighbour } from '../lib/neighbours.ts';
import { PLACES } from '../lib/adventure.ts';
import { villageStroll } from '../lib/neighbour-routines.ts';

test('every neighbour and guest has bounded finite geometry and distinctive character details', () => {
  for (const place of PLACES.filter((p) => p.id !== 'home'))
    for (const visitor of [false, true]) {
      const npc = createNeighbour(place.id, { visitor });
      let triangles = 0;
      npc.root.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          assert.ok(
            Array.from(o.geometry.attributes.position.array).every(
              Number.isFinite,
            ),
          );
          triangles +=
            (o.geometry.index?.count ?? o.geometry.attributes.position.count) /
            3;
        }
      });
      assert.ok(triangles < 110000, place.id + ' budget ' + triangles);
      for (const t of [0, 0.5, 2.4, 5.02, 19, 77]) {
        npc.animate(t, true, true, false, 0.7);
        npc.root.updateMatrixWorld(true);
        npc.root.traverse((o) =>
          assert.ok(o.matrixWorld.elements.every(Number.isFinite)),
        );
        const bounds = new THREE.Box3().setFromObject(npc.root);
        assert.ok(bounds.max.y < 3.5);
        assert.ok(bounds.min.x > -1.8 && bounds.max.x < 1.8);
      }
    }
  for (const [id, name] of [
    ['meadow', 'Chef apron'],
    ['woods', 'Reading glasses'],
    ['cove', 'Sailor cap'],
    ['garden', 'Garden dungarees'],
    ['shop', 'Hair flower'],
    ['rocket', 'Pilot goggles'],
    ['moon', 'Explorer jacket'],
  ])
    assert.ok(createNeighbour(id).root.getObjectByName(name), id + ' ' + name);
});
test('blinks close actual eyelids while eye whites and pupils retain their shape', () => {
  const npc = createNeighbour('meadow'),
    white = npc.root.getObjectByName('Eye white left'),
    pupil = npc.root.getObjectByName('Pupil left'),
    upper = npc.root.getObjectByName('Upper eyelid left'),
    lower = npc.root.getObjectByName('Lower eyelid left');
  const whiteShape = white.scale.toArray(),
    pupilShape = pupil.scale.toArray();
  npc.animate(4.8, false, false, false);
  assert.ok(upper.rotation.x < -1);
  npc.animate(5.02, false, false, false);
  assert.ok(Math.abs(upper.rotation.x) < 0.0001);
  assert.ok(Math.abs(lower.rotation.x) < 0.0001);
  assert.deepEqual(white.scale.toArray(), whiteShape);
  assert.deepEqual(pupil.scale.toArray(), pupilShape);
  npc.animate(5.3, false, false, false);
  assert.ok(upper.rotation.x < -1);
});
test('walking moves opposite feet and reduced motion holds a consistent still pose', () => {
  const npc = createNeighbour('shop');
  npc.animate(0.2, false, false, false, 1);
  const left = npc.root.getObjectByName('Foot left'),
    right = npc.root.getObjectByName('Foot right');
  assert.notEqual(left.position.y, right.position.y);
  const pose = (o) =>
    [
      ...o.position.toArray(),
      ...o.rotation.toArray(),
      ...o.scale.toArray(),
    ].map((v) => (typeof v === 'number' ? v + 0 : v));
  npc.animate(1, true, true, true, 1);
  const transforms = [];
  npc.root.traverse((o) => transforms.push(pose(o)));
  npc.animate(14, true, true, true, 1);
  let i = 0;
  npc.root.traverse((o) => assert.deepEqual(pose(o), transforms[i++]));
});
test('village strolls stay close to their starting point, pause and loop continuously', () => {
  let walking = false,
    resting = false,
    last = villageStroll(0);
  for (let t = 0.02; t <= 72; t += 0.02) {
    const p = villageStroll(t);
    assert.ok(Object.values(p).every(Number.isFinite));
    assert.ok(Math.hypot(p.x, p.z) < 3.1);
    assert.ok(Math.hypot(p.x - last.x, p.z - last.z) < 0.03);
    walking ||= p.walking > 0;
    resting ||= p.walking === 0;
    last = p;
  }
  assert.ok(walking && resting);
  assert.deepEqual(villageStroll(0), villageStroll(36));
});
