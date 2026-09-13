import test from 'node:test';
import assert from 'node:assert/strict';
import {
  freshPractice,
  readPractice,
  recordPractice,
  missionPractice,
  pizzaPractice,
  roverPractice,
  PRACTICE_RECENT_LIMIT,
} from '../lib/practice.ts';
import { freshProgress, readProgress } from '../lib/learning.ts';
import { missionFor, finishMission } from '../lib/adventure.ts';
import { roverSurvey, finishRoverSurvey, ROVER_STOPS } from '../lib/rover.ts';
import { exportSave, parseSavedProgress } from '../lib/save-recovery.ts';

const sample = (key = 'question-0') => ({
  key,
  skill: 'addition',
  title: 'Grow a flower path',
  concept: '1+2',
  range: 5,
});
test('old adventures gain an empty practice record without inventing past answers', () => {
  const p = freshProgress();
  p.adventure.rounds.garden = 42;
  p.adventure.wallet = 18;
  p.adventure.earned = 18;
  p.preferences.weather = 'rainbow';
  const old = { ...p };
  delete old.practice;
  const loaded = readProgress(JSON.stringify(old));
  assert.deepEqual(loaded, p);
  assert.equal(loaded.practice.skills.addition.finished, 0);
  assert.deepEqual(parseSavedProgress(exportSave(loaded)), loaded);
});
test('a first matching answer is recorded once and unchanged repeat presses add nothing', () => {
  const event = { question: sample(), answer: '3', correct: true };
  const log = recordPractice(freshPractice(), event);
  assert.equal(log.skills.addition.finished, 1);
  assert.equal(log.skills.addition.firstTry, 1);
  assert.equal(log.skills.addition.attempts, 1);
  assert.equal(recordPractice(log, event), log);
  assert.equal(
    recordPractice(log, { ...event, answer: '4', correct: false }),
    log,
  );
});
test('different answers and a later match survive leaving, pausing and save/resume', () => {
  const q = sample();
  let log = recordPractice(freshPractice(), {
    question: q,
    answer: '0',
    correct: false,
  });
  assert.equal(
    recordPractice(log, { question: q, answer: '0', correct: false }),
    log,
  );
  log = readPractice(JSON.parse(JSON.stringify(log)));
  log = recordPractice(log, { question: q, answer: '2', correct: false });
  log = recordPractice(log, { question: q, answer: '3', correct: true });
  assert.equal(log.skills.addition.finished, 1);
  assert.equal(log.skills.addition.firstTry, 0);
  assert.equal(log.skills.addition.attempts, 3);
  assert.equal(log.questions[0].attempts, 3);
  assert.equal(log.skills.addition.recent[0].first, false);
});
test('example replay and adult sound prompts remain separate from the first-answer result', () => {
  const q = { ...sample(), skill: 'sounds', concept: 'm', range: null };
  let log = recordPractice(freshPractice(), { question: q, example: true });
  assert.equal(log.skills.sounds.attempts, 0);
  assert.equal(log.skills.sounds.finished, 0);
  log = recordPractice(log, {
    question: q,
    answer: 'm',
    correct: true,
    adultModel: true,
  });
  assert.equal(log.skills.sounds.firstTry, 1);
  assert.equal(log.skills.sounds.adultModel, 1);
  assert.equal(log.skills.sounds.examples, 1);
  assert.deepEqual(log.skills.sounds.recent, [
    { first: true, adult: true, example: true, range: null, concept: 'm' },
  ]);
});
test('the practice history stays bounded without losing cumulative totals', () => {
  let log = freshPractice();
  for (let i = 0; i < 1000; i++) {
    const q = sample('question-' + i);
    if (i % 2)
      log = recordPractice(log, { question: q, answer: '0', correct: false });
    log = recordPractice(log, { question: q, answer: '3', correct: true });
  }
  assert.equal(log.questions.length, PRACTICE_RECENT_LIMIT);
  assert.equal(log.skills.addition.recent.length, 12);
  assert.equal(log.skills.addition.finished, 1000);
  assert.equal(log.skills.addition.firstTry, 500);
  assert.equal(log.skills.addition.attempts, 1500);
  assert.ok(JSON.stringify(log).length < 40000);
  assert.deepEqual(readPractice(log), log);
});
test('malformed practice data is bounded and cannot add unknown skill names or invalid counts', () => {
  const raw = {
    version: 1,
    skills: {
      addition: {
        attempts: -3,
        finished: 2,
        firstTry: 200,
        adultModel: Infinity,
        examples: 7,
        recent: Array.from({ length: 100 }, () => ({
          first: true,
          concept: 'x'.repeat(300),
        })),
      },
      sounds: { finished: 0, recent: [{ first: true }] },
      unknown: { finished: 10 },
    },
    questions: [
      { ...sample(), attempts: -1, complete: true },
      { ...sample('bad'), skill: '__proto__', attempts: 1, complete: true },
    ],
  };
  const log = readPractice(raw);
  assert.equal(log.skills.addition.attempts, 2);
  assert.equal(log.skills.addition.firstTry, 2);
  assert.equal(log.skills.addition.examples, 2);
  assert.equal(log.skills.addition.adultModel, 0);
  assert.equal(log.skills.addition.recent.length, 2);
  assert.equal(log.skills.addition.recent[0].concept.length, 100);
  assert.equal(log.skills.sounds.recent.length, 0);
  assert.equal(log.questions.length, 1);
  assert.equal(log.questions[0].complete, false);
  assert.equal(log.skills.unknown, undefined);
  assert.deepEqual(readPractice({ version: 2 }), freshPractice());
  assert.equal(
    recordPractice(log, {
      question: { ...sample(), key: 'a'.repeat(241) },
      answer: '3',
      correct: true,
    }),
    log,
  );
  assert.equal(
    recordPractice(log, {
      question: { ...sample(), skill: '__proto__' },
      answer: '3',
      correct: true,
    }),
    log,
  );
});
test('mission records describe the actual concept and numeric content, not just the parent cap', () => {
  const p = freshProgress();
  p.mathsMax = 10;
  p.adventure.rounds.rocket = 1;
  assert.equal(missionPractice(missionFor('rocket', p)).range, 5);
  for (const npc of ['garden', 'cove', 'rocket', 'woods', 'moon'])
    for (let r = 0; r < 100; r++) {
      p.adventure.rounds[npc] = r;
      const m = missionFor(npc, p),
        q = missionPractice(m);
      assert.ok(q.key.length <= 240);
      assert.equal(
        recordPractice(freshPractice(), {
          question: q,
          answer: m.answer,
          correct: true,
        }).skills[q.skill].finished,
        1,
      );
      if (m.kind === 'add') assert.equal(q.concept, `${m.total}+${m.second}`);
      if (m.kind === 'take') assert.equal(q.concept, `${m.total}−${m.second}`);
    }
  const a = missionFor('garden', p),
    b = { ...a, total: a.total + 1, second: a.second - 1 };
  assert.notEqual(missionPractice(a).key, missionPractice(b).key);
});
test('pizza records each topping separately and preserves the single recipe reward', () => {
  let p = freshProgress();
  const m = missionFor('meadow', p);
  assert.equal(missionPractice(m), null);
  const keys = new Set();
  m.recipe.steps.forEach((step, i) => {
    const q = pizzaPractice(m, i);
    keys.add(q.key);
    p = {
      ...p,
      practice: recordPractice(p.practice, {
        question: q,
        answer: String(step.quantity),
        correct: true,
      }),
    };
  });
  assert.equal(keys.size, 3);
  p.preferences.weather = 'rainbow';
  const finished = finishMission(p, m);
  assert.equal(finished.adventure.wallet, 2);
  assert.equal(
    finished.practice.skills.addition.finished +
      finished.practice.skills.subtraction.finished,
    3,
  );
  assert.equal(finished.preferences.weather, 'rainbow');
  assert.equal(finishMission(finished, m), finished);
  assert.deepEqual(parseSavedProgress(exportSave(finished)), finished);
});
test('rover records count actual survey questions while reward validation stays intact', () => {
  let p = freshProgress();
  p.adventure.rounds.rocket = 3;
  p.adventure.region = 'moon';
  const stop = ROVER_STOPS[0],
    survey = roverSurvey(stop.id, p.adventure.rover),
    q = roverPractice(survey);
  const wrong = { question: q, answer: '0', correct: false };
  p = { ...p, practice: recordPractice(p.practice, wrong) };
  assert.equal(finishRoverSurvey(p, survey, 0, stop.x, stop.z), p);
  const rewarded = finishRoverSurvey(p, survey, survey.target, stop.x, stop.z);
  const finished = {
    ...rewarded,
    practice: recordPractice(rewarded.practice, {
      question: q,
      answer: String(survey.target),
      correct: true,
    }),
  };
  assert.equal(finished.adventure.wallet, 1);
  assert.equal(finished.practice.skills.counting.finished, 1);
  assert.equal(finished.practice.skills.counting.firstTry, 0);
  assert.equal(
    finishRoverSurvey(finished, survey, survey.target, stop.x, stop.z),
    finished,
  );
});
