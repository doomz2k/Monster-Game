import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  PLANETS,
  observePlanet,
  readPlanetCollection,
  modelOrbit,
  planetComparison,
} from '../lib/observatory.ts';
import { freshProgress, readProgress } from '../lib/learning.ts';
import { exportSave, parseSavedProgress } from '../lib/save-recovery.ts';
import { createPlanet, disposePlanetScene } from '../lib/planet-model.ts';
import script from '../lib/audio-data/adventure-script.json' with { type: 'json' };
import voices from '../lib/audio-data/voice-clips.json' with { type: 'json' };

test('planet discovery is locked until Moon travel and cannot award duplicate observation stars', () => {
  let p = freshProgress();
  assert.equal(observePlanet(p, 'earth'), p);
  p.adventure.rounds.rocket = 3;
  assert.equal(observePlanet(p, 'earth'), p);
  p.adventure.region = 'moon';
  assert.equal(observePlanet(p, 'pluto'), p);
  for (const planet of [...PLANETS].reverse()) {
    const before = p.adventure.wallet;
    p = observePlanet(p, planet.id);
    assert.equal(p.adventure.wallet, before + 1);
    assert.equal(observePlanet(p, planet.id), p);
  }
  assert.equal(p.adventure.wallet, 8);
  assert.equal(p.adventure.earned, 8);
  assert.deepEqual(
    p.adventure.planets,
    PLANETS.map((p) => p.id),
  );
  assert.deepEqual(p.practice, freshProgress().practice);
  assert.deepEqual(p.knownSounds, []);
  assert.equal(p.adventure.rounds.moon, 0);
  assert.deepEqual(parseSavedProgress(exportSave(p)), p);
});

test('old and malformed planet collections preserve existing progress and accept only eight unique planets', () => {
  const p = freshProgress();
  p.adventure.wallet = 6;
  p.adventure.earned = 6;
  p.preferences.weather = 'rainbow';
  const old = JSON.parse(JSON.stringify(p));
  delete old.adventure.planets;
  assert.deepEqual(readProgress(JSON.stringify(old)), p);
  const data = ['earth', 'saturn', 'earth', 'sun', 'moon', '__proto__', null];
  assert.deepEqual(readPlanetCollection(data, true), ['earth', 'saturn']);
  assert.deepEqual(readPlanetCollection(data, false), []);
  for (const raw of [null, 42, {}, 'earth'])
    assert.deepEqual(readPlanetCollection(raw, true), []);
  old.adventure.planets = data;
  assert.deepEqual(readProgress(JSON.stringify(old)).adventure.planets, []);
});

test('planet order and comparison widths use the documented equatorial measurements', () => {
  assert.deepEqual(
    PLANETS.map((p) => p.id),
    [
      'mercury',
      'venus',
      'earth',
      'mars',
      'jupiter',
      'saturn',
      'uranus',
      'neptune',
    ],
  );
  assert.deepEqual(
    PLANETS.map((p) => p.diameter),
    [4880, 12104, 12756, 6792, 142984, 120536, 51118, 49528],
  );
  for (const p of PLANETS) {
    const c = planetComparison(p.id);
    assert.ok(Math.abs(c.planet / c.earth - p.diameter / 12756) < 1e-12);
    assert.ok(c.earth > 0 && c.earth <= 0.9 && c.planet > 0 && c.planet <= 0.9);
  }
  assert.equal(planetComparison('earth').ratio, 1);
  assert.ok(
    planetComparison('jupiter').ratio > 11 &&
      planetComparison('jupiter').ratio < 11.3,
  );
});

test('compressed orbits keep the correct order, bounded positions and continuous movement', () => {
  let previous = 0;
  for (let i = 0; i < 8; i++) {
    const start = modelOrbit(i, 0);
    assert.ok(start.radius > previous);
    previous = start.radius;
    for (const t of [0, 1, 100, 10000, NaN, Infinity, -5]) {
      const p = modelOrbit(i, t);
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.z));
      assert.ok(Math.abs(Math.hypot(p.x, p.z) - p.radius) < 1e-10);
    }
    const a = modelOrbit(i, 10),
      b = modelOrbit(i, 10.05);
    assert.ok(Math.hypot(a.x - b.x, a.z - b.z) < 0.025);
  }
  for (const index of [-2, 100, NaN, Infinity])
    assert.ok(Number.isFinite(modelOrbit(index, 1).x));
});

test('illustrated planets stay finite and bounded through rotation in both graphics tiers', () => {
  for (const simple of [false, true])
    for (const id of [...PLANETS.map((p) => p.id), 'sun', 'moon']) {
      const planet = createPlanet(id, simple);
      let count = 0;
      planet.root.traverse((o) => {
        if (!o.geometry) return;
        count++;
        const p = o.geometry.getAttribute('position');
        assert.ok([...p.array].every(Number.isFinite));
        assert.ok(p.count < 12000);
      });
      assert.ok(count >= 1 && count <= 32);
      for (const t of [0, 100, NaN, Infinity]) {
        planet.animate(t);
        planet.root.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(planet.root, true);
        assert.ok(box.min.toArray().every(Number.isFinite));
        const size = box.getSize(new THREE.Vector3());
        assert.ok(Math.max(size.x, size.y, size.z) < 4.5);
      }
      disposePlanetScene(planet.root);
    }
});

test('every observatory instruction and planet description is a bundled British recording', () => {
  for (const id of [
    'intro',
    'telescope',
    'orbits',
    'sizes',
    ...PLANETS.map((p) => 'fact-' + p.id),
  ]) {
    const key = 'observatory-' + id;
    assert.equal(script[key].voice, 'nova');
    assert.ok(voices[key]?.path.endsWith('.ogg'), key);
    assert.ok(voices[key].voice.startsWith('bf_'));
    assert.equal(voices[key].text, script[key].text);
  }
  assert.match(
    script['observatory-orbits'].text,
    /changed the sizes and speeds/,
  );
  assert.match(script['observatory-sizes'].text, /same ruler/);
});
