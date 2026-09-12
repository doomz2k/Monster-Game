import * as THREE from 'three';
import { placeFor, type PlaceId } from './adventure';

export function createNeighbour(id: PlaceId) {
  const place = placeFor(id),
    kind = place.kind,
    root = new THREE.Group(),
    body = new THREE.Group();
  root.add(body);
  root.name = place.friend;
  const limbs: THREE.Object3D[] = [],
    eyes: THREE.Object3D[] = [];
  function ball(
    colour: string,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy = sx,
    sz = sx,
  ) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 20, 14),
      new THREE.MeshStandardMaterial({ color: colour, roughness: 0.75 }),
    );
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    body.add(mesh);
    return mesh;
  }
  const colours: Record<string, string> = {
    fox: '#e99a5c',
    owl: '#b997ce',
    penguin: '#4a789b',
    frog: '#8abc65',
    rabbit: '#e8c5ba',
    alien: id === 'moon' ? '#b5a2eb' : '#7bc7b1',
  };
  const colour = colours[kind] ?? '#e9b966';
  ball(colour, 0, 0.75, 0, 0.56, 0.71, 0.43);
  ball('#fff0d5', 0, 0.66, 0.32, 0.4, 0.47, 0.14);
  ball(
    colour,
    0,
    1.56,
    0,
    kind === 'alien' ? 0.66 : 0.56,
    kind === 'owl' ? 0.48 : 0.52,
    0.43,
  );
  for (const side of [-1, 1]) {
    const eyeX = side * (kind === 'frog' ? 0.37 : 0.22),
      eyeY = kind === 'frog' ? 1.95 : 1.64;
    if (kind === 'frog') ball(colour, eyeX, eyeY, 0.14, 0.26);
    const eye = ball(
      '#fffced',
      eyeX,
      eyeY,
      0.385,
      kind === 'alien' ? 0.19 : 0.17,
      0.2,
      0.1,
    );
    eyes.push(eye);
    ball('#334450', eyeX, eyeY, 0.478, 0.072, 0.105, 0.04);
    ball('#ffffff', eyeX - 0.025, eyeY + 0.05, 0.513, 0.025);
    const arm = ball(
      colour,
      side * 0.58,
      0.88,
      0,
      0.14,
      kind === 'penguin' ? 0.45 : 0.34,
      0.2,
    );
    arm.rotation.z = side * 0.26;
    limbs.push(arm);
    ball(
      kind === 'penguin' ? '#eeb658' : colour,
      side * 0.25,
      0.16,
      0.14,
      0.23,
      0.15,
      0.3,
    );
    if (kind === 'rabbit') {
      ball(colour, side * 0.27, 2.21, 0, 0.18, 0.59, 0.14);
      ball('#eba5b8', side * 0.27, 2.26, 0.12, 0.09, 0.4, 0.04);
    }
    if (kind === 'fox' || kind === 'owl') {
      const ear = new THREE.Mesh(
        new THREE.ConeGeometry(0.23, 0.55, 16),
        new THREE.MeshStandardMaterial({ color: colour }),
      );
      ear.position.set(side * 0.4, 2.04, 0);
      ear.rotation.z = -side * 0.3;
      body.add(ear);
    }
    if (kind === 'alien') {
      ball(colour, side * 0.39, 2.09, 0, 0.045, 0.29, 0.045);
      ball('#fce594', side * 0.39, 2.4, 0, 0.1);
    }
  }
  const mouth = ball('#755056', 0, 1.32, 0.42, 0.12, 0.035, 0.025);
  if (kind === 'fox') {
    ball('#fff0d5', -0.13, 1.4, 0.39, 0.21, 0.15, 0.15);
    ball('#fff0d5', 0.13, 1.4, 0.39, 0.21, 0.15, 0.15);
    ball('#44414c', 0, 1.47, 0.56, 0.1, 0.06, 0.06);
  }
  if (kind === 'owl' || kind === 'penguin')
    ball('#e8b659', 0, 1.45, 0.48, 0.1, 0.1, 0.14);
  if (id === 'meadow') {
    ball('#fff9e7', 0, 2.18, 0, 0.36, 0.18, 0.33);
    for (const side of [-1, 0, 1])
      ball('#fff9e7', side * 0.23, 2.45, 0, 0.25, 0.27, 0.25);
    ball('#fff2db', 0, 0.78, 0.4, 0.31, 0.35, 0.05);
  }
  const scarf = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.08, 8, 24),
    new THREE.MeshStandardMaterial({
      color: id === 'moon' ? '#f2d378' : '#e7778c',
    }),
  );
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 1.17;
  body.add(scarf);
  return {
    root,
    animate(time: number, near: boolean, talking: boolean, reduced: boolean) {
      const motion = reduced ? 0 : 1;
      body.position.y =
        Math.sin(time * (kind === 'alien' ? 2 : 1.6)) *
        (kind === 'alien' ? 0.12 : 0.025) *
        motion;
      body.rotation.z = Math.sin(time * 1.2) * 0.035 * motion;
      limbs.forEach((limb, i) => {
        limb.rotation.z =
          (i ? -1 : 1) *
          (near ? 1.1 + Math.sin(time * 5) * 0.18 * motion : 0.25);
      });
      const blink = time % 5.4 > 5.2 ? 0.12 : 1;
      eyes.forEach((eye) => {
        eye.scale.y = 0.2 * (reduced ? 1 : blink);
      });
      mouth.scale.y = talking
        ? 0.045 + Math.abs(Math.sin(time * 9)) * 0.045 * motion
        : 0.035;
    },
  };
}
