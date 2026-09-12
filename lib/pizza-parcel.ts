import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** A toy cardboard pizza box held below Monster's face. No external texture. */
export function createPizzaParcel() {
  const root = new THREE.Group();
  root.name = 'Pizza delivery box';
  root.position.set(0, 1.16, 0.76);
  const card = new THREE.MeshStandardMaterial({
    color: '#dfb584',
    roughness: 0.85,
  });
  const lid = new THREE.MeshStandardMaterial({
    color: '#f4dbb2',
    roughness: 0.8,
  });
  const red = new THREE.MeshStandardMaterial({
    color: '#be6952',
    roughness: 0.8,
  });
  const cream = new THREE.MeshStandardMaterial({
    color: '#fff0bd',
    roughness: 0.8,
  });
  const geometry = new RoundedBoxGeometry(1, 1, 1, 2, 0.04);
  for (const [material, y, sx, sy, sz] of [
    [card, 0, 1.36, 0.17, 0.88],
    [lid, 0.1, 1.4, 0.055, 0.91],
  ] as const) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = y;
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
  }
  const badge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.008, 28),
    cream,
  );
  badge.position.set(0, 0.133, 0);
  root.add(badge);
  for (const [x, z] of [
    [-0.09, -0.06],
    [0.1, -0.03],
    [0, 0.12],
  ]) {
    const topping = new THREE.Mesh(
      new THREE.CylinderGeometry(0.057, 0.057, 0.009, 14),
      red,
    );
    topping.position.set(x, 0.14, z);
    root.add(topping);
  }
  const seal = new THREE.Mesh(geometry, red);
  seal.scale.set(0.24, 0.11, 0.025);
  seal.position.set(0, 0.04, 0.464);
  root.add(seal);
  return root;
}
