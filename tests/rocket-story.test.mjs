import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createRocketModel } from '../lib/rocket-model.ts';
import {
  FlightJourney,
  FLIGHT_DURATION,
  flightPose,
  repairStage,
  rocketChapter,
} from '../lib/rocket-story.ts';
import clips from '../lib/audio-data/voice-clips.json' with { type: 'json' };

test('each rocket repair restores the corresponding visible system and keeps a bounded model', () => {
  const model = createRocketModel(0);
  for (let stage = 0; stage <= 3; stage++) {
    model.setRepairStage(stage);
    assert.equal(
      model.root.getObjectByName('Repaired control panel').visible,
      stage >= 1,
    );
    assert.equal(
      model.root.getObjectByName('Loose panel wire').visible,
      stage === 0,
    );
    assert.equal(
      model.root.getObjectByName('Full fuel gauge').visible,
      stage >= 2,
    );
    assert.equal(
      model.root.getObjectByName('Connected star battery').visible,
      stage >= 3,
    );
    assert.equal(model.flame.visible, false);
    model.root.updateMatrixWorld(true);
    let triangles = 0;
    model.root.traverse((o) => {
      assert.ok(o.matrixWorld.elements.every(Number.isFinite));
      if (o instanceof THREE.Mesh) {
        assert.ok(
          Array.from(o.geometry.attributes.position.array).every(
            Number.isFinite,
          ),
        );
        triangles +=
          (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;
      }
    });
    assert.ok(triangles < 45000);
    const box = new THREE.Box3().setFromObject(model.root);
    assert.ok(
      box.max.y < 6.5 && box.min.y > -2 && box.min.x > -3 && box.max.x < 3,
    );
  }
  assert.equal(model.hull.rotation.z, 0);
});
test('rocket chapters safely clamp saved progress and all have recorded British instructions', () => {
  for (const n of [NaN, Infinity, -9]) assert.equal(repairStage(n), 0);
  assert.equal(repairStage(999), 3);
  for (let i = 0; i < 4; i++) {
    assert.ok(clips[rocketChapter(i).line]);
    assert.match(clips[rocketChapter(i).line].voice, /^bm_/);
    if (i > 0) assert.ok(clips['pip-repair-' + i]);
  }
});
test('flight pauses retain their position and arrival can be committed only once', () => {
  const journey = new FlightJourney();
  for (let i = 0; i < 20; i++) journey.advance(50, true);
  const position = journey.elapsed;
  for (let i = 0; i < 100; i++) journey.advance(50, false);
  assert.equal(journey.elapsed, position);
  for (let i = 0; i < 200; i++) journey.advance(50, true);
  assert.equal(journey.elapsed, FLIGHT_DURATION);
  assert.equal(journey.arrive(), true);
  assert.equal(journey.arrive(), false);
  journey.cancel();
  assert.equal(journey.status, 'arrived');
});
test('cancelling or skipping a journey cannot cause a delayed second arrival', () => {
  const cancelled = new FlightJourney();
  cancelled.advance(50, true);
  cancelled.cancel();
  for (let i = 0; i < 200; i++) cancelled.advance(50, true);
  assert.equal(cancelled.elapsed, 50);
  assert.equal(cancelled.arrive(), false);
  const skipped = new FlightJourney();
  assert.equal(skipped.arrive(), true);
  assert.equal(skipped.advance(100, true), 1);
  assert.equal(skipped.arrive(), false);
  const start = new FlightJourney();
  for (const n of [NaN, Infinity, -1, 0]) start.advance(n, true);
  assert.equal(start.elapsed, 0);
});
test('flight choreography is continuous, finite and still in reduced motion', () => {
  let last = flightPose(0, false);
  for (let i = 1; i <= 1000; i++) {
    const p = flightPose(i / 1000, false);
    assert.ok(Object.values(p).every(Number.isFinite));
    assert.ok(Math.abs(p.x - last.x) < 0.05 && Math.abs(p.y - last.y) < 0.05);
    last = p;
  }
  const pose = (p) => {
    const { phase: _phase, ...motion } = flightPose(p, true);
    return motion;
  };
  assert.deepEqual(pose(0), pose(0.6));
  assert.deepEqual(pose(0.6), pose(1));
  assert.deepEqual(flightPose(NaN, false), flightPose(0, false));
});
