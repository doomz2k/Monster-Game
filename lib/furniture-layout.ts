import type { ProgressData } from './learning';
import { SHOP_ITEMS } from './adventure';
export type FurnitureArea = 'house' | 'garden';
export const layoutFields = (area: FurnitureArea) =>
  area === 'garden'
    ? (['gardenFurniture', 'gardenTurns'] as const)
    : (['furniture', 'furnitureTurns'] as const);

export type FurnitureLayout = {
  furniture: (string | null)[];
  furnitureTurns: number[];
  gardenFurniture: (string | null)[];
  gardenTurns: number[];
};
export function readFurnitureTurns(raw: unknown, furniture: (string | null)[]) {
  return Array.from({ length: 6 }, (_, i) =>
    furniture[i] &&
    Array.isArray(raw) &&
    Number.isInteger(raw[i]) &&
    raw[i] >= 0 &&
    raw[i] < 4
      ? (raw[i] as number)
      : 0,
  );
}
export function furnitureSnapshot(p: ProgressData): FurnitureLayout {
  return {
    furniture: [...p.adventure.furniture],
    furnitureTurns: [...p.adventure.furnitureTurns],
    gardenFurniture: [...p.adventure.gardenFurniture],
    gardenTurns: [...p.adventure.gardenTurns],
  };
}
export function rotateFurniture(
  p: ProgressData,
  slot: number,
  area: FurnitureArea = 'house',
): ProgressData {
  const [itemsKey, turnsKey] = layoutFields(area);
  if (
    !Number.isInteger(slot) ||
    slot < 0 ||
    slot >= 6 ||
    !p.adventure[itemsKey][slot]
  )
    return p;
  const turns = [...p.adventure[turnsKey]];
  turns[slot] = (turns[slot] + 1) % 4;
  return { ...p, adventure: { ...p.adventure, [turnsKey]: turns } };
}
export function restoreFurniture(
  p: ProgressData,
  layout: FurnitureLayout,
): ProgressData {
  const used = new Set<string>();
  const restore = (list: (string | null)[] | undefined, garden: boolean) =>
    Array.from({ length: 6 }, (_, i) => {
      const id = list?.[i];
      if (!id || !p.adventure.inventory.includes(id) || used.has(id))
        return null;
      const item = SHOP_ITEMS.find((item) => item.id === id);
      if (!item || (item.kind === 'garden') !== garden) return null;
      used.add(id);
      return id;
    });
  const furniture = restore(layout.furniture, false),
    gardenFurniture = restore(layout.gardenFurniture, true);
  const furnitureTurns = readFurnitureTurns(layout.furnitureTurns, furniture);
  const gardenTurns = readFurnitureTurns(layout.gardenTurns, gardenFurniture);
  return {
    ...p,
    adventure: {
      ...p.adventure,
      furniture,
      furnitureTurns,
      gardenFurniture,
      gardenTurns,
    },
  };
}
export function furniturePosition(slot: number, garden: boolean) {
  return {
    x: ((slot % 3) - 1) * (garden ? 2.3 : 2.1),
    y: garden ? 0.05 : 0.17,
    z: garden
      ? 6.7 + Math.floor(slot / 3) * 2.3
      : Math.floor(slot / 3) * 2 - 1.2,
  };
}
