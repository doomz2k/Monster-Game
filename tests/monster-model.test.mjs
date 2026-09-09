import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createMonster } from '../lib/monster-model.ts';
import { createCostume } from '../lib/monster-outfit.ts';

function dispose(root) {
  const geometries = new Set(),
    materials = new Set(),
    textures = new Set();
  root.traverse((object) => {
    if (!object.isMesh) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      materials.add(material);
      if (material.bumpMap) textures.add(material.bumpMap);
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
}
const pose = (time, overrides = {}) => ({
  delta: 1 / 60,
  time,
  speed: 0,
  airborne: 0,
  celebrating: false,
  greeting: false,
  reducedMotion: false,
  ...overrides,
});

test('Monster geometry is finite and stays within its character rendering budget', () => {
  const monster = createMonster();
  try {
    assert.equal(monster.root.name, 'Monster');
    let triangles = 0,
      meshes = 0;
    monster.root.traverse((object) => {
      if (!object.isMesh) return;
      meshes++;
      const position = object.geometry.getAttribute('position');
      for (const value of position.array)
        assert.ok(Number.isFinite(value), object.name);
      triangles +=
        ((object.geometry.index?.count ?? position.count) / 3) *
        (object.isInstancedMesh ? object.count : 1);
    });
    assert.ok(
      triangles < 150000,
      'Character triangle budget exceeded: ' + triangles,
    );
    assert.ok(meshes < 100, 'Character draw budget exceeded: ' + meshes);
    const bounds = new THREE.Box3().setFromObject(monster.root);
    assert.ok(bounds.min.y >= 0 && bounds.max.y < 2.9);
    assert.ok(monster.root.getObjectByName('Short plush tufts').count > 500);
  } finally {
    dispose(monster.root);
  }
});
test('custom tummy and curved horn surfaces face outwards', () => {
  const monster = createMonster();
  try {
    const tummy = monster.root
      .getObjectByName('Soft blended tummy')
      .geometry.getAttribute('normal');
    let positive = 0;
    for (let i = 0; i < tummy.count; i++) if (tummy.getZ(i) > 0.4) positive++;
    assert.ok(positive / tummy.count > 0.9, 'Tummy must face the viewer');
    for (const side of [-1, 1]) {
      const horn = monster.root.getObjectByName(
        'Curved horn ' + (side === -1 ? 'left' : 'right'),
      ).geometry;
      const radial = new THREE.Vector3()
        .fromBufferAttribute(horn.getAttribute('position'), 0)
        .sub(new THREE.Vector3(side * 0.65, 2.19, -0.08));
      const normal = new THREE.Vector3().fromBufferAttribute(
        horn.getAttribute('normal'),
        0,
      );
      assert.ok(normal.dot(radial) > 0, 'Horn must not be inside out');
    }
  } finally {
    dispose(monster.root);
  }
});
test('blinking closes eyelids without flattening or moving the eye whites', () => {
  const monster = createMonster();
  try {
    const white = monster.root.getObjectByName('Eye white left'),
      initialScale = white.scale.clone(),
      initialPosition = white.position.clone();
    assert.ok(monster.eyes[0].upper.rotation.x < -1);
    monster.animate(pose(5.02));
    assert.ok(Math.abs(monster.eyes[0].upper.rotation.x) < 0.0001);
    assert.ok(Math.abs(monster.eyes[0].lower.rotation.x) < 0.0001);
    assert.ok(white.scale.equals(initialScale));
    assert.ok(white.position.equals(initialPosition));
    monster.animate(pose(5.4));
    assert.ok(monster.eyes[0].upper.rotation.x < -1);
  } finally {
    dispose(monster.root);
  }
});
test('walking, landing, waving and celebrations keep the rig and outfit transforms finite', () => {
  const monster = createMonster(),
    hat = createCostume('party');
  monster.root.add(hat);
  try {
    for (let frame = 0; frame < 240; frame++) {
      monster.animate(
        pose(frame / 60, {
          speed: frame < 120 ? 1 : 0,
          airborne: frame > 30 && frame < 60 ? 0.7 : 0,
          celebrating: frame > 150,
          greeting: frame < 30,
        }),
      );
      monster.root.updateMatrixWorld(true);
      monster.root.traverse((object) =>
        object.matrixWorld.elements.forEach((value) =>
          assert.ok(Number.isFinite(value), object.name),
        ),
      );
      assert.equal(hat.parent, monster.root);
      assert.ok(monster.root.scale.y > 0.9 && monster.root.scale.y < 1.1);
    }
    assert.ok(monster.arms[0].rotation.z > 1, 'Celebration raises the arm');
  } finally {
    dispose(monster.root);
  }
});
test('explorer hat openings leave space for both horns while keeping a solid brim', () => {
  const hat = createCostume('explorer');
  try {
    hat.updateMatrixWorld(true);
    const brim = hat.getObjectByName('Brim with horn openings');
    for (const side of [-1, 1]) {
      const ray = new THREE.Raycaster(
        new THREE.Vector3(side * 0.75, 3, -0.1),
        new THREE.Vector3(0, -1, 0),
      );
      assert.equal(ray.intersectObject(brim).length, 0);
    }
    const solid = new THREE.Raycaster(
      new THREE.Vector3(0, 3, 0.8),
      new THREE.Vector3(0, -1, 0),
    );
    assert.ok(solid.intersectObject(brim).length > 0);
  } finally {
    dispose(hat);
  }
});
