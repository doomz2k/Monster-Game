import test from 'node:test';
import assert from 'node:assert/strict';
import {
  arithmeticDeckSize,
  arithmeticFact,
  pizzaFact,
  pizzaToppingIndices,
  rocketPattern,
  countQuantity,
  patternStructure,
  PATTERN_LABELS,
} from '../lib/maths-variety.ts';
import { missionFor, pizzaRecipe, finishMission } from '../lib/adventure.ts';
import { freshProgress, readProgress } from '../lib/learning.ts';
import script from '../lib/audio-data/adventure-script.json' with { type: 'json' };

test('arithmetic uses complete valid decks with no repeated adjacent answer, including between decks', () => {
  for (const max of [5, 10])
    for (const op of ['+', '−'])
      for (let flavour = 0; flavour < 4; flavour++) {
        const size = arithmeticDeckSize(max, op);
        assert.equal(
          size,
          op === '+' ? (max * (max - 1)) / 2 : (max * (max + 1)) / 2,
        );
        let previous = null;
        for (let cycle = 0; cycle < 100; cycle++) {
          const seen = new Set();
          for (let i = 0; i < size; i++) {
            const fact = arithmeticFact(cycle * size + i, max, op, flavour);
            assert.equal(
              op === '+' ? fact.left + fact.right : fact.left - fact.right,
              fact.target,
            );
            assert.ok(
              fact.left >= 1 &&
                fact.right >= 1 &&
                fact.left <= max &&
                fact.right <= max &&
                fact.target >= 0 &&
                fact.target <= max,
            );
            assert.notEqual(
              fact.target,
              previous,
              'No guessing the previous answer',
            );
            previous = fact.target;
            seen.add(fact.left + op + fact.right);
          }
          assert.equal(
            seen.size,
            size,
            'Each full deck contains every fact exactly once',
          );
        }
      }
});
test('the opening harbour questions no longer all answer two, and saves continue the same deck', () => {
  let p = freshProgress();
  const answers = [];
  for (let i = 0; i < 3; i++) {
    const m = missionFor('cove', p);
    answers.push(m.target);
    p = finishMission(p, m);
  }
  assert.deepEqual(answers, [2, 1, 3]);
  assert.deepEqual(
    missionFor('cove', p),
    missionFor('cove', readProgress(JSON.stringify(p))),
  );
  for (const max of [5, 10]) {
    p.mathsMax = max;
    for (let i = 0; i < 200; i++) {
      p.adventure.rounds.garden = i;
      p.adventure.rounds.cove = i;
      p.adventure.rounds.rocket = i;
      for (const npc of ['garden', 'cove', 'rocket']) {
        const m = missionFor(npc, p);
        assert.ok(m.target <= max);
        assert.ok(script[m.prompt]);
      }
    }
  }
});
test('all ten sets of pizza toppings appear and every recipe uses three distinct quantities', () => {
  assert.equal(
    new Set(
      Array.from({ length: 10 }, (_, i) =>
        pizzaToppingIndices(i)
          .sort((a, b) => a - b)
          .join(),
      ),
    ).size,
    10,
  );
  for (const max of [5, 10])
    for (let round = 0; round < 1000; round++) {
      const r = pizzaRecipe(round, max);
      assert.equal(new Set(r.steps.map((s) => s.topping)).size, 3);
      assert.equal(new Set(r.steps.map((s) => s.quantity)).size, 3);
      for (const step of r.steps) {
        assert.ok(step.quantity >= 1 && step.quantity <= max);
        assert.ok(
          step.left >= 0 &&
            step.right >= 0 &&
            step.left <= max &&
            step.right <= max,
        );
        assert.equal(
          step.operation === '+'
            ? step.left + step.right
            : step.left - step.right,
          step.quantity,
        );
        assert.ok(script[step.prompt], step.prompt);
      }
    }
});
test('pizza practice covers every positive-result fact in either selected range', () => {
  for (const max of [5, 10]) {
    const seen = new Set();
    for (let round = 0; round < 2000; round++)
      for (let step = 0; step < 3; step++) {
        const f = pizzaFact(round, step, max);
        seen.add(f.left + f.operation + f.right);
      }
    for (let left = 0; left <= max; left++)
      for (let right = 1; right <= max - left; right++)
        assert.ok(seen.has(left + '+' + right));
    for (let left = 1; left <= max; left++)
      for (let right = 0; right < left; right++)
        assert.ok(seen.has(left + '−' + right));
    assert.equal(seen.size, max * (max + 1));
  }
});
test('rocket patterns include 24 distinct visible sequences with correct repeat units and varied answer positions', () => {
  const seen = new Set(),
    positions = new Set(),
    p = freshProgress();
  for (let i = 0; i < 24; i++) {
    const card = rocketPattern(i);
    seen.add(card.sequence.join());
    positions.add(card.choices.indexOf(card.answer));
    assert.deepEqual(
      card.sequence.slice(0, card.unitLength),
      card.sequence.slice(card.unitLength),
    );
    assert.equal(card.answer, card.sequence[0]);
    assert.equal(new Set(card.choices).size, 3);
    p.adventure.rounds.rocket = i * 3;
    const m = missionFor('rocket', p);
    assert.equal(m.patternUnit, card.unitLength);
    assert.equal(m.patternStyle, card.style);
    assert.ok(script['demo-pip-pattern-' + card.style]);
  }
  assert.equal(seen.size, 24);
  assert.equal(positions.size, 3);
});
test('rocket fuel uses the whole selected number range and later battery questions vary', () => {
  for (const max of [5, 10]) {
    assert.equal(
      new Set(Array.from({ length: max }, (_, i) => countQuantity(i, max)))
        .size,
      max,
    );
    const p = freshProgress();
    p.mathsMax = max;
    const sums = new Set();
    for (let i = 0; i < arithmeticDeckSize(max, '+'); i++) {
      p.adventure.rounds.rocket = i * 3 + 2;
      const m = missionFor('rocket', p);
      sums.add(m.total + '+' + m.second);
    }
    assert.equal(sums.size, arithmeticDeckSize(max, '+'));
  }
});
test('Moon patterns demonstrate and highlight their full repeated group, with named choices', () => {
  const p = freshProgress();
  p.adventure.rounds.rocket = 3;
  let patterned = 0;
  for (let i = 0; i < 48; i++) {
    p.adventure.rounds.moon = i;
    const m = missionFor('moon', p);
    if (m.kind !== 'pattern') continue;
    patterned++;
    const structure = patternStructure(m.sequence, m.answer);
    assert.ok(structure);
    assert.equal(m.patternUnit, structure.unitLength);
    assert.ok(script['demo-nova-pattern-' + m.patternStyle]);
    assert.ok(m.choices.every((s) => PATTERN_LABELS[s]));
  }
  assert.equal(patterned, 8);
  assert.equal(patternStructure(['a', 'b', 'c', 'c'], 'b'), null);
});
test('invalid counters fall back safely and huge valid counters do not require replaying history', () => {
  for (const round of [NaN, -1, Infinity, 0.3])
    assert.deepEqual(arithmeticFact(round, 5, '+'), arithmeticFact(0, 5, '+'));
  for (const round of [100000, Number.MAX_SAFE_INTEGER]) {
    const f = arithmeticFact(round, 10, '−');
    assert.ok(Number.isInteger(f.target) && f.target >= 0 && f.target <= 10);
  }
});
