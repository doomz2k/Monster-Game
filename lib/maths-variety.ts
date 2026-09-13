export type ArithmeticFact = {
  left: number;
  right: number;
  target: number;
  operation: '+' | '−';
};
export type PatternStyle = 'ab' | 'aab' | 'abb' | 'abc';
export const PATTERN_LABELS: Record<string, string> = {
  '🔵': 'Blue circle',
  '🔺': 'Red triangle',
  '🟨': 'Yellow square',
  '⭐': 'Star',
  '🌙': 'Moon',
  '🪐': 'Ringed planet',
  '🌍': 'Earth',
  '☀️': 'Sun',
  '🚀': 'Rocket',
  '🔋': 'Battery',
  '💎': 'Crystal',
  '🔩': 'Rocket bolt',
  '🛰️': 'Satellite',
  '🌼': 'Flower',
  '🪨': 'Moon rock',
};
export function patternStructure(sequence: readonly string[], answer: string) {
  const full = [...sequence, answer];
  for (const unitLength of [2, 3]) {
    if (
      full.length >= unitLength * 2 &&
      full.every((item, i) => item === full[i % unitLength])
    ) {
      const style: PatternStyle =
        unitLength === 2
          ? 'ab'
          : full[0] === full[1]
            ? 'aab'
            : full[1] === full[2]
              ? 'abb'
              : 'abc';
      return { style, unitLength };
    }
  }
  return null;
}
export const PATTERN_UNITS: Record<PatternStyle, readonly number[]> = {
  ab: [0, 1],
  aab: [0, 0, 1],
  abb: [0, 1, 1],
  abc: [0, 1, 2],
};
const safeRound = (round: number) =>
  Number.isSafeInteger(round) && round >= 0 ? round : 0;
const range = (max: number) => (max === 10 ? 10 : 5);
const cache = new Map<
  string,
  { facts: ArithmeticFact[]; offsets: number[]; repeatAt: number }
>();

function bank(
  max: number,
  operation: ArithmeticFact['operation'],
  flavour: number,
) {
  max = range(max);
  flavour = Number.isFinite(flavour) ? ((Math.trunc(flavour) % 4) + 4) % 4 : 0;
  const key = max + operation + flavour;
  if (cache.has(key)) return cache.get(key)!;
  const remaining: ArithmeticFact[] = [];
  for (let left = 1; left <= max; left++)
    for (let right = 1; right <= max; right++) {
      const target = operation === '+' ? left + right : left - right;
      if (target >= 0 && target <= max)
        remaining.push({ left, right, target, operation });
    }
  const facts: ArithmeticFact[] = [];
  const take = (left: number, right: number) => {
    const index = remaining.findIndex(
      (f) => f.left === left && f.right === right,
    );
    if (index >= 0) facts.push(...remaining.splice(index, 1));
  };
  // A gentle opening, with different answers, before the full fact bank.
  if (operation === '+')
    for (let total = 2; total <= max; total++)
      take(Math.floor(total / 2), Math.ceil(total / 2));
  else
    for (const total of [
      2,
      1,
      3,
      0,
      ...Array.from({ length: max - 4 }, (_, i) => i + 4),
    ])
      take(total + 1, 1);
  while (remaining.length) {
    const counts = new Map<number, number>();
    remaining.forEach((f) =>
      counts.set(f.target, (counts.get(f.target) ?? 0) + 1),
    );
    const previous = facts.at(-1)?.target,
      before = facts.at(-2)?.target;
    const candidates = remaining.filter((f) => f.target !== previous);
    if (!candidates.length)
      throw new Error('Arithmetic bank cannot avoid adjacent answers');
    candidates.sort(
      (a, b) =>
        counts.get(b.target)! - counts.get(a.target)! ||
        Number(a.target === before) - Number(b.target === before) ||
        ((a.left * 13 + a.right * 7 + flavour * 11) % 19) -
          ((b.left * 13 + b.right * 7 + flavour * 11) % 19),
    );
    const next = candidates[0];
    remaining.splice(remaining.indexOf(next), 1);
    facts.push(next);
  }
  if (facts[0].target === facts.at(-1)!.target) {
    const last = facts.length - 1,
      repeated = facts[last].target;
    const swap = facts.findIndex(
      (f, i) =>
        i >= max &&
        i < last - 1 &&
        f.target !== repeated &&
        f.target !== facts[last - 1].target &&
        facts[i - 1].target !== repeated &&
        facts[i + 1].target !== repeated,
    );
    if (swap < 0)
      throw new Error('Arithmetic bank needs a distinct wraparound answer');
    [facts[swap], facts[last]] = [facts[last], facts[swap]];
  }
  // Rotate later decks without repeating the answer at a deck boundary.
  // Offset transitions form a small finite cycle, even for very large save counters.
  const offsets = [0];
  let repeatAt = 0;
  for (;;) {
    const previous = offsets.at(-1)!,
      last = facts[(previous + facts.length - 1) % facts.length].target;
    let next = (previous + 7) % facts.length;
    while (facts[next].target === last) next = (next + 1) % facts.length;
    const seen = offsets.indexOf(next);
    if (seen >= 0) {
      repeatAt = seen;
      break;
    }
    offsets.push(next);
  }
  const result = { facts, offsets, repeatAt };
  cache.set(key, result);
  return result;
}
export function arithmeticDeckSize(
  max: number,
  operation: ArithmeticFact['operation'],
) {
  return bank(max, operation, 0).facts.length;
}
export function arithmeticFact(
  round: number,
  max: number,
  operation: ArithmeticFact['operation'],
  flavour = 0,
): ArithmeticFact {
  round = safeRound(round);
  const { facts, offsets, repeatAt } = bank(max, operation, flavour),
    cycle = Math.floor(round / facts.length);
  const offset =
    offsets[
      cycle < offsets.length
        ? cycle
        : repeatAt + ((cycle - repeatAt) % (offsets.length - repeatAt))
    ];
  return { ...facts[((round % facts.length) + offset) % facts.length] };
}
export function countQuantity(round: number, max: number) {
  max = range(max);
  return 1 + ((safeRound(round) * (max === 10 ? 3 : 2) + 1) % max);
}
export function rocketPattern(round: number) {
  round = safeRound(round);
  const symbols = ['🔵', '🔺', '🟨'];
  const permutations = [
    [0, 1, 2],
    [1, 2, 0],
    [2, 0, 1],
    [0, 2, 1],
    [1, 0, 2],
    [2, 1, 0],
  ];
  const style = (['ab', 'aab', 'abb', 'abc'] as const)[round % 4],
    mapping = permutations[Math.floor(round / 4) % 6],
    unit = PATTERN_UNITS[style].map((i) => symbols[mapping[i]]);
  const choices = symbols.slice(round % 3).concat(symbols.slice(0, round % 3));
  return {
    style,
    unitLength: unit.length,
    sequence: [...unit, ...unit],
    answer: unit[0],
    choices,
  };
}
/** Ten different sets of three toppings, with their presentation order rotated. */
export function pizzaToppingIndices(round: number) {
  const combinations: number[][] = [];
  for (let a = 0; a < 3; a++)
    for (let b = a + 1; b < 4; b++)
      for (let c = b + 1; c < 5; c++) combinations.push([a, b, c]);
  round = safeRound(round);
  const set = combinations[round % 10],
    shift = Math.floor(round / 10) % 3;
  return [...set.slice(shift), ...set.slice(0, shift)];
}
export function pizzaFact(
  round: number,
  step: number,
  max: number,
): ArithmeticFact {
  max = range(max);
  round = safeRound(round);
  const index = round * 3 + step,
    cycle = Math.floor(index / max),
    position = index % max,
    target = countQuantity(index, max),
    variant = Math.floor(cycle / 2);
  if ((cycle + position) % 2) {
    const right = (variant + position) % (max - target + 1);
    return { left: target + right, right, target, operation: '−' };
  }
  const left = (variant + position) % target;
  return { left, right: target - left, target, operation: '+' };
}
