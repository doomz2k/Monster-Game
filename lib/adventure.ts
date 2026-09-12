import { WORLD_SCALE } from './world-layout';
import { discoveryFor } from './discovery-catalogue';
import { freshPantry, readPantry, type Pantry, type ProduceId } from './garden';
import { spaceCard } from './space-learning';
import type { ProgressData } from './learning';
import { decodableWords, SOUNDS, soundChoices } from './phonics';

export const PLACES = (
  [
    {
      id: 'home',
      name: 'My home',
      friend: 'Monster',
      icon: '🏡',
      x: 11,
      z: 12,
      colour: '#e9ad65',
      kind: 'home',
      intro: 'home',
    },
    {
      id: 'meadow',
      name: 'Bramble’s pizza shop',
      friend: 'Bramble',
      icon: '🍕',
      x: 0,
      z: -14,
      colour: '#ec995f',
      kind: 'fox',
      intro: 'bramble-hello',
    },
    {
      id: 'woods',
      name: 'Olive’s story tree',
      friend: 'Olive',
      icon: '🦉',
      x: -20,
      z: 0,
      colour: '#b28acb',
      kind: 'owl',
      intro: 'olive-hello',
    },
    {
      id: 'cove',
      name: 'Marina’s harbour',
      friend: 'Marina',
      icon: '🐧',
      x: 21,
      z: 0,
      colour: '#78b9d8',
      kind: 'penguin',
      intro: 'marina-hello',
    },
    {
      id: 'garden',
      name: 'Tilly’s growing patch',
      friend: 'Tilly',
      icon: '🐸',
      x: 0,
      z: 22,
      colour: '#8fb968',
      kind: 'frog',
      intro: 'tilly-hello',
    },
    {
      id: 'shop',
      name: 'Poppy’s little shops',
      friend: 'Poppy',
      icon: '🐰',
      x: -12,
      z: 16,
      colour: '#e59cbd',
      kind: 'rabbit',
      intro: 'poppy-hello',
    },
    {
      id: 'rocket',
      name: 'Pip’s crashed rocket',
      friend: 'Pip',
      icon: '👽',
      x: -13,
      z: -27,
      colour: '#83c8b6',
      kind: 'alien',
      intro: 'pip-hello',
    },
    {
      id: 'moon',
      name: 'Moon meadow',
      friend: 'Nova',
      icon: '🌙',
      x: 10,
      z: -7,
      colour: '#c1b6eb',
      kind: 'alien',
      intro: 'nova-hello',
    },
  ] as const
).map((place) => ({
  ...place,
  x: place.x * WORLD_SCALE,
  z: place.z * WORLD_SCALE,
}));
export type PlaceId = (typeof PLACES)[number]['id'];
export type QuestId = Exclude<PlaceId, 'home' | 'shop'>;
export type Region = 'island' | 'moon';
export const placeFor = (id: PlaceId) => PLACES.find((p) => p.id === id)!;
export type Plant = { seed: string; water: number } | null;
export type AdventureProgress = {
  version: 1;
  earned: number;
  wallet: number;
  rounds: Record<QuestId, number>;
  inventory: string[];
  seeds: Record<string, number>;
  plots: Plant[];
  furniture: (string | null)[];
  region: Region;
  moonVisits: number;
  discoveries: string[];
  friendshipGifts: QuestId[];
  pantry: Pantry;
};
export const SHOP_ITEMS = [
  {
    id: 'tomato',
    name: 'Tomato seeds',
    icon: '🍅',
    kind: 'seed',
    price: 2,
    colour: '#df795f',
  },
  {
    id: 'pepper',
    name: 'Pepper seeds',
    icon: '🫑',
    kind: 'seed',
    price: 2,
    colour: '#92b361',
  },
  {
    id: 'daisy',
    name: 'Daisy seeds',
    icon: '🌼',
    kind: 'seed',
    price: 1,
    colour: '#ffe175',
  },
  {
    id: 'sunflower',
    name: 'Sunflower seeds',
    icon: '🌻',
    kind: 'seed',
    price: 2,
    colour: '#fbbd38',
  },
  {
    id: 'tulip',
    name: 'Tulip seeds',
    icon: '🌷',
    kind: 'seed',
    price: 2,
    colour: '#ee729b',
  },
  {
    id: 'carrot',
    name: 'Carrot seeds',
    icon: '🥕',
    kind: 'seed',
    price: 1,
    colour: '#f29743',
  },
  {
    id: 'strawberry',
    name: 'Strawberry seeds',
    icon: '🍓',
    kind: 'seed',
    price: 3,
    colour: '#e9677d',
  },
  {
    id: 'moonflower',
    name: 'Moonflower seeds',
    icon: '🌸',
    kind: 'seed',
    price: 3,
    colour: '#b398e0',
  },
  {
    id: 'sofa',
    name: 'Berry sofa',
    icon: '🛋️',
    kind: 'furniture',
    price: 4,
    colour: '#d78cab',
  },
  {
    id: 'bed',
    name: 'Starry bed',
    icon: '🛏️',
    kind: 'furniture',
    price: 5,
    colour: '#a59bdd',
  },
  {
    id: 'table',
    name: 'Picnic table',
    icon: '🪑',
    kind: 'furniture',
    price: 3,
    colour: '#c89e70',
  },
  {
    id: 'books',
    name: 'Book corner',
    icon: '📚',
    kind: 'furniture',
    price: 4,
    colour: '#719caf',
  },
  {
    id: 'lamp',
    name: 'Sunshine lamp',
    icon: '💡',
    kind: 'furniture',
    price: 3,
    colour: '#eab747',
  },
  {
    id: 'rug',
    name: 'Rainbow rug',
    icon: '🌈',
    kind: 'furniture',
    price: 3,
    colour: '#c28ed3',
  },
  {
    id: 'birdbath',
    name: 'Bird bath',
    icon: '🐦',
    kind: 'garden',
    price: 4,
    colour: '#92bac8',
  },
  {
    id: 'swing',
    name: 'Garden swing',
    icon: '🌳',
    kind: 'garden',
    price: 6,
    colour: '#b99169',
  },
  {
    id: 'mushroom',
    name: 'Toadstool seat',
    icon: '🍄',
    kind: 'garden',
    price: 3,
    colour: '#df7f80',
  },
  {
    id: 'lantern',
    name: 'Garden lantern',
    icon: '🏮',
    kind: 'garden',
    price: 2,
    colour: '#e8ac61',
  },
] as const;
export const freshAdventure = (legacyStars = 0): AdventureProgress => ({
  version: 1,
  earned: 0,
  wallet: legacyStars,
  rounds: { meadow: 0, woods: 0, cove: 0, garden: 0, rocket: 0, moon: 0 },
  inventory: ['table'],
  seeds: {
    tomato: 1,
    pepper: 0,
    daisy: 2,
    sunflower: 0,
    tulip: 0,
    carrot: 0,
    strawberry: 0,
    moonflower: 0,
  },
  plots: Array.from({ length: 6 }, () => null),
  furniture: ['table', null, null, null, null, null],
  region: 'island',
  moonVisits: 0,
  discoveries: [],
  friendshipGifts: [],
  pantry: freshPantry(),
});
const integer = (v: unknown, max = 100000) =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
    ? Math.min(v, max)
    : 0;
export function readAdventure(
  raw: unknown,
  legacyStars: number,
): AdventureProgress {
  const p = freshAdventure(legacyStars);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return p;
  const v = raw as Record<string, unknown>;
  if (v.version !== 1) return p;
  p.earned = integer(v.earned);
  p.wallet = Math.min(integer(v.wallet), legacyStars + p.earned);
  if (v.rounds && typeof v.rounds === 'object')
    for (const key of Object.keys(p.rounds) as QuestId[])
      p.rounds[key] = integer((v.rounds as Record<string, unknown>)[key]);
  p.inventory = [
    ...new Set([
      'table',
      ...(Array.isArray(v.inventory)
        ? v.inventory.filter(
            (id): id is string =>
              typeof id === 'string' &&
              SHOP_ITEMS.some((item) => item.id === id && item.kind !== 'seed'),
          )
        : []),
    ]),
  ];
  p.seeds = {};
  if (v.seeds && typeof v.seeds === 'object')
    for (const item of SHOP_ITEMS.filter((i) => i.kind === 'seed'))
      p.seeds[item.id] = integer(
        (v.seeds as Record<string, unknown>)[item.id],
        99,
      );
  const savedPlots = v.plots;
  if (Array.isArray(savedPlots))
    p.plots = Array.from({ length: 6 }, (_, i) => {
      const plant = savedPlots[i] as Plant;
      return plant &&
        SHOP_ITEMS.some(
          (item) => item.id === plant.seed && item.kind === 'seed',
        )
        ? { seed: plant.seed, water: integer(plant.water, 3) }
        : null;
    });
  if (Array.isArray(v.furniture))
    p.furniture = Array.from({ length: 6 }, (_, i) => {
      const id = (v.furniture as unknown[])[i];
      return typeof id === 'string' && p.inventory.includes(id) ? id : null;
    });
  // A single owned item cannot occupy several spaces in a restored save.
  const used = new Set<string>();
  p.furniture = p.furniture.map((id) => {
    if (!id || used.has(id)) return null;
    used.add(id);
    return id;
  });
  p.region = v.region === 'moon' && p.rounds.rocket >= 3 ? 'moon' : 'island';
  p.moonVisits = integer(v.moonVisits);
  p.pantry = readPantry(v.pantry);
  p.discoveries = [
    ...new Set(
      Array.isArray(v.discoveries)
        ? v.discoveries.filter(
            (id): id is string =>
              typeof id === 'string' &&
              !!discoveryFor(id) &&
              (discoveryFor(id)!.region !== 'moon' || p.rounds.rocket >= 3),
          )
        : [],
    ),
  ];
  p.friendshipGifts = [
    ...new Set(
      Array.isArray(v.friendshipGifts)
        ? v.friendshipGifts.filter(
            (id): id is QuestId =>
              typeof id === 'string' &&
              Object.hasOwn(p.rounds, id) &&
              p.rounds[id as QuestId] >= 3,
          )
        : [],
    ),
  ];
  return p;
}
export const lifetimeStars = (p: ProgressData) =>
  p.completed.length + p.adventure.earned;
export const rocketParts = (p: ProgressData) =>
  Math.min(3, p.adventure.rounds.rocket);
export function buyItem(p: ProgressData, id: string): ProgressData {
  const item = SHOP_ITEMS.find((i) => i.id === id);
  if (
    !item ||
    item.price > p.adventure.wallet ||
    (item.kind !== 'seed' && p.adventure.inventory.includes(id)) ||
    (item.id === 'moonflower' && rocketParts(p) < 3)
  )
    return p;
  const a = { ...p.adventure, wallet: p.adventure.wallet - item.price };
  if (item.kind === 'seed') {
    if ((a.seeds[id] ?? 0) >= 99) return p;
    a.seeds = { ...a.seeds, [id]: (a.seeds[id] ?? 0) + 1 };
  } else a.inventory = [...a.inventory, id];
  return { ...p, adventure: a };
}
export function plantSeed(
  p: ProgressData,
  slot: number,
  seed: string,
): ProgressData {
  if (
    !Number.isInteger(slot) ||
    slot < 0 ||
    slot >= 6 ||
    p.adventure.plots[slot] ||
    !(p.adventure.seeds[seed] > 0)
  )
    return p;
  const plots = [...p.adventure.plots];
  plots[slot] = { seed, water: 0 };
  return {
    ...p,
    adventure: {
      ...p.adventure,
      plots,
      seeds: { ...p.adventure.seeds, [seed]: p.adventure.seeds[seed] - 1 },
    },
  };
}
export function waterPlant(p: ProgressData, slot: number): ProgressData {
  const plant = p.adventure.plots[slot];
  if (!plant || plant.water >= 3) return p;
  const plots = [...p.adventure.plots];
  plots[slot] = { ...plant, water: plant.water + 1 };
  return { ...p, adventure: { ...p.adventure, plots } };
}
export function clearPlot(p: ProgressData, slot: number): ProgressData {
  if (!p.adventure.plots[slot]) return p;
  const plots = [...p.adventure.plots];
  plots[slot] = null;
  return { ...p, adventure: { ...p.adventure, plots } };
}
export function placeFurniture(
  p: ProgressData,
  slot: number,
  id: string | null,
): ProgressData {
  if (
    !Number.isInteger(slot) ||
    slot < 0 ||
    slot >= 6 ||
    (id && !p.adventure.inventory.includes(id))
  )
    return p;
  const furniture = p.adventure.furniture.map((entry) =>
    entry === id ? null : entry,
  );
  furniture[slot] = id;
  return { ...p, adventure: { ...p.adventure, furniture } };
}
export function changeRegion(p: ProgressData, region: Region): ProgressData {
  if (region === 'moon' && rocketParts(p) < 3) return p;
  return {
    ...p,
    adventure: {
      ...p.adventure,
      region,
      moonVisits:
        p.adventure.moonVisits +
        Number(region === 'moon' && p.adventure.region !== 'moon'),
    },
  };
}

export const TOPPINGS = [
  { id: 'tomato', name: 'Tomatoes', icon: '🍅', colour: '#dc5b43' },
  { id: 'mushroom', name: 'Mushrooms', icon: '🍄', colour: '#cba77e' },
  { id: 'pepper', name: 'Peppers', icon: '🫑', colour: '#68a257' },
  { id: 'olive', name: 'Olives', icon: '🫒', colour: '#555c4c' },
  { id: 'sweetcorn', name: 'Sweetcorn', icon: '🌽', colour: '#ffdb50' },
] as const;
export type ToppingId = (typeof TOPPINGS)[number]['id'];
export type RecipeStep = {
  topping: ToppingId;
  left: number;
  right: number;
  operation: '+' | '−';
  quantity: number;
  prompt: string;
};
export type PizzaRecipe = {
  customer: 'woods' | 'garden' | 'cove' | 'rocket';
  name: string;
  intro: string;
  steps: RecipeStep[];
};
export function pizzaRecipe(round: number, max: number): PizzaRecipe {
  const customer = (['woods', 'garden', 'cove', 'rocket'] as const)[round % 4];
  return {
    customer,
    name: ['Woodland pizza', 'Garden pizza', 'Harbour pizza', 'Space pizza'][
      round % 4
    ],
    intro: 'pizza-order-' + customer,
    steps: Array.from({ length: 3 }, (_, i) => {
      const topping = TOPPINGS[(round + i * 2) % TOPPINGS.length].id;
      const quantity = 1 + ((round + i + 1) % max);
      const subtract = (round + i) % 2 === 1;
      const left = subtract
        ? Math.min(max, quantity + 1)
        : Math.floor(quantity / 2);
      const right = subtract ? left - quantity : quantity - left;
      return {
        topping,
        left,
        right,
        operation: subtract ? '−' : '+',
        quantity,
        prompt: 'pizza-' + (subtract ? 'minus-' : 'plus-') + left + '-' + right,
      };
    }),
  };
}
export function pizzaMatches(
  recipe: PizzaRecipe,
  counts: Partial<Record<ToppingId, number>>,
) {
  return TOPPINGS.every(
    (t) =>
      (counts[t.id] ?? 0) ===
      (recipe.steps.find((s) => s.topping === t.id)?.quantity ?? 0),
  );
}
export type Mission = {
  npc: QuestId;
  round: number;
  kind:
    | 'pizza'
    | 'pack'
    | 'add'
    | 'take'
    | 'pattern'
    | 'sound'
    | 'spell'
    | 'space';
  title: string;
  prompt: string;
  voice: string;
  icon: string;
  target: number;
  choices: string[];
  answer: string;
  parts: string[];
  introduce?: string;
  sequence: string[];
  total: number;
  second: number;
  recipe?: PizzaRecipe;
  gardenIngredients?: ProduceId[];
};
const numbers = (n: number) =>
  Array.from({ length: n }, (_, i) => String(i + 1));
export function missionFor(npc: QuestId, p: ProgressData): Mission {
  const round = p.adventure.rounds[npc],
    target = 1 + (round % p.mathsMax);
  const m: Mission = {
    npc,
    round,
    kind: 'pack',
    title: 'Pack the picnic',
    prompt: 'pack-' + target,
    voice: 'bramble',
    icon: '🍎',
    target,
    choices: [],
    answer: String(target),
    parts: [],
    sequence: [],
    total: p.mathsMax,
    second: 0,
  };
  if (npc === 'meadow') {
    m.kind = 'pizza';
    m.title = 'Bramble’s pizza kitchen';
    m.recipe = pizzaRecipe(round, p.mathsMax);
    m.gardenIngredients = (['tomato', 'pepper'] as ProduceId[]).filter(
      (id) =>
        p.adventure.pantry[id] > 0 &&
        m.recipe!.steps.some((s) => s.topping === id),
    );
    m.prompt = m.recipe.intro;
    m.total = p.mathsMax;
  }
  if (npc === 'garden') {
    m.kind = 'add';
    m.title = 'Grow a flower path';
    m.voice = 'tilly';
    m.icon = '🌼';
    m.total = 1 + (round % Math.max(1, p.mathsMax - 1));
    m.second = 1 + (Math.floor(round / 2) % (p.mathsMax - m.total));
    m.target = m.total + m.second;
    m.answer = String(m.target);
    m.prompt = 'add';
  }
  if (npc === 'cove') {
    m.kind = 'take';
    m.title = 'Help the little boats';
    m.voice = 'marina';
    m.icon = '🐟';
    m.total = Math.min(p.mathsMax, 3 + (round % 3));
    m.second = 1 + (round % m.total);
    m.target = m.total - m.second;
    m.answer = String(m.target);
    m.prompt = 'take-' + m.second;
  }
  if (npc === 'rocket') {
    m.voice = 'pip';
    m.title = [
      'Mend the control panel',
      'Fill the rocket fuel',
      'Connect the star battery',
    ][round % 3];
    if (round % 3 === 0) {
      m.kind = 'pattern';
      m.prompt = 'pattern';
      m.choices = ['🔵', '🔺', '🟨'];
      m.sequence =
        round % 2 ? ['🟨', '🔵', '🟨', '🔵'] : ['🔵', '🔺', '🔵', '🔺'];
      m.answer = m.sequence[0];
    } else if (round % 3 === 1) {
      m.icon = '💎';
      m.prompt = 'fuel-' + target;
    } else {
      m.kind = 'add';
      m.icon = '⚡';
      m.prompt = 'battery';
      m.total = 2;
      m.second = Math.min(p.mathsMax - 2, 1 + (round % 3));
      m.target = m.total + m.second;
      m.answer = String(m.target);
    }
  }
  if (npc === 'woods') {
    m.voice = 'olive';
    m.icon = '📖';
    const allowed = SOUNDS.slice(0, p.soundLimit).map((s) => s.grapheme);
    const known = p.knownSounds.filter((g) => allowed.includes(g));
    const next = allowed.find((g) => !known.includes(g));
    const words = decodableWords(known);
    if (words.length && round % 3 === 2) {
      const word = words[Math.floor(round / 3) % words.length];
      m.kind = 'spell';
      m.title = 'Build a word for Olive';
      m.prompt = 'spell-' + word.word;
      m.parts = word.parts;
      m.answer = word.word;
      m.icon = word.picture;
      m.choices = [...new Set([...word.parts, ...known.slice(0, 2)])].sort();
    } else {
      const g = next ?? allowed[round % allowed.length];
      m.kind = 'sound';
      m.title = 'Find the missing sound';
      m.prompt = next ? 'learn-sound' : 'find-sound';
      m.parts = [g];
      m.answer = g;
      m.introduce = next;
      m.choices = soundChoices(g, [...new Set([...known, g])]);
    }
  }
  if (npc === 'moon') {
    m.voice = 'nova';
    m.title = 'Nova’s space discoveries';
    m.kind = 'space';
    const card = spaceCard(round);
    m.kind = card.kind as Mission['kind'];
    m.prompt = card.id;
    m.choices = card.choices;
    m.answer = card.answer;
    m.sequence = card.sequence ?? [];
    m.icon = card.icon ?? '🌙';
    m.target = card.target ?? 0;
    m.total = p.mathsMax;
  }
  if (m.kind === 'add' || m.kind === 'take')
    m.choices = ['0', ...numbers(p.mathsMax)];
  return m;
}
export function finishMission(p: ProgressData, mission: Mission): ProgressData {
  if (
    p.adventure.rounds[mission.npc] !== mission.round ||
    (mission.npc === 'moon' && rocketParts(p) < 3)
  )
    return p;
  const a = p.adventure;
  const pantry = { ...a.pantry };
  const gardenIngredients =
    mission.kind === 'pizza'
      ? [...new Set(mission.gardenIngredients ?? [])].filter(
          (id) =>
            pantry[id] > 0 &&
            mission.recipe?.steps.some((s) => s.topping === id),
        )
      : [];
  for (const id of gardenIngredients) pantry[id] -= 1;
  const reward = 2 + gardenIngredients.length;
  return {
    ...p,
    knownSounds: mission.introduce
      ? [...new Set([...p.knownSounds, mission.introduce])]
      : p.knownSounds,
    adventure: {
      ...a,
      earned: a.earned + reward,
      wallet: a.wallet + reward,
      pantry,
      rounds: { ...a.rounds, [mission.npc]: mission.round + 1 },
    },
  };
}
