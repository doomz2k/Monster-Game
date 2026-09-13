import type { ProgressData } from './learning';

/** Equatorial widths in km: NASA's Planet Sizes and Locations guide, checked September 2026. */
export const PLANETS = [
  {
    id: 'mercury',
    name: 'Mercury',
    colour: '#afa89f',
    diameter: 4880,
    fact: 'The smallest planet, and the nearest to the Sun.',
  },
  {
    id: 'venus',
    name: 'Venus',
    colour: '#e2c784',
    diameter: 12104,
    fact: 'Second from the Sun. Almost as wide as Earth.',
  },
  {
    id: 'earth',
    name: 'Earth',
    colour: '#58a9cf',
    diameter: 12756,
    fact: 'Our home planet. Third from the Sun.',
  },
  {
    id: 'mars',
    name: 'Mars',
    colour: '#d88b6c',
    diameter: 6792,
    fact: 'The red planet. About half as wide as Earth.',
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    colour: '#d7b699',
    diameter: 142984,
    fact: 'The biggest planet. About eleven Earths across!',
  },
  {
    id: 'saturn',
    name: 'Saturn',
    colour: '#dccda5',
    diameter: 120536,
    fact: 'Its beautiful rings are made of pieces of ice and rock.',
  },
  {
    id: 'uranus',
    name: 'Uranus',
    colour: '#a5dce0',
    diameter: 51118,
    fact: 'Seventh from the Sun. About four Earths across.',
  },
  {
    id: 'neptune',
    name: 'Neptune',
    colour: '#83bedb',
    diameter: 49528,
    fact: 'The farthest of the eight planets from the Sun.',
  },
] as const;
export type PlanetId = (typeof PLANETS)[number]['id'];
export type ObservatoryView = 'telescope' | 'orbits' | 'sizes';
export const OBSERVATORY_VIEWS: ObservatoryView[] = [
  'telescope',
  'orbits',
  'sizes',
];
export const planetFor = (id: PlanetId) => PLANETS.find((p) => p.id === id)!;
export function readPlanetCollection(
  raw: unknown,
  unlocked: boolean,
): PlanetId[] {
  if (!unlocked || !Array.isArray(raw)) return [];
  return PLANETS.filter((p) => raw.includes(p.id)).map((p) => p.id);
}
/** Only a first observation on the unlocked Moon awards a star; repeats remain available. */
export function observePlanet(p: ProgressData, id: PlanetId): ProgressData {
  if (
    p.adventure.region !== 'moon' ||
    p.adventure.rounds.rocket < 3 ||
    !PLANETS.some((planet) => planet.id === id) ||
    p.adventure.planets.includes(id)
  )
    return p;
  return {
    ...p,
    adventure: {
      ...p.adventure,
      planets: readPlanetCollection([...p.adventure.planets, id], true),
      earned: p.adventure.earned + 1,
      wallet: p.adventure.wallet + 1,
    },
  };
}
/** Equal units per equatorial width, with enough room for Saturn's rings. */
export function planetComparison(id: PlanetId) {
  const ratio = planetFor(id).diameter / planetFor('earth').diameter;
  return {
    ratio,
    earth: 0.9 / Math.max(1, ratio),
    planet: 0.9 * Math.min(1, ratio),
  };
}
/** A deliberately compressed teaching model: order is real, positions and timing are illustrative. */
export function modelOrbit(index: number, seconds: number) {
  const i = Math.max(
    0,
    Math.min(7, Number.isFinite(index) ? Math.floor(index) : 0),
  );
  const t = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const radius = 1.65 + i * 0.77;
  const angle = i * 2.39996 + (t % 100000) * (0.14 / (1 + i * 0.6));
  return { radius, x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
}
