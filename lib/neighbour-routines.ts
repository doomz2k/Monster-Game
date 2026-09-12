/** A short, repeatable stroll with pauses. No real-time schedule or progress dependency. */
export function villageStroll(time: number, phase = 0) {
  const t = (Math.max(0, time) + phase) % 36;
  const points = [
    [0, 0],
    [2.2, 0.8],
    [2.4, -1.6],
    [0, 0],
  ];
  const spans = [4, 4, 5],
    starts = [7, 15, 27];
  let x = 0,
    z = 0,
    yaw = 0.3,
    walking = 0;
  for (let i = 0; i < 3; i++) {
    if (t < starts[i]) break;
    const a = points[i],
      b = points[i + 1],
      f = Math.min(1, (t - starts[i]) / spans[i]);
    x = a[0] + (b[0] - a[0]) * f;
    z = a[1] + (b[1] - a[1]) * f;
    const direction = Math.atan2(b[0] - a[0], b[1] - a[1]);
    const turn = Math.atan2(
      Math.sin(direction - yaw),
      Math.cos(direction - yaw),
    );
    yaw += turn * Math.min(1, (t - starts[i]) / 0.55);
    walking = f < 1 ? 0.7 : 0;
  }
  if (t >= 32) yaw += (0.3 - yaw) * Math.min(1, (t - 32) / 4);
  return { x, z, yaw, walking };
}
