'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GamePicture } from './game-picture';
import { SPACE_OBJECTS } from '@/lib/space-learning';

/** Game-native planet models; schematic sizes, never a to-scale astronomy diagram. */
export function SpaceObject({ id }: { id: string }) {
  const host = useRef<HTMLSpanElement>(null);
  const item = SPACE_OBJECTS[id];
  useEffect(() => {
    if (!host.current || !item?.colour) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
    camera.position.set(0, 0.3, 5.4);
    camera.lookAt(0, 0, 0);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    host.current.appendChild(renderer.domElement);
    const globe = new THREE.Group();
    scene.add(globe);
    globe.scale.setScalar(item.size ?? 1);
    globe.rotation.z = id === 'uranus' ? 1.4 : 0.13;
    const material = new THREE.MeshStandardMaterial({
      color: item.colour,
      roughness: 0.9,
      emissive: id === 'sun' ? '#ac5410' : '#000000',
      emissiveIntensity: 0.8,
    });
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), material));
    if (['jupiter', 'saturn', 'venus', 'uranus', 'neptune'].includes(id)) {
      for (let i = 0; i < 9; i++) {
        const start = 0.25 + i * 0.29;
        const stripe = new THREE.Mesh(
          new THREE.SphereGeometry(
            1.004,
            40,
            4,
            0,
            Math.PI * 2,
            start,
            0.08 + (i % 3) * 0.035,
          ),
          new THREE.MeshStandardMaterial({
            color:
              id === 'jupiter' ? (i % 2 ? '#a66c49' : '#f0d4ae') : item.colour,
            roughness: 1,
            transparent: true,
            opacity: id === 'jupiter' ? 0.8 : 0.28,
          }),
        );
        globe.add(stripe);
      }
    }
    if (id === 'jupiter') {
      const spot = new THREE.Mesh(
        new THREE.SphereGeometry(1, 20, 12),
        new THREE.MeshStandardMaterial({ color: '#af543e' }),
      );
      spot.position.set(0.35, -0.32, 0.89);
      spot.scale.set(0.25, 0.11, 0.07);
      globe.add(spot);
    }
    if (id === 'saturn' || id === 'uranus') {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.2, id === 'saturn' ? 1.85 : 1.42, 80),
        new THREE.MeshStandardMaterial({
          color: '#d3c5a7',
          side: THREE.DoubleSide,
          transparent: true,
          opacity: id === 'saturn' ? 0.85 : 0.35,
          roughness: 1,
        }),
      );
      ring.rotation.x = -1.05;
      globe.add(ring);
    }
    if (id === 'earth') {
      for (let i = 0; i < 15; i++) {
        const a = i * 2.39996,
          y = Math.sin(i * 1.7) * 0.75,
          r = Math.sqrt(1 - y * y);
        const land = new THREE.Mesh(
          new THREE.SphereGeometry(1, 10, 8),
          new THREE.MeshStandardMaterial({
            color: i % 2 ? '#70a66e' : '#a1b67c',
            roughness: 1,
          }),
        );
        land.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
        land.scale.set(0.21, 0.3, 0.09);
        land.lookAt(land.position.clone().multiplyScalar(2));
        globe.add(land);
      }
    }
    if (id === 'moon' || id === 'mercury') {
      for (let i = 0; i < 23; i++) {
        const a = i * 2.39996,
          y = Math.sin(i * 1.9) * 0.88,
          r = Math.sqrt(1 - y * y);
        const crater = new THREE.Mesh(
          new THREE.TorusGeometry(0.055 + (i % 4) * 0.024, 0.015, 5, 14),
          new THREE.MeshStandardMaterial({ color: '#777982', roughness: 1 }),
        );
        crater.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
        crater.lookAt(crater.position.clone().multiplyScalar(2));
        globe.add(crater);
      }
    }
    scene.add(new THREE.HemisphereLight('#fff7e1', '#7186a2', 1.7));
    const light = new THREE.DirectionalLight('#fff3db', 2.4);
    light.position.set(-3, 4, 5);
    scene.add(light);
    const resize = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    });
    resize.observe(host.current);
    return () => {
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
  }, [id, item]);
  return (
    <span className="space-object" ref={host} aria-hidden="true">
      {!item?.colour && <GamePicture symbol={item?.icon ?? id} />}
    </span>
  );
}
