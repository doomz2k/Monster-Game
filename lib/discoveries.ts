import type { ProgressData } from './learning';
import { discoveryFor } from './discovery-catalogue';

export function collectDiscovery(
  p: ProgressData,
  id: string,
  x: number,
  z: number,
): ProgressData {
  const d = discoveryFor(id);
  if (
    !d ||
    d.region !== p.adventure.region ||
    p.adventure.discoveries.includes(id) ||
    !Number.isFinite(x) ||
    !Number.isFinite(z) ||
    Math.hypot(d.x - x, d.z - z) > 3.2
  )
    return p;
  return {
    ...p,
    adventure: {
      ...p.adventure,
      discoveries: [...p.adventure.discoveries, id],
      earned: p.adventure.earned + 1,
      wallet: p.adventure.wallet + 1,
    },
  };
}
