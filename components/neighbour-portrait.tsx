'use client';
import { useGamePreferences } from './game-preferences';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createNeighbour } from '@/lib/neighbours';
import { placeFor, type PlaceId } from '@/lib/adventure';
export function NeighbourPortrait({
  id,
  talking = false,
  isTalking,
}: {
  id: PlaceId;
  talking?: boolean;
  isTalking?: () => boolean;
}) {
  const { reducedMotion: reduced } = useGamePreferences();
  const host = useRef<HTMLDivElement>(null),
    speech = useRef(talking),
    speechState = useRef(isTalking);
  useEffect(() => {
    speech.current = talking;
    speechState.current = isTalking;
  }, [talking, isTalking]);
  useEffect(() => {
    if (!host.current) return;
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
    camera.position.set(0, 1.5, 5.4);
    camera.lookAt(0, 1.3, 0);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
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
    let frame = 0;
    const draw = (t: number) => {
      rig.animate(
        t / 1000,
        true,
        speechState.current?.() ?? speech.current,
        reduced,
      );
      renderer.render(scene, camera);
      if (!reduced) frame = requestAnimationFrame(draw);
    };
    const resize = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (!width || !height) return;
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
  }, [id, reduced]);
  return (
    <figure
      ref={host}
      className="neighbour-portrait"
      aria-label={placeFor(id).friend + ', your neighbour'}
    />
  );
}
