import type { ProgressData } from './learning';

export const ROVER_DOCK = { x: -23, z: -28 };
export const ROVER_STOPS = [
  {
    id: 'rocks',
    name: 'Rock trail',
    item: 'Moon rocks',
    x: -43,
    z: -13,
    colour: '#c6a38b',
  },
  {
    id: 'panels',
    name: 'Sunshine station',
    item: 'solar panels',
    x: 27,
    z: 25,
    colour: '#80b9ce',
  },
  {
    id: 'signals',
    name: 'Signal hill',
    item: 'signal lights',
    x: 40,
    z: -28,
    colour: '#c8a1d5',
  },
] as const;
export type RoverStopId = (typeof ROVER_STOPS)[number]['id'];
export type RoverProgress = Record<RoverStopId, number>;
export type RoverSurvey = { stop: RoverStopId; round: number; target: number };
export const freshRoverProgress = (): RoverProgress => ({
  rocks: 0,
  panels: 0,
  signals: 0,
});
export const roverStop = (id: RoverStopId) =>
  ROVER_STOPS.find((s) => s.id === id)!;
export function readRoverProgress(
  raw: unknown,
  unlocked: boolean,
): RoverProgress {
  const result = freshRoverProgress();
  if (!unlocked || !raw || typeof raw !== 'object' || Array.isArray(raw))
    return result;
  for (const s of ROVER_STOPS) {
    const n = (raw as Record<string, unknown>)[s.id];
    if (typeof n === 'number' && Number.isSafeInteger(n) && n >= 0)
      result[s.id] = Math.min(100000, n);
  }
  return result;
}
export function nextRoverStop(progress: RoverProgress): RoverStopId {
  return [...ROVER_STOPS].sort((a, b) => progress[a.id] - progress[b.id])[0].id;
}
export function nearbyRoverStop(x: number, z: number) {
  return ROVER_STOPS.find((s) => Math.hypot(s.x - x, s.z - z) < 5.5);
}
export function roverSurvey(
  stop: RoverStopId,
  progress: RoverProgress,
): RoverSurvey {
  const index = ROVER_STOPS.findIndex((s) => s.id === stop);
  return {
    stop,
    round: progress[stop],
    target: 1 + ((progress[stop] * 2 + index + 2) % 5),
  };
}
/** Expected round and proximity make repeats, stale screens and remote claims harmless. */
export function finishRoverSurvey(
  p: ProgressData,
  survey: RoverSurvey,
  answer: number,
  x: number,
  z: number,
) {
  if (
    p.adventure.region !== 'moon' ||
    p.adventure.rounds.rocket < 3 ||
    !ROVER_STOPS.some((s) => s.id === survey.stop) ||
    p.adventure.rover[survey.stop] !== survey.round ||
    nearbyRoverStop(x, z)?.id !== survey.stop
  )
    return p;
  const expected = roverSurvey(survey.stop, p.adventure.rover);
  if (answer !== expected.target || survey.target !== expected.target) return p;
  return {
    ...p,
    adventure: {
      ...p.adventure,
      earned: p.adventure.earned + 1,
      wallet: p.adventure.wallet + 1,
      rover: { ...p.adventure.rover, [survey.stop]: survey.round + 1 },
    },
  };
}
/** A clear side of the rover, away from stations and the play-area edge. */
export function roverExit(
  x: number,
  z: number,
  yaw: number,
  obstacles: readonly { x: number; z: number; r: number }[],
) {
  for (const turn of [
    Math.PI / 2,
    -Math.PI / 2,
    Math.PI,
    0,
    Math.PI / 4,
    -Math.PI / 4,
  ]) {
    const next = {
      x: x + Math.sin(yaw + turn) * 3.2,
      z: z + Math.cos(yaw + turn) * 3.2,
    };
    if (
      Math.hypot(next.x, next.z) <= 80 &&
      obstacles.every(
        (o) => Math.hypot(next.x - o.x, next.z - o.z) >= o.r + 0.5,
      )
    )
      return next;
  }
  // The dock is always a clear recovery point if a future layout encloses the vehicle.
  return { x: ROVER_DOCK.x + 3.2, z: ROVER_DOCK.z };
}
