import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultAppearance, readAppearance } from '../lib/appearance.ts';
import { equipItem, starterOutfit } from '../lib/wardrobe.ts';
import { freshProgress, readProgress } from '../lib/learning.ts';
test('custom appearance survives save migration and rejects invalid values', () => {
  const appearance = {
    ...defaultAppearance(),
    eyes: 'three',
    colour: '#123456',
    shape: 'round',
    texture: 'shiny',
  };
  assert.deepEqual(
    readProgress(JSON.stringify({ ...freshProgress(), appearance })).appearance,
    appearance,
  );
  assert.deepEqual(
    readAppearance({ shape: '__proto__', colour: 'url(example)', eyes: 400 }),
    defaultAppearance(),
  );
});
test('a hat, glasses, scarf, wings and boots remain equipped together', () => {
  let outfit = starterOutfit();
  for (const id of ['wizard', 'blue-glasses', 'scarf', 'fairy-wings', 'boots'])
    outfit = equipItem(outfit, id, 0);
  assert.equal(outfit.hat, 'wizard');
  assert.equal(outfit.face, 'blue-glasses');
  assert.equal(outfit.accessory, 'scarf');
  assert.equal(outfit.back, 'fairy-wings');
  assert.equal(outfit.feet, 'boots');
});
