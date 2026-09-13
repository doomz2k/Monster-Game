'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { createFurniture } from '@/lib/furniture-model';
import { createHomeStage } from '@/lib/home-stage';
import {
  furniturePosition,
  layoutFields,
  type FurnitureArea,
} from '@/lib/furniture-layout';
import { SHOP_ITEMS, type AdventureProgress } from '@/lib/adventure';
import { graphicsPixelRatio } from '@/lib/graphics-quality';
import { useGamePreferences } from './game-preferences';

type Preview = {
  adventure: AdventureProgress;
  slot: number;
  item: string | null;
  tool: 'place' | 'turn' | 'remove';
  area: FurnitureArea;
};
export function FurniturePreview(props: Preview) {
  const host = useRef<HTMLDivElement>(null),
    state = useRef(props),
    repaint = useRef<() => void>(() => {});
  const { preferences, reducedMotion } = useGamePreferences(),
    tier = preferences.graphics === 'auto' ? 'balanced' : preferences.graphics;
  useLayoutEffect(() => {
    state.current = props;
    repaint.current();
  }, [props]);
  useEffect(() => {
    if (!host.current) return;
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
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
      repaint.current(),
    );
    timber.colorSpace = THREE.SRGBColorSpace;
    const sun = new THREE.DirectionalLight('#fff4db', 3);
    sun.position.set(-4, 9, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.normalBias = 0.04;
    Object.assign(sun.shadow.camera, {
      left: -9,
      right: 9,
      top: 12,
      bottom: -9,
      near: 0.1,
      far: 35,
    });
    scene.add(sun, new THREE.HemisphereLight('#e7f2ff', '#8b9674', 1.8));
    const stage = createHomeStage(timber),
      objects = new THREE.Group(),
      guides = new THREE.Group();
    scene.add(stage.root, objects, guides);
    const marks: Array<{
      ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
      label: THREE.Sprite;
    }> = [];
    for (let i = 0; i < 6; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.72, 0.77, 32),
        new THREE.MeshBasicMaterial({
          color: '#96ad92',
          transparent: true,
          opacity: 0.75,
          depthWrite: false,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      guides.add(ring);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#fffae5';
      ctx.beginPath();
      ctx.arc(32, 32, 27, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#496153';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), 32, 34);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const label = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: texture, depthTest: false }),
      );
      label.scale.set(0.42, 0.42, 1);
      label.renderOrder = 20;
      guides.add(label);
      marks.push({ ring, label });
    }
    let models: ReturnType<typeof createFurniture>[] = [],
      ghost: THREE.Group | null = null,
      key = '',
      frame = 0,
      last = -1000,
      elapsed = 0,
      disposed = false;
    const disposeMeshes = (group: THREE.Object3D) => {
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      group.traverse((o) => {
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
    const draw = (now: number) => {
      if (disposed || document.hidden) return;
      const { adventure: a, slot, item, tool, area } = state.current;
      const held = SHOP_ITEMS.find((c) => c.id === item);
      const garden = area === 'garden',
        [itemsKey, turnsKey] = layoutFields(area);
      stage.setArea(area);
      camera.position.set(6.5, 6.6, garden ? 15.4 : 8);
      camera.lookAt(0, 0.35, garden ? 7.1 : 0);
      const nextKey = JSON.stringify([
        a.furniture,
        a.furnitureTurns,
        a.gardenFurniture,
        a.gardenTurns,
        a.unlit,
        item,
        tool,
      ]);
      if (nextKey !== key) {
        key = nextKey;
        disposeMeshes(objects);
        objects.clear();
        models = [];
        ghost = null;
        for (const [listKey, angleKey] of [
          layoutFields('house'),
          layoutFields('garden'),
        ])
          a[listKey].forEach((id, i) => {
            const definition = SHOP_ITEMS.find((c) => c.id === id);
            if (!definition) return;
            const model = createFurniture(
              definition.id,
              definition.colour,
              timber,
            );
            model.setLit(!a.unlit.includes(definition.id));
            model.root.userData.area =
              definition.kind === 'garden' ? 'garden' : 'house';
            const p = furniturePosition(i, definition.kind === 'garden');
            model.root.position.set(p.x, p.y, p.z);
            model.root.rotation.y = ((a[angleKey][i] ?? 0) * Math.PI) / 2;
            objects.add(model.root);
            models.push(model);
          });
        if (tool === 'place' && held) {
          ghost = createFurniture(held.id, held.colour, timber).root;
          ghost.traverse((o) => {
            if (o instanceof THREE.Mesh) {
              o.castShadow = false;
              o.material.transparent = true;
              o.material.opacity = 0.42;
              o.material.depthWrite = false;
            }
          });
          objects.add(ghost);
        }
      }
      marks.forEach(({ ring, label }, i) => {
        const p = furniturePosition(i, garden);
        ring.position.set(p.x, p.y + 0.02, p.z);
        ring.material.color.set(i === slot ? '#d5a937' : '#91a28b');
        ring.material.opacity = i === slot ? 1 : 0.5;
        label.position.set(p.x, p.y + 0.3, p.z + 0.8);
        label.scale.setScalar(i === slot ? 0.75 : 0.6);
      });
      if (ghost) {
        const p = furniturePosition(slot, garden);
        ghost.position.set(p.x, p.y, p.z);
        const previous = a[itemsKey].indexOf(item);
        ghost.rotation.y =
          ((previous >= 0 ? a[turnsKey][previous] : 0) * Math.PI) / 2;
        ghost.visible = a[itemsKey][slot] !== item;
      }
      elapsed += Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      models.forEach((m) => {
        m.root.visible = m.root.userData.area === area;
        m.animate(elapsed, reducedMotion);
      });
      renderer.render(scene, camera);
    };
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (now - last >= 1000 / 30) draw(now);
    };
    repaint.current = () => draw(performance.now());
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
      repaint.current = () => {};
      cancelAnimationFrame(frame);
      observer.disconnect();
      disposeMeshes(scene);
      marks.forEach(({ label }) => {
        label.material.map?.dispose();
        label.material.dispose();
      });
      timber.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [tier, reducedMotion]);
  return (
    <figure
      className="furniture-preview"
      ref={host}
      aria-label="Your furnished house and garden, with numbered spaces matching the placement buttons"
    />
  );
}
