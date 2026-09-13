import type { ProgressData } from './learning';
import { layoutFields, type FurnitureArea } from './furniture-layout';
import type { AdventureProgress } from './adventure';

export const HOME_ACTIVITIES = {
  sofa: { action: 'sit', label: 'Sit down' },
  bed: { action: 'sleep', label: 'Have a rest' },
  table: { action: 'picnic', label: 'Have a picnic' },
  books: { action: 'read', label: 'Look at a book' },
  lamp: { action: 'light', label: 'Switch the light' },
  rug: { action: 'dance', label: 'Do a little dance' },
  birdbath: { action: 'splash', label: 'Make a splash' },
  swing: { action: 'swing', label: 'Have a swing' },
  mushroom: { action: 'sit', label: 'Sit on a spot' },
  lantern: { action: 'light', label: 'Switch the lantern' },
} as const;
export type HomeItem = keyof typeof HOME_ACTIVITIES;
export type HomeAction = (typeof HOME_ACTIVITIES)[HomeItem]['action'];
export function homeActivity(
  a: AdventureProgress,
  area: FurnitureArea,
  slot: number,
) {
  if (!Number.isInteger(slot) || slot < 0 || slot >= 6) return null;
  const [items, turns] = layoutFields(area),
    id = a[items][slot];
  if (!id || !Object.hasOwn(HOME_ACTIVITIES, id) || !a.inventory.includes(id))
    return null;
  return {
    id: id as HomeItem,
    turn: a[turns][slot],
    ...HOME_ACTIVITIES[id as HomeItem],
  };
}
export function toggleFurnitureLight(
  p: ProgressData,
  id: string,
): ProgressData {
  if (
    !['lamp', 'lantern'].includes(id) ||
    !p.adventure.inventory.includes(id) ||
    ![...p.adventure.furniture, ...p.adventure.gardenFurniture].includes(id)
  )
    return p;
  const unlit = p.adventure.unlit.includes(id)
    ? p.adventure.unlit.filter((item) => item !== id)
    : [...p.adventure.unlit, id];
  return { ...p, adventure: { ...p.adventure, unlit } };
}
