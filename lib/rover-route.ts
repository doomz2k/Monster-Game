type Point = { x: number; z: number };
type Obstacle = Point & { r: number };
export function clearRoverSegment(
  a: Point,
  b: Point,
  obstacles: readonly Obstacle[],
) {
  const dx = b.x - a.x,
    dz = b.z - a.z,
    length = dx * dx + dz * dz;
  return obstacles.every((o) => {
    const f = length
      ? Math.max(0, Math.min(1, ((o.x - a.x) * dx + (o.z - a.z) * dz) / length))
      : 0;
    return (
      Math.hypot(a.x + dx * f - o.x, a.z + dz * f - o.z) >= o.r + 1.7 - 0.0001
    );
  });
}
/** Small visibility graph around Moon buildings, calculated only when A starts a ride. */
export function roverRoute(
  from: Point,
  to: Point,
  obstacles: readonly Obstacle[],
): Point[] {
  if (![from.x, from.z, to.x, to.z].every(Number.isFinite)) return [];
  const nodes: Point[] = [from, to];
  for (const o of obstacles)
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8,
        r = o.r + 2.7;
      const p = { x: o.x + Math.cos(a) * r, z: o.z + Math.sin(a) * r };
      if (Math.hypot(p.x, p.z) <= 79 && clearRoverSegment(p, p, obstacles))
        nodes.push(p);
    }
  const distance = nodes.map(() => Infinity),
    previous = nodes.map(() => -1),
    visited = new Set<number>();
  distance[0] = 0;
  for (let count = 0; count < nodes.length; count++) {
    let current = -1;
    nodes.forEach((_, i) => {
      if (!visited.has(i) && (current < 0 || distance[i] < distance[current]))
        current = i;
    });
    if (current < 0 || !Number.isFinite(distance[current])) break;
    if (current === 1) {
      const result: Point[] = [];
      let index = 1;
      while (index > 0) {
        result.unshift(nodes[index]);
        index = previous[index];
      }
      return result;
    }
    visited.add(current);
    nodes.forEach((node, i) => {
      if (visited.has(i) || !clearRoverSegment(nodes[current], node, obstacles))
        return;
      const cost =
        distance[current] +
        Math.hypot(node.x - nodes[current].x, node.z - nodes[current].z);
      if (cost < distance[i]) {
        distance[i] = cost;
        previous[i] = current;
      }
    });
  }
  return [];
}
