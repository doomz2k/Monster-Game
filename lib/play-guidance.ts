import { ZONES, type ZoneId } from './learning';

export function explorationSpeech(near: ZoneId | null, target: ZoneId) {
  const zone = ZONES.find((z) => z.id === (near ?? target))!;
  return near
    ? zone.intro + ' Press the green A button to play.'
    : 'Follow the sparkle to ' +
        zone.name +
        '. Move with the stick. Press the green A button to hop.';
}

/** Wait for a real arrival, and don't repeat when a child circles the glow. */
export class ArrivalGuide {
  private near: ZoneId | null = null;
  private enteredAt = 0;
  private announced = false;
  private lastSpoken = new Map<ZoneId, number>();

  offer(near: ZoneId | null, now: number): ZoneId | null {
    if (near !== this.near) {
      this.near = near;
      this.enteredAt = now;
      this.announced = Boolean(
        near && now - (this.lastSpoken.get(near) ?? -Infinity) < 30000,
      );
    }
    if (!near || this.announced || now - this.enteredAt < 700) return null;
    return near;
  }

  acknowledge(near: ZoneId, now: number) {
    this.lastSpoken.set(near, now);
    if (near === this.near) this.announced = true;
  }
}

export function movePictureSelection(
  selection: number,
  direction: 'left' | 'right' | 'up' | 'down',
  length: number,
) {
  const delta =
    direction === 'up'
      ? -2
      : direction === 'down'
        ? 2
        : direction === 'left'
          ? -1
          : 1;
  return (selection + delta + length) % length;
}

export function pauseSpeech(selection: number, muted: boolean) {
  return (
    [
      'Play again.',
      'Dress up Monster.',
      'Choose a place to visit.',
      muted ? 'Turn the sound on.' : 'Turn the sound off.',
      'Help for grown-ups.',
      'Go to the launch screen.',
    ][selection] + ' Press A to choose.'
  );
}
