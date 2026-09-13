'use client';
import { useGamePreferences } from './game-preferences';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createNeighbour } from '@/lib/neighbours';
import { placeFor, type PlaceId } from '@/lib/adventure';
import { graphicsPixelRatio } from '@/lib/graphics-quality';
export function NeighbourPortrait({
  id,
  talking = false,
  isTalking,
  active = true,
}: {
  id: PlaceId;
  talking?: boolean;
  isTalking?: () => boolean;
  active?: boolean;
}) {
  const { reducedMotion: reduced, preferences } = useGamePreferences();
  const tier =
    preferences.graphics === 'auto' ? 'balanced' : preferences.graphics;
  const host = useRef<HTMLDivElement>(null),
    speech = useRef(talking),
    speechState = useRef(isTalking),
    playing = useRef(active);
  useEffect(() => {
    speech.current = talking;
    speechState.current = isTalking;
    playing.current = active;
  }, [talking, isTalking, active]);
  useEffect(() => {
    if (!host.current) return;
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
    camera.position.set(0, 1.5, 5.4);
    camera.lookAt(0, 1.3, 0);
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
    host.current.appendChild(renderer.domElement);
    const rig = createNeighbour(id);
    scene.add(rig.root);
    scene.add(new THREE.HemisphereLight('#fff3d6', '#8b89a8', 2));
    const light = new THREE.DirectionalLight('#fff4dc', 2.5);
    light.position.set(-3, 4, 5);
    scene.add(light);
    let frame = 0,
      drawable = false,
      lastFrame = -1000;
    const draw = (t: number) => {
      if (!reduced) frame = requestAnimationFrame(draw);
      if (
        !drawable ||
        !playing.current ||
        document.hidden ||
        (t !== 0 && t - lastFrame < 1000 / 30)
      )
        return;
      lastFrame = t;
      rig.animate(
        t / 1000,
        true,
        speechState.current?.() ?? speech.current,
        reduced,
      );
      renderer.render(scene, camera);
    };
    const resize = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      drawable = width > 0 && height > 0;
      if (!drawable) return;
      renderer.setPixelRatio(
        graphicsPixelRatio(tier, width, height, devicePixelRatio),
      );
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    });
    resize.observe(host.current);
    draw(0);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            m.dispose(),
          );
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [id, reduced, tier]);
  return (
    <figure
      ref={host}
      className="neighbour-portrait"
      aria-label={placeFor(id).friend + ', your neighbour'}
    />
  );
}
