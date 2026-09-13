import test from 'node:test';
import assert from 'node:assert/strict';
import {
  needsExample,
  practiceFact,
  reviewFact,
} from '../lib/practice-support.ts';
import {
  freshPractice,
  recordPractice,
  missionPractice,
  pizzaPractice,
} from '../lib/practice.ts';
import { missionFor, finishMission } from '../lib/adventure.ts';
import { freshProgress, readProgress } from '../lib/learning.ts';
import { arithmeticFact } from '../lib/maths-variety.ts';
import script from '../lib/audio-data/adventure-script.json' with { type: 'json' };

function matched(log, q, flags = {}) {
  if (flags.retry)
    log = recordPractice(log, { question: q, answer: 'wrong', correct: false });
  return recordPractice(log, {
    question: q,
    answer: 'right',
    correct: true,
    example: !!flags.example,
    adultModel: !!flags.adult,
  });
}
function arithmeticLog(concepts, hard = 0, operation = '+') {
  return concepts.reduce(
    (log, concept, i) =>
      matched(
        log,
        {
          key: 'observed-' + i,
          title: 'Observed question',
          concept,
          skill: operation === '+' ? 'addition' : 'subtraction',
          range: 5,
        },
        { retry: i === hard },
      ),
    freshPractice(),
  );
}
function completeRound(p, npc, flags = {}) {
  const m = missionFor(npc, p);
  return finishMission(
    { ...p, practice: matched(p.practice, missionPractice(m), flags) },
    m,
  );
}

test('familiar examples require two recent first matches in that activity and return after a retry', () => {
  let p = freshProgress();
  assert.equal(missionFor('garden', p).showExample, true);
  p = completeRound(p, 'garden');
  assert.equal(missionFor('garden', p).showExample, true);
  p = completeRound(p, 'garden');
  assert.equal(missionFor('garden', p).showExample, false);
  assert.equal(missionFor('cove', p).showExample, true);
  assert.equal(missionFor('rocket', p).showExample, true);
  assert.equal(needsExample(missionFor('garden', p), p.practice, true), true);
  p = completeRound(p, 'garden', { retry: true });
  assert.equal(missionFor('garden', p).showExample, true);
  p = completeRound(p, 'garden');
  assert.equal(missionFor('garden', p).showExample, true);
  p = completeRound(p, 'garden');
  assert.equal(missionFor('garden', p).showExample, false);
  p = completeRound(p, 'garden', { example: true });
  assert.equal(missionFor('garden', p).showExample, true);
});

test('unfinished questions, larger quantities and new repeat structures keep their examples', () => {
  let p = completeRound(completeRound(freshProgress(), 'garden'), 'garden');
  const m = missionFor('garden', p);
  p.practice = recordPractice(p.practice, {
    question: missionPractice(m),
    answer: '0',
    correct: false,
  });
  assert.equal(
    missionFor('garden', readProgress(JSON.stringify(p))).showExample,
    true,
  );
  p = completeRound(completeRound(freshProgress(), 'garden'), 'garden');
  p.mathsMax = 10;
  let larger;
  for (let i = 0; i < 20; i++) {
    p.adventure.rounds.garden = i;
    const candidate = missionFor('garden', p);
    if (missionPractice(candidate).range === 10) {
      larger = candidate;
      break;
    }
  }
  assert.ok(larger);
  assert.equal(larger.showExample, true);
  p = freshProgress();
  for (const r of [0, 12]) {
    p.adventure.rounds.rocket = r;
    p = completeRound(p, 'rocket');
  }
  p.adventure.rounds.rocket = 24;
  assert.equal(missionFor('rocket', p).showExample, false);
  p.adventure.rounds.rocket = 3;
  assert.equal(missionFor('rocket', p).showExample, true);
});

test('phonics retains modelling even when the same answer has previously matched', () => {
  const p = freshProgress();
  for (const npc of ['woods']) {
    const m = missionFor(npc, p),
      q = missionPractice(m);
    let log = freshPractice();
    for (let i = 0; i < 3; i++)
      log = matched(log, { ...q, key: `mission:${npc}:${i}:sound` });
    assert.equal(needsExample(m, log), true);
    assert.equal(
      needsExample(
        { ...m, introduce: undefined, parts: ['m', 'a', 't'], kind: 'spell' },
        log,
      ),
      true,
    );
  }
});

test('pizza examples require two whole clean recipes and do not treat a partial recipe as familiar', () => {
  const p = freshProgress();
  for (let r = 0; r < 2; r++) {
    p.adventure.rounds.meadow = r;
    const m = missionFor('meadow', p);
    assert.equal(m.showExample, true);
    for (let step = 0; step < 3; step++)
      p.practice = matched(p.practice, pizzaPractice(m, step));
  }
  p.adventure.rounds.meadow = 2;
  const next = missionFor('meadow', p);
  assert.equal(next.showExample, false);
  p.practice = matched(p.practice, pizzaPractice(next, 0));
  assert.equal(missionFor('meadow', p).showExample, true);
  for (const step of [1, 2])
    p.practice = matched(p.practice, pizzaPractice(next, step), {
      retry: step === 1,
    });
  p.adventure.rounds.meadow = 3;
  assert.equal(missionFor('meadow', p).showExample, true);
});

test('maths review waits for three other questions and a spaced slot, then retires a matched concept', () => {
  const concepts = ['2+2', '1+1', '1+2', '1+4', '2+1', '3+2', '1+1'];
  for (let n = 1; n < 7; n++)
    assert.equal(
      reviewFact(arithmeticLog(concepts.slice(0, n)), 'garden', 7, '+', 5, []),
      null,
    );
  let log = arithmeticLog(concepts);
  assert.deepEqual(reviewFact(log, 'garden', 7, '+', 5, []), {
    left: 2,
    right: 2,
    operation: '+',
    target: 4,
  });
  assert.equal(reviewFact(log, 'garden', 7, '+', 5, [4]), null);
  assert.equal(reviewFact(log, 'garden', 7, '+', 5, [], false), null);
  log = matched(log, {
    key: 'review',
    title: 'Review',
    concept: '2+2',
    skill: 'addition',
    range: 5,
  });
  for (let i = 0; i < 3; i++)
    log = matched(log, {
      key: 'later-' + i,
      title: 'Later',
      concept: '1+2',
      skill: 'addition',
      range: 5,
    });
  assert.equal(log.skills.addition.finished, 11);
  assert.equal(reviewFact(log, 'garden', 11, '+', 5, []), null);
});

test('reviews ignore adult-prompted results, stale repeats and repeated answer targets', () => {
  const concepts = ['2+2', '1+1', '1+2', '1+4', '2+1', '3+2', '1+1'];
  let log = arithmeticLog(concepts);
  log.skills.addition.recent[0].adult = true;
  assert.equal(reviewFact(log, 'garden', 7, '+', 5, []), null);
  log = arithmeticLog([...concepts.slice(0, -1), '3+1']);
  assert.equal(reviewFact(log, 'garden', 7, '+', 5, []), null);
  log = arithmeticLog(concepts);
  log.questions[5].key = 'mission:garden:1:old';
  log.questions[5].concept = '1+3';
  assert.equal(reviewFact(log, 'garden', 7, '+', 5, []), null);
  log = arithmeticLog(['2+2', '2+2', ...concepts.slice(2)]);
  assert.equal(reviewFact(log, 'garden', 7, '+', 5, []), null);
  log = arithmeticLog(concepts, -1);
  log.skills.addition.recent[0].example = true;
  assert.equal(reviewFact(log, 'garden', 7, '+', 5, []).target, 4);
});

test('review arithmetic remains within the parent range and has available instructions', () => {
  for (const max of [5, 10])
    for (const op of ['+', '−'])
      for (let a = 0; a <= 12; a++)
        for (let b = 0; b <= 12; b++) {
          const f = practiceFact(`${a}${op}${b}`, op, max);
          if (!f) continue;
          assert.ok(
            f.left <= max && f.right <= max && f.target >= 0 && f.target <= max,
          );
          assert.equal(f.target, op === '+' ? a + b : a - b);
          if (op === '−') assert.ok(script['take-' + f.right]);
        }
  for (const concept of ['-1+2', '20+1', '2*2', '1−2', '5−0', '2+frog'])
    assert.equal(
      practiceFact(concept, concept.includes('−') ? '−' : '+', 5),
      null,
    );
  assert.equal(practiceFact('6+1', '+', 5), null);
  assert.equal(practiceFact('2+2', '+', 6), null);
});

test('pending review survives other activities and save/resume without changing rewards or phonics', () => {
  let p = freshProgress();
  p.practice = arithmeticLog(['2+2', '1+1', '1+2', '1+4', '2+1', '3+2', '1+1']);
  let chosen;
  for (let round = 0; round < 30; round++) {
    p.adventure.rounds.garden = round;
    const m = missionFor('garden', p);
    if (m.reviewing) {
      chosen = m;
      break;
    }
  }
  assert.ok(chosen);
  assert.equal(chosen.showExample, true);
  assert.equal(missionPractice(chosen).concept, '2+2');
  assert.ok(missionPractice(chosen).title.endsWith('practice again'));
  p.practice = recordPractice(p.practice, {
    question: missionPractice(chosen),
    answer: '0',
    correct: false,
  });
  p.practice = matched(p.practice, {
    key: 'pizza:99:0:test',
    title: 'Pizza',
    skill: 'addition',
    concept: '1+1',
    range: 5,
  });
  p = readProgress(JSON.stringify(p));
  assert.equal(
    missionPractice(missionFor('garden', p)).key,
    missionPractice(chosen).key,
  );
  assert.equal(p.adventure.wallet, 0);
  assert.deepEqual(p.knownSounds, []);
  p = finishMission(p, chosen);
  assert.equal(p.adventure.wallet, 2);
  assert.equal(finishMission(p, chosen), p);
  p.preferences.examples = 'always';
  p.preferences.reviewMaths = false;
  const restored = readProgress(JSON.stringify(p));
  assert.equal(restored.preferences.examples, 'always');
  assert.equal(restored.preferences.reviewMaths, false);
  const base = missionFor('garden', restored),
    expected = arithmeticFact(
      restored.adventure.rounds.garden,
      restored.mathsMax,
      '+',
    );
  assert.equal(base.reviewing, undefined);
  assert.equal(base.total, expected.left);
  assert.equal(base.second, expected.right);
  assert.equal(base.showExample, true);
});
