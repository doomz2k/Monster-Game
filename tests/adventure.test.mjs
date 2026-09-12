import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { freshProgress, readProgress } from '../lib/learning.ts';
import {
  missionFor,
  finishMission,
  changeRegion,
  buyItem,
  plantSeed,
  waterPlant,
  placeFurniture,
  lifetimeStars,
  pizzaRecipe,
  pizzaMatches,
  TOPPINGS,
  PLACES,
} from '../lib/adventure.ts';
const script = JSON.parse(
  readFileSync(
    new URL('../lib/audio-data/adventure-script.json', import.meta.url),
  ),
);
const voices = JSON.parse(
  readFileSync(new URL('../lib/audio-data/voice-clips.json', import.meta.url)),
);

test('pizza customers have three distinct toppings and every puzzle is in the selected range', () => {
  for (const max of [5, 10])
    for (let round = 0; round < 100; round++) {
      const recipe = pizzaRecipe(round, max),
        counts = {};
      assert.equal(new Set(recipe.steps.map((s) => s.topping)).size, 3);
      assert.ok(script[recipe.intro]);
      for (const s of recipe.steps) {
        assert.equal(
          s.operation === '+' ? s.left + s.right : s.left - s.right,
          s.quantity,
        );
        assert.ok(
          s.quantity > 0 &&
            s.quantity <= max &&
            s.left <= max &&
            s.right <= max,
        );
        assert.ok(script[s.prompt], s.prompt);
        counts[s.topping] = s.quantity;
      }
      assert.equal(pizzaMatches(recipe, counts), true);
      assert.equal(
        pizzaMatches(recipe, { ...counts, [recipe.steps[0].topping]: 0 }),
        false,
      );
      const extra = TOPPINGS.find(
        (t) => !recipe.steps.some((s) => s.topping === t.id),
      );
      assert.equal(pizzaMatches(recipe, { ...counts, [extra.id]: 1 }), false);
    }
});

test('adventure rewards cannot replay a completion ticket; three repairs unlock moon travel', () => {
  let p = freshProgress();
  assert.equal(changeRegion(p, 'moon'), p);
  assert.equal(finishMission(p, missionFor('moon', p)), p);
  for (let i = 0; i < 3; i++) {
    const m = missionFor('rocket', p);
    p = finishMission(p, m);
    assert.equal(p.adventure.wallet, (i + 1) * 2);
    assert.equal(finishMission(p, m), p);
  }
  p = changeRegion(p, 'moon');
  assert.equal(p.adventure.region, 'moon');
  assert.equal(p.adventure.moonVisits, 1);
  p = changeRegion(p, 'moon');
  assert.equal(p.adventure.moonVisits, 1);
  const restored = readProgress(JSON.stringify(p));
  assert.equal(restored.adventure.region, 'moon');
  assert.equal(restored.adventure.wallet, 6);
});

test('spending stars preserves earned outfit rewards and item ownership, seeds grow persistently', () => {
  let p = freshProgress();
  assert.equal(buyItem(p, 'sofa'), p);
  for (let i = 0; i < 3; i++) p = finishMission(p, missionFor('meadow', p));
  p = buyItem(p, 'sofa');
  assert.equal(p.adventure.wallet, 2);
  assert.equal(lifetimeStars(p), 6);
  assert.equal(buyItem(p, 'sofa'), p);
  assert.equal(buyItem(p, 'moonflower'), p);
  p = placeFurniture(p, 1, 'sofa');
  p = placeFurniture(p, 4, 'sofa');
  assert.equal(p.adventure.furniture.filter((id) => id === 'sofa').length, 1);
  assert.equal(placeFurniture(p, 0, 'bed'), p);
  p = plantSeed(p, 0, 'daisy');
  assert.equal(p.adventure.seeds.daisy, 1);
  assert.equal(plantSeed(p, 0, 'daisy'), p);
  for (let i = 0; i < 3; i++) p = waterPlant(p, 0);
  assert.equal(waterPlant(p, 0), p);
  const saved = readProgress(JSON.stringify(p));
  assert.deepEqual(saved.adventure, p.adventure);
});

test('all missions have recorded prompts and selected-range maths; phonics use introduced graphemes', () => {
  for (const max of [5, 10])
    for (const place of PLACES.filter(
      (p) => !['home', 'shop'].includes(p.id),
    )) {
      let p = freshProgress();
      p.mathsMax = max;
      p.soundLimit = 32;
      for (let i = 0; i < 80; i++) {
        const m = missionFor(place.id, p);
        assert.ok(script[m.prompt], m.prompt);
        if (m.kind === 'add') assert.equal(m.total + m.second, m.target);
        if (m.kind === 'take') assert.equal(m.total - m.second, m.target);
        if (m.kind === 'spell')
          assert.ok(m.parts.every((g) => p.knownSounds.includes(g)));
        if (['add', 'take'].includes(m.kind))
          assert.ok(m.choices.includes(m.answer));
        p = finishMission(p, m);
      }
    }
});

test('the complete narration bank contains only British voice profiles and real bundled recordings', () => {
  assert.deepEqual(Object.keys(voices), Object.keys(script));
  for (const [id, clip] of Object.entries(voices)) {
    assert.match(clip.voice, /^b[fm]_/, id);
    assert.equal(clip.text, script[id].text);
    assert.match(clip.path, /^\/audio\/voices\/[a-z0-9-]+\.ogg$/);
    const file = readFileSync(
      new URL('../public' + clip.path, import.meta.url),
    );
    assert.equal(file.subarray(0, 4).toString(), 'OggS');
    assert.ok(file.length > 1000);
  }
  assert.equal(
    readdirSync(new URL('../public/audio/voices/', import.meta.url)).length,
    Object.keys(voices).length,
    'No obsolete American or superseded files remain',
  );
});
