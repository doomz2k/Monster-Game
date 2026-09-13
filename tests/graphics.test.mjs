import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GraphicsGovernor,
  GRAPHICS,
  graphicsPixelRatio,
} from '../lib/graphics-quality.ts';
import { defaultPreferences, readPreferences } from '../lib/preferences.ts';
import { freshProgress, readProgress } from '../lib/learning.ts';

function frames(g, fps, seconds) {
  for (let i = 0; i < fps * seconds; i++) g.sample(1000 / fps);
}
test('automatic graphics needs sustained evidence and ignores pauses and isolated stalls', () => {
  const g = new GraphicsGovernor();
  frames(g, 60, 8);
  assert.equal(g.tier, 'balanced');
  for (let i = 0; i < 20; i++) {
    g.sample(900);
    frames(g, 15, 1);
  }
  assert.equal(g.tier, 'balanced');
  g.pause();
  frames(g, 20, 5);
  assert.equal(g.tier, 'balanced');
  frames(g, 20, 6);
  assert.equal(g.tier, 'simple');
  assert.ok(g.fps >= 19.9 && g.fps <= 20.1);
  frames(g, 60, 12);
  assert.equal(g.tier, 'simple');
  frames(g, 60, 20);
  assert.equal(g.tier, 'balanced');
  frames(g, 60, 32);
  assert.equal(g.tier, 'rich');
});
test('manual graphics stays fixed and automatic resumes with a fresh sample', () => {
  const g = new GraphicsGovernor();
  for (const tier of ['rich', 'simple', 'balanced']) {
    g.setMode(tier);
    frames(g, 15, 40);
    frames(g, 120, 40);
    assert.equal(g.tier, tier);
  }
  g.setMode('auto');
  assert.equal(g.tier, 'balanced');
  for (const n of [NaN, Infinity, 0, -5]) g.sample(n);
  assert.equal(g.tier, 'balanced');
  frames(g, 30, 3);
  assert.equal(g.tier, 'balanced');
});
test('sustained severe frame stalls still lower automatic detail', () => {
  const g = new GraphicsGovernor();
  frames(g, 3, 15);
  assert.equal(g.tier, 'simple');
  assert.ok(g.fps < 4);
});
test('each render tier obeys its pixel budget at TV, laptop and high DPI sizes', () => {
  for (const tier of ['rich', 'balanced', 'simple'])
    for (const [w, h, dpr] of [
      [960, 540, 1],
      [1920, 1080, 2],
      [3840, 2160, 3],
      [390, 844, 3],
    ]) {
      const ratio = graphicsPixelRatio(tier, w, h, dpr);
      assert.ok(
        ratio > 0 && ratio <= dpr && ratio <= GRAPHICS[tier].pixelRatio,
      );
      assert.ok(w * h * ratio * ratio <= GRAPHICS[tier].pixels + 0.01);
    }
  assert.equal(graphicsPixelRatio('rich', 960, 540, NaN), 1);
  assert.ok(GRAPHICS.simple.grass < GRAPHICS.balanced.grass);
  assert.ok(GRAPHICS.balanced.shadowSize < GRAPHICS.rich.shadowSize);
});
test('graphics preferences migrate, round-trip and leave adventure rewards untouched', () => {
  assert.equal(defaultPreferences().graphics, 'auto');
  for (const graphics of ['auto', 'rich', 'simple', 'balanced']) {
    const p = freshProgress();
    p.adventure.wallet = 3;
    p.adventure.earned = 3;
    p.preferences.graphics = graphics;
    const q = readProgress(JSON.stringify(p));
    assert.equal(q.preferences.graphics, graphics);
    assert.deepEqual(q.adventure, p.adventure);
  }
  assert.equal(readPreferences({ graphics: 'ultra' }).graphics, 'auto');
  assert.equal(readPreferences({ graphics: [] }).graphics, 'auto');
});
