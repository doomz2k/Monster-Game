import type { ProgressData } from './learning';

export const COMPANIONS = [
  {
    id: 'sprig',
    name: 'Sprig',
    colour: '#8eb888',
    belly: '#e4e8b1',
    wing: '#bcd891',
    clue: 'Ready to explore',
  },
  {
    id: 'puff',
    name: 'Puff',
    colour: '#a3ccdf',
    belly: '#fff1d4',
    wing: '#7ca7c9',
    clue: 'Help Tilly in the garden',
  },
  {
    id: 'twinkle',
    name: 'Twinkle',
    colour: '#b4a0d8',
    belly: '#f5e2c0',
    wing: '#d8b5df',
    clue: 'Repair Pip’s rocket',
  },
] as const;
export type CompanionId = (typeof COMPANIONS)[number]['id'];
export function companionAvailable(
  id: CompanionId,
  adventure: Pick<ProgressData['adventure'], 'rounds'>,
) {
  return (
    id === 'sprig' ||
    (id === 'puff' ? adventure.rounds.garden > 0 : adventure.rounds.rocket >= 3)
  );
}
export function readCompanion(
  raw: unknown,
  adventure: Pick<ProgressData['adventure'], 'rounds'>,
): CompanionId | null {
  if (raw === null) return null;
  const companion = COMPANIONS.find((c) => c.id === raw);
  return companion && companionAvailable(companion.id, adventure)
    ? companion.id
    : 'sprig';
}
export function chooseCompanion(
  p: ProgressData,
  id: CompanionId | null,
): ProgressData {
  if (
    id === p.adventure.companion ||
    (id !== null &&
      (!COMPANIONS.some((c) => c.id === id) ||
        !companionAvailable(id, p.adventure)))
  )
    return p;
  return { ...p, adventure: { ...p.adventure, companion: id } };
}

export type CompanionPoint = { x: number; z: number };
type Obstacle = CompanionPoint & { r: number };
export function companionSpot(
  player: CompanionPoint,
  facing: number,
  obstacles: Obstacle[],
): CompanionPoint {
  for (const [side, back] of [
    [1.7, 1.5],
    [-1.7, 1.5],
    [2.5, 0],
    [-2.5, 0],
    [0, -2.5],
  ]) {
    const spot = {
      x: player.x + Math.cos(facing) * side - Math.sin(facing) * back,
      z: player.z - Math.sin(facing) * side - Math.cos(facing) * back,
    };
    if (
      !obstacles.some(
        (c) => Math.hypot(spot.x - c.x, spot.z - c.z) < c.r + 0.65,
      )
    )
      return spot;
  }
  return { ...player };
}
export class CompanionMotion {
  x = 0;
  z = 0;
  facing = 0;
  ready = false;
  update(
    spot: CompanionPoint,
    dt: number,
    active: boolean,
    obstacles: Obstacle[],
    snap = false,
  ) {
    if (!Number.isFinite(spot.x) || !Number.isFinite(spot.z)) return;
    const distance = Math.hypot(spot.x - this.x, spot.z - this.z);
    if (!this.ready || snap || distance > 10) {
      this.x = spot.x;
      this.z = spot.z;
      this.ready = true;
      return;
    }
    if (!active || !Number.isFinite(dt) || dt <= 0) return;
    const factor = 1 - Math.exp(-5 * Math.min(dt, 0.05));
    const next = {
      x: this.x + (spot.x - this.x) * factor,
      z: this.z + (spot.z - this.z) * factor,
    };
    const blocked = obstacles.some(
      (c) => Math.hypot(next.x - c.x, next.z - c.z) < c.r + 0.45,
    );
    // This small magical flier rejoins at the clear shoulder position if scenery cuts across its route.
    if (blocked) {
      this.x = spot.x;
      this.z = spot.z;
    } else {
      this.x = next.x;
      this.z = next.z;
    }
    if (distance > 0.15)
      this.facing = Math.atan2(spot.x - this.x, spot.z - this.z);
  }
}
