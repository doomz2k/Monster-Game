'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Plant } from '@/lib/adventure';
import { createGardenPlant, createGardenWildlife } from '@/lib/garden-models';
import { useGamePreferences } from './game-preferences';
import { graphicsPixelRatio } from '@/lib/graphics-quality';

export function GardenPreview({
  plots,
  spotlight,
}: {
  plots: Plant[];
  spotlight?: string;
}) {
  const host = useRef<HTMLDivElement>(null),
    { reducedMotion, preferences } = useGamePreferences();
  const tier =
    preferences.graphics === 'auto' ? 'balanced' : preferences.graphics;
  useEffect(() => {
    if (!host.current) return;
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(36, 1, 0.1, 30);
    camera.position.set(7.5, 7, 9);
    camera.lookAt(2.1, 0.3, 0.85);
    if (spotlight) {
      camera.position.set(2.1, 2.2, 3.5);
      camera.lookAt(0, 0.65, 0);
    }
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: tier !== 'simple',
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = tier !== 'simple';
    renderer.shadowMap.type = THREE.PCFShadowMap;
    host.current.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight('#fff5d8', '#6b7856', 2));
    const sun = new THREE.DirectionalLight('#fff1d3', 3);
    sun.position.set(-3, 8, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(
      tier === 'rich' ? 1024 : 512,
      tier === 'rich' ? 1024 : 512,
    );
    sun.shadow.normalBias = 0.04;
    scene.add(sun);
    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(7, 0.26, 4.7),
      new THREE.MeshStandardMaterial({ color: '#a5bb7d', roughness: 0.9 }),
    );
    ground.position.set(spotlight ? 0 : 2.1, -0.3, spotlight ? 0 : 0.85);
    if (spotlight) ground.scale.set(0.43, 1, 0.64);
    ground.receiveShadow = true;
    scene.add(ground);
    const models: ReturnType<typeof createGardenPlant>[] = [];
    for (let i = 0; i < (spotlight ? 1 : 6); i++) {
      const x = (i % 3) * 2.1,
        z = Math.floor(i / 3) * 1.7;
      const bed = new THREE.Mesh(
        new THREE.BoxGeometry(1.85, 0.24, 1.4),
        new THREE.MeshStandardMaterial({ color: '#b89164', roughness: 0.8 }),
      );
      bed.position.set(x, -0.08, z);
      bed.castShadow = bed.receiveShadow = true;
      scene.add(bed);
      const soil = new THREE.Mesh(
        new THREE.BoxGeometry(1.66, 0.07, 1.2),
        new THREE.MeshStandardMaterial({ color: '#725240', roughness: 1 }),
      );
      soil.position.set(x, 0.06, z);
      soil.receiveShadow = true;
      scene.add(soil);
      const plant = spotlight ? { seed: spotlight, water: 3 } : plots[i];
      if (plant) {
        const model = createGardenPlant(plant.seed, plant.water);
        model.root.position.set(x, 0.12, z);
        scene.add(model.root);
        models.push(model);
      }
    }
    const wildlife = createGardenWildlife(plots);
    scene.add(wildlife.root);
    let frame = 0,
      lastFrame = -1000;
    const draw = (t: number) => {
      if (!reducedMotion) frame = requestAnimationFrame(draw);
      if (document.hidden || (t !== 0 && t - lastFrame < 1000 / 30)) return;
      lastFrame = t;
      models.forEach((m, i) => m.animate(t / 1000 + i, reducedMotion));
      wildlife.animate(t / 1000, reducedMotion);
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      renderer.setPixelRatio(
        graphicsPixelRatio(tier, width, height, devicePixelRatio),
      );
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    });
    observer.observe(host.current);
    draw(0);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          geometries.add(o.geometry);
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            materials.add(m),
          );
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      sun.shadow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [plots, spotlight, reducedMotion, tier]);
  return (
    <figure
      className="garden-preview"
      ref={host}
      aria-label={
        spotlight
          ? 'A close look at your chosen flower'
          : 'Your growing garden and its little visitors'
      }
    />
  );
}
