'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  PLANETS,
  modelOrbit,
  planetComparison,
  type PlanetId,
  type ObservatoryView,
} from '@/lib/observatory';
import { createPlanet, disposePlanetScene } from '@/lib/planet-model';
import { graphicsPixelRatio } from '@/lib/graphics-quality';
import { useGamePreferences } from './game-preferences';
import { PlanetPicture } from './planet-picture';

type Props = { id: PlanetId; view: ObservatoryView; active: boolean };
export function ObservatoryStage(props: Props) {
  const host = useRef<HTMLDivElement>(null),
    state = useRef(props),
    invalidate = useRef(() => {});
  const [available, setAvailable] = useState(false);
  const { preferences, reducedMotion } = useGamePreferences();
  const tier =
    preferences.graphics === 'auto' ? 'balanced' : preferences.graphics;
  useLayoutEffect(() => {
    state.current = props;
    invalidate.current();
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
    host.current.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight('#e4f5ff', '#36445e', 2));
    const light = new THREE.DirectionalLight('#fff4dc', 2.8);
    light.position.set(-5, 5, 7);
    scene.add(light);
    const planets = PLANETS.map((p) => createPlanet(p.id, tier === 'simple')),
      sun = createPlanet('sun', tier === 'simple'),
      earth = createPlanet('earth', tier === 'simple');
    scene.add(...planets.map((p) => p.root), sun.root, earth.root);
    const tracks = new THREE.Group();
    scene.add(tracks);
    const trackMat = new THREE.LineBasicMaterial({
      color: '#8b9fcb',
      transparent: true,
      opacity: 0.25,
    });
    for (let i = 0; i < 8; i++) {
      const r = modelOrbit(i, 0).radius;
      const points = Array.from(
        { length: 129 },
        (_, j) =>
          new THREE.Vector3(
            Math.cos((j / 128) * Math.PI * 2) * r,
            0,
            Math.sin((j / 128) * Math.PI * 2) * r,
          ),
      );
      tracks.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          trackMat,
        ),
      );
    }
    const focusRing = new THREE.Mesh(
      new THREE.RingGeometry(0.53, 0.57, 48),
      new THREE.MeshBasicMaterial({
        color: '#ffe8a0',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      }),
    );
    focusRing.rotation.x = -Math.PI / 2;
    scene.add(focusRing);
    const starCount = tier === 'simple' ? 80 : 220,
      points = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const a = i * 2.39996,
        b = Math.sin(i * 9.2);
      points[i * 3] = Math.cos(a) * 20;
      points[i * 3 + 1] = b * 12;
      points[i * 3 + 2] = -18 + Math.sin(a) * 8;
    }
    const stars = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.BufferAttribute(points, 3),
      ),
      new THREE.PointsMaterial({
        color: '#cddaf8',
        size: 0.055,
        transparent: true,
        opacity: 0.65,
      }),
    );
    scene.add(stars);
    let seconds = 0,
      last = 0,
      painted = 0,
      frame = 0,
      dirty = true;
    invalidate.current = () => {
      dirty = true;
    };
    let firstFrame = true;
    const draw = () => {
      const { id, view } = state.current,
        index = PLANETS.findIndex((p) => p.id === id);
      tracks.visible = focusRing.visible = sun.root.visible = view === 'orbits';
      earth.root.visible = view === 'sizes';
      sun.root.scale.setScalar(0.58);
      sun.animate(seconds);
      planets.forEach((p, i) => {
        p.root.visible = view === 'orbits' || i === index;
        p.root.position.set(0, 0, 0);
        p.root.scale.setScalar(1);
        p.root.rotation.x =
          view !== 'sizes' && PLANETS[i].id === 'saturn' ? 0.45 : 0;
        p.root.rotation.y =
          view !== 'sizes' && PLANETS[i].id === 'uranus' ? 0.45 : 0;
        const rings = p.root.getObjectByName('planet-rings');
        if (rings) rings.visible = view !== 'sizes';
        p.root.rotation.z =
          view === 'sizes'
            ? 0
            : PLANETS[i].id === 'uranus'
              ? 1.706
              : PLANETS[i].id === 'saturn'
                ? 0.47
                : 0.13;
        p.animate(seconds);
        if (view === 'orbits') {
          const pos = modelOrbit(i, seconds);
          p.root.position.set(pos.x, 0, pos.z);
          p.root.scale.setScalar(i < 4 ? 0.22 : 0.32);
        }
      });
      if (view === 'orbits') {
        const pos = modelOrbit(index, seconds);
        focusRing.position.set(pos.x, 0.04, pos.z);
        const fit = Math.max(1, 1 / camera.aspect);
        camera.position.set(0, 18 * fit, 14 * fit);
        camera.lookAt(0, 0, 0);
      } else if (view === 'sizes') {
        const sizes = planetComparison(id);
        planets[index].root.position.x = 1.7;
        planets[index].root.scale.setScalar(sizes.planet);
        earth.root.position.set(-1.7, 0, 0);
        earth.root.scale.setScalar(sizes.earth);
        earth.animate(seconds);
        // Equatorial comparison uses face-on discs; Saturn's ring is outside the measured body.
        camera.position.set(0, 0.1, Math.max(7.8, 13 / camera.aspect));
        camera.lookAt(0, 0, 0);
      } else {
        camera.position.set(
          0,
          0.2,
          (id === 'saturn' ? 6.8 : 4.8) * Math.max(1, 0.95 / camera.aspect),
        );
        camera.lookAt(0, 0, 0);
      }
      renderer.render(scene, camera);
      if (firstFrame) {
        firstFrame = false;
        setAvailable(true);
      }
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
    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const active = state.current.active && !document.hidden;
      if (active && !reducedMotion) seconds += dt;
      if (active && (dirty || (!reducedMotion && now - painted >= 1000 / 30))) {
        draw();
        dirty = false;
        painted = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      disposePlanetScene(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      invalidate.current = () => {};
    };
  }, [tier, reducedMotion]);
  return (
    <figure
      className={'observatory-stage stage-' + props.view}
      ref={host}
      aria-label={
        props.view === 'sizes'
          ? 'Earth and ' + props.id + ', equatorial widths at the same scale'
          : props.view === 'orbits'
            ? 'Eight planets orbiting the Sun in a compressed teaching model'
            : 'An illustrated close-up of ' + props.id
      }
    >
      {!available && (
        <div className="observatory-fallback">
          {props.view === 'sizes' ? (
            <div className="fallback-comparison">
              <div>
                <span
                  style={{
                    width: (planetComparison(props.id).earth / 0.9) * 100 + '%',
                  }}
                >
                  <PlanetPicture id="earth" rings={false} />
                </span>
              </div>
              <div>
                <span
                  style={{
                    width:
                      (planetComparison(props.id).planet / 0.9) * 100 + '%',
                  }}
                >
                  <PlanetPicture id={props.id} rings={false} />
                </span>
              </div>
            </div>
          ) : props.view === 'orbits' ? (
            <div className="fallback-planets">
              {PLANETS.map((p, i) => (
                <div key={p.id}>
                  <PlanetPicture id={p.id} />
                  <span>
                    {i + 1} · {p.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <PlanetPicture id={props.id} />
          )}
        </div>
      )}
      {props.view === 'telescope' && (
        <div className="telescope-reticle" aria-hidden="true" />
      )}
      {props.view === 'sizes' && (
        <div className="comparison-names">
          <span>Earth</span>
          <span>{PLANETS.find((p) => p.id === props.id)?.name}</span>
        </div>
      )}
    </figure>
  );
}
