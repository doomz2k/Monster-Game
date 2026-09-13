import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  ROVER_STOPS,
  ROVER_DOCK,
  readRoverProgress,
  roverSurvey,
  nextRoverStop,
  finishRoverSurvey,
  roverExit,
  nearbyRoverStop,
} from '../lib/rover.ts';
import { createRoverModel } from '../lib/rover-model.ts';
import { roverRoute, clearRoverSegment } from '../lib/rover-route.ts';
import { freshProgress } from '../lib/learning.ts';
import { readAdventure } from '../lib/adventure.ts';
import clips from '../lib/audio-data/voice-clips.json' with { type: 'json' };

test('older and malformed saves gain a safe, locked-until-repaired expedition', () => {
  assert.deepEqual(readRoverProgress(undefined, true), {
    rocks: 0,
    panels: 0,
    signals: 0,
  });
  assert.deepEqual(
    readRoverProgress({ rocks: 9, panels: 8, signals: 7 }, false),
    { rocks: 0, panels: 0, signals: 0 },
  );
  assert.deepEqual(
    readRoverProgress({ rocks: -1, panels: NaN, signals: 2.3 }, true),
    { rocks: 0, panels: 0, signals: 0 },
  );
  const p = freshProgress();
  p.adventure.rounds.rocket = 3;
  p.adventure.rover = { rocks: 3, panels: 1, signals: 2 };
  assert.deepEqual(
    readAdventure(JSON.parse(JSON.stringify(p.adventure)), 0).rover,
    p.adventure.rover,
  );
});
test('each route offers all five quantities before repeating and visits unfinished stops first', () => {
  const p = freshProgress();
  for (const s of ROVER_STOPS) {
    const targets = [];
    for (let n = 0; n < 5; n++) {
      p.adventure.rover[s.id] = n;
      targets.push(roverSurvey(s.id, p.adventure.rover).target);
    }
    assert.deepEqual(
      targets.sort((a, b) => a - b),
      [1, 2, 3, 4, 5],
    );
  }
  assert.equal(nextRoverStop({ rocks: 1, panels: 0, signals: 0 }), 'panels');
  assert.equal(nextRoverStop({ rocks: 2, panels: 1, signals: 0 }), 'signals');
});
test('survey rewards need the correct answer, real stop, unlocked Moon and a fresh round', () => {
  const p = freshProgress();
  p.adventure.rounds.rocket = 3;
  p.adventure.region = 'moon';
  const s = ROVER_STOPS[0],
    task = roverSurvey(s.id, p.adventure.rover);
  assert.equal(finishRoverSurvey(p, task, 0, s.x, s.z), p);
  assert.equal(finishRoverSurvey(p, task, task.target, 0, 0), p);
  assert.equal(finishRoverSurvey(p, task, task.target, NaN, s.z), p);
  assert.equal(finishRoverSurvey(p, { ...task, target: 4 }, 4, s.x, s.z), p);
  const next = finishRoverSurvey(p, task, task.target, s.x, s.z);
  assert.equal(next.adventure.wallet, p.adventure.wallet + 1);
  assert.equal(next.adventure.earned, p.adventure.earned + 1);
  assert.equal(next.adventure.rover.rocks, 1);
  assert.equal(finishRoverSurvey(next, task, task.target, s.x, s.z), next);
  assert.equal(p.adventure.rover.rocks, 0);
  assert.equal(nearbyRoverStop(999, 999), undefined);
  p.adventure.region = 'island';
  assert.equal(finishRoverSurvey(p, task, task.target, s.x, s.z), p);
});
test('climbing out chooses a clear side at the shore and beside the observatory', () => {
  const obstacles = [{ x: 19, z: -17, r: 3.5 }];
  for (const [x, z, a] of [
    [79, 0, 0],
    [0, -79, Math.PI / 2],
    [24.3, -17, Math.PI],
    [ROVER_DOCK.x, ROVER_DOCK.z, 0],
  ]) {
    const exit = roverExit(x, z, a, obstacles);
    assert.ok(Math.hypot(exit.x, exit.z) <= 80);
    assert.ok(
      obstacles.every(
        (o) => Math.hypot(exit.x - o.x, exit.z - o.z) >= o.r + 0.5,
      ),
    );
    assert.ok(Math.hypot(exit.x - x, exit.z - z) > 3);
  }
});
test('the six-wheel rover remains bounded and animation does not accumulate drift', () => {
  const model = createRoverModel();
  for (let n = 0; n < 500; n++) model.animate(0.1, n / 60, false);
  model.animate(0, 20, true);
  model.root.updateMatrixWorld(true);
  let triangles = 0;
  model.root.traverse((o) => {
    assert.ok(o.matrixWorld.elements.every(Number.isFinite));
    if (o instanceof THREE.Mesh)
      triangles +=
        (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;
  });
  const box = new THREE.Box3().setFromObject(model.root, true);
  assert.ok(
    box.min.x > -1.6 && box.max.x < 1.6 && box.max.y < 3.1 && box.min.y >= 0,
  );
  assert.ok(triangles < 50000);
  assert.equal(model.root.children[0].position.y, 0);
});
test('every expedition instruction is a recorded British line', () => {
  for (const key of [
    'rover-intro',
    'rover-drive',
    'rover-exit',
    'rover-next',
    'rover-success',
    ...ROVER_STOPS.flatMap((s) => [
      'rover-route-' + s.id,
      'rover-count-' + s.id,
    ]),
  ]) {
    assert.ok(clips[key], key);
    assert.match(clips[key].voice, /^b[fm]_/);
    assert.match(clips[key].path, /\.ogg$/);
  }
});

test('guided rides find clear paths between every stop and route around the observatory', () => {
  const obstacles = [{ x: 19, z: -17, r: 3.5 }];
  const locations = [
    ROVER_DOCK,
    ...ROVER_STOPS,
    { x: 0, z: -17 },
    { x: 38, z: -17 },
  ];
  for (const from of locations)
    for (const to of locations) {
      const path = roverRoute(from, to, obstacles);
      assert.ok(path.length > 0);
      let previous = from;
      for (const point of path) {
        assert.ok(clearRoverSegment(previous, point, obstacles));
        assert.ok(Math.hypot(point.x, point.z) <= 80);
        previous = point;
      }
      assert.deepEqual(previous, to);
    }
  assert.ok(
    roverRoute({ x: 0, z: -17 }, { x: 38, z: -17 }, obstacles).length > 1,
  );
  assert.deepEqual(roverRoute({ x: NaN, z: 0 }, ROVER_DOCK, obstacles), []);
});
