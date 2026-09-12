// Follow visible choice positions so the pad matches each screen's layout.
export function moveMenuFocus(
  surface: HTMLElement,
  direction: 'left' | 'right' | 'up' | 'down',
) {
  const choices = Array.from(
    surface.querySelectorAll<HTMLButtonElement>('[data-game-choice]'),
  ).filter((el) => !el.disabled && el.getClientRects().length > 0);
  if (!choices.length) return;
  const current = document.activeElement as HTMLElement;
  if (!choices.includes(current as HTMLButtonElement)) {
    choices[0].focus();
    return;
  }
  const origin = current.getBoundingClientRect(),
    ox = origin.x + origin.width / 2,
    oy = origin.y + origin.height / 2;
  const horizontal = direction === 'left' || direction === 'right',
    sign = direction === 'left' || direction === 'up' ? -1 : 1;
  const candidates = choices
    .filter((el) => el !== current)
    .map((el) => {
      const r = el.getBoundingClientRect(),
        dx = r.x + r.width / 2 - ox,
        dy = r.y + r.height / 2 - oy;
      const forward = (horizontal ? dx : dy) * sign,
        sideways = Math.abs(horizontal ? dy : dx);
      return { el, forward, score: forward + sideways * 2.5 };
    })
    .filter((c) => c.forward > 4)
    .sort((a, b) => a.score - b.score);
  if (candidates[0]) {
    candidates[0].el.focus();
    candidates[0].el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}
