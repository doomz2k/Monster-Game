import { PLACES, type Region } from './adventure';
export type AttentionKind = 'wave' | 'sniff' | 'watch';
export type AttentionTarget = {
  id: string;
  kind: AttentionKind;
  x: number;
  z: number;
};
export type AttentionPose = {
  kind: AttentionKind;
  age: number;
  weight: number;
  lookX: number;
  lookY: number;
};
export type AttentionMoment = AttentionPose & { target: AttentionTarget };
const durations = { wave: 3.4, sniff: 4, watch: 4.6 };
export function nearbyAttention(
  x: number,
  z: number,
  region: Region,
  flowers: readonly { id: string; x: number; z: number }[],
  butterflies: readonly { id: string; x: number; z: number }[],
): AttentionTarget | null {
  if (![x, z].every(Number.isFinite)) return null;
  const distance = (p: { x: number; z: number }) =>
    Math.hypot(p.x - x, p.z - z);
  const friends = PLACES.filter(
    (p) => p.id !== 'home' && (p.id === 'moon') === (region === 'moon'),
  ).sort((a, b) => distance(a) - distance(b));
  if (friends[0] && distance(friends[0]) < 6.5)
    return {
      id: 'friend-' + friends[0].id,
      kind: 'wave',
      x: friends[0].x,
      z: friends[0].z,
    };
  if (region === 'moon') return null;
  const flower = [...flowers]
    .filter((p) => distance(p) < 3.1)
    .sort((a, b) => distance(a) - distance(b))[0];
  if (flower) return { ...flower, kind: 'sniff' };
  const butterfly = [...butterflies]
    .filter((p) => distance(p) < 4.5)
    .sort((a, b) => distance(a) - distance(b))[0];
  return butterfly ? { ...butterfly, kind: 'watch' } : null;
}
/** Context reactions use active idle time, with bounded per-target cooldowns. */
export class MonsterAttention {
  private idle = 0;
  private candidate = '';
  private gesture: { target: AttentionTarget; age: number } | null = null;
  private cooldown = new Map<string, number>();
  update(
    dt: number,
    input: {
      active: boolean;
      moving: boolean;
      blocked: boolean;
      reduced: boolean;
      target: AttentionTarget | null;
      x: number;
      z: number;
      facing: number;
    },
  ): AttentionMoment | null {
    const delta = Number.isFinite(dt) ? Math.max(0, Math.min(0.1, dt)) : 0;
    if (!input.active) return null;
    for (const [id, time] of this.cooldown) {
      if (time <= delta) this.cooldown.delete(id);
      else this.cooldown.set(id, time - delta);
    }
    const target = input.target;
    if (
      input.moving ||
      input.blocked ||
      input.reduced ||
      !target ||
      ![target.x, target.z, input.x, input.z, input.facing].every(
        Number.isFinite,
      )
    ) {
      this.idle = 0;
      this.gesture = null;
      this.candidate = '';
      return null;
    }
    if (target.id !== this.candidate) {
      this.candidate = target.id;
      this.idle = 0;
      this.gesture = null;
    }
    this.idle += delta;
    if (!this.gesture && this.idle >= 0.9 && !this.cooldown.has(target.id)) {
      this.gesture = { target, age: 0 };
      this.cooldown.set(target.id, target.kind === 'wave' ? 24 : 18);
      if (this.cooldown.size > 32)
        this.cooldown.delete(this.cooldown.keys().next().value!);
    }
    if (!this.gesture) return null;
    this.gesture.age += delta;
    this.gesture.target = target;
    const age = this.gesture.age,
      duration = durations[target.kind];
    if (age >= duration) {
      this.gesture = null;
      return null;
    }
    const angle =
      Math.atan2(target.x - input.x, target.z - input.z) - input.facing;
    return {
      target,
      kind: target.kind,
      age,
      weight: Math.sin((age / duration) * Math.PI) ** 2,
      lookX: Math.sin(angle),
      lookY:
        target.kind === 'sniff' ? -0.75 : target.kind === 'watch' ? 0.65 : 0,
    };
  }
}
