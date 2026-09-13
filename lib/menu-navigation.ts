export type ChoiceRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export type MenuDirection = 'left' | 'right' | 'up' | 'down';
/** Prefer the same row/column before diagonal shortcuts between differently sized controls. */
export function nextMenuChoice(
  rectangles: ChoiceRect[],
  current: number,
  direction: MenuDirection,
): number {
  const origin = rectangles[current];
  if (!origin) return rectangles.length ? 0 : -1;
  const ox = origin.x + origin.width / 2,
    oy = origin.y + origin.height / 2;
  const horizontal = direction === 'left' || direction === 'right',
    sign = direction === 'left' || direction === 'up' ? -1 : 1;
  const candidates = rectangles
    .map((r, index) => {
      const dx = r.x + r.width / 2 - ox,
        dy = r.y + r.height / 2 - oy,
        forward = (horizontal ? dx : dy) * sign,
        sideways = Math.abs(horizontal ? dy : dx);
      const overlap = horizontal
        ? Math.min(origin.y + origin.height, r.y + r.height) -
          Math.max(origin.y, r.y)
        : Math.min(origin.x + origin.width, r.x + r.width) -
          Math.max(origin.x, r.x);
      return {
        index,
        forward,
        aligned: overlap > 0,
        score: forward + sideways * 2.5,
      };
    })
    .filter((c) => c.index !== current && c.forward > 4)
    .sort((a, b) => Number(b.aligned) - Number(a.aligned) || a.score - b.score);
  return candidates[0]?.index ?? current;
}
// Follow visible choice positions so the pad matches each screen's layout.
export function moveMenuFocus(surface: HTMLElement, direction: MenuDirection) {
  const choices = Array.from(
    surface.querySelectorAll<HTMLButtonElement>('[data-game-choice]'),
  ).filter((el) => !el.disabled && el.getClientRects().length > 0);
  if (!choices.length) return;
  const current = document.activeElement as HTMLButtonElement,
    index = choices.indexOf(current);
  const next = nextMenuChoice(
    choices.map((el) => el.getBoundingClientRect()),
    index,
    direction,
  );
  if (next < 0 || next === index) return;
  choices[next].focus();
  choices[next].scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
