import * as THREE from 'three';
import type { DanceMove } from './home-visits';

type DancingRig = { root: THREE.Group; arms: THREE.Group[] };
const restingArms = new WeakMap<THREE.Group, THREE.Vector3>();
/** Apply after the rig's idle pose; each call sets its whole gesture without accumulating rotation. */
export function dancePose(
  rig: DancingRig,
  move: DanceMove | null,
  age: number,
  reduced: boolean,
) {
  rig.arms.forEach((arm) => {
    if (!restingArms.has(arm)) restingArms.set(arm, arm.position.clone());
    arm.position.copy(restingArms.get(arm)!);
  });
  if (!move) return;
  const t = Number.isFinite(age) ? Math.max(0, age) : 0;
  const phase = reduced ? 0.5 : (t % 1.8) / 1.8;
  const wave = Math.sin(phase * Math.PI),
    sign = -1;
  rig.root.rotation.set(0, 0, 0);
  rig.root.position.y = 0;
  rig.arms.forEach((arm, i) =>
    arm.rotation.set(0, 0, sign * (i ? -1 : 1) * 0.2),
  );
  if (move === 'clap') {
    rig.arms.forEach((arm, i) => {
      const rest = restingArms.get(arm)!;
      // Soft cartoon shoulders bring the short hands in front of the tummy.
      arm.position.x = rest.x * (1 - wave * 0.2);
      arm.position.z = rest.z + Math.abs(rest.x) * 0.66;
      arm.rotation.set(-0.45, 0, (i ? -1 : 1) * (0.5 + wave * 0.95));
    });
  } else if (move === 'stretch') {
    rig.arms.forEach((arm, i) =>
      arm.rotation.set(-0.16, 0, sign * (i ? -1 : 1) * (1.9 + wave * 0.45)),
    );
  } else if (move === 'hop') {
    rig.root.position.y = reduced ? 0 : Math.sin(phase * Math.PI) ** 2 * 0.32;
    rig.arms.forEach((arm, i) => (arm.rotation.z = sign * (i ? -1 : 1) * 0.55));
  } else {
    rig.root.rotation.z = reduced ? 0.08 : Math.sin(phase * Math.PI * 2) * 0.12;
    rig.arms.forEach(
      (arm, i) => (arm.rotation.z = sign * (i ? -1 : 1) * (1.15 + wave * 0.18)),
    );
  }
}
