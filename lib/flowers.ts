import type { ProgressData } from './learning';
import type { Plant } from './adventure';

export const FLOWERS = [
  {
    id: 'daisy',
    name: 'Daisy',
    base: 'daisy',
    petals: '#fff4d2',
    centre: '#e7bd4d',
    needs: [],
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    base: 'sunflower',
    petals: '#f3c84c',
    centre: '#97704b',
    needs: [],
  },
  {
    id: 'tulip',
    name: 'Tulip',
    base: 'tulip',
    petals: '#e783a5',
    centre: '#f4a4bb',
    needs: [],
  },
  {
    id: 'moonflower',
    name: 'Moonflower',
    base: 'moonflower',
    petals: '#c6b4ed',
    centre: '#e3d9ff',
    needs: [],
  },
  {
    id: 'apricot-daisy',
    name: 'Apricot daisy',
    base: 'daisy',
    petals: '#f3a678',
    centre: '#ae734d',
    needs: ['daisy', 'tulip'],
  },
  {
    id: 'coral-sunflower',
    name: 'Coral sunflower',
    base: 'sunflower',
    petals: '#e78b96',
    centre: '#846680',
    needs: ['sunflower', 'tulip'],
  },
  {
    id: 'golden-tulip',
    name: 'Golden tulip',
    base: 'tulip',
    petals: '#eeb649',
    centre: '#f5d484',
    needs: ['daisy', 'sunflower'],
  },
  {
    id: 'starlight-daisy',
    name: 'Starlight daisy',
    base: 'daisy',
    petals: '#bfd9e8',
    centre: '#e4bd6c',
    needs: ['daisy', 'moonflower'],
  },
  {
    id: 'twilight-sunflower',
    name: 'Twilight sunflower',
    base: 'sunflower',
    petals: '#b098d3',
    centre: '#eee0a3',
    needs: ['sunflower', 'moonflower'],
  },
  {
    id: 'moonlight-tulip',
    name: 'Moonlight tulip',
    base: 'tulip',
    petals: '#c1dbbc',
    centre: '#ecf1d3',
    needs: ['tulip', 'moonflower'],
  },
] as const;
export type FlowerId = (typeof FLOWERS)[number]['id'];
export const SPECIAL_FLOWERS = FLOWERS.filter((f) => f.needs.length > 0);
export const flowerFor = (id: string) => FLOWERS.find((f) => f.id === id);
export const plantFamily = (id: string) => flowerFor(id)?.base ?? id;

/** Existing mature beds are remembered without retrospectively granting stars. */
export function readFlowers(raw: unknown, plots: Plant[]): FlowerId[] {
  const found = new Set(Array.isArray(raw) ? raw : []);
  for (const plant of plots) if (plant?.water === 3) found.add(plant.seed);
  return FLOWERS.filter((f) => found.has(f.id)).map((f) => f.id);
}
export function flowerAvailable(p: ProgressData, id: string) {
  const flower = flowerFor(id);
  return (
    !!flower &&
    flower.needs.length > 0 &&
    flower.needs.every((need) => p.adventure.flowers.includes(need))
  );
}
/** Tilly shares one free packet at a time after the child has grown the pictured pair. */
export function takeFlowerSeed(p: ProgressData, id: string): ProgressData {
  if (!flowerAvailable(p, id) || (p.adventure.seeds[id] ?? 0) > 0) return p;
  return {
    ...p,
    adventure: { ...p.adventure, seeds: { ...p.adventure.seeds, [id]: 1 } },
  };
}
export function rememberBloom(p: ProgressData, seed: string): ProgressData {
  const flower = flowerFor(seed);
  if (
    !flower ||
    p.adventure.flowers.includes(flower.id) ||
    !p.adventure.plots.some(
      (plant) => plant?.seed === seed && plant.water === 3,
    )
  )
    return p;
  const flowers = readFlowers([...p.adventure.flowers, flower.id], []);
  return {
    ...p,
    adventure: {
      ...p.adventure,
      flowers,
      wallet: p.adventure.wallet + 1,
      earned: p.adventure.earned + 1,
    },
  };
}
