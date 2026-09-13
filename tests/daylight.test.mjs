import test from 'node:test';
import assert from 'node:assert/strict';
import { IslandDay, DAY_LENGTH, daylightPalette } from '../lib/daylight.ts';
import { defaultPreferences, readPreferences } from '../lib/preferences.ts';
import { freshProgress, readProgress } from '../lib/learning.ts';

test('the island day advances only during active play and wraps smoothly', () => {
  const day = new IslandDay();
  for (let i = 0; i < 100; i++) day.advance(0.1, true);
  const before = day.elapsed;
  for (let i = 0; i < 100; i++) day.advance(100, false);
  assert.equal(day.elapsed, before);
  for (const dt of [NaN, Infinity, -4, 0]) day.advance(dt, true);
  assert.equal(day.elapsed, before);
  day.advance(3600, true);
  assert.ok(Math.abs(day.elapsed - before - 0.1) < 0.00001);
  day.elapsed = DAY_LENGTH - 0.05;
  day.advance(0.1, true);
  assert.ok(day.elapsed < 0.1);
  assert.equal(day.phase('day'), 0);
  assert.equal(day.phase('sunset'), 0.52);
  assert.equal(day.phase('evening'), 0.7);
});
test('every light phase stays navigable, finite and continuous at the loop seam', () => {
  for (let i = 0; i < 1000; i++) {
    const p = daylightPalette(i / 1000);
    for (const key of ['top', 'horizon', 'fog', 'sun', 'sky', 'ground', 'sea'])
      assert.match(p[key], /^#[0-9a-f]{6}$/);
    assert.ok(p.sunlight >= 0.71 && p.sunlight <= 2.36);
    assert.ok(p.ambient >= 0.77 && p.environment >= 0.19);
    assert.ok(p.evening >= 0 && p.evening <= 1);
  }
  assert.deepEqual(daylightPalette(0), daylightPalette(1));
  assert.deepEqual(daylightPalette(NaN), daylightPalette(0));
  const a = daylightPalette(0.99999),
    b = daylightPalette(0);
  assert.equal(a.top, b.top);
  assert.ok(Math.abs(a.sunlight - b.sunlight) < 0.001);
});
test('daylight preferences survive a save without changing learning or rewards', () => {
  assert.equal(defaultPreferences().daylight, 'cycle');
  assert.equal(readPreferences({ daylight: 'broken' }).daylight, 'cycle');
  for (const mode of ['cycle', 'day', 'sunset', 'evening']) {
    const p = freshProgress();
    p.preferences.daylight = mode;
    p.adventure.wallet = 0;
    assert.deepEqual(readProgress(JSON.stringify(p)), p);
  }
});
