import type { ProgressData } from './learning';
import type { Plant } from './adventure';

export const PRODUCE = ['tomato', 'pepper'] as const;
export type ProduceId = (typeof PRODUCE)[number];
export type Pantry = Record<ProduceId, number>;
export const freshPantry = (): Pantry => ({ tomato: 0, pepper: 0 });
export function readPantry(raw: unknown): Pantry {
  const pantry = freshPantry();
  if (!raw || typeof raw !== 'object') return pantry;
  for (const id of PRODUCE) {
    const n = (raw as Record<string, unknown>)[id];
    pantry[id] =
      typeof n === 'number' && Number.isSafeInteger(n) && n > 0
        ? Math.min(99, n)
        : 0;
  }
  return pantry;
}
export function harvestPlant(p: ProgressData, slot: number): ProgressData {
  if (!Number.isInteger(slot) || slot < 0 || slot >= 6) return p;
  const plant = p.adventure.plots[slot];
  if (!plant || plant.water !== 3 || !PRODUCE.includes(plant.seed as ProduceId))
    return p;
  const id = plant.seed as ProduceId;
  if (p.adventure.pantry[id] >= 99) return p;
  const plots = [...p.adventure.plots];
  plots[slot] = { ...plant, water: 1 };
  return {
    ...p,
    adventure: {
      ...p.adventure,
      plots,
      pantry: { ...p.adventure.pantry, [id]: p.adventure.pantry[id] + 1 },
    },
  };
}
/** Helpful visitors are cosmetic. They never eat crops or depend on real-world time. */
export function gardenVisitors(plots: Plant[]) {
  const blooms = plots.filter((p) => p?.water === 3).map((p) => p!.seed);
  return {
    bee: blooms.some((s) => ['daisy', 'sunflower', 'tulip'].includes(s)),
    butterfly: blooms.some((s) => ['tulip', 'moonflower', 'daisy'].includes(s)),
    bird: blooms.some((s) => ['sunflower', 'strawberry'].includes(s)),
  };
}
