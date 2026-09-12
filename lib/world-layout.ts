export const WORLD_SCALE = 1.6;
export const PLAY_RADIUS = 80;
export const SHORE_RADIUS = 84;
export const LANDMARKS = [
  [-43, -43],
  [-44, 23],
  [58, 17],
  [28, 48],
] as const;
export function groundHeight(x: number, z: number) {
  x /= WORLD_SCALE;
  z /= WORLD_SCALE;
  return (
    0.32 +
    Math.sin(x * 0.105) * 0.5 +
    Math.cos(z * 0.12) * 0.45 +
    Math.sin((x + z) * 0.09) * 0.3
  );
}
export function clampToPlayArea(x: number, z: number) {
  const distance = Math.hypot(x, z);
  return distance > PLAY_RADIUS
    ? { x: (x * PLAY_RADIUS) / distance, z: (z * PLAY_RADIUS) / distance }
    : { x, z };
}
