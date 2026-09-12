export type CameraObstacle = { x: number; z: number; r: number };
function blockage(
  x: number,
  z: number,
  yaw: number,
  obstacles: CameraObstacle[],
) {
  const vx = Math.sin(yaw),
    vz = Math.cos(yaw);
  let score = 0;
  for (const o of obstacles) {
    const dx = o.x - x,
      dz = o.z - z,
      along = dx * vx + dz * vz;
    if (along < 1.5 || along > 14) continue;
    const across = Math.abs(dx * vz - dz * vx),
      radius = o.r + 1;
    if (across < radius) score += (1 - across / radius) * (1 - along / 20);
  }
  return score;
}
/** Small turns only; movement direction is latched while the pad stays held. */
export function chooseCameraYaw(
  x: number,
  z: number,
  current: number,
  obstacles: CameraObstacle[],
) {
  const candidates = [0, -0.55, 0.55, -0.9, 0.9, current];
  const score = (yaw: number) =>
    blockage(x, z, yaw, obstacles) +
    Math.abs(yaw) * 0.15 +
    Math.abs(yaw - current) * 0.08;
  const best = candidates.reduce(
    (a, b) => (score(a) < score(b) ? a : b),
    current,
  );
  return score(current) - score(best) > 0.12 ? best : current;
}
export function cameraObstructed(
  x: number,
  z: number,
  yaw: number,
  obstacles: CameraObstacle[],
) {
  return blockage(x, z, yaw, obstacles) > 0.2;
}
