export function quantityHint(chosen: number, target: number) {
  return {
    direction: chosen < target ? 'more' : chosen > target ? 'fewer' : 'correct',
    difference: Math.abs(target - chosen),
    slots: Array.from({ length: Math.max(chosen, target) }, (_, i) =>
      i >= target ? 'extra' : i >= chosen ? 'missing' : 'matched',
    ),
  } as const;
}
export function firstMismatch(chosen: string[], target: string[]) {
  return target.findIndex((sound, i) => sound !== chosen[i]);
}
