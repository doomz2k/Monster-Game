import cards from './space-cards.json' with { type: 'json' };
export const SPACE_OBJECTS: Record<
  string,
  { name: string; icon: string; colour?: string; size?: number }
> = {
  earth: { name: 'Earth', icon: '🌍', colour: '#378bc7', size: 1 },
  sun: { name: 'The Sun', icon: '☀️', colour: '#ffbd40', size: 1.2 },
  moon: { name: 'The Moon', icon: '🌕', colour: '#b9bbc7', size: 0.85 },
  mercury: { name: 'Mercury', icon: '⚪', colour: '#aaa197', size: 0.68 },
  venus: { name: 'Venus', icon: '🟡', colour: '#dfbe72', size: 1 },
  mars: { name: 'Mars', icon: '🔴', colour: '#c45c3b', size: 0.82 },
  jupiter: { name: 'Jupiter', icon: '🟠', colour: '#d9ad7d', size: 1.25 },
  saturn: { name: 'Saturn', icon: '🪐', colour: '#d8c08c', size: 0.85 },
  uranus: { name: 'Uranus', icon: '🔵', colour: '#93d6dd', size: 1.05 },
  neptune: { name: 'Neptune', icon: '🔵', colour: '#3858c6', size: 1.05 },
  rocket: { name: 'Rocket', icon: '🚀' },
  boat: { name: 'Boat', icon: '⛵' },
  bicycle: { name: 'Bicycle', icon: '🚲' },
  astronaut: { name: 'Astronaut', icon: '🧑‍🚀' },
  owl: { name: 'Owl', icon: '🦉' },
  frog: { name: 'Frog', icon: '🐸' },
  fox: { name: 'Fox', icon: '🦊' },
  penguin: { name: 'Penguin', icon: '🐧' },
  telescope: { name: 'Telescope', icon: '🔭' },
  satellite: { name: 'Satellite', icon: '🛰️' },
  flower: { name: 'Flower', icon: '🌼' },
  rock: { name: 'Moon rock', icon: '🪨' },
  fish: { name: 'Fish', icon: '🐟' },
};
export const SPACE_DECK_SIZE = cards.length;
/** A full deck before any repeat. Later visits rotate the deck and answer positions. */
export function spaceCard(round: number) {
  const cycle = Math.floor(round / cards.length);
  const card = cards[((round % cards.length) + cycle * 7) % cards.length];
  const offset = (round + cycle) % Math.max(1, card.choices.length);
  return {
    ...card,
    choices: [...card.choices.slice(offset), ...card.choices.slice(0, offset)],
  };
}
