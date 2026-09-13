'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GamePicture } from './game-picture';
import { SPACE_OBJECTS } from '@/lib/space-learning';
import { createPlanet, disposePlanetScene } from '@/lib/planet-model';
import { PLANETS, type PlanetId } from '@/lib/observatory';
import { graphicsPixelRatio } from '@/lib/graphics-quality';
import { useGamePreferences } from './game-preferences';

/** Shared illustrated surfaces; card sizes remain schematic, with true comparisons in the observatory. */
export function SpaceObject({ id }: { id: string }) {
  const host = useRef<HTMLSpanElement>(null);
  const [rendered, setRendered] = useState(false);
  const item = SPACE_OBJECTS[id];
  const { preferences } = useGamePreferences();
  const tier =
    preferences.graphics === 'auto' ? 'balanced' : preferences.graphics;
  const planetary =
    id === 'sun' || id === 'moon' || PLANETS.some((p) => p.id === id);
  useEffect(() => {
    if (!host.current || !planetary) return;
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
    host.current.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(35, 1, 0.1, 30);
    const planet = createPlanet(
      id as PlanetId | 'sun' | 'moon',
      tier === 'simple',
    );
    planet.root.scale.setScalar(item.size ?? 1);
    scene.add(
      planet.root,
      new THREE.HemisphereLight('#fff7e1', '#7186a2', 1.7),
    );
    const light = new THREE.DirectionalLight('#fff3db', 2.4);
    light.position.set(-3, 4, 5);
    scene.add(light);
    const resize = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (!width || !height) return;
      renderer.setPixelRatio(
        graphicsPixelRatio(tier, width, height, devicePixelRatio),
      );
      renderer.setSize(width, height);
      camera.aspect = width / height;
      const radius =
        (item.size ?? 1) *
        (id === 'saturn' ? 2.15 : id === 'uranus' ? 1.65 : 1);
      camera.position.set(
        0,
        0.3,
        Math.max(
          4.6,
          (radius / (Math.tan((Math.PI * 35) / 360) * camera.aspect)) * 1.1,
        ),
      );
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      setRendered(true);
    });
    resize.observe(host.current);
    return () => {
      resize.disconnect();
      disposePlanetScene(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [id, item, planetary, tier]);
  return (
    <span className="space-object" ref={host} aria-hidden="true">
      {(!planetary || !rendered) && <GamePicture symbol={item?.icon ?? id} />}
    </span>
  );
}
