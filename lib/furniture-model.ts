import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function createFurniture(
  id: string,
  colour: string,
  timber?: THREE.Texture,
) {
  const root = new THREE.Group();
  root.name = 'Furniture: ' + id;
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const mat = (c: string, wood = false) => {
    const key = c + wood;
    if (!materials.has(key))
      materials.set(
        key,
        new THREE.MeshStandardMaterial({
          color: c,
          roughness: wood ? 0.82 : 0.74,
          map: wood && timber ? timber : null,
          bumpMap: wood && timber ? timber : null,
          bumpScale: 0.015,
        }),
      );
    return materials.get(key)!;
  };
  const add = (
    parent: THREE.Object3D,
    g: THREE.BufferGeometry,
    c: string,
    x: number,
    y: number,
    z: number,
    wood = false,
  ) => {
    const m = new THREE.Mesh(g, mat(c, wood));
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const box = (
    p: THREE.Object3D,
    c: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    wood = false,
  ) =>
    add(
      p,
      new RoundedBoxGeometry(
        w,
        h,
        d,
        2,
        Math.min(0.055, h * 0.2, w * 0.2, d * 0.2),
      ),
      c,
      x,
      y,
      z,
      wood,
    );
  const ball = (
    p: THREE.Object3D,
    c: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) => {
    const m = add(p, new THREE.SphereGeometry(1, 14, 10), c, x, y, z);
    m.scale.set(w, h, d);
    return m;
  };
  const cylinder = (
    p: THREE.Object3D,
    c: string,
    x: number,
    y: number,
    z: number,
    top: number,
    bottom: number,
    h: number,
  ) => add(p, new THREE.CylinderGeometry(top, bottom, h, 24), c, x, y, z);
  const wood = '#c5a17a',
    dark = '#9c7655',
    cream = '#fff0cc';
  const legs = (w: number, d: number, h = 0.25) => {
    for (const x of [-w, w])
      for (const z of [-d, d])
        box(root, dark, x, h / 2, z, 0.12, h, 0.12, true);
  };
  let swing: THREE.Group | null = null;
  if (id === 'sofa') {
    legs(0.66, 0.32, 0.25);
    box(root, colour, 0, 0.36, 0, 1.8, 0.32, 0.94);
    for (const x of [-0.38, 0.38]) {
      box(root, '#e6a5c2', x, 0.57, 0.05, 0.7, 0.2, 0.78);
      box(root, colour, x, 0.94, -0.36, 0.74, 0.65, 0.24);
      ball(root, '#b4789e', x, 1, -0.215, 0.035, 0.035, 0.016);
    }
    for (const x of [-0.8, 0.8])
      box(root, colour, x, 0.66, 0.03, 0.22, 0.58, 1.02);
    const cushion = box(root, '#f5d995', -0.45, 0.83, 0.05, 0.35, 0.34, 0.14);
    cushion.rotation.z = 0.18;
  } else if (id === 'bed') {
    legs(0.54, 0.77, 0.3);
    box(root, wood, 0, 0.32, 0, 1.34, 0.2, 1.8, true);
    box(root, wood, 0, 0.72, -0.86, 1.42, 1.05, 0.13, true);
    box(root, cream, 0, 0.47, 0, 1.25, 0.18, 1.7);
    box(root, colour, 0, 0.58, 0.22, 1.28, 0.18, 1.18);
    box(root, cream, 0, 0.63, -0.58, 0.78, 0.17, 0.37);
    for (const [x, z] of [
      [-0.3, 0],
      [0.28, 0.28],
      [-0.15, 0.57],
    ]) {
      const star = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5,
          r = i % 2 ? 0.045 : 0.1,
          xs = Math.sin(a) * r,
          ys = Math.cos(a) * r;
        if (i === 0) star.moveTo(xs, ys);
        else star.lineTo(xs, ys);
      }
      star.closePath();
      const patch = add(
        root,
        new THREE.ShapeGeometry(star),
        cream,
        x,
        0.678,
        z,
      );
      patch.rotation.x = -Math.PI / 2;
    }
  } else if (id === 'table') {
    for (const z of [-0.38, -0.12, 0.14, 0.4])
      box(root, colour, 0, 0.81, z, 1.8, 0.12, 0.23, true);
    for (const x of [-0.61, 0.61]) {
      const leg = box(root, dark, x, 0.42, 0, 0.13, 0.8, 0.85, true);
      leg.rotation.z = x > 0 ? -0.1 : 0.1;
    }
    box(root, wood, 0, 0.36, 0, 1.45, 0.13, 0.13, true);
    for (const z of [-0.7, 0.7]) {
      box(root, colour, 0, 0.44, z, 1.8, 0.12, 0.27, true);
      for (const x of [-0.65, 0.65])
        box(root, dark, x, 0.23, z, 0.11, 0.4, 0.15, true);
    }
  } else if (id === 'books') {
    for (const x of [-0.65, 0.65])
      box(root, wood, x, 0.77, 0, 0.12, 1.54, 0.52, true);
    for (const y of [0.13, 0.78, 1.49])
      box(root, wood, 0, y, 0, 1.4, 0.1, 0.54, true);
    box(root, '#d7ba8e', 0, 0.77, -0.23, 1.3, 1.48, 0.05, true);
    for (let i = 0; i < 10; i++) {
      const x = -0.5 + (i % 5) * 0.23,
        y = i < 5 ? 0.4 : 1.09,
        c = ['#93afcb', '#d4a5b6', '#e8c27a', '#a6bd97', '#b6a4cb'][i % 5];
      box(root, c, x, y, 0.06, 0.18, 0.42 + (i % 3) * 0.045, 0.3);
      box(root, cream, x, y + 0.11, 0.218, 0.12, 0.027, 0.018);
    }
  } else if (id === 'lamp' || id === 'lantern') {
    cylinder(root, dark, 0, 0.06, 0, 0.29, 0.33, 0.12);
    cylinder(root, wood, 0, 0.72, 0, 0.045, 0.065, 1.3);
    if (id === 'lamp') {
      add(
        root,
        new THREE.CylinderGeometry(0.23, 0.44, 0.46, 28, 1, true),
        colour,
        0,
        1.48,
        0,
      ).material.side = THREE.DoubleSide;
      const bulb = ball(root, cream, 0, 1.4, 0, 0.17, 0.21, 0.17);
      bulb.material.emissive.set('#f6d48b');
      bulb.material.emissiveIntensity = 0.45;
      cylinder(root, colour, 0, 1.72, 0, 0.23, 0.23, 0.03);
      ball(root, dark, 0.3, 1.2, 0, 0.028, 0.035, 0.028);
    } else {
      cylinder(root, dark, 0, 1.1, 0, 0.23, 0.25, 0.1);
      const bulb = ball(root, colour, 0, 1.4, 0, 0.17, 0.3, 0.17);
      bulb.material.emissive.set('#f1b769');
      bulb.material.emissiveIntensity = 0.45;
      for (const x of [-0.2, 0.2])
        for (const z of [-0.2, 0.2])
          box(root, dark, x, 1.4, z, 0.035, 0.6, 0.035);
      add(
        root,
        new THREE.ConeGeometry(0.34, 0.25, 4),
        dark,
        0,
        1.77,
        0,
      ).rotation.y = Math.PI / 4;
    }
  } else if (id === 'rug') {
    ['#b596c9', '#cf9eaf', '#e7b879', '#e5d796', '#9eb897', '#95bdc7'].forEach(
      (c, i) => {
        const rug = cylinder(
          root,
          c,
          0,
          0.025 + i * 0.004,
          0,
          0.9 - i * 0.12,
          0.9 - i * 0.12,
          0.025,
        );
        rug.scale.z = 0.76;
      },
    );
    for (const x of [-0.89, 0.89])
      for (let i = 0; i < 7; i++)
        box(root, cream, x, 0.018, -0.39 + i * 0.13, 0.15, 0.025, 0.035);
  } else if (id === 'birdbath') {
    cylinder(root, colour, 0, 0.07, 0, 0.33, 0.4, 0.14);
    cylinder(root, colour, 0, 0.45, 0, 0.12, 0.22, 0.72);
    cylinder(root, colour, 0, 0.83, 0, 0.61, 0.35, 0.19);
    const rim = add(
      root,
      new THREE.TorusGeometry(0.5, 0.09, 10, 28),
      colour,
      0,
      0.94,
      0,
    );
    rim.rotation.x = Math.PI / 2;
    const water = cylinder(root, '#8cc9d5', 0, 0.928, 0, 0.49, 0.49, 0.025);
    water.material.roughness = 0.18;
    water.material.metalness = 0.15;
    ball(root, '#9ab6c8', 0.43, 1.11, 0, 0.12, 0.14, 0.13);
    ball(root, '#dcd6ae', 0.43, 1.09, 0.1, 0.07, 0.08, 0.05);
    ball(root, '#35394b', 0.4, 1.17, 0.11, 0.02, 0.022, 0.015);
    ball(root, '#e3b975', 0.47, 1.13, 0.14, 0.035, 0.025, 0.05);
  } else if (id === 'swing') {
    for (const x of [-0.8, 0.8]) {
      box(root, wood, x, 0.95, 0, 0.14, 1.9, 0.16, true);
      box(root, dark, x, 0.08, 0, 0.35, 0.15, 0.65, true);
    }
    box(root, wood, 0, 1.92, 0, 1.95, 0.17, 0.2, true);
    swing = new THREE.Group();
    swing.position.y = 1.83;
    root.add(swing);
    for (const x of [-0.43, 0.43])
      cylinder(swing, cream, x, -0.58, 0, 0.023, 0.023, 1.16);
    box(swing, colour, 0, -1.16, 0, 1.15, 0.13, 0.53, true);
    box(swing, colour, 0, -0.97, -0.25, 1.15, 0.36, 0.08, true);
  } else if (id === 'mushroom') {
    cylinder(root, cream, 0, 0.27, 0, 0.18, 0.25, 0.54);
    ball(root, colour, 0, 0.61, 0, 0.58, 0.25, 0.58);
    for (let i = 0; i < 7; i++) {
      const a = i * 2.399963,
        r = i === 0 ? 0 : 0.32;
      ball(
        root,
        cream,
        Math.cos(a) * r,
        0.815 - (i === 0 ? 0 : 0.02),
        Math.sin(a) * r,
        0.075,
        0.021,
        0.075,
      );
    }
  }
  return {
    root,
    animate(time: number, reduced: boolean) {
      if (swing) swing.rotation.x = reduced ? 0 : Math.sin(time * 0.9) * 0.045;
    },
  };
}
