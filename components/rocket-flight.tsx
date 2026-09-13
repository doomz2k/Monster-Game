'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createRocketModel } from '@/lib/rocket-model';
import { createMonster } from '@/lib/monster-model';
import { createCostume } from '@/lib/monster-outfit';
import { FlightJourney, flightPose } from '@/lib/rocket-story';
import { graphicsPixelRatio } from '@/lib/graphics-quality';
import type { Appearance } from '@/lib/appearance';
import type { Outfit } from '@/lib/wardrobe';
import type { Region } from '@/lib/adventure';
import { useGamePreferences } from './game-preferences';
import { GamePicture } from './game-picture';

export function RocketFlight({
  to,
  active,
  appearance,
  outfit,
  onArrive,
  onBack,
}: {
  to: Region;
  active: boolean;
  appearance: Appearance;
  outfit: Outfit;
  onArrive: () => void;
  onBack: () => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    journey = useRef(new FlightJourney()),
    live = useRef(active),
    arrive = useRef(onArrive);
  const [phase, setPhase] = useState(0),
    [unavailable, setUnavailable] = useState(false);
  const { preferences, reducedMotion } = useGamePreferences();
  const tier =
    preferences.graphics === 'auto' ? 'balanced' : preferences.graphics;
  useLayoutEffect(() => {
    live.current = active;
    arrive.current = onArrive;
  }, [active, onArrive]);
  const finish = () => {
    if (journey.current.arrive()) arrive.current();
  };
  const cancel = () => {
    journey.current.cancel();
    onBack();
  };
  useEffect(() => {
    if (!host.current) return;
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(39, 1, 0.1, 100);
    scene.background = new THREE.Color('#1e324c');
    camera.position.set(0, 2, 17);
    camera.lookAt(0, 1, 0);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      /* oxlint-disable-next-line react/react-compiler -- Report a browser WebGL creation failure with a usable landing fallback. */
      setUnavailable(true);
      return;
    }
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    host.current.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight('#eef4f2', '#73809b', 2.5));
    const sun = new THREE.DirectionalLight('#ffe8bd', 2.8);
    sun.position.set(-5, 8, 10);
    scene.add(sun);
    const ship = createRocketModel(3);
    scene.add(ship.root);
    const pilot = createMonster(appearance);
    pilot.root.scale.multiplyScalar(0.3);
    pilot.root.position.set(0, 2.99, 1.11);
    for (const id of Object.values(outfit)) {
      const piece = createCostume(id);
      if (piece) pilot.root.add(piece);
    }
    ship.hull.add(pilot.root);
    const glass = ship.window.material as THREE.MeshStandardMaterial;
    glass.transparent = true;
    glass.opacity = 0.2;
    glass.depthWrite = false;
    const planets = new THREE.Group();
    scene.add(planets);
    const sphere = new THREE.SphereGeometry(1, 32, 24);
    function planet(earth: boolean, x: number, y: number) {
      const group = new THREE.Group();
      group.position.set(x, y, -15);
      planets.add(group);
      const ball = new THREE.Mesh(
        sphere,
        new THREE.MeshStandardMaterial({
          color: earth ? '#63a5c3' : '#bbb6ca',
          roughness: 0.9,
        }),
      );
      ball.scale.setScalar(earth ? 4.3 : 3.6);
      group.add(ball);
      for (let i = 0; i < (earth ? 6 : 10); i++) {
        const a = i * 2.39996,
          r = 0.6 + (i % 3) * 0.7;
        const patch = new THREE.Mesh(
          earth ? sphere : new THREE.CircleGeometry(1, 28),
          new THREE.MeshStandardMaterial({
            color: earth ? '#8dbb96' : '#9593b1',
            roughness: 1,
          }),
        );
        patch.position.set(
          Math.cos(a) * r,
          Math.sin(a) * r,
          Math.sqrt((earth ? 4.3 : 3.6) ** 2 - r * r),
        );
        patch.scale.set(
          earth ? 0.8 : 0.35,
          earth ? 1.05 : 0.35,
          earth ? 0.09 : 1,
        );
        if (!earth) {
          patch.position.multiplyScalar(1.002);
          patch.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            patch.position.clone().normalize(),
          );
          const rim = new THREE.Mesh(
            new THREE.TorusGeometry(1, 0.065, 8, 28),
            new THREE.MeshStandardMaterial({ color: '#c7c0d0', roughness: 1 }),
          );
          patch.add(rim);
        }
        group.add(patch);
      }
      return group;
    }
    planet(to === 'moon', -6, -6);
    planet(to !== 'moon', 6, 5);
    const stars = new Float32Array(240 * 3);
    for (let i = 0; i < 240; i++) {
      stars[i * 3] = ((i * 73) % 240) / 6 - 20;
      stars[i * 3 + 1] = ((i * 47) % 200) / 7 - 14;
      stars[i * 3 + 2] = -20 - ((i * 29) % 10);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(stars, 3));
    scene.add(
      new THREE.Points(
        starGeometry,
        new THREE.PointsMaterial({
          color: '#fff0ce',
          size: 0.075,
          sizeAttenuation: true,
        }),
      ),
    );
    const platform = (x: number, moon: boolean) => {
      const group = new THREE.Group();
      group.position.x = x;
      scene.add(group);
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(2.15, 2.4, 0.3, 40),
        new THREE.MeshStandardMaterial({ color: moon ? '#86859f' : '#94b27e' }),
      );
      group.add(pad);
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(1.8, 0.045, 8, 40),
        new THREE.MeshStandardMaterial({ color: '#edcf8d' }),
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.18;
      group.add(rim);
      return group;
    };
    const source = platform(-1.7, to !== 'moon'),
      destination = platform(1.7, to === 'moon');
    let frame = 0,
      last = performance.now(),
      lastPhase = -1,
      dirty = true;
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const delta = now - last;
      last = now;
      if (!live.current || document.hidden) return;
      const progress = journey.current.advance(delta, true),
        pose = flightPose(progress, reducedMotion);
      const phaseChanged = pose.phase !== lastPhase;
      if (phaseChanged) {
        lastPhase = pose.phase;
        setPhase(pose.phase);
      }
      ship.root.position.set(pose.x, -3 + pose.y, 0);
      ship.root.rotation.z = pose.tilt;
      ship.flame.visible = pose.flame > 0;
      ship.flame.scale.y = pose.flame * (1 + Math.sin(now * 0.015) * 0.07);
      source.position.y = pose.sourceY;
      destination.position.y = pose.destinationY;
      if (!reducedMotion || dirty || phaseChanged)
        renderer.render(scene, camera);
      dirty = false;
      if (progress >= 1 && journey.current.arrive()) arrive.current();
    };
    const resize = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
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
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>(),
        textures = new Set<THREE.Texture>();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
          geometries.add(o.geometry);
          (Array.isArray(o.material) ? o.material : [o.material]).forEach(
            (m) => {
              materials.add(m);
              if (m instanceof THREE.MeshStandardMaterial) {
                if (m.map) textures.add(m.map);
                if (m.bumpMap) textures.add(m.bumpMap);
              }
            },
          );
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [to, appearance, outfit, reducedMotion, tier]);
  return (
    <section
      className="space-flight"
      hidden={!active}
      data-choice-scope
      aria-label={to === 'moon' ? 'Flying to the Moon' : 'Flying home'}
    >
      <div ref={host} className="flight-canvas" />
      <div className="flight-topline">
        <button className="back-control" onClick={cancel}>
          <b className="pad-key b-key">B</b> Back
        </button>
        <span>
          <GamePicture symbol={to === 'moon' ? '🌙' : '🏡'} />
          {to === 'moon' ? 'Moon meadow' : 'Our island'}
        </span>
      </div>
      <div className="flight-caption">
        <p>OUR LITTLE SPACE ADVENTURE</p>
        <h2>
          {unavailable
            ? 'Ready to land'
            : [
                'All aboard!',
                'Up we go!',
                'Through the stars…',
                to === 'moon' ? 'Hello, Moon!' : 'Hello, home!',
              ][phase]}
        </h2>
        <div
          className="flight-dots"
          aria-label={'Journey part ' + (phase + 1) + ' of 4'}
        >
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={i <= phase ? 'lit' : ''} />
          ))}
        </div>
      </div>
      <button data-game-choice className="flight-land" onClick={finish}>
        <b className="pad-key a-key">A</b>
        <GamePicture symbol={to === 'moon' ? '🌙' : '🏡'} />
        <span>Land now</span>
      </button>
    </section>
  );
}
