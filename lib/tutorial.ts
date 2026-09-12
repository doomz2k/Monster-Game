import type { Action } from './input';
export const TUTORIAL_STEPS = [
  'hello',
  'move',
  'choose',
  'confirm',
  'back',
  'done',
] as const;
export function tutorialAction(step: number, action: Action, selected: number) {
  if (action === 'back') return step === 4 ? 5 : Math.max(0, step - 1);
  if (step === 0 && action === 'confirm') return 1;
  if (step === 2 && action === 'right' && selected !== 1) return 3;
  if (step === 3 && action === 'confirm') return 4;
  if (step === 3 && action === 'left') return 2;
  return step;
}
