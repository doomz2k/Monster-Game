import test from 'node:test';
import assert from 'node:assert/strict';
import { nextMenuChoice } from '../lib/menu-navigation.ts';
test('right follows a wide furniture shelf instead of jumping diagonally to the tabs', () => {
  const rects = [
    { x: 335, y: 160, width: 300, height: 58 },
    { x: 25, y: 230, width: 608, height: 83 },
    { x: 645, y: 230, width: 608, height: 83 },
  ];
  assert.equal(nextMenuChoice(rects, 1, 'right'), 2);
  assert.equal(nextMenuChoice(rects, 2, 'left'), 1);
  assert.equal(nextMenuChoice(rects, 1, 'up'), 0);
});
test('the controller visits every cell in both directions without diagonal skips', () => {
  const rects = Array.from({ length: 6 }, (_, i) => ({
    x: (i % 3) * 130,
    y: Math.floor(i / 3) * 100,
    width: 110,
    height: 80,
  }));
  assert.equal(nextMenuChoice(rects, 0, 'right'), 1);
  assert.equal(nextMenuChoice(rects, 1, 'right'), 2);
  assert.equal(nextMenuChoice(rects, 2, 'down'), 5);
  assert.equal(nextMenuChoice(rects, 5, 'left'), 4);
  assert.equal(nextMenuChoice(rects, 4, 'left'), 3);
  assert.equal(nextMenuChoice(rects, 3, 'up'), 0);
  assert.equal(nextMenuChoice(rects, 0, 'up'), 0);
  assert.equal(nextMenuChoice(rects, 0, 'left'), 0);
});
test('offset controls remain reachable when no aligned neighbour exists', () => {
  const rects = [
    { x: 0, y: 0, width: 100, height: 60 },
    { x: 160, y: 80, width: 100, height: 60 },
  ];
  assert.equal(nextMenuChoice(rects, 0, 'down'), 1);
  assert.equal(nextMenuChoice(rects, 1, 'up'), 0);
  assert.equal(nextMenuChoice(rects, -1, 'right'), 0);
  assert.equal(nextMenuChoice([], 0, 'down'), -1);
});
