import type { ProgressData } from './learning';
export type TrackDirection = 0 | 1 | 2 | 3; // north, east, south, west
export type TrackPiece = {
  cell: number;
  ports: TrackDirection[];
  editable: boolean;
};
export type TrackTask = {
  round: number;
  path: number[];
  pieces: TrackPiece[];
  turns: number[];
};
const neighbours = (cell: number) =>
  [
    cell - 3,
    cell % 3 < 2 ? cell + 1 : -1,
    cell + 3,
    cell % 3 > 0 ? cell - 1 : -1,
  ].filter((n) => n >= 0 && n < 9);
const direction = (from: number, to: number): TrackDirection =>
  to === from - 3 ? 0 : to === from + 1 ? 1 : to === from + 3 ? 2 : 3;
const opposite = (d: TrackDirection) => ((d + 2) % 4) as TrackDirection;
function routeDeck() {
  const routes: number[][] = [];
  const walk = (path: number[]) => {
    const last = path[path.length - 1];
    if (last % 3 === 2) {
      if (path.length >= 3 && path.length <= 7) routes.push(path);
      return;
    }
    if (path.length >= 7) return;
    for (const next of neighbours(last))
      if (!path.includes(next)) walk([...path, next]);
  };
  for (const start of [0, 3, 6]) walk([start]);
  let seed = 817;
  for (let i = routes.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [routes[i], routes[j]] = [routes[j], routes[i]];
  }
  return routes;
}
export const TRACK_ROUTES = routeDeck();
export function trackTask(round: number): TrackTask {
  const r = Number.isSafeInteger(round) && round >= 0 ? round : 0;
  const path =
    r < 3
      ? [
          [3, 4, 5],
          [0, 1, 2],
          [6, 7, 8],
        ][r]
      : TRACK_ROUTES[(r - 3) % TRACK_ROUTES.length];
  const editableCount = r < 3 ? 1 : r < 8 ? 2 : 3;
  const candidates = path.slice(1, -1),
    editable = new Set<number>();
  for (let i = 0; i < Math.min(editableCount, candidates.length); i++)
    editable.add(candidates[(r + i) % candidates.length]);
  const pieces = path.map(
    (cell, i): TrackPiece => ({
      cell,
      ports: [
        i ? opposite(direction(path[i - 1], cell)) : 3,
        i === path.length - 1 ? 1 : direction(cell, path[i + 1]),
      ],
      editable: editable.has(cell),
    }),
  );
  const turns = Array(9).fill(0);
  for (const piece of pieces)
    if (piece.editable) {
      const straight = (piece.ports[0] + 2) % 4 === piece.ports[1];
      turns[piece.cell] = straight ? 1 : 1 + ((r + piece.cell) % 3);
    }
  return { round: r, path: [...path], pieces, turns };
}
export function turnedPorts(piece: TrackPiece, turn: number): TrackDirection[] {
  const q = Number.isSafeInteger(turn) ? ((turn % 4) + 4) % 4 : 0;
  return piece.ports.map((d) => ((d + q) % 4) as TrackDirection);
}
/** Follow actual matching ports from the left station; no jumping across a gap. */
export function inspectTrack(task: TrackTask, turns: readonly number[]) {
  let entering: TrackDirection = 3,
    cell = task.path[0];
  const visited: number[] = [];
  for (let step = 0; step < 10; step++) {
    const piece = task.pieces.find((p) => p.cell === cell);
    if (!piece || visited.includes(cell))
      return { connected: false, visited, stop: cell };
    const ports = turnedPorts(piece, piece.editable ? (turns[cell] ?? 0) : 0);
    if (!ports.includes(entering))
      return { connected: false, visited, stop: cell };
    visited.push(cell);
    const leaving = ports.find((d) => d !== entering)!;
    if (cell === task.path[task.path.length - 1] && leaving === 1)
      return { connected: true, visited, stop: null };
    const next =
      leaving === 0
        ? cell - 3
        : leaving === 1
          ? cell + 1
          : leaving === 2
            ? cell + 3
            : cell - 1;
    if (!neighbours(cell).includes(next))
      return { connected: false, visited, stop: cell };
    entering = opposite(leaving);
    cell = next;
  }
  return { connected: false, visited, stop: cell };
}
export function nextTrackHint(task: TrackTask, turns: readonly number[]) {
  return (
    task.pieces.find(
      (p) =>
        p.editable &&
        turnedPorts(p, turns[p.cell]).some((port) => !p.ports.includes(port)),
    )?.cell ?? null
  );
}
export function finishTrack(
  p: ProgressData,
  round: number,
  turns: readonly number[],
): ProgressData {
  if (
    p.adventure.region !== 'island' ||
    p.adventure.rounds.rocket < 1 ||
    p.adventure.workshop !== round ||
    !Number.isSafeInteger(round) ||
    round < 0 ||
    round >= 100000 ||
    turns.length !== 9 ||
    turns.some((n) => !Number.isSafeInteger(n))
  )
    return p;
  if (!inspectTrack(trackTask(round), turns).connected) return p;
  return {
    ...p,
    adventure: {
      ...p.adventure,
      workshop: round + 1,
      wallet: p.adventure.wallet + 2,
      earned: p.adventure.earned + 2,
    },
  };
}
/** Travel along the same quadratic curves drawn on each road tile. */
export function trackRidePoint(task: TrackTask, ms: number) {
  const cells = task.path.map((cell) => ({
    x: cell % 3,
    y: Math.floor(cell / 3),
  }));
  const duration = cells.length * 700 + 500;
  const t = Number.isFinite(ms) ? Math.max(0, Math.min(duration, ms)) : 0;
  if (t < 250)
    return {
      x: -0.8 + (0.3 * t) / 250,
      y: cells[0].y,
      angle: 0,
      duration,
      finished: false,
    };
  if (t >= duration - 250)
    return {
      x: 2.5 + (0.3 * (t - duration + 250)) / 250,
      y: cells[cells.length - 1].y,
      angle: 0,
      duration,
      finished: t >= duration,
    };
  const index = Math.floor((t - 250) / 700),
    u = ((t - 250) % 700) / 700,
    v = 1 - u;
  const c = cells[index],
    previous = cells[index - 1],
    next = cells[index + 1];
  const a = previous
    ? { x: (previous.x + c.x) / 2, y: (previous.y + c.y) / 2 }
    : { x: -0.5, y: c.y };
  const b = next
    ? { x: (next.x + c.x) / 2, y: (next.y + c.y) / 2 }
    : { x: 2.5, y: c.y };
  const dx = 2 * v * (c.x - a.x) + 2 * u * (b.x - c.x),
    dy = 2 * v * (c.y - a.y) + 2 * u * (b.y - c.y);
  return {
    x: v * v * a.x + 2 * v * u * c.x + u * u * b.x,
    y: v * v * a.y + 2 * v * u * c.y + u * u * b.y,
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
    duration,
    finished: false,
  };
}
