import type { Mission } from './adventure';
import type { ArithmeticFact } from './maths-variety';
import {
  missionPractice,
  type PracticeLog,
  type PracticeRecord,
} from './practice';

const firstMatch = (q: PracticeRecord) =>
  q.complete && q.attempts === 1 && !q.example && !q.adultModel;
/** Keep new mechanics and phonics modelling explicit; remember only matching recent play. */
export function needsExample(m: Mission, log: PracticeLog, always = false) {
  if (always || m.introduce || m.parts.length > 0) return true;
  if (m.kind === 'pizza') {
    const rounds = new Map<string, PracticeRecord[]>();
    for (const q of log.questions) {
      if (!q.key.startsWith('pizza:')) continue;
      const round = q.key.split(':')[1];
      rounds.set(round, [...(rounds.get(round) ?? []), q]);
    }
    const recent = [...rounds.values()].slice(-2);
    return (
      recent.length < 2 ||
      recent.some((r) => r.length !== 3 || !r.every(firstMatch))
    );
  }
  const q = missionPractice(m);
  if (!q) return true;
  const history = log.questions.filter(
    (r) =>
      r.key.startsWith('mission:' + m.npc + ':') &&
      r.skill === q.skill &&
      (q.skill !== 'patterns' || r.concept === q.concept) &&
      (q.range !== 10 || r.range === 10),
  );
  const recent = history.slice(-2);
  return recent.length < 2 || !recent.every(firstMatch);
}
export function practiceFact(
  concept: string,
  operation: '+' | '−',
  max: number,
): ArithmeticFact | null {
  if (max !== 5 && max !== 10) return null;
  const parts = /^(\d{1,2})([+−])(\d{1,2})$/.exec(concept);
  if (!parts || parts[2] !== operation) return null;
  const left = Number(parts[1]),
    right = Number(parts[3]),
    target = operation === '+' ? left + right : left - right;
  // Harbour instructions exist for taking away one or more; do not invent take-zero audio.
  if (
    left > max ||
    right > max ||
    target < 0 ||
    target > max ||
    (operation === '−' && right === 0)
  )
    return null;
  return { left, right, target, operation };
}
/** Revisit an observed retry after at least three other questions of that skill. */
export function reviewFact(
  log: PracticeLog,
  npc: string,
  round: number,
  operation: '+' | '−',
  max: 5 | 10,
  avoidTargets: readonly number[],
  enabled = true,
): ArithmeticFact | null {
  if (!enabled) return null;
  const skill = operation === '+' ? 'addition' : 'subtraction';
  // A half-finished question remains the same after visiting another activity.
  const pending = log.questions.findLast(
    (q) =>
      !q.complete &&
      q.key.startsWith(`mission:${npc}:${round}:`) &&
      q.skill === skill,
  );
  if (pending) {
    const remembered = practiceFact(pending.concept, operation, max);
    if (remembered) return remembered;
  }
  const s = log.skills[skill];
  if (s.finished % 4 !== 3) return null;
  const lastTarget = practiceFact(
    s.recent.at(-1)?.concept ?? '',
    operation,
    max,
  )?.target;
  const lastOwn = log.questions.findLast(
    (q) =>
      q.complete && q.key.startsWith(`mission:${npc}:`) && q.skill === skill,
  );
  const lastOwnTarget = lastOwn
    ? practiceFact(lastOwn.concept, operation, max)?.target
    : undefined;
  for (let i = 0; i < s.recent.length - 3; i++) {
    const candidate = s.recent[i];
    if ((candidate.first && !candidate.example) || candidate.adult) continue;
    if (s.recent.slice(i + 1).some((q) => q.concept === candidate.concept))
      continue;
    const fact = practiceFact(candidate.concept, operation, max);
    if (
      fact &&
      fact.target !== lastTarget &&
      fact.target !== lastOwnTarget &&
      !avoidTargets.includes(fact.target)
    )
      return fact;
  }
  return null;
}
