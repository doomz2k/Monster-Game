import test from 'node:test';
import assert from 'node:assert/strict';
import { freshProgress, readProgress } from '../lib/learning.ts';
import { exportSave, parseSavedProgress } from '../lib/save-recovery.ts';
import {
  TRACK_ROUTES,
  trackTask,
  inspectTrack,
  turnedPorts,
  nextTrackHint,
  finishTrack,
  trackRidePoint,
} from '../lib/track-workshop.ts';
import script from '../lib/audio-data/adventure-script.json' with { type: 'json' };
import voices from '../lib/audio-data/voice-clips.json' with { type: 'json' };

function checkRoute(path) {
  assert.equal(path[0] % 3, 0);
  assert.equal(path.at(-1) % 3, 2);
  assert.ok(path.length >= 3 && path.length <= 7);
  assert.equal(new Set(path).size, path.length);
  path.forEach((cell, i) => {
    assert.ok(Number.isInteger(cell) && cell >= 0 && cell < 9);
    if (i)
      assert.equal(
        Math.abs((cell % 3) - (path[i - 1] % 3)) +
          Math.abs(Math.floor(cell / 3) - Math.floor(path[i - 1] / 3)),
        1,
      );
  });
}
test('workshop introduces one turnable piece, then covers all 29 distinct contiguous routes', () => {
  assert.equal(TRACK_ROUTES.length, 29);
  assert.equal(new Set(TRACK_ROUTES.map((r) => r.join(','))).size, 29);
  TRACK_ROUTES.forEach(checkRoute);
  for (let i = 0; i < 500; i++) {
    const task = trackTask(i);
    checkRoute(task.path);
    const editable = task.pieces.filter((p) => p.editable);
    assert.equal(
      editable.length,
      Math.min(i < 3 ? 1 : i < 8 ? 2 : 3, task.path.length - 2),
    );
    assert.ok(
      task.pieces[0].editable === false &&
        task.pieces.at(-1).editable === false,
    );
    assert.equal(inspectTrack(task, task.turns).connected, false);
    assert.equal(inspectTrack(task, Array(9).fill(0)).connected, true);
    assert.notEqual(nextTrackHint(task, task.turns), null);
    assert.equal(nextTrackHint(task, Array(9).fill(0)), null);
    if (i >= 3) assert.deepEqual(task.path, trackTask(i + 29).path);
  }
  for (const bad of [-1, NaN, Infinity, 1.3])
    assert.deepEqual(trackTask(bad), trackTask(0));
});
test('every accepted rotation combination follows an unbroken route and neither mutates the task nor jumps across a gap', () => {
  for (let round = 8; round < 37; round++) {
    const task = trackTask(round),
      original = JSON.stringify(task),
      editable = task.pieces.filter((p) => p.editable);
    let connected = 0;
    for (let mask = 0; mask < 4 ** editable.length; mask++) {
      const turns = Array(9).fill(0);
      editable.forEach((p, i) => {
        turns[p.cell] = Math.floor(mask / 4 ** i) % 4;
      });
      const answer = inspectTrack(task, turns);
      if (answer.connected) {
        checkRoute(answer.visited);
        connected++;
      } else assert.notEqual(nextTrackHint(task, turns), null);
    }
    assert.ok(connected > 0);
    assert.equal(JSON.stringify(task), original);
  }
  const straight = trackTask(0).pieces.find((p) => p.editable);
  assert.deepEqual(turnedPorts(straight, 4), straight.ports);
  assert.deepEqual(turnedPorts(straight, -1), turnedPorts(straight, 3));
  const turns = Array(9).fill(0);
  turns[4] = 2;
  assert.equal(inspectTrack(trackTask(0), turns).connected, true);
  assert.equal(nextTrackHint(trackTask(0), turns), null);
});
test('road rewards need an unlocked workshop, current ticket and a complete route, and do not count as school practice', () => {
  let p = freshProgress();
  const solved = Array(9).fill(0);
  assert.equal(finishTrack(p, 0, solved), p);
  p.adventure.rounds.rocket = 1;
  const initial = structuredClone(p);
  assert.equal(finishTrack(p, 0, trackTask(0).turns), p);
  for (const bad of [
    [],
    [0],
    Array(10).fill(0),
    Array(9).fill(NaN),
    Array(9).fill(0.5),
  ])
    assert.equal(finishTrack(p, 0, bad), p);
  for (let i = 0; i < 40; i++) {
    const before = p;
    assert.equal(finishTrack(p, i + 1, solved), p);
    p = finishTrack(p, i, solved);
    assert.notEqual(p, before);
    assert.equal(p.adventure.workshop, i + 1);
    assert.equal(p.adventure.wallet, (i + 1) * 2);
    assert.equal(p.adventure.earned, (i + 1) * 2);
    assert.equal(finishTrack(p, i, solved), p);
    assert.deepEqual(p.practice, initial.practice);
    assert.deepEqual(p.adventure.rounds, initial.adventure.rounds);
    assert.deepEqual(p.knownSounds, initial.knownSounds);
  }
  p.adventure.region = 'moon';
  assert.equal(finishTrack(p, 40, solved), p);
  p.adventure.region = 'island';
  p.adventure.workshop = 100000;
  assert.equal(finishTrack(p, 100000, solved), p);
});
test('old saves gain an empty workshop and exported progress preserves earned road rewards', () => {
  const p = freshProgress(),
    old = structuredClone(p);
  delete old.adventure.workshop;
  assert.deepEqual(readProgress(JSON.stringify(old)), p);
  for (const [input, expected] of [
    [-1, 0],
    [2.3, 0],
    ['7', 0],
    [200000, 100000],
  ]) {
    old.adventure.workshop = input;
    assert.equal(
      readProgress(JSON.stringify(old)).adventure.workshop,
      expected,
    );
  }
  p.adventure.rounds.rocket = 1;
  const complete = finishTrack(p, 0, Array(9).fill(0));
  assert.deepEqual(parseSavedProgress(exportSave(complete)), complete);
});
test('the rover travels continuously through each visited cell and stops exactly beyond the flag', () => {
  for (let round = 0; round < 32; round++) {
    const task = trackTask(round),
      duration = trackRidePoint(task, 0).duration;
    let previous = trackRidePoint(task, 0);
    for (let ms = 10; ms <= duration + 10; ms += 10) {
      const now = trackRidePoint(task, ms);
      assert.ok([now.x, now.y, now.angle].every(Number.isFinite));
      assert.ok(Math.hypot(now.x - previous.x, now.y - previous.y) < 0.025);
      previous = now;
    }
    task.path.forEach((cell, i) => {
      const entry = trackRidePoint(task, 250 + i * 700);
      const previous = task.path[i - 1];
      assert.equal(entry.x, i ? ((cell % 3) + (previous % 3)) / 2 : -0.5);
      assert.equal(
        entry.y,
        i
          ? (Math.floor(cell / 3) + Math.floor(previous / 3)) / 2
          : Math.floor(cell / 3),
      );
      const before = trackRidePoint(task, 250 + i * 700 - 0.001),
        after = trackRidePoint(task, 250 + i * 700 + 0.001);
      assert.ok(Math.hypot(before.x - after.x, before.y - after.y) < 0.00001);
      // Entry tangents agree across tile boundaries, including curved pieces.
      assert.ok(
        Math.abs(Math.sin(((before.angle - after.angle) * Math.PI) / 180)) <
          0.0001,
      );
    });
    const end = trackRidePoint(task, duration + 10000);
    assert.equal(end.x, 2.8);
    assert.equal(end.y, Math.floor(task.path.at(-1) / 3));
    assert.equal(end.finished, true);
    for (const bad of [-10, NaN, Infinity])
      assert.deepEqual(trackRidePoint(task, bad), trackRidePoint(task, 0));
  }
});
test('all workshop instructions have bundled British Pip recordings', () => {
  for (const action of ['intro', 'help', 'try', 'ready', 'drive', 'success']) {
    const key = 'workshop-' + action;
    assert.equal(script[key].voice, 'pip');
    assert.equal(voices[key].voice, 'bm_fable');
    assert.equal(voices[key].text, script[key].text);
    assert.match(voices[key].path, /\.ogg$/);
  }
});
