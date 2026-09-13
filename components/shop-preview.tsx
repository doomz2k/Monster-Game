'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { SHOP_ITEMS } from '@/lib/adventure';
import { createFurniture } from '@/lib/furniture-model';
import { createGardenPlant } from '@/lib/garden-models';
import { graphicsPixelRatio } from '@/lib/graphics-quality';
import { useGamePreferences } from './game-preferences';
import { ShopPicture } from './shop-picture';

export function ShopPreview({ id }: { id: string }) {
  const host = useRef<HTMLDivElement>(null),
    selected = useRef(id),
    redraw = useRef<() => void>(() => {});
  const { preferences, reducedMotion } = useGamePreferences(),
    tier = preferences.graphics === 'auto' ? 'balanced' : preferences.graphics;
  useLayoutEffect(() => {
    selected.current = id;
    redraw.current();
  }, [id]);
  useEffect(() => {
    if (!host.current) return;
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
    camera.position.set(2.8, 2.7, 4.5);
    camera.lookAt(0, 0.8, 0);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = tier !== 'simple';
    renderer.shadowMap.type = THREE.PCFShadowMap;
    host.current.appendChild(renderer.domElement);
    const timber = new THREE.TextureLoader().load('/textures/timber.png', () =>
      redraw.current(),
    );
    timber.colorSpace = THREE.SRGBColorSpace;
    const light = new THREE.DirectionalLight('#fff0d4', 3);
    light.position.set(-3, 7, 5);
    light.castShadow = true;
    light.shadow.mapSize.set(512, 512);
    light.shadow.normalBias = 0.04;
    scene.add(light, new THREE.HemisphereLight('#e8f5ff', '#a2ac84', 1.8));
    const stage = new THREE.Mesh(
      new THREE.CylinderGeometry(1.55, 1.6, 0.15, 40),
      new THREE.MeshStandardMaterial({ color: '#e4d8b8', roughness: 0.9 }),
    );
    stage.position.y = -0.1;
    stage.receiveShadow = true;
    scene.add(stage);
    const contents = new THREE.Group();
    scene.add(contents);
    let model:
        | ReturnType<typeof createFurniture>
        | ReturnType<typeof createGardenPlant>
        | null = null,
      current = '',
      frame = 0,
      last = -1000,
      elapsed = 0,
      disposed = false;
    const disposeMeshes = (root: THREE.Object3D) => {
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      root.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          geometries.add(o.geometry);
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            materials.add(m),
          );
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    };
    const draw = (t: number) => {
      if (document.hidden || disposed) return;
      if (current !== selected.current) {
        current = selected.current;
        disposeMeshes(contents);
        contents.clear();
        const item = SHOP_ITEMS.find((item) => item.id === current);
        if (!item) return;
        model =
          item.kind === 'seed'
            ? createGardenPlant(item.id, 3)
            : createFurniture(item.id, item.colour, timber);
        model.animate(0, true);
        const bounds = new THREE.Box3().setFromObject(model.root),
          size = bounds.getSize(new THREE.Vector3()),
          scale = 1.85 / Math.max(size.x, size.y, size.z);
        model.root.scale.setScalar(scale);
        model.root.position.y = -bounds.min.y * scale + 0.03;
        contents.add(model.root);
        if (item.kind === 'seed') {
          const bed = new THREE.Mesh(
            new THREE.CylinderGeometry(0.62, 0.56, 0.18, 28),
            new THREE.MeshStandardMaterial({
              color: '#a68660',
              roughness: 0.9,
            }),
          );
          bed.position.y = 0.03;
          contents.add(bed);
        }
      }
      elapsed += Math.min(0.05, Math.max(0, (t - last) / 1000));
      last = t;
      contents.rotation.y = reducedMotion
        ? -0.25
        : -0.25 + Math.sin(elapsed * 0.22) * 0.18;
      model?.animate(elapsed, reducedMotion);
      renderer.render(scene, camera);
    };
    const loop = (t: number) => {
      frame = requestAnimationFrame(loop);
      if (t - last >= 1000 / 30) draw(t);
    };
    redraw.current = () => draw(performance.now());
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      renderer.setPixelRatio(
        graphicsPixelRatio(tier, width, height, devicePixelRatio),
      );
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      draw(performance.now());
    });
    observer.observe(host.current);
    if (!reducedMotion) frame = requestAnimationFrame(loop);
    draw(performance.now());
    return () => {
      disposed = true;
      redraw.current = () => {};
      cancelAnimationFrame(frame);
      observer.disconnect();
      disposeMeshes(scene);
      timber.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [reducedMotion, tier]);
  return (
    <figure
      className="shop-preview"
      ref={host}
      aria-label={
        'Close-up of ' +
        (SHOP_ITEMS.find((item) => item.id === id)?.name ?? 'your choice')
      }
    >
      <ShopPicture id={id} />
    </figure>
  );
}
