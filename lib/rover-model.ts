import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ROVER_STOPS, type RoverProgress } from './rover';

export function createRoverModel() {
  const root = new THREE.Group();
  root.name = 'Monster’s six-wheel Moon rover';
  const body = new THREE.Group();
  root.add(body);
  const cube = new RoundedBoxGeometry(1, 1, 1, 2, 0.08);
  const ball = new THREE.SphereGeometry(1, 16, 10);
  const mats = new Map<string, THREE.MeshStandardMaterial>();
  const part = (
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    colour: string,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = sx,
    sz = sx,
  ) => {
    if (!mats.has(colour))
      mats.set(
        colour,
        new THREE.MeshStandardMaterial({
          color: colour,
          roughness: 0.7,
          metalness: 0.12,
        }),
      );
    const m = new THREE.Mesh(geometry, mats.get(colour));
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  part(body, cube, '#e7d9b9', 0, 0.83, 0, 2.3, 0.45, 3.1);
  part(body, cube, '#9baabd', 0, 0.57, 0, 1.9, 0.18, 2.9);
  part(body, cube, '#df9c69', 0, 1.13, 1.1, 2.2, 0.55, 0.6);
  part(body, cube, '#7297a7', 0, 1.18, -0.6, 1.12, 0.25, 0.9);
  part(body, cube, '#7297a7', 0, 1.65, -1.05, 1.12, 0.9, 0.22);
  part(body, cube, '#44516c', 0, 1.56, 0.68, 0.96, 0.15, 0.32).rotation.x =
    -0.25;
  for (const x of [-0.31, 0, 0.31])
    part(
      body,
      ball,
      x === 0 ? '#c8e7a9' : '#f9d494',
      x,
      1.64,
      0.67,
      0.075,
      0.04,
      0.06,
    );
  part(body, cube, '#c5b899', 0, 0.87, 1.65, 2.5, 0.2, 0.16);
  for (const x of [-0.78, 0.78]) {
    part(body, ball, '#fef1b1', x, 1.2, 1.45, 0.21, 0.16, 0.1);
    part(body, cube, '#d0b986', x * 1.5, 1.02, 0, 0.13, 0.13, 2.7);
  }
  const wheels: THREE.Group[] = [];
  for (const side of [-1, 1])
    for (const z of [-1.13, 0, 1.13]) {
      const wheel = new THREE.Group();
      wheel.position.set(side * 1.27, 0.5, z);
      root.add(wheel);
      wheels.push(wheel);
      part(
        wheel,
        new THREE.CylinderGeometry(0.46, 0.46, 0.36, 20),
        '#444b64',
        0,
        0,
        0,
      ).rotation.z = Math.PI / 2;
      part(
        wheel,
        new THREE.CylinderGeometry(0.25, 0.25, 0.39, 16),
        '#c3bec1',
        0,
        0,
        0,
      ).rotation.z = Math.PI / 2;
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        part(
          wheel,
          cube,
          '#606a7e',
          0,
          Math.sin(a) * 0.45,
          Math.cos(a) * 0.45,
          0.4,
          0.12,
          0.075,
        ).rotation.x = -a;
      }
    }
  part(body, cube, '#afaec4', 0.9, 1.9, -1.2, 0.07, 1.8, 0.07);
  part(body, ball, '#f1cd7a', 0.9, 2.82, -1.2, 0.12);
  const flag = part(body, cube, '#a9cce0', 1.14, 2.52, -1.2, 0.45, 0.3, 0.04);
  part(body, ball, '#f9e7b0', 1.14, 2.52, -1.17, 0.085, 0.085, 0.015);
  const parcelRack = new THREE.Group();
  parcelRack.position.set(0, 1.1, -1.35);
  body.add(parcelRack);
  let travelled = 0;
  return {
    root,
    parcelRack,
    animate(distance: number, time: number, reduced: boolean) {
      travelled += distance;
      wheels.forEach((w) => (w.rotation.x = travelled / 0.46));
      body.position.y = reduced
        ? 0
        : Math.sin(travelled * 5) * Math.min(distance * 1.8, 0.025);
      flag.rotation.y = reduced ? 0 : Math.sin(time * 1.2) * 0.035;
    },
  };
}

export function createRoverStops() {
  const root = new THREE.Group();
  root.name = 'Moon expedition stops';
  const signs: { id: keyof RoverProgress; lamp: THREE.MeshStandardMaterial }[] =
    [];
  const pole = new THREE.CylinderGeometry(0.08, 0.11, 1.9, 10);
  const plinth = new THREE.CylinderGeometry(2.3, 2.5, 0.12, 32);
  ROVER_STOPS.forEach((s, i) => {
    const g = new THREE.Group();
    g.name = s.name;
    g.position.set(s.x, 0, s.z);
    root.add(g);
    const material = new THREE.MeshStandardMaterial({
      color: s.colour,
      roughness: 0.85,
    });
    const base = new THREE.Mesh(plinth, material);
    base.position.y = 0.04;
    base.receiveShadow = true;
    g.add(base);
    const mast = new THREE.Mesh(
      pole,
      new THREE.MeshStandardMaterial({ color: '#e7ddcf' }),
    );
    mast.position.set(0, 1, 0);
    g.add(mast);
    const lamp = new THREE.MeshStandardMaterial({
      color: '#fff0a4',
      emissive: '#b68737',
      emissiveIntensity: 0.15,
    });
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), lamp);
    light.position.set(0, 2.2, 0);
    g.add(light);
    signs.push({ id: s.id, lamp });
    const prop = new THREE.Group();
    prop.position.set(0, 0, -1.1);
    g.add(prop);
    if (s.id === 'rocks') {
      for (let n = 0; n < 4; n++) {
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.3 + (n % 2) * 0.15, 0),
          material,
        );
        rock.position.set(((n % 2) - 0.5) * 1.1, 0.4, Math.floor(n / 2) * 0.6);
        rock.rotation.set(n * 0.3, n * 0.4, n * 0.15);
        rock.castShadow = true;
        prop.add(rock);
      }
    } else if (s.id === 'panels') {
      const support = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 1.1, 8),
        material,
      );
      support.position.y = 0.65;
      prop.add(support);
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.1, 1.2),
        new THREE.MeshStandardMaterial({ color: '#517fba', roughness: 0.4 }),
      );
      panel.position.y = 1.1;
      panel.rotation.x = 0.35;
      panel.castShadow = true;
      prop.add(panel);
      for (let n = -2; n <= 2; n++) {
        const grid = new THREE.Mesh(
          new THREE.BoxGeometry(0.025, 0.018, 1.1),
          new THREE.MeshStandardMaterial({ color: '#b4dae5' }),
        );
        grid.position.set(n * 0.36, 0.06, 0);
        panel.add(grid);
      }
    } else {
      for (const x of [-0.8, 0.8]) {
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.1, 1.1, 8),
          material,
        );
        stem.position.set(x, 0.6, 0);
        prop.add(stem);
        const lamp = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 16, 10),
          new THREE.MeshStandardMaterial({
            color: '#ecc99b',
            emissive: '#edaf7d',
            emissiveIntensity: 0.15,
          }),
        );
        lamp.position.set(x, 1.25, 0);
        prop.add(lamp);
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.38, 0.035, 6, 24, Math.PI * 1.2),
          material,
        );
        ring.position.set(x, 1.25, 0);
        ring.rotation.z = -0.3;
        prop.add(ring);
      }
    }
    // A large, readable numeral is a navigation sign, not a teaching answer.
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#f8eed6';
    ctx.beginPath();
    ctx.arc(64, 64, 57, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#51506b';
    ctx.font = 'bold 76px Trebuchet MS';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), 64, 68);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texture, depthTest: true }),
    );
    sign.position.set(0, 3.15, 0);
    sign.scale.set(1.3, 1.3, 1);
    g.add(sign);
  });
  return {
    root,
    update(progress: RoverProgress) {
      signs.forEach(({ id, lamp }) =>
        lamp.color.set(progress[id] > 0 ? '#bce4b0' : '#fff0a4'),
      );
    },
  };
}
