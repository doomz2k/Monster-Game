import type { Mission } from './adventure';
import type { RoverSurvey } from './rover';

export const PRACTICE_SKILLS = {
  counting: {
    name: 'Counting',
    where: 'Pip’s fuel tank and Nova’s rover stops',
  },
  addition: {
    name: 'Adding',
    where: 'Tilly’s growing patch, pizza recipes and Pip’s batteries',
  },
  subtraction: {
    name: 'Taking away',
    where: 'Marina’s harbour and pizza recipes',
  },
  patterns: {
    name: 'Repeating patterns',
    where: 'Pip’s rocket and Nova’s Moon meadow',
  },
  sounds: { name: 'Choosing a sound', where: 'Olive’s story tree' },
  blending: { name: 'Building words', where: 'Olive’s story tree' },
  space: { name: 'Space discoveries', where: 'Nova’s Moon meadow' },
} as const;
export type PracticeSkill = keyof typeof PRACTICE_SKILLS;
export type PracticeQuestion = {
  key: string;
  skill: PracticeSkill;
  title: string;
  concept: string;
  range: 5 | 10 | null;
};
export type PracticeEvent = {
  question: PracticeQuestion;
  answer?: string;
  correct?: boolean;
  adultModel?: boolean;
  example?: boolean;
};
type PracticeResult = {
  first: boolean;
  adult: boolean;
  example: boolean;
  range: 5 | 10 | null;
  concept: string;
};
export type PracticeRecord = PracticeQuestion & {
  attempts: number;
  lastAnswer: string;
  complete: boolean;
  adultModel: boolean;
  example: boolean;
};
export type PracticeStats = {
  attempts: number;
  finished: number;
  firstTry: number;
  adultModel: number;
  examples: number;
  recent: PracticeResult[];
};
export type PracticeLog = {
  version: 1;
  skills: Record<PracticeSkill, PracticeStats>;
  questions: PracticeRecord[];
};
export const PRACTICE_RECENT_LIMIT = 80;
const stats = (): PracticeStats => ({
  attempts: 0,
  finished: 0,
  firstTry: 0,
  adultModel: 0,
  examples: 0,
  recent: [],
});
export function freshPractice(): PracticeLog {
  return {
    version: 1,
    skills: Object.fromEntries(
      Object.keys(PRACTICE_SKILLS).map((k) => [k, stats()]),
    ) as PracticeLog['skills'],
    questions: [],
  };
}
const object = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
const number = (v: unknown) =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
    ? Math.min(1000000, v)
    : 0;
const text = (v: unknown, max: number) =>
  typeof v === 'string' ? v.slice(0, max) : '';
const range = (v: unknown) => (v === 5 || v === 10 ? v : null);
function question(raw: unknown): PracticeQuestion | null {
  const v = object(raw);
  if (
    !v ||
    typeof v.skill !== 'string' ||
    !Object.hasOwn(PRACTICE_SKILLS, v.skill) ||
    typeof v.key !== 'string' ||
    !v.key ||
    v.key.length > 240
  )
    return null;
  return {
    key: v.key,
    skill: v.skill as PracticeSkill,
    title: text(v.title, 120),
    concept: text(v.concept, 100),
    range: range(v.range),
  };
}
export function readPractice(raw: unknown): PracticeLog {
  const clean = freshPractice(),
    v = object(raw);
  if (v?.version !== 1) return clean;
  const data = object(v.skills);
  for (const id of Object.keys(PRACTICE_SKILLS) as PracticeSkill[]) {
    const s = object(data?.[id]);
    if (!s) continue;
    const finished = number(s.finished);
    clean.skills[id] = {
      attempts: Math.max(finished, number(s.attempts)),
      finished,
      firstTry: Math.min(finished, number(s.firstTry)),
      adultModel: Math.min(finished, number(s.adultModel)),
      examples: Math.min(finished, number(s.examples)),
      recent:
        Array.isArray(s.recent) && finished > 0
          ? s.recent.slice(-Math.min(12, finished)).flatMap((r: unknown) => {
              const value = object(r);
              return value && typeof value.first === 'boolean'
                ? [
                    {
                      first: value.first,
                      adult: value.adult === true,
                      example: value.example === true,
                      range: range(value.range),
                      concept: text(value.concept, 100),
                    },
                  ]
                : [];
            })
          : [],
    };
  }
  if (Array.isArray(v.questions)) {
    const seen = new Set<string>();
    for (const raw of v.questions.slice(-PRACTICE_RECENT_LIMIT)) {
      const q = question(raw),
        value = object(raw);
      if (!q || !value || seen.has(q.key)) continue;
      seen.add(q.key);
      const attempts = number(value.attempts);
      clean.questions.push({
        ...q,
        attempts,
        lastAnswer: text(value.lastAnswer, 64),
        complete: attempts > 0 && value.complete === true,
        adultModel: value.adultModel === true,
        example: value.example === true,
      });
    }
  }
  return clean;
}
/** Record observed answers only. Matching a picture-assisted answer is not a proficiency assessment. */
export function recordPractice(
  log: PracticeLog,
  event: PracticeEvent,
): PracticeLog {
  const q = question(event.question);
  if (!q) return log;
  const existing = log.questions.find((r) => r.key === q.key);
  if (
    existing?.complete ||
    (existing && (existing.skill !== q.skill || existing.concept !== q.concept))
  )
    return log;
  const submitted =
    typeof event.answer === 'string' &&
    event.answer.length <= 64 &&
    typeof event.correct === 'boolean';
  if (!submitted && !event.example && !event.adultModel) return log;
  const next: PracticeRecord = existing
    ? { ...existing }
    : {
        ...q,
        attempts: 0,
        lastAnswer: '',
        complete: false,
        adultModel: false,
        example: false,
      };
  next.adultModel ||= event.adultModel === true;
  next.example ||= event.example === true;
  // An accidental repeat press on an unchanged response does not inflate the record.
  const newAnswer =
    submitted && !(next.attempts > 0 && next.lastAnswer === event.answer);
  const tally = {
    ...log.skills[q.skill],
    recent: [...log.skills[q.skill].recent],
  };
  if (newAnswer) {
    next.attempts = Math.min(1000000, next.attempts + 1);
    next.lastAnswer = event.answer!;
    tally.attempts = Math.min(1000000, tally.attempts + 1);
    if (event.correct) {
      next.complete = true;
      tally.finished = Math.min(1000000, tally.finished + 1);
      if (next.attempts === 1)
        tally.firstTry = Math.min(1000000, tally.firstTry + 1);
      if (next.adultModel)
        tally.adultModel = Math.min(1000000, tally.adultModel + 1);
      if (next.example) tally.examples = Math.min(1000000, tally.examples + 1);
      tally.recent = [
        ...tally.recent,
        {
          first: next.attempts === 1,
          adult: next.adultModel,
          example: next.example,
          range: q.range,
          concept: q.concept,
        },
      ].slice(-12);
    }
  }
  if (
    existing &&
    !newAnswer &&
    existing.adultModel === next.adultModel &&
    existing.example === next.example
  )
    return log;
  return {
    version: 1,
    skills: { ...log.skills, [q.skill]: tally },
    questions: [...log.questions.filter((r) => r.key !== q.key), next].slice(
      -PRACTICE_RECENT_LIMIT,
    ),
  };
}
export function missionPractice(m: Mission): PracticeQuestion | null {
  if (m.kind === 'pizza') return null;
  const skill = (
    {
      pack: 'counting',
      add: 'addition',
      take: 'subtraction',
      pattern: 'patterns',
      sound: 'sounds',
      spell: 'blending',
      space: 'space',
    } as const
  )[m.kind];
  const numeric = ['pack', 'add', 'take'].includes(m.kind);
  const concept =
    m.kind === 'add'
      ? `${m.total}+${m.second}`
      : m.kind === 'take'
        ? `${m.total}−${m.second}`
        : m.kind === 'pack'
          ? `count-${m.target}`
          : m.kind === 'pattern'
            ? (m.patternStyle ?? 'pattern')
            : m.kind === 'space'
              ? m.prompt
              : m.answer;
  return {
    key: `mission:${m.npc}:${m.round}:${m.prompt}:${m.target}:${m.answer}:${concept}`,
    skill,
    title: m.title,
    concept,
    range: numeric
      ? (m.kind === 'pack' ? m.target : Math.max(m.total, m.second, m.target)) >
        5
        ? 10
        : 5
      : null,
  };
}
export function pizzaPractice(
  m: Mission,
  step: number,
): PracticeQuestion | null {
  const s = m.recipe?.steps[step];
  if (!s || m.kind !== 'pizza') return null;
  return {
    key: `pizza:${m.round}:${step}:${s.prompt}`,
    skill: s.operation === '+' ? 'addition' : 'subtraction',
    title: 'Pizza recipe · ' + s.topping,
    concept: `${s.left}${s.operation}${s.right}`,
    range: Math.max(s.left, s.right, s.quantity) > 5 ? 10 : 5,
  };
}
export function roverPractice(s: RoverSurvey): PracticeQuestion {
  return {
    key: `rover:${s.stop}:${s.round}:${s.target}`,
    skill: 'counting',
    title: 'Moon rover · ' + s.stop,
    concept: `count-${s.target}`,
    range: 5,
  };
}
