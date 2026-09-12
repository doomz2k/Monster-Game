import * as THREE from 'three';
import { gardenVisitors } from './garden';
import type { Plant } from './adventure';

/** Distinct reusable botanical toys for both the island and the close-up garden. */
export function createGardenPlant(seed: string, water: number) {
  const root = new THREE.Group();
  root.name = seed + ' plant';
  const stage = Number.isFinite(water)
    ? Math.max(0, Math.min(3, Math.floor(water)))
    : 0;
  const sphere = new THREE.SphereGeometry(1, 18, 12);
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const material = (colour: string) => {
    if (!materials.has(colour))
      materials.set(
        colour,
        new THREE.MeshStandardMaterial({ color: colour, roughness: 0.65 }),
      );
    return materials.get(colour)!;
  };
  function ball(
    colour: string,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy = sx,
    sz = sx,
  ) {
    const m = new THREE.Mesh(sphere, material(colour));
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.castShadow = m.receiveShadow = true;
    root.add(m);
    return m;
  }
  function stem(x: number, z: number, h: number) {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(0.027, 0.038, h, 10),
      material('#608d43'),
    );
    m.position.set(x, h / 2, z);
    root.add(m);
  }
  const tall = seed === 'sunflower',
    h = (tall ? 1.5 : 0.8) * (0.3 + stage * 0.23);
  if (seed === 'carrot') {
    const carrot = new THREE.Mesh(
      new THREE.ConeGeometry(0.15 + stage * 0.025, 0.35 + stage * 0.1, 12),
      material('#ed933b'),
    );
    carrot.rotation.z = Math.PI;
    carrot.position.y = 0.09;
    root.add(carrot);
    for (let i = 0; i < 5; i++) {
      const leaf = ball(
        '#6ea648',
        (i - 2) * 0.08,
        0.25 + stage * 0.09,
        0,
        0.055,
        0.28 + stage * 0.04,
        0.035,
      );
      leaf.rotation.z = (i - 2) * 0.25;
    }
  } else {
    stem(0, 0, h);
    for (const side of [-1, 1]) {
      const leaf = ball(
        '#76a756',
        side * 0.15,
        h * 0.55,
        0,
        0.24,
        0.045,
        0.105,
      );
      leaf.rotation.z = side * 0.35;
    }
    if (stage < 3)
      ball(
        '#a5c375',
        0,
        h,
        0,
        0.065 + stage * 0.025,
        0.1 + stage * 0.025,
        0.07,
      );
    else if (seed === 'tomato' || seed === 'pepper') {
      for (let i = 0; i < 3; i++) {
        const x = (i - 1) * 0.25,
          y = h - 0.1 + (i % 2) * 0.22,
          z = i === 1 ? 0.13 : 0;
        stem(x, z, y + 0.1);
        if (seed === 'tomato') {
          ball('#df6550', x, y, z, 0.19, 0.16, 0.18);
          for (let j = 0; j < 5; j++) {
            const a = (j * Math.PI * 2) / 5;
            const leaf = ball(
              '#689247',
              x + Math.cos(a) * 0.07,
              y + 0.15,
              z + Math.sin(a) * 0.07,
              0.09,
              0.02,
              0.035,
            );
            leaf.rotation.y = -a;
          }
        } else {
          for (const side of [-1, 0, 1])
            ball('#7ca643', x + side * 0.055, y, z, 0.1, 0.2, 0.11);
          ball('#537b36', x, y + 0.2, z, 0.035, 0.09, 0.035);
        }
      }
    } else if (seed === 'strawberry') {
      for (let i = 0; i < 3; i++) {
        const x = (i - 1) * 0.22,
          y = 0.25 + (i % 2) * 0.1;
        ball('#dc6175', x, y, 0.1, 0.13, 0.18, 0.11);
        for (let j = 0; j < 5; j++)
          ball(
            '#f5d9a2',
            x + Math.sin(j * 2) * 0.09,
            y + (j - 2) * 0.047,
            0.2,
            0.013,
            0.019,
            0.009,
          );
        ball('#689e4b', x, y + 0.17, 0.1, 0.12, 0.025, 0.07);
      }
    } else if (seed === 'tulip') {
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        const p = ball(
          i % 2 ? '#f4a4bb' : '#e783a5',
          Math.cos(a) * 0.09,
          h + 0.06,
          Math.sin(a) * 0.09,
          0.13,
          0.22,
          0.07,
        );
        p.rotation.y = -a;
      }
    } else {
      const count = tall ? 12 : seed === 'moonflower' ? 6 : 9,
        radius = tall ? 0.21 : 0.16;
      for (let i = 0; i < count; i++) {
        const a = (i * Math.PI * 2) / count;
        const petal = ball(
          tall ? '#f3c84c' : seed === 'moonflower' ? '#c6b4ed' : '#fff4d2',
          Math.cos(a) * radius,
          h + Math.sin(a) * radius,
          0,
          tall ? 0.17 : 0.14,
          0.07,
          0.045,
        );
        petal.rotation.z = a;
      }
      ball(
        tall ? '#97704b' : seed === 'moonflower' ? '#e3d9ff' : '#e7bd4d',
        0,
        h,
        0.045,
        tall ? 0.14 : 0.09,
        tall ? 0.14 : 0.09,
        0.06,
      );
    }
  }
  return {
    root,
    animate(time: number, reduced: boolean) {
      root.rotation.z = reduced ? 0 : Math.sin(time * 1.4) * 0.025;
    },
  };
}

export function createGardenWildlife(plots: Plant[]) {
  const root = new THREE.Group(),
    visitors = gardenVisitors(plots);
  const sphere = new THREE.SphereGeometry(1, 12, 8);
  const creatures: { body: THREE.Group; wings: THREE.Mesh[]; phase: number }[] =
    [];
  for (const [i, kind] of (['bee', 'butterfly', 'bird'] as const).entries()) {
    if (!visitors[kind]) continue;
    const body = new THREE.Group(),
      wings: THREE.Mesh[] = [];
    root.add(body);
    const add = (
      c: string,
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
    ) => {
      const m = new THREE.Mesh(
        sphere,
        new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }),
      );
      m.position.set(x, y, z);
      m.scale.set(sx, sy, sz);
      body.add(m);
      return m;
    };
    add(
      kind === 'bee' ? '#e4b43e' : kind === 'bird' ? '#85b4c7' : '#7e625f',
      0,
      0,
      0,
      kind === 'butterfly' ? 0.04 : 0.12,
      0.1,
      0.2,
    );
    add('#403c41', 0, 0.03, 0.17, 0.075, 0.075, 0.065);
    for (const side of [-1, 1]) {
      if (kind === 'bee')
        wings.push(add('#e6f3ee', side * 0.13, 0.12, -0.02, 0.14, 0.018, 0.09));
      else if (kind === 'butterfly') {
        wings.push(add('#d4a1d8', side * 0.15, 0.02, 0.03, 0.19, 0.035, 0.16));
        wings.push(add('#f0bdd9', side * 0.11, 0.02, -0.13, 0.13, 0.028, 0.12));
      } else
        wings.push(add('#5889a1', side * 0.14, 0.01, -0.02, 0.19, 0.035, 0.16));
    }
    if (kind === 'bee')
      for (const z of [-0.08, 0.045]) {
        const band = new THREE.Mesh(
          new THREE.TorusGeometry(0.105, 0.021, 6, 16),
          new THREE.MeshStandardMaterial({ color: '#5b5040' }),
        );
        band.position.z = z;
        body.add(band);
      }
    if (kind === 'bird') {
      const beak = new THREE.Mesh(
        new THREE.ConeGeometry(0.055, 0.13, 8),
        new THREE.MeshStandardMaterial({ color: '#eac16c' }),
      );
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 0.02, 0.27);
      body.add(beak);
    }
    creatures.push({ body, wings, phase: i * 2 });
  }
  return {
    root,
    animate(time: number, reduced: boolean) {
      for (const { body, wings, phase } of creatures) {
        const t = reduced ? phase : time * 0.3 + phase;
        body.position.set(
          2.1 + Math.cos(t) * 1.65,
          1.4 + Math.sin(t * 1.5) * 0.22,
          0.85 + Math.sin(t) * 1.1,
        );
        body.rotation.y = -t;
        wings.forEach((w, i) => {
          w.rotation.z = reduced
            ? 0
            : Math.sin(time * (phase === 0 ? 22 : 7)) * (i % 2 ? -1 : 1) * 0.45;
        });
      }
    },
  };
}
