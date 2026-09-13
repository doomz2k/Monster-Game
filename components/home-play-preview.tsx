'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { createMonster } from '@/lib/monster-model';
import { BODY_SCALE } from '@/lib/appearance';
import { createCostume } from '@/lib/monster-outfit';
import { createFurniture } from '@/lib/furniture-model';
import { createHomeStage } from '@/lib/home-stage';
import { createCompanion } from '@/lib/companion-model';
import { homeActivity } from '@/lib/home-play';
import {
  furniturePosition,
  layoutFields,
  type FurnitureArea,
} from '@/lib/furniture-layout';
import { SHOP_ITEMS } from '@/lib/adventure';
import type { ProgressData } from '@/lib/learning';
import { graphicsPixelRatio } from '@/lib/graphics-quality';
import { useGamePreferences } from './game-preferences';

type Props = {
  progress: ProgressData;
  area: FurnitureArea;
  slot: number;
  playing: boolean;
  take: number;
};
export function HomePlayPreview(props: Props) {
  const host = useRef<HTMLDivElement>(null),
    state = useRef(props),
    redraw = useRef<() => void>(() => {});
  const { preferences, reducedMotion } = useGamePreferences(),
    tier = preferences.graphics === 'auto' ? 'balanced' : preferences.graphics;
  const {
    appearance,
    outfit,
    adventure: { companion },
  } = props.progress;
  useLayoutEffect(() => {
    state.current = props;
    redraw.current();
  }, [props]);
  useEffect(() => {
    if (!host.current) return;
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
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(36, 1, 0.1, 45);
    const timber = new THREE.TextureLoader().load('/textures/timber.png', () =>
      redraw.current(),
    );
    timber.colorSpace = THREE.SRGBColorSpace;
    const stage = createHomeStage(timber),
      objects = new THREE.Group();
    scene.add(stage.root, objects);
    const light = new THREE.DirectionalLight('#fff0d2', 3);
    light.position.set(-3, 8, 6);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.normalBias = 0.035;
    Object.assign(light.shadow.camera, {
      left: -9,
      right: 9,
      top: 12,
      bottom: -9,
      near: 0.1,
      far: 35,
    });
    scene.add(light, new THREE.HemisphereLight('#e7f4ff', '#96a579', 1.8));
    const hero = createMonster(appearance),
      actor = new THREE.Group(),
      actorScale = new THREE.Group();
    Object.values(outfit).forEach((id) => hero.root.add(createCostume(id)));
    actorScale.add(hero.root);
    actor.add(actorScale);
    scene.add(actor);
    const heroBounds = new THREE.Box3().setFromObject(hero.root),
      heroSize = heroBounds.getSize(new THREE.Vector3());
    const pet = companion ? createCompanion(companion) : null;
    if (pet) {
      pet.root.scale.setScalar(0.7);
      scene.add(pet.root);
    }
    const book = new THREE.Group(),
      picnic = new THREE.Group();
    hero.root.add(book, picnic);
    const propBox = (
      parent: THREE.Group,
      c: string,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }),
      );
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    };
    book.position.set(0, 0.96, 1.03);
    book.rotation.x = 0.35;
    propBox(book, '#a88cc3', 0, 0, 0, 1.1, 0.08, 0.65);
    propBox(book, '#fff3d5', -0.27, 0.06, 0, 0.5, 0.05, 0.58);
    propBox(book, '#fff3d5', 0.27, 0.06, 0, 0.5, 0.05, 0.58);
    const page = new THREE.Group();
    book.add(page);
    page.position.y = 0.1;
    propBox(page, '#fcebc5', 0.27, 0, 0, 0.5, 0.012, 0.58);
    for (const x of [-0.26, 0.26]) {
      const picture = new THREE.Mesh(
        new THREE.CircleGeometry(0.13, 16),
        new THREE.MeshStandardMaterial({
          color: x < 0 ? '#dfb163' : '#a5bd88',
          side: THREE.DoubleSide,
        }),
      );
      picture.rotation.x = -Math.PI / 2;
      picture.position.set(x, 0.092, 0);
      book.add(picture);
    }
    picnic.position.set(0, 1.1, 1);
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.46, 0.07, 28),
      new THREE.MeshStandardMaterial({ color: '#fff1d1' }),
    );
    picnic.add(plate);
    for (let i = 0; i < 3; i++) {
      const fruit = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 12, 10),
        new THREE.MeshStandardMaterial({
          color: ['#df906d', '#a3b96a', '#e9c477'][i],
        }),
      );
      fruit.position.set((i - 1) * 0.22, 0.13, 0);
      picnic.add(fruit);
    }
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.76, 0.8, 48),
      new THREE.MeshBasicMaterial({
        color: '#d6b951',
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    scene.add(ring);
    const drops = new THREE.Group();
    scene.add(drops);
    for (let i = 0; i < 10; i++) {
      const drop = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 8, 6),
        new THREE.MeshStandardMaterial({
          color: '#a7dce6',
          transparent: true,
          opacity: 0.85,
        }),
      );
      drops.add(drop);
    }
    let models = new Map<number, ReturnType<typeof createFurniture>>(),
      key = '',
      frame = 0,
      last = -1000,
      time = 0,
      take = -1,
      activityTime = 0,
      disposed = false;
    const target = new THREE.Vector3(),
      desired = new THREE.Vector3(),
      eye = new THREE.Vector3(),
      posePosition = new THREE.Vector3(),
      poseRotation = new THREE.Quaternion();
    let cameraReady = false,
      previousArea: FurnitureArea | null = null;
    const dispose = (root: THREE.Object3D, textures = false) => {
      const gs = new Set<THREE.BufferGeometry>(),
        ms = new Set<THREE.Material>(),
        ts = new Set<THREE.Texture>();
      root.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
          gs.add(o.geometry);
          (Array.isArray(o.material) ? o.material : [o.material]).forEach(
            (m) => {
              ms.add(m);
              if (textures && m instanceof THREE.MeshStandardMaterial) {
                if (m.map) ts.add(m.map);
                if (m.bumpMap) ts.add(m.bumpMap);
              }
            },
          );
        }
      });
      gs.forEach((g) => g.dispose());
      ms.forEach((m) => m.dispose());
      ts.forEach((t) => t.dispose());
    };
    const draw = (now: number) => {
      if (disposed || document.hidden) return;
      const {
          progress: p,
          area,
          slot,
          playing,
          take: currentTake,
        } = state.current,
        a = p.adventure,
        task = homeActivity(a, area, slot),
        pos = furniturePosition(slot, area === 'garden');
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      if (!reducedMotion) time += dt;
      if (currentTake !== take) {
        take = currentTake;
        activityTime = 0;
      } else if (playing && !reducedMotion) activityTime += dt;
      stage.setArea(area);
      const [items, turns] = layoutFields(area),
        nextKey = JSON.stringify([area, a[items], a[turns]]);
      if (key !== nextKey) {
        key = nextKey;
        dispose(objects);
        objects.clear();
        models = new Map();
        a[items].forEach((id, i) => {
          const item = SHOP_ITEMS.find((item) => item.id === id);
          if (!item) return;
          const m = createFurniture(id!, item.colour, timber),
            at = furniturePosition(i, area === 'garden');
          m.root.position.set(at.x, at.y, at.z);
          m.root.rotation.y = (a[turns][i] * Math.PI) / 2;
          objects.add(m.root);
          models.set(i, m);
        });
      }
      models.forEach((m, i) => {
        m.setLit(!a.unlit.includes(a[items][i]!));
        m.animate(time, reducedMotion, playing && i === slot);
      });
      const model = models.get(slot);
      const action = playing ? task?.action : undefined;
      const size =
        task?.id === 'swing'
          ? Math.min(0.5, 1.1 / heroSize.y, 0.93 / heroSize.x)
          : task?.id === 'bed'
            ? Math.min(0.56, 1.6 / heroSize.y)
            : Math.min(0.6, 1.4 / heroSize.y, 1.1 / heroSize.x);
      actorScale.scale.setScalar(size);
      if (playing && model) {
        model.root.updateMatrixWorld(true);
        model.seat.getWorldPosition(posePosition);
        model.seat.getWorldQuaternion(poseRotation);
        actor.position.copy(posePosition);
        if (action === 'sleep')
          actor.position.y += 0.65 * BODY_SCALE[appearance.shape][2] * size;
        actor.quaternion.copy(poseRotation);
      } else {
        actor.position.set(pos.x + 0.65, pos.y, pos.z + 0.72);
        actor.rotation.set(0, -0.3, 0);
      }
      hero.animate({
        delta: dt,
        time: playing ? activityTime : time,
        speed: 0,
        airborne: 0,
        celebrating: false,
        greeting: false,
        reducedMotion,
        homeActivity: action,
      });
      book.visible = action === 'read';
      picnic.visible = action === 'picnic';
      page.rotation.z = reducedMotion
        ? -0.6
        : -0.1 - (Math.sin(activityTime * 0.7) * 0.5 + 0.5) * 2.75;
      ring.position.set(pos.x, pos.y + 0.022, pos.z);
      ring.visible = !!task;
      drops.visible = action === 'splash';
      if (drops.visible) {
        drops.position.set(pos.x, pos.y + 0.94, pos.z);
        drops.children.forEach((d, i) => {
          const t = reducedMotion ? 0.35 : (activityTime * 0.7 + i / 10) % 1,
            angle = i * 2.39996;
          d.position.set(
            Math.cos(angle) * (0.15 + t * 0.45),
            Math.sin(t * Math.PI) * 0.65,
            Math.sin(angle) * (0.15 + t * 0.45),
          );
        });
      }
      if (pet) {
        pet.root.position.set(pos.x + 1, pos.y + 0.24, pos.z + 0.45);
        const resting =
          action === 'sleep' || action === 'read' || action === 'sit';
        pet.animate(time, 0, playing && !resting, reducedMotion, resting);
      }
      desired.set(
        pos.x * 0.68,
        0.72,
        area === 'garden' ? 7.85 + (pos.z - 7.85) * 0.65 : pos.z * 0.68,
      );
      if (!cameraReady || previousArea !== area || reducedMotion) {
        target.copy(desired);
        cameraReady = true;
      } else target.lerp(desired, 1 - Math.exp(-dt * 4));
      previousArea = area;
      const distance = camera.aspect < 1 ? 1.4 : 1;
      eye.set(3.7 * distance, 3.2 * distance, 5 * distance).add(target);
      camera.position.copy(eye);
      camera.lookAt(target);
      light.position.set(target.x - 3, 8, target.z + 5);
      light.target.position.copy(target);
      light.target.updateMatrixWorld();
      renderer.render(scene, camera);
    };
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (now - last >= 1000 / 30) draw(now);
    };
    redraw.current = () => draw(performance.now());
    const onVisible = () => {
      last = performance.now();
      redraw.current();
    };
    document.addEventListener('visibilitychange', onVisible);
    const resize = new ResizeObserver(([entry]) => {
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
    resize.observe(host.current);
    if (!reducedMotion) frame = requestAnimationFrame(loop);
    draw(performance.now());
    return () => {
      disposed = true;
      redraw.current = () => {};
      cancelAnimationFrame(frame);
      resize.disconnect();
      document.removeEventListener('visibilitychange', onVisible);
      dispose(scene, true);
      timber.dispose();
      light.shadow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [appearance, outfit, companion, tier, reducedMotion]);
  return (
    <figure
      className="home-play-preview"
      ref={host}
      aria-label="Your own monster playing with your furniture"
    >
      <span>Choose somewhere to play</span>
    </figure>
  );
}
