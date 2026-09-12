import { SOUNDS, decodableWords, soundChoices } from './phonics';
import { readOutfit, starterOutfit, type Outfit } from './wardrobe';
import {
  defaultAppearance,
  readAppearance,
  type Appearance,
} from './appearance';
export const ZONES = [
  {
    id: 'meadow',
    name: 'Counting Meadow',
    short: 'Count & shapes',
    x: 0,
    z: -14,
    colour: '#4b9155',
    symbol: '123',
    icon: '🌼',
    intro: 'Let’s count together!',
    skill: 'Counting & shapes',
  },
  {
    id: 'woods',
    name: 'Whispering Woods',
    short: 'Sounds & words',
    x: -20,
    z: 0,
    colour: '#8b68bc',
    symbol: 'abc',
    icon: '🚀',
    intro: 'Sounds for our space friends.',
    skill: 'Set 1 sounds & blending',
  },
  {
    id: 'cove',
    name: 'Bubble Bay',
    short: 'Sea numbers',
    x: 21,
    z: 0,
    colour: '#dc9443',
    symbol: '1 2 3',
    icon: '🐠',
    intro: 'Find treasures by the sea.',
    skill: 'More, fewer & taking away',
  },
  {
    id: 'garden',
    name: 'Together Garden',
    short: 'Grow & add',
    x: 0,
    z: 22,
    colour: '#dc7195',
    symbol: '1+1',
    icon: '🌷',
    intro: 'Help our garden grow.',
    skill: 'Dice & adding up to 5',
  },
] as const;
export type ZoneId = (typeof ZONES)[number]['id'];
export type Question = {
  id: string;
  title: string;
  speech: string;
  kind: 'count' | 'sound' | 'shape' | 'add' | 'subtract' | 'compare' | 'blend';
  options: string[];
  answer: string;
  items?: string;
  amount?: number;
  second?: number;
  word?: string;
  picture?: string;
  parts?: string[];
  introduce?: string;
  encouragement: string;
};
export type ProgressData = {
  version: 1;
  completed: string[];
  rounds: Record<ZoneId, number>;
  knownSounds: string[];
  soundLimit: number;
  mathsMax: 5 | 10;
  outfit: Outfit;
  appearance: Appearance;
};
export const freshProgress = (): ProgressData => ({
  version: 1,
  completed: [],
  rounds: { meadow: 0, woods: 0, cove: 0, garden: 0 },
  knownSounds: [],
  soundLimit: 5,
  mathsMax: 5,
  outfit: starterOutfit(),
  appearance: defaultAppearance(),
});
export function readProgress(raw: string | null): ProgressData {
  try {
    const p = JSON.parse(raw ?? 'null');
    if (p?.version !== 1) return freshProgress();
    const clean = freshProgress();
    clean.completed = Array.isArray(p.completed)
      ? [
          ...new Set<string>(
            p.completed
              .filter((v: unknown) => typeof v === 'string')
              .slice(0, 10000),
          ),
        ]
      : [];
    for (const z of ZONES) {
      const v = p.rounds?.[z.id];
      clean.rounds[z.id] =
        Number.isSafeInteger(v) && v >= 0 ? Math.min(v, 10000) : 0;
    }
    clean.knownSounds = Array.isArray(p.knownSounds)
      ? [
          ...new Set<string>(
            p.knownSounds.filter((v: string) =>
              SOUNDS.some((s) => s.grapheme === v),
            ),
          ),
        ]
      : [];
    clean.soundLimit = [5, 8, 12, 16, 19, 25, 32].includes(p.soundLimit)
      ? p.soundLimit
      : 5;
    clean.mathsMax = p.mathsMax === 10 ? 10 : 5;
    clean.outfit = readOutfit(p.outfit, clean.completed.length);
    clean.appearance = readAppearance(p.appearance);
    return clean;
  } catch {
    return freshProgress();
  }
}
function choices(n: number, max: number, offset: number) {
  const values = [n];
  for (let d = 1; values.length < 3; d++) {
    if (n - d >= 0) values.push(n - d);
    if (values.length < 3 && n + d <= max) values.push(n + d);
  }
  const k = offset % values.length;
  return [...values.slice(k), ...values.slice(0, k)].map(String);
}
export function questionFor(zone: ZoneId, p: ProgressData): Question {
  const r = p.rounds[zone],
    max = p.mathsMax;
  if (zone === 'woods') {
    const allowed = SOUNDS.slice(0, p.soundLimit).map((s) => s.grapheme),
      newSound = allowed.find((g) => !p.knownSounds.includes(g));
    const words = decodableWords(
      p.knownSounds.filter((g) => allowed.includes(g)),
    );
    if (!newSound && words.length >= 3 && r % 3 === 2) {
      const target = words[Math.floor(r / 3) % words.length];
      const others = words
        .filter((w) => w.word !== target.word)
        .slice(0, 2)
        .map((w) => w.word);
      const options = [target.word, ...others];
      const k = r % 3;
      return {
        id: 'woods-blend-' + target.word,
        kind: 'blend',
        title: 'Blend the sounds',
        speech:
          'Listen to the sounds. Put them together. Which word do they make?',
        parts: target.parts,
        word: target.word,
        options: [...options.slice(k), ...options.slice(0, k)],
        answer: target.word,
        encouragement:
          'You blended the sounds! The word is ' + target.word + '.',
      };
    }
    const g = newSound ?? allowed[r % allowed.length],
      s = SOUNDS.find((s) => s.grapheme === g)!;
    const known = [
      ...new Set([...p.knownSounds.filter((x) => allowed.includes(x)), g]),
    ];
    return {
      id: 'woods-sound-' + g,
      kind: 'sound',
      title: 'Find the sound',
      speech: 'Listen carefully. Can you find the matching letters?',
      introduce: newSound,
      parts: [g],
      word: s.example,
      options: soundChoices(g, known),
      answer: g,
      encouragement:
        'You found the matching sound! Our space friends say thank you.',
    };
  }
  if (zone === 'meadow') {
    if (r % 4 === 3) {
      const shapes = ['circle', 'triangle', 'square'],
        answer = shapes[Math.floor(r / 4) % 3];
      return {
        id: 'meadow-shape-' + answer,
        kind: 'shape',
        title: 'Find the ' + answer,
        speech: 'Can you find the ' + answer + '?',
        options: shapes,
        answer,
        encouragement: 'You found the ' + answer + '! Lovely shape spotting.',
      };
    }
    const amount = 1 + (r < 3 ? r : r % max),
      items = ['🌼', '🦋', '🐞'][r % 3],
      name = ['flowers', 'butterflies', 'ladybirds'][r % 3];
    return {
      id: 'meadow-count-' + amount + '-' + (r % 3),
      kind: 'count',
      title: 'How many ' + name + '?',
      speech: 'Count the ' + name + '. How many can you see?',
      items,
      amount,
      options: choices(amount, max, r),
      answer: String(amount),
      encouragement: 'Yes! ' + amount + ' ' + name + '. Lovely counting!',
    };
  }
  if (zone === 'cove') {
    if (r % 3 === 1) {
      const small = 1 + (r % (max - 1)),
        swapped = Math.floor(r / 6) % 2 === 1,
        amount = swapped ? small + 1 : small,
        second = swapped ? small : small + 1,
        most = Math.floor(r / 3) % 2 === 0;
      return {
        id: 'cove-compare-' + (r % 12),
        kind: 'compare',
        title: most ? 'Which has more?' : 'Which has fewer?',
        speech: most
          ? 'Which group has more fish?'
          : 'Which group has fewer fish?',
        items: '🐠',
        amount,
        second,
        options: ['left', 'right'],
        answer: most === swapped ? 'left' : 'right',
        encouragement:
          'You found the group with ' + (most ? 'more' : 'fewer') + ' fish!',
      };
    }
    if (r % 3 === 2) {
      const amount = Math.min(max, 3 + (Math.floor(r / 3) % (max - 2))),
        second = 1 + (Math.floor(r / 3) % amount),
        answer = amount - second;
      return {
        id: 'cove-take-' + amount + '-' + second,
        kind: 'subtract',
        title: 'How many are left?',
        speech:
          amount +
          ' shells. ' +
          second +
          ' go in the treasure chest. How many shells are left?',
        items: '🐚',
        amount,
        second,
        options: choices(answer, max, r),
        answer: String(answer),
        encouragement:
          'Yes! ' + amount + ' take away ' + second + ' leaves ' + answer + '.',
      };
    }
    const amount = 1 + (Math.floor(r / 3) % max);
    return {
      id: 'cove-count-' + amount,
      kind: 'count',
      title: 'How many fish?',
      speech: 'Count the fish in our rock pool.',
      items: '🐠',
      amount,
      options: choices(amount, max, r),
      answer: String(amount),
      encouragement: amount + ' fish! Thank you for helping our sea friends.',
    };
  }
  const sides = Math.min(6, max - 1),
    amount = 1 + (r % sides),
    second = 1 + (Math.floor(r / sides) % Math.min(6, max - amount)),
    answer = amount + second;
  return {
    id: 'garden-add-' + amount + '-' + second,
    kind: 'add',
    title: 'How many altogether?',
    speech:
      amount +
      ' dots on one die, and ' +
      second +
      ' on the other. How many dots altogether?',
    items: '●',
    amount,
    second,
    options: choices(answer, max, r),
    answer: String(answer),
    encouragement:
      amount +
      ' and ' +
      second +
      ' make ' +
      answer +
      '. You helped a flower grow!',
  };
}
export function award(
  p: ProgressData,
  zone: ZoneId,
  q: Question,
): ProgressData {
  return {
    ...p,
    completed: p.completed.includes(q.id)
      ? p.completed
      : [...p.completed, q.id],
    rounds: { ...p.rounds, [zone]: p.rounds[zone] + 1 },
  };
}
export function nearestZone(x: number, z: number) {
  return [...ZONES].sort(
    (a, b) => Math.hypot(x - a.x, z - a.z) - Math.hypot(x - b.x, z - b.z),
  )[0];
}
export function clampToIsland(x: number, z: number) {
  const r = Math.hypot(x, z);
  return r > 38 ? { x: (x * 38) / r, z: (z * 38) / r } : { x, z };
}
export function deadzone(v: number, threshold = 0.18) {
  return Math.abs(v) < threshold
    ? 0
    : (Math.sign(v) * (Math.abs(v) - threshold)) / (1 - threshold);
}
