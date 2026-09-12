import type { PlaceId, Region } from './adventure';

export type Discovery = {
  id: string;
  name: string;
  picture: string;
  region: Region;
  friend: PlaceId;
  x: number;
  z: number;
  colour: string;
  note: string;
  clue: string;
};
/** Coordinates are world metres, not the old village scale. Every find is optional. */
export const DISCOVERIES: Discovery[] = [
  {
    id: 'welcome-daisy',
    name: 'A little welcome',
    picture: '🌼',
    region: 'island',
    friend: 'home',
    x: 22,
    z: 23,
    colour: '#f1c859',
    note: 'A little daisy for our home. What shall we plant beside it?',
    clue: 'Look beside the garden at your house.',
  },
  {
    id: 'pizza-tomato',
    name: 'Chef’s treasure',
    picture: '🍅',
    region: 'island',
    friend: 'meadow',
    x: -5,
    z: -19,
    colour: '#df795f',
    note: 'Bramble saved a shiny tomato for the next pizza. What toppings would you choose?',
    clue: 'Look beside Bramble’s pizza shop.',
  },
  {
    id: 'story-owl',
    name: 'A story friend',
    picture: '🦉',
    region: 'island',
    friend: 'woods',
    x: -27,
    z: 6,
    colour: '#b594d1',
    note: 'A tiny owl ornament is watching the story tree. Shall we make up an owl adventure?',
    clue: 'Look beside Olive’s story tree.',
  },
  {
    id: 'harbour-boat',
    name: 'Little sailing boat',
    picture: '⛵',
    region: 'island',
    friend: 'cove',
    x: 30,
    z: 8,
    colour: '#6babcd',
    note: 'A little boat is ready for an imaginary voyage. Where shall it sail?',
    clue: 'Look along the path beside Marina’s harbour.',
  },
  {
    id: 'garden-flower',
    name: 'Tilly’s favourite',
    picture: '🌼',
    region: 'island',
    friend: 'garden',
    x: 6,
    z: 33,
    colour: '#dfa2b9',
    note: 'Tilly has picked a lovely flower for our book. Can you spot another flower nearby?',
    clue: 'Look beside Tilly’s growing patch.',
  },
  {
    id: 'market-basket',
    name: 'Picnic plans',
    picture: '🧺',
    region: 'island',
    friend: 'shop',
    x: -15,
    z: 24,
    colour: '#d6a270',
    note: 'A picnic basket! We could invite all our friends. What would you bring?',
    clue: 'Look near Poppy’s little shops.',
  },
  {
    id: 'rocket-bolt',
    name: 'Pip’s spare part',
    picture: '🔩',
    region: 'island',
    friend: 'rocket',
    x: -16,
    z: -39,
    colour: '#88bdb2',
    note: 'Pip has found a spare bolt. It is a souvenir of our rocket adventure.',
    clue: 'Look along the path beside Pip’s rocket.',
  },
  {
    id: 'woodland-mushroom',
    name: 'Secret picnic spot',
    picture: '🍄',
    region: 'island',
    friend: 'woods',
    x: -42,
    z: -38,
    colour: '#d89380',
    note: 'A mushroom beside a cosy woodland clearing. It looks like a tiny stool for a tiny friend.',
    clue: 'From Olive, follow the trees towards the woodland lookout.',
  },
  {
    id: 'sea-glass',
    name: 'Seaside sparkle',
    picture: '💎',
    region: 'island',
    friend: 'cove',
    x: 53,
    z: 18,
    colour: '#79c4c5',
    note: 'A sparkling pebble beside the sea. Let’s leave the beach just as lovely as we found it.',
    clue: 'From Marina, follow the shore towards the lighthouse.',
  },
  {
    id: 'meadow-star',
    name: 'A meadow wish',
    picture: '⭐',
    region: 'island',
    friend: 'garden',
    x: 27,
    z: 46,
    colour: '#e6be59',
    note: 'A little wooden star is hiding in the meadow. What lovely thing shall we wish for?',
    clue: 'From Tilly, explore the meadow towards the windmill.',
  },
  {
    id: 'moon-pebble',
    name: 'Moon explorer',
    picture: '🪨',
    region: 'moon',
    friend: 'moon',
    x: -10,
    z: 1,
    colour: '#aaa6d2',
    note: 'Our first Moon pebble! Let’s draw it in the book and remember our journey.',
    clue: 'On the Moon, look beside the landing pad.',
  },
  {
    id: 'moon-telescope',
    name: 'Stargazing',
    picture: '🔭',
    region: 'moon',
    friend: 'moon',
    x: 23,
    z: -15,
    colour: '#8daacb',
    note: 'A telescope for our Moon camp. What would you like to look at in the sky?',
    clue: 'On the Moon, explore just beyond Nova’s camp.',
  },
];
export const discoveryFor = (id: string) =>
  DISCOVERIES.find((d) => d.id === id);

export function nearbyDiscovery(
  region: Region,
  x: number,
  z: number,
  found: string[],
) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  return (
    DISCOVERIES.filter((d) => d.region === region && !found.includes(d.id))
      .map((d) => ({ d, distance: Math.hypot(d.x - x, d.z - z) }))
      .filter(({ distance }) => distance <= 3.2)
      .sort((a, b) => a.distance - b.distance)[0]?.d ?? null
  );
}
