// Published Set 1 order: Oxford Owl's Read Write Inc. parent guide (accessed 2026-09-09).
// This is a practice companion, not an accredited Read Write Inc. programme.
export const PHONICS_SOURCE =
  'https://home.oxfordowl.co.uk/reading/reading-schemes-oxford-levels/read-write-inc-phonics-guide/';
export const PRONUNCIATION_SOURCE =
  'https://www.ruthmiskin.com/parentsandcarers/';
export type Sound = {
  grapheme: string;
  ipa: string;
  example: string;
  tip: string;
  kind: 'stretch' | 'bounce' | 'vowel' | 'sequence';
};
export const SOUNDS: Sound[] = [
  {
    grapheme: 'm',
    ipa: 'm',
    example: 'mat',
    kind: 'stretch',
    tip: 'Lips together. Hum mmm. No vowel after it.',
  },
  {
    grapheme: 'a',
    ipa: 'æ',
    example: 'apple',
    kind: 'vowel',
    tip: 'Short a as in apple, not the letter name or ah.',
  },
  {
    grapheme: 's',
    ipa: 's',
    example: 'sun',
    kind: 'stretch',
    tip: 'A long, quiet hiss. No suh or ess.',
  },
  {
    grapheme: 'd',
    ipa: 'd',
    example: 'dog',
    kind: 'bounce',
    tip: 'A short release with the tongue just behind the teeth. No duh.',
  },
  {
    grapheme: 't',
    ipa: 't',
    example: 'tap',
    kind: 'bounce',
    tip: 'A light, quick tongue release. No tuh or tee.',
  },
  {
    grapheme: 'i',
    ipa: 'ɪ',
    example: 'insect',
    kind: 'vowel',
    tip: 'Short i as in insect or sit, not eye or ee.',
  },
  {
    grapheme: 'n',
    ipa: 'n',
    example: 'net',
    kind: 'stretch',
    tip: 'Tongue behind the top teeth, hum nnn. No nuh.',
  },
  {
    grapheme: 'p',
    ipa: 'p',
    example: 'pig',
    kind: 'bounce',
    tip: 'A small puff as the lips open. Stop before an uh sound.',
  },
  {
    grapheme: 'g',
    ipa: 'ɡ',
    example: 'goat',
    kind: 'bounce',
    tip: 'Hard g as in goat. A quick sound, without guh.',
  },
  {
    grapheme: 'o',
    ipa: 'ɒ',
    example: 'orange',
    kind: 'vowel',
    tip: 'Short British o as in orange or pot, not oh.',
  },
  {
    grapheme: 'c',
    ipa: 'k',
    example: 'cat',
    kind: 'bounce',
    tip: 'Hard c as in cat. A quick release, without kuh.',
  },
  {
    grapheme: 'k',
    ipa: 'k',
    example: 'kit',
    kind: 'bounce',
    tip: 'The same sound as c in cat. No kuh.',
  },
  {
    grapheme: 'u',
    ipa: 'ʌ',
    example: 'up',
    kind: 'vowel',
    tip: 'Short u as in up or cup, not yoo.',
  },
  {
    grapheme: 'b',
    ipa: 'b',
    example: 'bat',
    kind: 'bounce',
    tip: 'A quick voiced lip release. No buh or bee.',
  },
  {
    grapheme: 'f',
    ipa: 'f',
    example: 'fish',
    kind: 'stretch',
    tip: 'Top teeth touch the lower lip. Let air flow: fff.',
  },
  {
    grapheme: 'e',
    ipa: 'e',
    example: 'egg',
    kind: 'vowel',
    tip: 'Short e as in egg or bed, not ee.',
  },
  {
    grapheme: 'l',
    ipa: 'l',
    example: 'leg',
    kind: 'stretch',
    tip: 'Tongue behind the top teeth. Sustain the sound without luh.',
  },
  {
    grapheme: 'h',
    ipa: 'h',
    example: 'hat',
    kind: 'bounce',
    tip: 'A quiet breath, as at the start of hat. No huh.',
  },
  {
    grapheme: 'r',
    ipa: 'r',
    example: 'rat',
    kind: 'stretch',
    tip: 'Use the initial British r in rat, without ruh or a rolled r.',
  },
  {
    grapheme: 'j',
    ipa: 'dʒ',
    example: 'jam',
    kind: 'bounce',
    tip: 'A short j as at the start of jam. No added uh.',
  },
  {
    grapheme: 'v',
    ipa: 'v',
    example: 'van',
    kind: 'stretch',
    tip: 'Top teeth on the lower lip. Let the voice buzz: vvv.',
  },
  {
    grapheme: 'y',
    ipa: 'j',
    example: 'yes',
    kind: 'bounce',
    tip: 'The beginning of yes, not why or eye.',
  },
  {
    grapheme: 'w',
    ipa: 'w',
    example: 'wet',
    kind: 'bounce',
    tip: 'Round the lips, then release. No wuh or double-you.',
  },
  {
    grapheme: 'z',
    ipa: 'z',
    example: 'zip',
    kind: 'stretch',
    tip: 'A voiced buzzing sound. No zuh or zed.',
  },
  {
    grapheme: 'x',
    ipa: 'ks',
    example: 'box',
    kind: 'sequence',
    tip: 'Two sounds together: k then s, as at the end of box. Not ex.',
  },
  {
    grapheme: 'sh',
    ipa: 'ʃ',
    example: 'ship',
    kind: 'stretch',
    tip: 'A quiet, sustained sh. These two letters represent one sound.',
  },
  {
    grapheme: 'th',
    ipa: 'θ',
    example: 'thin',
    kind: 'stretch',
    tip: 'Unvoiced th in thin. Tongue gently between teeth. This activity uses θ, not voiced ð in this.',
  },
  {
    grapheme: 'ch',
    ipa: 'tʃ',
    example: 'chip',
    kind: 'bounce',
    tip: 'A short ch as in chip. These two letters represent one sound.',
  },
  {
    grapheme: 'qu',
    ipa: 'kw',
    example: 'quit',
    kind: 'sequence',
    tip: 'The sequence k then w, as in quit. Not cue.',
  },
  {
    grapheme: 'ng',
    ipa: 'ŋ',
    example: 'ring',
    kind: 'stretch',
    tip: 'The final nasal sound in ring. No preceding i and no added g.',
  },
  {
    grapheme: 'nk',
    ipa: 'ŋk',
    example: 'pink',
    kind: 'sequence',
    tip: 'The final two sounds in pink: ng then k. No preceding i.',
  },
  {
    grapheme: 'ck',
    ipa: 'k',
    example: 'sock',
    kind: 'bounce',
    tip: 'The same single sound as c and k. No kuh.',
  },
];
export const SOUND_GROUPS = [5, 8, 12, 16, 19, 25, 32];
export const soundFor = (g: string) => SOUNDS.find((s) => s.grapheme === g);
export const BLENDING_WORDS = [
  { word: 'mat', parts: ['m', 'a', 't'], picture: '🟫' },
  { word: 'sat', parts: ['s', 'a', 't'], picture: '🪑' },
  { word: 'sad', parts: ['s', 'a', 'd'], picture: '😔' },
  { word: 'dad', parts: ['d', 'a', 'd'], picture: '👨' },
  { word: 'mad', parts: ['m', 'a', 'd'], picture: '😠' },
  { word: 'sit', parts: ['s', 'i', 't'], picture: '🪑' },
  { word: 'pin', parts: ['p', 'i', 'n'], picture: '📌' },
  { word: 'pan', parts: ['p', 'a', 'n'], picture: '🍳' },
  { word: 'tap', parts: ['t', 'a', 'p'], picture: '🚰' },
  { word: 'map', parts: ['m', 'a', 'p'], picture: '🗺️' },
  { word: 'dog', parts: ['d', 'o', 'g'], picture: '🐶' },
  { word: 'cat', parts: ['c', 'a', 't'], picture: '🐱' },
  { word: 'cup', parts: ['c', 'u', 'p'], picture: '🥤' },
  { word: 'hat', parts: ['h', 'a', 't'], picture: '🎩' },
  { word: 'ship', parts: ['sh', 'i', 'p'], picture: '🚢' },
  { word: 'chin', parts: ['ch', 'i', 'n'], picture: '🙂' },
  { word: 'ring', parts: ['r', 'i', 'ng'], picture: '💍' },
  { word: 'pink', parts: ['p', 'i', 'nk'], picture: '🩷' },
];
export function decodableWords(learned: string[]) {
  return BLENDING_WORDS.filter((w) =>
    w.parts.every((g) => learned.includes(g)),
  );
}
export function soundChoices(target: string, learned: string[]) {
  const value = soundFor(target)!;
  const others = learned.filter(
    (g) => g !== target && soundFor(g)?.ipa !== value.ipa,
  );
  const selected = [target, ...others.slice(-2)];
  const offset =
    SOUNDS.findIndex((s) => s.grapheme === target) % selected.length;
  return [...selected.slice(offset), ...selected.slice(0, offset)];
}
