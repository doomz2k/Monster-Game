import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Each piece uses Monster's rig coordinates, so it follows every hop and sway.
export function createCostume(id: string): THREE.Group {
  const group = new THREE.Group();
  group.name = id;
  const materials = new Map<string, THREE.MeshPhysicalMaterial>();
  function add(
    geometry: THREE.BufferGeometry,
    colour: string,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = sx,
    sz = sx,
  ) {
    let material = materials.get(colour);
    if (!material) {
      const polished = id === 'crown' || id === 'medal' || id === 'glasses';
      material = new THREE.MeshPhysicalMaterial({
        color: colour,
        roughness: polished ? 0.36 : 0.8,
        sheen: polished ? 0 : 0.75,
        sheenColor: '#fff4d9',
        sheenRoughness: 0.65,
        clearcoat: polished ? 0.4 : 0,
        metalness: id === 'crown' || id === 'medal' ? 0.22 : 0,
      });
      materials.set(colour, material);
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  const ball = (
    colour: string,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy = sx,
    sz = sx,
  ) => add(new THREE.SphereGeometry(1, 32, 24), colour, x, y, z, sx, sy, sz);
  const ring = (
    colour: string,
    radius: number,
    tube: number,
    x: number,
    y: number,
    z: number,
  ) => add(new THREE.TorusGeometry(radius, tube, 12, 64), colour, x, y, z);
  const cylinder = (
    colour: string,
    radius: number,
    height: number,
    y: number,
  ) =>
    add(
      new THREE.CylinderGeometry(radius, radius, height, 64),
      colour,
      0,
      y,
      0,
    );
  if (id === 'beanie') {
    ball('#6aafa2', 0, 2.4, -0.02, 0.66, 0.39, 0.59);
    ring('#4f938c', 0.565, 0.055, 0, 2.34, 0).rotation.x = Math.PI / 2;
    ball('#fff0c9', 0, 2.83, 0, 0.18);
  } else if (id === 'party') {
    group.position.y = 0.08;
    add(new THREE.ConeGeometry(0.48, 0.95, 48), '#b28dd0', 0, 2.74, 0);
    ring('#f2a6bb', 0.48, 0.07, 0, 2.29, 0).rotation.x = Math.PI / 2;
    ball('#ffe17b', 0, 3.26, 0, 0.14);
    for (const [x, y, z] of [
      [0, 2.61, 0.36],
      [-0.17, 2.43, 0.35],
      [0.13, 2.88, 0.15],
    ])
      ball('#fff6cf', x, y, z, 0.065, 0.065, 0.035);
  } else if (id === 'explorer') {
    const brim = new THREE.Shape();
    brim.absarc(0, 0, 0.95, 0, Math.PI * 2, false);
    for (const side of [-1, 1]) {
      const opening = new THREE.Path();
      opening.absarc(side * 0.75, 0.1, 0.18, 0, Math.PI * 2, true);
      brim.holes.push(opening);
    }
    const brimGeometry = new THREE.ExtrudeGeometry(brim, {
      depth: 0.07,
      bevelEnabled: true,
      bevelSize: 0.01,
      bevelThickness: 0.01,
      bevelSegments: 2,
      steps: 1,
      curveSegments: 32,
    });
    brimGeometry.rotateX(-Math.PI / 2);
    add(brimGeometry, '#d8bb7b', 0, 2.305, 0).name = 'Brim with horn openings';
    cylinder('#e6cd97', 0.62, 0.38, 2.55);
    cylinder('#8a9c67', 0.63, 0.12, 2.41);
    ball('#edddb3', 0, 2.77, 0, 0.6, 0.09, 0.6);
  } else if (id === 'flowers') {
    ring('#719f62', 0.555, 0.055, 0, 2.34, 0).rotation.x = Math.PI / 2;
    for (let n = 0; n < 7; n++) {
      const a = (n * Math.PI * 2) / 7,
        x = Math.sin(a) * 0.56,
        z = Math.cos(a) * 0.56;
      for (let p = 0; p < 5; p++) {
        const t = (p * Math.PI * 2) / 5;
        ball(
          n % 2 ? '#efabc1' : '#fff4cf',
          x + Math.cos(t) * 0.1,
          2.37 + Math.sin(t) * 0.1,
          z,
          0.09,
          0.09,
          0.05,
        );
      }
      ball('#e7ad38', x, 2.37, z + 0.04, 0.065);
    }
  } else if (id === 'crown') {
    ring('#e7b546', 0.56, 0.085, 0, 2.38, 0).rotation.x = Math.PI / 2;
    for (let n = 0; n < 6; n++) {
      const a = (n * Math.PI * 2) / 6,
        x = Math.sin(a) * 0.55,
        z = Math.cos(a) * 0.55;
      add(new THREE.ConeGeometry(0.17, 0.48, 4), '#f4ce64', x, 2.62, z);
      ball(['#8bc5b9', '#ea9fb6', '#b29cd4'][n % 3], x, 2.9, z, 0.1);
    }
  } else if (id === 'bow') {
    ball('#d77f9e', -0.21, 1.07, 0.745, 0.23, 0.15, 0.09).rotation.z = -0.25;
    ball('#d77f9e', 0.21, 1.07, 0.745, 0.23, 0.15, 0.09).rotation.z = 0.25;
    ball('#ab5279', 0, 1.07, 0.81, 0.12);
  } else if (id === 'scarf') {
    const collar = ring('#6eaba1', 0.71, 0.12, 0, 1.05, 0);
    collar.rotation.x = Math.PI / 2;
    collar.scale.x = 1.2;
    collar.scale.y = 0.96;
    add(
      new RoundedBoxGeometry(0.24, 0.55, 0.1, 3, 0.024),
      '#8ac0b4',
      0.33,
      0.77,
      0.73,
    ).rotation.z = -0.16;
    add(
      new THREE.BoxGeometry(0.25, 0.06, 0.11),
      '#fff0c9',
      0.36,
      0.56,
      0.75,
    ).rotation.z = -0.16;
  } else if (id === 'glasses') {
    for (const side of [-1, 1]) {
      ring('#8c74ad', 0.255, 0.033, side * 0.29, 1.79, 0.9);
      add(
        new THREE.BoxGeometry(0.04, 0.04, 0.46),
        '#8c74ad',
        side * 0.56,
        1.81,
        0.69,
      );
    }
    add(
      new RoundedBoxGeometry(0.12, 0.033, 0.04, 2, 0.01),
      '#8c74ad',
      0,
      1.82,
      0.9,
    );
  } else if (id === 'backpack') {
    ball('#699cba', 0, 1.2, -0.77, 0.58, 0.62, 0.28);
    ball('#8ab9cf', 0, 0.97, -1.01, 0.4, 0.27, 0.08);
    ring('#3c7396', 0.18, 0.045, 0, 1.83, -0.77);
    for (const side of [-1, 1]) {
      const strap = ring('#93c4d3', 0.51, 0.055, side * 0.58, 1.2, 0);
      strap.rotation.y = Math.PI / 2;
      strap.scale.y = 1.25;
    }
  } else if (id === 'medal') {
    for (const side of [-1, 1])
      add(
        new THREE.BoxGeometry(0.1, 0.46, 0.04),
        '#ab8bbf',
        side * 0.13,
        1.06,
        0.76,
      ).rotation.z = -side * 0.55;
    const star = new THREE.Shape();
    for (let n = 0; n < 10; n++) {
      const a = Math.PI / 2 + (n * Math.PI) / 5,
        r = n % 2 ? 0.115 : 0.24;
      if (n === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    star.closePath();
    add(
      new THREE.ExtrudeGeometry(star, {
        depth: 0.06,
        bevelEnabled: true,
        bevelSize: 0.018,
        bevelThickness: 0.018,
        bevelSegments: 1,
        steps: 1,
      }),
      '#f0c04e',
      0,
      0.79,
      0.77,
    );
  }
  return group;
}
