import * as THREE from 'three';
import { COMPANIONS, type CompanionId } from './companion';

export function createCompanion(id: CompanionId) {
  const definition = COMPANIONS.find((c) => c.id === id)!;
  const root = new THREE.Group(),
    body = new THREE.Group();
  root.name = definition.name + ' companion';
  root.add(body);
  const sphere = new THREE.SphereGeometry(1, 16, 12),
    materials = new Map<string, THREE.MeshStandardMaterial>();
  const material = (colour: string) => {
    if (!materials.has(colour))
      materials.set(
        colour,
        new THREE.MeshStandardMaterial({ color: colour, roughness: 0.72 }),
      );
    return materials.get(colour)!;
  };
  const ball = (
    parent: THREE.Object3D,
    colour: string,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) => {
    const mesh = new THREE.Mesh(sphere, material(colour));
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const c = definition.colour,
    b = definition.belly;
  ball(body, c, 0, 0, 0, 0.48, 0.5, 0.39);
  ball(body, b, 0, -0.08, 0.32, 0.31, 0.33, 0.11);
  if (id === 'puff') {
    for (const [x, y, s] of [
      [-0.3, 0.22, 0.25],
      [0.28, 0.26, 0.26],
      [0, 0.4, 0.28],
    ])
      ball(body, c, x, y, -0.04, s, s, s * 0.8);
    ball(body, '#efbc69', 0, 0.02, 0.48, 0.13, 0.07, 0.16);
  } else if (id === 'sprig') {
    for (const side of [-1, 1]) {
      const ear = ball(
        body,
        definition.wing,
        side * 0.32,
        0.48,
        -0.05,
        0.11,
        0.32,
        0.09,
      );
      ear.rotation.z = -side * 0.45;
      ball(body, c, side * 0.36, -0.26, 0.14, 0.14, 0.18, 0.16);
    }
    for (let i = 0; i < 3; i++)
      ball(body, definition.wing, 0, 0.1 - i * 0.2, -0.37, 0.09, 0.09, 0.08);
    const tail = ball(body, c, 0, -0.17, -0.45, 0.15, 0.12, 0.34);
    tail.rotation.x = -0.4;
  } else {
    for (const side of [-1, 1]) {
      const stalk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.022, 0.3, 6),
        material('#7e69a2'),
      );
      stalk.position.set(side * 0.2, 0.51, 0);
      stalk.rotation.z = -side * 0.45;
      body.add(stalk);
      const light = ball(
        body,
        '#f9d885',
        side * 0.27,
        0.67,
        0,
        0.08,
        0.08,
        0.08,
      );
      (light.material as THREE.MeshStandardMaterial).emissive.set('#eabe56');
      (light.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.25;
    }
    ball(body, '#fff4b5', 0, -0.12, 0.435, 0.09, 0.12, 0.03);
  }
  const eyes: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(side * 0.2, 0.16, 0.35);
    body.add(eye);
    eyes.push(eye);
    ball(eye, '#fff8e9', 0, 0, 0, 0.15, 0.18, 0.1);
    ball(eye, '#34364b', 0, -0.006, 0.079, 0.069, 0.095, 0.04);
    ball(eye, '#ffffff', -0.019, 0.035, 0.111, 0.024, 0.032, 0.018);
    ball(body, '#dfb4a0', side * 0.34, -0.035, 0.29, 0.075, 0.04, 0.05);
    ball(body, b, side * 0.22, -0.46, 0.1, 0.12, 0.085, 0.16);
  }
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.085, 0.015, 6, 18, Math.PI),
    material('#59484c'),
  );
  smile.position.set(0, -0.04, 0.421);
  smile.rotation.z = Math.PI;
  body.add(smile);
  const wings: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group();
    wing.position.set(side * 0.35, 0.04, -0.13);
    body.add(wing);
    wings.push(wing);
    const feather = ball(
      wing,
      definition.wing,
      side * 0.22,
      0.05,
      0,
      id === 'twinkle' ? 0.36 : 0.3,
      0.15,
      0.1,
    );
    feather.rotation.z = side * 0.4;
    if (id === 'twinkle')
      ball(wing, b, side * 0.25, 0.06, 0.095, 0.12, 0.08, 0.025);
    else
      for (let i = 0; i < 3; i++)
        ball(
          wing,
          id === 'sprig' ? b : definition.wing,
          side * (0.2 + i * 0.09),
          -0.025 - i * 0.035,
          0.03,
          0.16,
          0.07,
          0.07,
        );
  }
  return {
    root,
    animate(
      time: number,
      speed: number,
      happy: boolean,
      reduced: boolean,
      resting = false,
    ) {
      const t = reduced ? 0 : time;
      body.position.y = reduced
        ? 0
        : Math.sin(t * (resting ? 1.4 : 2.8)) * (resting ? 0.025 : 0.07) +
          (happy ? Math.max(0, Math.sin(t * 7)) * 0.16 : 0);
      body.rotation.z = reduced ? 0 : Math.sin(t * 1.8) * 0.035;
      body.rotation.x = reduced ? 0 : Math.min(1, speed) * 0.12;
      const blink = !reduced && (t % 5.3 > 5.12 || (happy && t % 1.8 > 1.66));
      eyes.forEach((e) => (e.scale.y = blink ? 0.1 : 1));
      wings.forEach(
        (wing, i) =>
          (wing.rotation.z =
            (i === 0 ? -1 : 1) *
            (resting
              ? 0.75
              : reduced
                ? 0.15
                : 0.1 + Math.sin(t * (happy ? 14 : 9)) * 0.28)),
      );
    },
  };
}
