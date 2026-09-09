export type OutfitSlot = 'hat' | 'accessory';
export type Outfit = Record<OutfitSlot, string>;
export const COSMETICS = [
  {
    id: 'no-hat',
    slot: 'hat',
    name: 'No hat',
    icon: '☀️',
    stars: 0,
    colour: '#fff1c5',
  },
  {
    id: 'beanie',
    slot: 'hat',
    name: 'Bobble beanie',
    icon: '🧶',
    stars: 0,
    colour: '#d1e8df',
  },
  {
    id: 'party',
    slot: 'hat',
    name: 'Party hat',
    icon: '🎉',
    stars: 0,
    colour: '#f4d9e5',
  },
  {
    id: 'explorer',
    slot: 'hat',
    name: 'Explorer hat',
    icon: '🧭',
    stars: 3,
    colour: '#ebdfc3',
  },
  {
    id: 'flowers',
    slot: 'hat',
    name: 'Flower crown',
    icon: '🌼',
    stars: 8,
    colour: '#f4e8bd',
  },
  {
    id: 'crown',
    slot: 'hat',
    name: 'Rainbow crown',
    icon: '👑',
    stars: 16,
    colour: '#e2d9f2',
  },
  {
    id: 'no-accessory',
    slot: 'accessory',
    name: 'Just Monster',
    icon: '💛',
    stars: 0,
    colour: '#fff1c5',
  },
  {
    id: 'bow',
    slot: 'accessory',
    name: 'Berry bow tie',
    icon: '🎀',
    stars: 0,
    colour: '#f4d9e5',
  },
  {
    id: 'scarf',
    slot: 'accessory',
    name: 'Cosy scarf',
    icon: '🧣',
    stars: 0,
    colour: '#d1e8df',
  },
  {
    id: 'glasses',
    slot: 'accessory',
    name: 'Round glasses',
    icon: '👓',
    stars: 5,
    colour: '#dddaf2',
  },
  {
    id: 'backpack',
    slot: 'accessory',
    name: 'Little backpack',
    icon: '🎒',
    stars: 12,
    colour: '#d3e4eb',
  },
  {
    id: 'medal',
    slot: 'accessory',
    name: 'Superstar medal',
    icon: '🏅',
    stars: 24,
    colour: '#f5e6b3',
  },
] as const;
export type Cosmetic = (typeof COSMETICS)[number];
export const starterOutfit = (): Outfit => ({
  hat: 'beanie',
  accessory: 'bow',
});
export const itemsFor = (slot: OutfitSlot) =>
  COSMETICS.filter((item) => item.slot === slot);
export function moveWardrobeSelection(
  index: number,
  direction: 'left' | 'right' | 'up' | 'down',
  count: number,
): number {
  const step =
    direction === 'up'
      ? -3
      : direction === 'down'
        ? 3
        : direction === 'left'
          ? -1
          : 1;
  return Math.max(0, Math.min(count, index + step));
}
export const isUnlocked = (item: Cosmetic, stars: number) =>
  stars >= item.stars;
export function newlyUnlocked(before: number, after: number): Cosmetic[] {
  return COSMETICS.filter((item) => item.stars > before && item.stars <= after);
}
export function equipItem(outfit: Outfit, id: string, stars: number): Outfit {
  const item = COSMETICS.find((candidate) => candidate.id === id);
  if (!item || !isUnlocked(item, stars)) return outfit;
  return { ...outfit, [item.slot]: item.id };
}
export function readOutfit(raw: unknown, stars: number): Outfit {
  const outfit = starterOutfit();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return outfit;
  const saved = raw as Record<string, unknown>;
  for (const slot of ['hat', 'accessory'] as const) {
    const item = COSMETICS.find(
      (candidate) => candidate.slot === slot && candidate.id === saved[slot],
    );
    if (item && isUnlocked(item, stars)) outfit[slot] = item.id;
  }
  return outfit;
}
