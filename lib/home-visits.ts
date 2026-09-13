import type { ProgressData } from './learning';

export const DANCE_MOVES = ['clap', 'stretch', 'hop', 'wiggle'] as const;
export type DanceMove = (typeof DANCE_MOVES)[number];
export const MOVE_LABELS: Record<DanceMove, string> = {
  clap: 'Clap',
  stretch: 'Reach up',
  hop: 'Hop',
  wiggle: 'Wiggle',
};
export const VISITORS = [
  {
    id: 'shop',
    name: 'Poppy',
    icon: '🐰',
    favourite: 'lamp',
    colour: '#e5a6c2',
  },
  {
    id: 'garden',
    name: 'Tilly',
    icon: '🐸',
    favourite: 'table',
    colour: '#9cbf82',
  },
  {
    id: 'meadow',
    name: 'Bramble',
    icon: '🦊',
    favourite: 'table',
    colour: '#e9b38e',
  },
  {
    id: 'woods',
    name: 'Olive',
    icon: '🦉',
    favourite: 'books',
    colour: '#b4a1cc',
  },
  {
    id: 'cove',
    name: 'Marina',
    icon: '🐧',
    favourite: 'sofa',
    colour: '#93bfce',
  },
  {
    id: 'rocket',
    name: 'Pip',
    icon: '👽',
    favourite: 'rug',
    colour: '#97cabc',
  },
  { id: 'moon', name: 'Nova', icon: '🌙', favourite: 'bed', colour: '#c1b4df' },
] as const;
export type VisitorId = (typeof VISITORS)[number]['id'];
export type VisitProgress = Record<VisitorId, number>;
export const freshVisits = (): VisitProgress =>
  Object.fromEntries(VISITORS.map((v) => [v.id, 0])) as VisitProgress;
export function visitorAvailable(p: ProgressData, id: VisitorId) {
  return (
    VISITORS.some((v) => v.id === id) &&
    (id === 'shop' || p.adventure.rounds[id] > 0)
  );
}
export function readVisits(raw: unknown): VisitProgress {
  const result = freshVisits();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;
  for (const v of VISITORS) {
    const n = (raw as Record<string, unknown>)[v.id];
    if (typeof n === 'number' && Number.isSafeInteger(n) && n >= 0)
      result[v.id] = Math.min(n, 100000);
  }
  return result;
}
/** Two or three pictured moves; visit counters choose full decks without adjacent repeats. */
export function visitDance(id: VisitorId, round: number): DanceMove[] {
  const r = Number.isSafeInteger(round) && round >= 0 ? round : 0;
  const guest = Math.max(
    0,
    VISITORS.findIndex((v) => v.id === id),
  );
  const length = r < 4 ? 2 : 3,
    deck: DanceMove[][] = [];
  for (const a of DANCE_MOVES)
    for (const b of DANCE_MOVES) {
      if (a === b) continue;
      if (length === 2) deck.push([a, b]);
      else for (const c of DANCE_MOVES) if (c !== b) deck.push([a, b, c]);
    }
  const index = length === 2 ? r : r - 4;
  return deck[((index % deck.length) * 5 + guest * 7) % deck.length];
}
export function visitorAdmires(p: ProgressData, id: VisitorId) {
  const item = VISITORS.find((v) => v.id === id)?.favourite;
  return (
    !!item &&
    p.adventure.inventory.includes(item) &&
    p.adventure.furniture.includes(item)
  );
}
/** A fresh, complete dance earns two stars. Visiting and free imitation do not mark school practice. */
export function finishVisit(
  p: ProgressData,
  id: VisitorId,
  round: number,
  answers: readonly DanceMove[],
): ProgressData {
  if (
    p.adventure.region !== 'island' ||
    !visitorAvailable(p, id) ||
    p.adventure.visits[id] !== round ||
    round >= 100000
  )
    return p;
  const expected = visitDance(id, round);
  if (
    answers.length !== expected.length ||
    answers.some((answer, i) => answer !== expected[i])
  )
    return p;
  return {
    ...p,
    adventure: {
      ...p.adventure,
      visits: { ...p.adventure.visits, [id]: round + 1 },
      wallet: p.adventure.wallet + 2,
      earned: p.adventure.earned + 2,
    },
  };
}
