import * as THREE from 'three';
import type { FurnitureArea } from './furniture-layout';

/** Shared room and garden shell for decorating and playing. */
export function createHomeStage(timber: THREE.Texture) {
  const root = new THREE.Group(),
    house = new THREE.Group(),
    garden = new THREE.Group();
  root.add(house, garden);
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const block = (
    group: THREE.Group,
    colour: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    wood = false,
  ) => {
    const key = colour + wood;
    if (!materials.has(key))
      materials.set(
        key,
        new THREE.MeshStandardMaterial({
          color: colour,
          roughness: 0.85,
          map: wood ? timber : null,
        }),
      );
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      materials.get(key),
    );
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    group.add(m);
    return m;
  };
  block(house, '#e6cfaa', 0, 0.08, 0, 7.2, 0.18, 5.5, true);
  block(house, '#f7dec1', 0, 1.5, -2.55, 7.2, 2.7, 0.14);
  block(house, '#e8ccb0', -3.55, 1.5, 0, 0.14, 2.7, 5.2);
  block(house, '#fff2d9', 0, 0.28, -2.43, 7, 0.16, 0.08);
  block(house, '#fff2d9', -3.43, 0.28, 0, 0.08, 0.16, 5.1);
  for (const x of [-2, 2]) {
    block(house, '#9ac7ca', x, 1.75, -2.44, 1.3, 1.3, 0.05);
    block(house, '#fff4d9', x, 1.75, -2.38, 0.07, 1.3, 0.04);
    block(house, '#fff4d9', x, 1.75, -2.38, 1.3, 0.07, 0.04);
    block(house, '#e4a6ad', x - 0.75, 1.8, -2.3, 0.2, 1.6, 0.08);
    block(house, '#e4a6ad', x + 0.75, 1.8, -2.3, 0.2, 1.6, 0.08);
    block(house, '#cf9c84', x, 2.59, -2.28, 1.9, 0.09, 0.09, true);
    block(house, '#fff0d2', x, 1.05, -2.31, 1.65, 0.12, 0.2);
  }
  block(garden, '#a8c080', 0, -0.06, 7.9, 7.8, 0.22, 6);
  for (let i = 0; i < 14; i++) {
    block(garden, '#e6d8b6', -3.6 + i * 0.55, 0.43, 5.03, 0.15, 0.78, 0.11);
  }
  block(garden, '#d6c6a3', 0, 0.33, 5.1, 7.6, 0.09, 0.1);
  block(garden, '#d6c6a3', 0, 0.65, 5.1, 7.6, 0.09, 0.1);
  for (const x of [-3.6, 3.6])
    for (let i = 0; i < 5; i++) {
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.026, 0.24, 6),
        new THREE.MeshStandardMaterial({ color: '#698754' }),
      );
      stem.position.set(x, 0.17, 6 + i * 0.95);
      garden.add(stem);
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 10, 8),
        new THREE.MeshStandardMaterial({
          color: i % 2 ? '#e9c976' : '#dca2b4',
        }),
      );
      flower.position.set(x, 0.32, stem.position.z);
      garden.add(flower);
    }
  return {
    root,
    setArea(area: FurnitureArea) {
      house.visible = area === 'house';
      garden.visible = area === 'garden';
    },
  };
}
