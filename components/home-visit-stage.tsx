'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { createHomeStage } from '@/lib/home-stage';
import { createFurniture } from '@/lib/furniture-model';
import { furniturePosition } from '@/lib/furniture-layout';
import { createMonster } from '@/lib/monster-model';
import { createCostume } from '@/lib/monster-outfit';
import { createNeighbour } from '@/lib/neighbours';
import { createCompanion } from '@/lib/companion-model';
import { dancePose } from '@/lib/visit-motion';
import { SHOP_ITEMS } from '@/lib/adventure';
import { VISITORS, type VisitorId, type DanceMove } from '@/lib/home-visits';
import type { ProgressData } from '@/lib/learning';
import { graphicsPixelRatio } from '@/lib/graphics-quality';
import { useGamePreferences } from './game-preferences';
import { DancePicture } from './dance-picture';
import { GamePicture } from './game-picture';

type Props = {
  progress: ProgressData;
  visitor: VisitorId;
  active: boolean;
  demonstration: DanceMove | null;
  move: DanceMove | null;
  take: number;
  celebrating: boolean;
  isTalking: () => boolean;
};
export function HomeVisitStage(props: Props) {
  const host = useRef<HTMLElement>(null),
    state = useRef(props),
    redraw = useRef(() => {});
  const { preferences, reducedMotion } = useGamePreferences(),
    tier = preferences.graphics === 'auto' ? 'balanced' : preferences.graphics;
  const { progress: p, visitor } = props;
  const {
    appearance,
    outfit,
    adventure: { furniture, furnitureTurns, unlit, companion },
  } = p;
  useLayoutEffect(() => {
    state.current = props;
    redraw.current();
  }, [props]);
  useEffect(() => {
    if (!host.current) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: tier !== 'simple',
      });
    } catch {
      return;
    }
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = tier !== 'simple';
    renderer.shadowMap.type = THREE.PCFShadowMap;
    host.current.appendChild(renderer.domElement);
    let dirty = true,
      disposed = false;
    const timber = new THREE.TextureLoader().load(
      '/textures/timber.png',
      () => {
        if (!disposed) dirty = true;
      },
    );
    timber.colorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50),
      stage = createHomeStage(timber);
    stage.setArea('house');
    scene.add(stage.root);
    const patio = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 0.18, 2.5),
      new THREE.MeshStandardMaterial({
        color: '#d8bd98',
        map: timber,
        roughness: 0.85,
      }),
    );
    patio.position.set(0, 0.08, 3.45);
    patio.receiveShadow = true;
    scene.add(patio);
    const carpet = new THREE.Mesh(
      new THREE.BoxGeometry(5.7, 0.015, 2.05),
      new THREE.MeshStandardMaterial({ color: '#b3bd99', roughness: 1 }),
    );
    carpet.position.set(0, 0.182, 3.2);
    carpet.receiveShadow = true;
    scene.add(carpet);
    for (let i = 0; i < 5; i++) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.018, 1.9),
        new THREE.MeshStandardMaterial({ color: '#e3dcc2', roughness: 1 }),
      );
      stripe.position.set(-2.55 + i * 1.27, 0.188, 3.2);
      scene.add(stripe);
    }
    furniture.forEach((id, i) => {
      if (!id) return;
      const item = SHOP_ITEMS.find((s) => s.id === id);
      if (!item) return;
      const f = createFurniture(id, item.colour, timber),
        at = furniturePosition(i, false);
      f.root.position.set(at.x, at.y, at.z);
      f.root.rotation.y = (furnitureTurns[i] * Math.PI) / 2;
      f.setLit(!unlit.includes(id));
      scene.add(f.root);
    });
    const light = new THREE.DirectionalLight('#fff1d2', 3);
    light.position.set(-4, 8, 7);
    light.castShadow = tier !== 'simple';
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.normalBias = 0.03;
    Object.assign(light.shadow.camera, {
      left: -7,
      right: 7,
      top: 7,
      bottom: -7,
      near: 0.1,
      far: 30,
    });
    scene.add(light, new THREE.HemisphereLight('#e5f3fc', '#a29b7d', 2));
    const hero = createMonster(appearance);
    Object.values(outfit).forEach((id) => hero.root.add(createCostume(id)));
    const heroBounds = new THREE.Box3().setFromObject(hero.root),
      scale = 2.35 / Math.max(0.2, heroBounds.getSize(new THREE.Vector3()).y),
      actor = new THREE.Group(),
      bodyScale = new THREE.Group();
    bodyScale.scale.setScalar(scale);
    bodyScale.add(hero.root);
    actor.add(bodyScale);
    actor.position.set(-1.3, 0.2 - heroBounds.min.y * scale, 3.15);
    actor.rotation.y = 0.15;
    scene.add(actor);
    const friend = createNeighbour(visitor),
      guest = new THREE.Group();
    guest.add(friend.root);
    guest.position.set(1.3, 0.2, 3.1);
    guest.rotation.y = -0.15;
    scene.add(guest);
    const pet = companion ? createCompanion(companion) : null;
    if (pet) {
      pet.root.scale.setScalar(0.6);
      pet.root.position.set(-2.7, 0.45, 4);
      scene.add(pet.root);
    }
    let frame = 0,
      last = 0,
      lastDraw = 0,
      seconds = 0,
      moveAge = 10,
      lastTake = state.current.take,
      lastDemo: DanceMove | null = null,
      demoAge = 0;
    redraw.current = () => {
      dirty = true;
    };
    const draw = (dt: number) => {
      const s = state.current;
      if (s.take !== lastTake) {
        lastTake = s.take;
        moveAge = 0;
      }
      if (s.demonstration !== lastDemo) {
        lastDemo = s.demonstration;
        demoAge = 0;
      }
      const performing = s.move && moveAge < 1.6;
      hero.animate({
        time: seconds,
        delta: dt,
        speed: 0,
        airborne: 0,
        celebrating: s.celebrating && !performing,
        greeting: false,
        reducedMotion,
        homeActivity: performing ? 'dance' : undefined,
      });
      friend.animate(seconds, false, s.isTalking(), reducedMotion);
      dancePose(hero, performing ? s.move : null, moveAge, reducedMotion);
      dancePose(friend, s.demonstration, demoAge, reducedMotion);
      if (s.celebrating) {
        friend.arms.forEach(
          (arm, i) =>
            (arm.rotation.z =
              (i ? 1 : -1) *
              (2 + Math.sin(seconds * 4) * 0.1 * (reducedMotion ? 0 : 1))),
        );
      }
      pet?.animate(seconds, 0, s.celebrating, reducedMotion, !s.demonstration);
      const fit = Math.max(1, 1.15 / camera.aspect);
      camera.position.set(2.5 * fit, 4.8 * fit, 2 + 8.2 * fit);
      camera.lookAt(0, 1, 1.3);
      renderer.render(scene, camera);
    };
    const resize = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (!width || !height) return;
      renderer.setPixelRatio(
        graphicsPixelRatio(tier, width, height, devicePixelRatio),
      );
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      dirty = true;
    });
    resize.observe(host.current);
    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (state.current.active && !document.hidden) {
        seconds += reducedMotion ? 0 : dt;
        moveAge += dt;
        demoAge += dt;
        if (dirty || now - lastDraw >= 1000 / 30) {
          draw(dt);
          dirty = false;
          lastDraw = now;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      redraw.current = () => {};
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>(),
        textures = new Set<THREE.Texture>([timber]);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          geometries.add(o.geometry);
          (Array.isArray(o.material) ? o.material : [o.material]).forEach(
            (m) => {
              materials.add(m);
              Object.values(m).forEach((v) => {
                if (v instanceof THREE.Texture) textures.add(v);
              });
            },
          );
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      light.shadow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [
    appearance,
    outfit,
    furniture,
    furnitureTurns,
    unlit,
    companion,
    visitor,
    tier,
    reducedMotion,
  ]);
  return (
    <figure
      className="home-visit-stage"
      ref={host}
      aria-label={
        'Monster and ' +
        VISITORS.find((v) => v.id === visitor)?.name +
        ' together at your decorated home'
      }
    >
      <div className="home-visit-fallback">
        <DancePicture move={props.move ?? 'wiggle'} />
        <div>
          <GamePicture symbol={VISITORS.find((v) => v.id === visitor)!.icon} />
          {props.demonstration && <DancePicture move={props.demonstration} />}
        </div>
      </div>
      <div className="visiting-name-tags">
        <span>Monster</span>
        <span>{VISITORS.find((v) => v.id === visitor)?.name}</span>
      </div>
    </figure>
  );
}
