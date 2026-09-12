export const OUTFIT_SLOTS = [
  'hat',
  'accessory',
  'face',
  'back',
  'body',
  'feet',
  'badge',
] as const;
export type OutfitSlot = (typeof OUTFIT_SLOTS)[number];
export const SLOT_LABELS: Record<OutfitSlot, string> = {
  hat: '🎩 Hats',
  accessory: '🧣 Neck',
  face: '👓 Glasses',
  back: '🦋 Backs',
  body: '👕 Clothes',
  feet: '👟 Shoes',
  badge: '🏅 Badges',
};
export type Outfit = Record<OutfitSlot, string>;
export type Cosmetic = {
  id: string;
  slot: OutfitSlot;
  name: string;
  icon: string;
  stars: number;
  colour: string;
  model?: string;
};
export const COSMETICS: Cosmetic[] = [
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
    slot: 'face',
    name: 'Round glasses',
    icon: '👓',
    stars: 5,
    colour: '#dddaf2',
  },
  {
    id: 'backpack',
    slot: 'back',
    name: 'Little backpack',
    icon: '🎒',
    stars: 12,
    colour: '#d3e4eb',
  },
  {
    id: 'medal',
    slot: 'badge',
    name: 'Superstar medal',
    icon: '🏅',
    stars: 24,
    colour: '#f5e6b3',
  },
];
const additions: [OutfitSlot, string, string, string, string, number][] = [
  ['hat', 'wizard', 'Wizard hat', '🧙', '#665bcd', 0],
  ['hat', 'pirate', 'Pirate hat', '🏴‍☠️', '#39435a', 0],
  ['hat', 'sunhat', 'Sunny sunhat', '👒', '#f6ca5b', 0],
  ['hat', 'chef', 'Chef hat', '👨‍🍳', '#fff4df', 0],
  ['hat', 'astronaut', 'Space helmet', '🧑‍🚀', '#b9d8ed', 10],
  ['hat', 'top-hat', 'Top hat', '🎩', '#674793', 0],
  ['hat', 'beret', 'Artist beret', '🎨', '#ed735d', 0],
  ['hat', 'flower-beanie', 'Pink bobble hat', '🧶', '#ed83b4', 0],
  ['hat', 'rainbow-party', 'Rainbow party hat', '🥳', '#60cfc2', 0],
  ['hat', 'gold-crown', 'Golden crown', '👑', '#fbc956', 18],
  ['accessory', 'red-scarf', 'Red scarf', '🧣', '#e76566', 0],
  ['accessory', 'rainbow-scarf', 'Purple scarf', '🧣', '#9b72d2', 0],
  ['accessory', 'blue-bow', 'Blue bow tie', '🎀', '#70b7ef', 0],
  ['accessory', 'yellow-bow', 'Sunshine bow tie', '🎀', '#f8ce57', 0],
  ['accessory', 'bandana', 'Explorer bandana', '🔺', '#ee8550', 0],
  ['accessory', 'beads', 'Rainbow beads', '📿', '#e69ac7', 4],
  ['face', 'sun-glasses', 'Sunny glasses', '🕶️', '#343955', 0],
  ['face', 'heart-glasses', 'Pink glasses', '💗', '#f284b1', 0],
  ['face', 'blue-glasses', 'Blue glasses', '👓', '#68b4dd', 0],
  ['face', 'goggles', 'Flying goggles', '🥽', '#b88c5e', 6],
  ['face', 'star-glasses', 'Golden glasses', '⭐', '#efbd36', 8],
  ['back', 'fairy-wings', 'Fairy wings', '🦋', '#c095ed', 0],
  ['back', 'dragon-wings', 'Dragon wings', '🐉', '#65ba9c', 0],
  ['back', 'cape', 'Hero cape', '🦸', '#e96f71', 0],
  ['back', 'blue-cape', 'Sky cape', '🦸', '#669bea', 0],
  ['back', 'jetpack', 'Jet pack', '🚀', '#b3c6d5', 12],
  ['back', 'pink-backpack', 'Berry backpack', '🎒', '#e98cae', 0],
  ['back', 'butterfly-wings', 'Sunset wings', '🦋', '#f0b357', 6],
  ['body', 'shirt', 'Blue T-shirt', '👕', '#67b1e0', 0],
  ['body', 'pink-shirt', 'Berry T-shirt', '👕', '#e78cac', 0],
  ['body', 'green-shirt', 'Leaf T-shirt', '👕', '#83ba64', 0],
  ['body', 'dress', 'Twirl dress', '👗', '#bb8fe3', 0],
  ['body', 'raincoat', 'Raincoat', '🧥', '#f1c33f', 0],
  ['body', 'spacesuit', 'Space suit', '🧑‍🚀', '#e6eef0', 12],
  ['body', 'dungarees', 'Garden dungarees', '👖', '#6194b4', 5],
  ['feet', 'boots', 'Yellow wellies', '🥾', '#f3c847', 0],
  ['feet', 'pink-boots', 'Pink wellies', '🥾', '#ee89b0', 0],
  ['feet', 'trainers', 'Blue trainers', '👟', '#76b4e9', 0],
  ['feet', 'red-trainers', 'Red trainers', '👟', '#eb7970', 0],
  ['feet', 'slippers', 'Cosy slippers', '🥿', '#c092db', 0],
  ['feet', 'space-boots', 'Moon boots', '🥾', '#c6d9e3', 12],
  ['badge', 'flower-pin', 'Flower badge', '🌼', '#f3b952', 0],
  ['badge', 'heart-pin', 'Heart badge', '💛', '#eb8ba8', 0],
  ['badge', 'moon-pin', 'Moon badge', '🌙', '#c4b3eb', 10],
  ['badge', 'rainbow-pin', 'Rainbow badge', '🌈', '#73c9b4', 6],
];
for (const [slot, id, name, icon, colour, stars] of additions)
  COSMETICS.push({ slot, id, name, icon, colour, stars });
for (const slot of OUTFIT_SLOTS.filter((s) => s !== 'hat' && s !== 'accessory'))
  COSMETICS.push({
    id: 'no-' + slot,
    slot,
    name: 'Take off',
    icon: '✕',
    stars: 0,
    colour: '#fff1c5',
  });
export const starterOutfit = (): Outfit => ({
  hat: 'beanie',
  accessory: 'bow',
  face: 'no-face',
  back: 'no-back',
  body: 'no-body',
  feet: 'no-feet',
  badge: 'no-badge',
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
  for (const slot of OUTFIT_SLOTS) {
    const item = COSMETICS.find(
      (candidate) => candidate.slot === slot && candidate.id === saved[slot],
    );
    if (item && isUnlocked(item, stars)) outfit[slot] = item.id;
  }
  // Old saves placed glasses, backpacks and medals in the single accessory slot.
  const legacy = COSMETICS.find(
    (item) =>
      item.id === saved.accessory &&
      ['glasses', 'backpack', 'medal'].includes(item.id),
  );
  if (legacy && isUnlocked(legacy, stars)) outfit[legacy.slot] = legacy.id;
  return outfit;
}
