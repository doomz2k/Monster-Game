import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { freshProgress, readProgress } from '../lib/learning.ts';
import { exportSave, parseSavedProgress } from '../lib/save-recovery.ts';
import {
  DANCE_MOVES,
  VISITORS,
  freshVisits,
  readVisits,
  visitorAvailable,
  visitorAdmires,
  visitDance,
  finishVisit,
} from '../lib/home-visits.ts';
import { dancePose } from '../lib/visit-motion.ts';
import { createMonster } from '../lib/monster-model.ts';
import { createNeighbour } from '../lib/neighbours.ts';
import script from '../lib/audio-data/adventure-script.json' with { type: 'json' };
import voices from '../lib/audio-data/voice-clips.json' with { type: 'json' };

test('home visits migrate without changing existing savings or learning and validate stored counters', () => {
  const p = freshProgress();
  p.adventure.wallet = 27;
  p.adventure.earned = 27;
  const old = JSON.parse(JSON.stringify(p));
  delete old.adventure.visits;
  assert.deepEqual(readProgress(JSON.stringify(old)), p);
  assert.deepEqual(readVisits(null), freshVisits());
  assert.deepEqual(readVisits([]), freshVisits());
  const visits = readVisits({
    shop: 4,
    garden: 2.5,
    meadow: -1,
    woods: Infinity,
    cove: 200000,
    moon: '2',
    rocket: NaN,
    home: 99,
  });
  assert.deepEqual(visits, {
    shop: 4,
    garden: 0,
    meadow: 0,
    woods: 0,
    cove: 100000,
    rocket: 0,
    moon: 0,
  });
  p.adventure.visits = visits;
  assert.deepEqual(parseSavedProgress(exportSave(p)), p);
});

test('Poppy can visit immediately and each other friend unlocks after helping that friend', () => {
  const p = freshProgress();
  assert.equal(visitorAvailable(p, 'shop'), true);
  assert.equal(visitorAvailable(p, 'home'), false);
  for (const visitor of VISITORS.filter((v) => v.id !== 'shop')) {
    assert.equal(visitorAvailable(p, visitor.id), false);
    assert.equal(finishVisit(p, visitor.id, 0, visitDance(visitor.id, 0)), p);
    p.adventure.rounds[visitor.id] = 1;
    assert.equal(visitorAvailable(p, visitor.id), true);
  }
});

test('complete dances award exactly once, reject stale or wrong answers, and leave school practice alone', () => {
  let p = freshProgress();
  const initial = p;
  assert.equal(finishVisit(p, 'shop', 0, []), p);
  assert.equal(finishVisit(p, 'shop', 0, ['wiggle', 'wiggle']), p);
  assert.equal(finishVisit(p, 'shop', 1, visitDance('shop', 1)), p);
  for (let round = 0; round < 12; round++) {
    const before = p;
    p = finishVisit(p, 'shop', round, visitDance('shop', round));
    assert.notEqual(p, before);
    assert.equal(p.adventure.wallet, (round + 1) * 2);
    assert.equal(p.adventure.earned, (round + 1) * 2);
    assert.equal(finishVisit(p, 'shop', round, visitDance('shop', round)), p);
    assert.deepEqual(p.practice, initial.practice);
    assert.deepEqual(p.adventure.rounds, initial.adventure.rounds);
    assert.deepEqual(p.knownSounds, initial.knownSounds);
  }
  p.adventure.region = 'moon';
  assert.equal(finishVisit(p, 'shop', 12, visitDance('shop', 12)), p);
  p.adventure.region = 'island';
  p.adventure.visits.shop = 100000;
  assert.equal(finishVisit(p, 'shop', 100000, visitDance('shop', 100000)), p);
});

test('dance recipes introduce two moves then visit every distinct three-move recipe without adjacent identical gestures', () => {
  const first = new Set();
  for (const visitor of VISITORS) {
    first.add(visitDance(visitor.id, 0).join(','));
    for (let i = 0; i < 4; i++)
      assert.equal(visitDance(visitor.id, i).length, 2);
    const recipes = new Set();
    for (let i = 4; i < 40; i++) {
      const moves = visitDance(visitor.id, i);
      assert.equal(moves.length, 3);
      assert.ok(moves.every((m) => DANCE_MOVES.includes(m)));
      assert.notEqual(moves[0], moves[1]);
      assert.notEqual(moves[1], moves[2]);
      recipes.add(moves.join(','));
    }
    assert.equal(recipes.size, 36);
    assert.deepEqual(visitDance(visitor.id, 40), visitDance(visitor.id, 4));
    for (const invalid of [-2, NaN, Infinity])
      assert.deepEqual(
        visitDance(visitor.id, invalid),
        visitDance(visitor.id, 0),
      );
    assert.equal(visitDance(visitor.id, Number.MAX_SAFE_INTEGER).length, 3);
  }
  assert.equal(first.size, 7);
});

test('friends admire only their favourite furniture when owned and placed indoors', () => {
  for (const visitor of VISITORS) {
    const p = freshProgress();
    p.adventure.furniture = [null, null, null, null, null, null];
    p.adventure.inventory = [];
    assert.equal(visitorAdmires(p, visitor.id), false);
    p.adventure.inventory.push(visitor.favourite);
    assert.equal(visitorAdmires(p, visitor.id), false);
    p.adventure.gardenFurniture[0] = visitor.favourite;
    assert.equal(visitorAdmires(p, visitor.id), false);
    p.adventure.furniture[0] = visitor.favourite;
    assert.equal(visitorAdmires(p, visitor.id), true);
  }
});

test('monster and all seven neighbour poses remain finite, reset between gestures, and respect reduced movement', () => {
  const monster = createMonster(freshProgress().appearance);
  for (const rig of [monster, ...VISITORS.map((v) => createNeighbour(v.id))]) {
    const armsAtRest = rig.arms.map((a) => a.position.clone());
    for (const reduced of [false, true]) {
      for (const move of DANCE_MOVES) {
        for (const age of [0, 0.3, 0.9, 10, 1000, NaN]) {
          dancePose(rig, move, age, reduced);
          const before = rig.root.position.y;
          dancePose(rig, move, age, reduced);
          assert.equal(rig.root.position.y, before);
          if (reduced) assert.equal(before, 0);
          rig.root.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(rig.root, true);
          assert.ok(box.min.toArray().every(Number.isFinite));
          assert.ok(box.max.toArray().every(Number.isFinite));
        }
      }
    }
    dancePose(rig, null, 0, false);
    rig.arms.forEach((arm, i) =>
      assert.deepEqual(arm.position.toArray(), armsAtRest[i].toArray()),
    );
  }
});

test('every visitor greeting, favourite reaction and move has a bundled British recording', () => {
  const keys = ['visits-intro', ...DANCE_MOVES.map((m) => 'visit-move-' + m)];
  for (const v of VISITORS)
    for (const kind of ['hello', 'admire', 'success'])
      keys.push('visit-' + kind + '-' + v.id);
  for (const key of keys) {
    assert.ok(script[key], key);
    assert.match(voices[key]?.voice ?? '', /^b[fm]_/);
    assert.match(voices[key].path, /\.ogg$/);
    assert.equal(voices[key].text, script[key].text);
  }
});
