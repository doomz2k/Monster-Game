import * as THREE from 'three';
import { DISCOVERIES } from './discovery-catalogue';

/** A single visual language for optional finds: a little open book and a golden star. */
export function createDiscoveryMarkers(
  height: (x: number, z: number) => number,
) {
  const island = new THREE.Group(),
    moon = new THREE.Group();
  island.name = 'Island discovery trail';
  moon.name = 'Moon discovery trail';
  const paper = new THREE.MeshStandardMaterial({
    color: '#fff4d4',
    roughness: 0.8,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: '#f6cf60',
    emissive: '#a46115',
    emissiveIntensity: 0.24,
    metalness: 0.22,
    roughness: 0.35,
  });
  const pageGeometry = new THREE.BoxGeometry(0.57, 0.07, 0.8),
    baseGeometry = new THREE.CylinderGeometry(0.7, 0.83, 0.18, 24);
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const angle = Math.PI / 2 + (i * Math.PI) / 5,
      radius = i % 2 ? 0.2 : 0.43;
    const x = Math.cos(angle) * radius,
      y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const starGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.045,
    bevelSize: 0.04,
    bevelSegments: 2,
    steps: 1,
  });
  const entries = DISCOVERIES.map((d, i) => {
    const root = new THREE.Group();
    root.position.set(d.x, d.region === 'moon' ? 0 : height(d.x, d.z), d.z);
    root.name = d.name;
    (d.region === 'moon' ? moon : island).add(root);
    const base = new THREE.Mesh(
      baseGeometry,
      new THREE.MeshStandardMaterial({ color: d.colour, roughness: 0.75 }),
    );
    base.position.y = 0.12;
    root.add(base);
    const book = new THREE.Group();
    root.add(book);
    for (const side of [-1, 1]) {
      const page = new THREE.Mesh(pageGeometry, paper);
      page.position.set(side * 0.25, 0.48, 0);
      page.rotation.z = -side * 0.16;
      book.add(page);
    }
    const star = new THREE.Mesh(starGeometry, gold);
    star.position.set(0, 1.25, 0);
    star.castShadow = true;
    root.add(star);
    return { id: d.id, root, book, star, phase: i * 0.7 };
  });
  return {
    island,
    moon,
    update(time: number, found: string[], reduced: boolean) {
      for (const e of entries) {
        const collected = found.includes(e.id);
        e.star.visible = !collected;
        e.book.scale.setScalar(collected ? 0.7 : 1);
        e.star.rotation.y = reduced ? 0.25 : time * 0.55 + e.phase;
        e.star.position.y =
          1.3 + (reduced ? 0 : Math.sin(time * 1.8 + e.phase) * 0.1);
      }
    },
  };
}
