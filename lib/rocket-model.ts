import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { repairStage } from './rocket-story';

/** A shared toy rocket with three visible, independently repaired systems. */
export function createRocketModel(initialStage = 3) {
  const root = new THREE.Group();
  root.name = 'Pip’s exploration rocket';
  const hull = new THREE.Group();
  root.add(hull);
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  const cube = new RoundedBoxGeometry(1, 1, 1, 2, 0.08);
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const mat = (colour: string) => {
    if (!materials.has(colour))
      materials.set(
        colour,
        new THREE.MeshStandardMaterial({
          color: colour,
          roughness: 0.65,
          metalness: 0.07,
        }),
      );
    return materials.get(colour)!;
  };
  const mesh = (
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    colour: string,
    name: string,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = sx,
    sz = sx,
  ) => {
    const part = new THREE.Mesh(geometry, mat(colour));
    part.name = name;
    part.position.set(x, y, z);
    part.scale.set(sx, sy, sz);
    part.castShadow = part.receiveShadow = true;
    parent.add(part);
    return part;
  };
  mesh(
    hull,
    new THREE.CylinderGeometry(1, 1.13, 3.55, 36),
    '#f2ead7',
    'Cream hull',
    0,
    2.65,
    0,
  );
  mesh(
    hull,
    new THREE.ConeGeometry(1, 1.6, 36),
    '#d78578',
    'Rounded nose',
    0,
    5.22,
    0,
  );
  mesh(hull, sphere, '#d78578', 'Nose tip', 0, 5.96, 0, 0.08, 0.12, 0.08);
  for (const y of [1.06, 4.33])
    mesh(
      hull,
      new THREE.TorusGeometry(y < 2 ? 1.13 : 1.02, 0.055, 8, 40),
      '#cdbb9a',
      'Hull ring',
      0,
      y,
      0,
    ).rotation.x = Math.PI / 2;
  const rim = mesh(
    hull,
    new THREE.TorusGeometry(0.64, 0.105, 10, 40),
    '#d7ad67',
    'Window rim',
    0,
    3.51,
    1.02,
  );
  const window = mesh(
    hull,
    sphere,
    '#87bdc9',
    'Cabin window',
    0,
    3.51,
    1.07,
    0.57,
    0.57,
    0.12,
  );
  mesh(
    hull,
    sphere,
    '#e4f5ed',
    'Window glint',
    -0.19,
    3.73,
    1.18,
    0.16,
    0.075,
    0.025,
  ).rotation.z = 0.5;
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    mesh(
      hull,
      sphere,
      '#f7e3b5',
      'Window bolt',
      Math.cos(angle) * 0.65,
      3.51 + Math.sin(angle) * 0.65,
      1.13,
      0.04,
    );
  }
  for (const side of [-1, 1]) {
    const fin = mesh(
      hull,
      cube,
      '#8dafb6',
      'Steady fin',
      side * 1.22,
      1.15,
      0,
      0.4,
      1.8,
      1.08,
    );
    fin.rotation.z = -side * 0.3;
    mesh(
      hull,
      cube,
      '#69768c',
      'Landing foot',
      side * 1.48,
      0.17,
      0,
      0.85,
      0.23,
      1.3,
    );
  }
  mesh(
    hull,
    new THREE.CylinderGeometry(0.6, 0.8, 0.52, 24),
    '#67758c',
    'Engine bell',
    0,
    0.58,
    0,
  );
  const panel = mesh(
    hull,
    cube,
    '#596b7c',
    'Control panel socket',
    -0.55,
    2.02,
    0.94,
    0.64,
    0.7,
    0.18,
  );
  panel.rotation.y = -0.22;
  const controls = new THREE.Group();
  controls.name = 'Repaired control panel';
  hull.add(controls);
  for (let i = 0; i < 3; i++)
    mesh(
      controls,
      sphere,
      ['#e7b97a', '#83c8b4', '#bcb1de'][i],
      'Panel button ' + i,
      -0.68 + (i % 2) * 0.25,
      2.2 - Math.floor(i / 2) * 0.28,
      1.07,
      0.1,
      0.1,
      0.04,
    );
  const looseWire = mesh(
    hull,
    new THREE.TorusGeometry(0.22, 0.032, 8, 20, Math.PI * 1.5),
    '#b4836b',
    'Loose panel wire',
    -0.55,
    2.04,
    1.08,
  );
  mesh(
    hull,
    cube,
    '#b6c5c3',
    'Fuel gauge rim',
    0.51,
    2.16,
    0.98,
    0.46,
    1,
    0.17,
  );
  mesh(
    hull,
    cube,
    '#617889',
    'Fuel gauge empty',
    0.51,
    2.16,
    1.08,
    0.31,
    0.82,
    0.035,
  );
  const fuel = mesh(
    hull,
    cube,
    '#91c49c',
    'Full fuel gauge',
    0.51,
    2.16,
    1.115,
    0.29,
    0.78,
    0.028,
  );
  for (let i = 0; i < 3; i++)
    mesh(
      hull,
      cube,
      '#d6e5d3',
      'Fuel gauge mark',
      0.51,
      1.9 + i * 0.25,
      1.14,
      0.3,
      0.022,
      0.022,
    );
  mesh(
    hull,
    cube,
    '#616c83',
    'Battery socket',
    0,
    1.22,
    1.04,
    0.62,
    0.44,
    0.12,
  );
  const battery = mesh(
    hull,
    cube,
    '#e5c465',
    'Connected star battery',
    0,
    1.22,
    1.13,
    0.5,
    0.32,
    0.1,
  );
  mesh(
    battery,
    sphere,
    '#fff0b9',
    'Battery light',
    0,
    0,
    0.6,
    0.15,
    0.19,
    0.11,
  );
  const flame = new THREE.Group();
  flame.name = 'Engine flame';
  hull.add(flame);
  mesh(
    flame,
    new THREE.ConeGeometry(0.43, 1.8, 24),
    '#e9bc74',
    'Warm exhaust',
    0,
    -0.35,
    0,
  ).rotation.z = Math.PI;
  mesh(
    flame,
    new THREE.ConeGeometry(0.25, 1.2, 24),
    '#fff0b8',
    'Soft exhaust centre',
    0,
    -0.1,
    0.05,
  ).rotation.z = Math.PI;
  flame.visible = false;
  let stage = -1;
  const setRepairStage = (rounds: number) => {
    const next = repairStage(rounds);
    if (next === stage) return;
    stage = next;
    controls.visible = stage >= 1;
    looseWire.visible = stage < 1;
    fuel.visible = stage >= 2;
    battery.visible = stage >= 3;
    hull.rotation.z = (3 - stage) * 0.075;
  };
  setRepairStage(initialStage);
  return { root, hull, window, rim, flame, setRepairStage };
}
