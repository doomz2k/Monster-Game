import type { CSSProperties } from 'react';

const sheets = {
  objects: [
    '🍅',
    '🍄',
    '🫑',
    '🫒',
    '🌽',
    '🌼',
    '🐟',
    '⭐',
    '💎',
    '🔋',
    '🔩',
    '🚀',
    '🪨',
    '🛰️',
    '🍎',
    '🧺',
  ],
  words: [
    '🟫',
    '🪑',
    '😔',
    '👨',
    '😠',
    '📌',
    '🍳',
    '🚰',
    '🗺️',
    '🐶',
    '🐱',
    '🥤',
    '🎩',
    '🚢',
    '🙂',
    '🩷',
  ],
  world: [
    '💍',
    '🐰',
    '🦉',
    '🦊',
    '🐸',
    '🐧',
    '🧑‍🚀',
    '🔭',
    '⛵',
    '🚲',
    '🌳',
    '🏡',
    'oven',
    '🍕',
    '🌙',
    '🔥',
  ],
};
const aliases: Record<string, string> = {
  '🐠': '🐟',
  '⚡': '🔋',
  '🏠': '🏡',
  '🌕': '🌙',
  '☄️': '🪨',
};
/** Original sprite art with a padded, clipped cell; no OS-dependent learning pictures. */
export function GamePicture({
  symbol,
  label,
  className = '',
}: {
  symbol: string;
  label?: string;
  className?: string;
}) {
  const key = aliases[symbol] ?? symbol;
  const sheet = Object.entries(sheets).find(([, icons]) => icons.includes(key));
  const index = sheet?.[1].indexOf(key) ?? 0;
  const shape = { '🔵': 'circle', '🔺': 'triangle', '🟨': 'square' }[symbol];
  return (
    <span
      className={'game-picture ' + className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={!label || undefined}
    >
      {sheet ? (
        <span
          className="picture-cell"
          style={
            {
              backgroundImage: `url(/images/learning/${sheet[0]}.png)`,
              backgroundPosition: `${((index % 4) * 100) / 3}% ${(Math.floor(index / 4) * 100) / 3}%`,
            } as CSSProperties
          }
        />
      ) : shape ? (
        <span className={'learning-shape ' + shape} />
      ) : (
        <span>{symbol}</span>
      )}
    </span>
  );
}
