import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  IslandWeather,
  WEATHER_LENGTH,
  WEATHER_MODES,
  weatherAt,
  weatherPalette,
  PUDDLES,
  puddleAt,
  PuddleSteps,
} from '../lib/weather.ts';
import { createIslandWeather } from '../lib/island-weather.ts';
import { daylightPalette } from '../lib/daylight.ts';
import { groundHeight, PLAY_RADIUS } from '../lib/world-layout.ts';
import { defaultPreferences, readPreferences } from '../lib/preferences.ts';
import { freshProgress, readProgress } from '../lib/learning.ts';
import { environmentalMix } from '../lib/soundscape.ts';
import { PLACES } from '../lib/adventure.ts';

test('weather advances only during active play, never catching up an absence', () => {
  const w = new IslandWeather();
  for (let i = 0; i < 100; i++) w.advance(0.1, true);
  const before = w.elapsed;
  for (const dt of [20, NaN, Infinity, -1]) w.advance(dt, false);
  assert.equal(w.elapsed, before);
  for (const dt of [NaN, Infinity, -1]) w.advance(dt, true);
  assert.equal(w.elapsed, before);
  w.advance(3600, true);
  assert.ok(Math.abs(w.elapsed - before - 0.1) < 0.000001);
  w.elapsed = WEATHER_LENGTH - 0.05;
  w.advance(0.1, true);
  assert.ok(w.elapsed < 0.1);
});
test('all weather transitions stay gentle, bright and continuous', () => {
  for (let t = 0; t < WEATHER_LENGTH; t += 0.5) {
    const w = weatherAt(t),
      next = weatherAt(t + 0.5);
    for (const key of ['rain', 'wet', 'cloud', 'rainbow']) {
      assert.ok(w[key] >= 0 && w[key] <= 1);
      assert.ok(Math.abs(next[key] - w[key]) < 0.03);
    }
    const p = weatherPalette(daylightPalette(t / WEATHER_LENGTH), w);
    assert.ok(p.sunlight >= 0.59 && p.ambient >= 0.78);
    for (const key of ['top', 'horizon', 'fog'])
      assert.match(p[key], /^#[0-9a-f]{6}$/);
  }
  assert.deepEqual(weatherAt(0), weatherAt(WEATHER_LENGTH));
  assert.deepEqual(weatherAt(NaN), weatherAt(0));
  assert.equal(weatherAt(180).rain, 0);
  assert.equal(weatherAt(300).rain, 0.7);
  assert.equal(weatherAt(405).rainbow, 1);
});
test('weather settings preserve old saves and calm or reduced play removes falling rain', () => {
  assert.equal(defaultPreferences().weather, 'cycle');
  assert.equal(readPreferences({ weather: 'thunder' }).weather, 'cycle');
  const w = new IslandWeather();
  w.elapsed = 300;
  for (const mode of WEATHER_MODES) {
    const p = freshProgress();
    p.preferences.weather = mode;
    assert.deepEqual(readProgress(JSON.stringify(p)), p);
    assert.deepEqual(w.sample(mode, true), w.sample('sunny'));
    assert.equal(w.sample(mode, false, true).rain, 0);
  }
  assert.equal(w.sample('drizzle', false, true).wet, 1);
  assert.equal(w.sample('rainbow', false, true).rainbow, 1);
});
test('puddle contacts follow wet footprints on open, reachable island ground', () => {
  PUDDLES.forEach((p, i) => {
    assert.ok(Math.hypot(p.x, p.z) + p.radius < PLAY_RADIUS);
    assert.equal(puddleAt(p.x, p.z, 1), i);
    assert.equal(puddleAt(p.x, p.z, 0), -1);
    assert.equal(puddleAt(p.x + p.radius * 1.1, p.z, 1), -1);
    assert.ok(
      PLACES.filter((p) => p.id !== 'moon').every(
        (place) => Math.hypot(place.x - p.x, place.z - p.z) > 4,
      ),
    );
  });
  assert.equal(puddleAt(NaN, 0, 1), -1);
  assert.equal(puddleAt(0, 7, NaN), -1);
});
test('walking and landing make bounded puddle events, with no idle, teleport or paused splashes', () => {
  const steps = new PuddleSteps();
  assert.equal(steps.update(0.1, 0, 7, false, 1, true), null);
  for (let i = 0; i < 10; i++)
    assert.equal(steps.update(0.1, 0, 7, false, 1, true), null);
  const walk = steps.update(0.1, 0.7, 7, false, 1, true);
  assert.equal(walk.index, 0);
  assert.equal(walk.landed, false);
  for (let i = 0; i < 10; i++) steps.update(0.1, 0.7, 7, true, 1, true);
  const land = steps.update(0.1, 0.7, 7, false, 1, true);
  assert.equal(land.index, 0);
  assert.equal(land.landed, true);
  assert.equal(steps.update(0.1, 0.7, 7, false, 1, true), null);
  assert.equal(steps.update(0.1, -13, -7, false, 1, true), null);
  assert.equal(steps.update(1, 0, 7, false, 1, false), null);
  assert.equal(steps.update(0.1, 0, 7, false, 1, true), null);
});
test('weather geometry is finite, rain density follows graphics tiers, and effects pause in menus', () => {
  const model = createIslandWeather(groundHeight),
    w = new IslandWeather();
  const rain = model.root.children.find((o) => o instanceof THREE.LineSegments);
  for (const [tier, count] of [
    ['rich', 600],
    ['balanced', 360],
    ['simple', 144],
  ]) {
    model.update(
      w.sample('drizzle'),
      0.1,
      true,
      false,
      { x: 0, z: 5 },
      tier,
      [],
    );
    assert.equal(rain.geometry.drawRange.count, count);
  }
  const before = Array.from(rain.geometry.attributes.position.array);
  model.update(
    w.sample('drizzle'),
    60,
    false,
    false,
    { x: 0, z: 5 },
    'simple',
    [],
  );
  assert.deepEqual(Array.from(rain.geometry.attributes.position.array), before);
  for (let i = 0; i < 100; i++) {
    model.splash(0, 7, i % 2 === 0);
    model.update(
      w.sample('drizzle'),
      0.1,
      true,
      false,
      { x: 0, z: 5 },
      'rich',
      [],
    );
  }
  model.root.traverse((o) => {
    if (o.geometry?.attributes.position)
      assert.ok(
        Array.from(o.geometry.attributes.position.array).every(Number.isFinite),
      );
    assert.ok(o.position.toArray().every(Number.isFinite));
    assert.ok(o.scale.toArray().every(Number.isFinite));
  });
  assert.equal(model.root.children.length, 13);
  model.update(
    w.sample('drizzle', false, true),
    0.1,
    true,
    true,
    { x: 0, z: 5 },
    'rich',
    [],
  );
  assert.equal(rain.visible, false);
});
test('rain audio remains bounded and is absent off the island or while inactive', () => {
  const s = {
    active: true,
    region: 'island',
    x: 0,
    z: 7,
    moving: true,
    rain: 0.7,
    puddle: true,
  };
  assert.equal(environmentalMix(s).rain.gain, 0.7);
  assert.equal(environmentalMix({ ...s, rain: 9 }).rain.gain, 1);
  assert.equal(environmentalMix({ ...s, rain: NaN }).rain.gain, 0);
  assert.equal(environmentalMix({ ...s, active: false }).rain.gain, 0);
  assert.equal(environmentalMix({ ...s, region: 'moon' }).rain.gain, 0);
});
