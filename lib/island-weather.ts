import * as THREE from 'three';
import type { GraphicsTier } from './graphics-quality';
import { PUDDLES, type WeatherSample } from './weather';

const DROP_COUNTS = { rich: 300, balanced: 180, simple: 72 };
/** One rain draw call, eight terrain-following puddles and a bounded splash pool. */
export function createIslandWeather(height: (x: number, z: number) => number) {
  const root = new THREE.Group();
  root.name = 'Gentle rain, puddles and rainbow';
  const uniforms = { wet: { value: 0 }, time: { value: 0 } };
  const puddleMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms,
    vertexShader:
      'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `
      uniform float wet;uniform float time;varying vec2 vUv;
      void main(){
        vec2 p=(vUv-.5)*2.;float a=atan(p.y,p.x);
        float d=length(p)/( .92+.045*sin(a*3.)+.025*cos(a*7.));
        d/=.65+wet*.35;
        float alpha=(1.-smoothstep(.9,1.,d))*wet*.72;
        float edge=smoothstep(.78,.9,d)*(1.-smoothstep(.91,1.,d));
        float gleam=pow(max(0.,sin(p.x*3.+p.y*8.+.7)),18.)*.24;
        vec3 c=mix(vec3(.33,.59,.64),vec3(.77,.9,.9),gleam+edge*.48);
        gl_FragColor=vec4(c,alpha);
        #include <colorspace_fragment>
      }`,
  });
  const puddles = new THREE.Group();
  root.add(puddles);
  for (const p of PUDDLES) {
    const geometry = new THREE.CircleGeometry(1, 48);
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = p.x + positions.getX(i) * p.radius,
        z = p.z + positions.getZ(i) * p.radius * p.stretch;
      positions.setXYZ(i, x, height(x, z) + 0.075, z);
    }
    geometry.computeVertexNormals();
    const surface = new THREE.Mesh(geometry, puddleMaterial);
    surface.name = `Puddle at ${p.x}, ${p.z}`;
    surface.renderOrder = 2;
    puddles.add(surface);
  }
  const rainPositions = new Float32Array(DROP_COUNTS.rich * 6),
    rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(rainPositions, 3),
  );
  const rainMaterial = new THREE.LineBasicMaterial({
    color: '#d4edf0',
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const rain = new THREE.LineSegments(rainGeometry, rainMaterial);
  rain.frustumCulled = false;
  root.add(rain);
  const rainbow = new THREE.Group();
  rainbow.position.set(0, -0.8, -7);
  rainbow.name = 'After-shower rainbow';
  root.add(rainbow);
  const rainbowMaterials: THREE.MeshBasicMaterial[] = [];
  [
    '#e89290',
    '#eab078',
    '#ecdb86',
    '#8bc6a2',
    '#92c7db',
    '#a3add4',
    '#bca1d4',
  ].forEach((c, i) => {
    const material = new THREE.MeshBasicMaterial({
      color: c,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
    });
    rainbowMaterials.push(material);
    rainbow.add(
      new THREE.Mesh(
        new THREE.RingGeometry(
          5.6 - (i + 1) * 0.19,
          5.6 - i * 0.19,
          80,
          1,
          0,
          Math.PI,
        ),
        material,
      ),
    );
  });
  const ringGeometry = new THREE.RingGeometry(0.83, 1, 32);
  ringGeometry.rotateX(-Math.PI / 2);
  const dropletGeometry = new THREE.SphereGeometry(0.065, 6, 5),
    dropletMaterial = new THREE.MeshBasicMaterial({ color: '#c4e5e9' });
  const splashes = Array.from({ length: 10 }, () => {
    const group = new THREE.Group(),
      material = new THREE.MeshBasicMaterial({
        color: '#d3eeeb',
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      ring = new THREE.Mesh(ringGeometry, material),
      drops = Array.from(
        { length: 6 },
        () => new THREE.Mesh(dropletGeometry, dropletMaterial),
      );
    group.add(ring, ...drops);
    group.visible = false;
    root.add(group);
    return { group, ring, drops, material, age: 2, strength: 1 };
  });
  let nextSplash = 0,
    elapsed = 0,
    rainAnchorX = Infinity,
    rainAnchorZ = Infinity;
  const floors = new Float32Array(DROP_COUNTS.rich),
    sheltered = new Uint8Array(DROP_COUNTS.rich);
  const dropBase = Array.from({ length: DROP_COUNTS.rich }, (_, i) => ({
    x: ((i * 31.73) % 44) - 22,
    z: ((i * 17.19) % 44) - 22,
    phase: ((i * 0.618034) % 1) * 14,
  }));
  return {
    root,
    splash(x: number, z: number, landed: boolean) {
      const splash = splashes[nextSplash++ % splashes.length];
      splash.group.position.set(x, height(x, z) + 0.105, z);
      splash.age = 0;
      splash.strength = landed ? 1.5 : 0.8;
    },
    update(
      weather: WeatherSample,
      dt: number,
      active: boolean,
      reduced: boolean,
      player: { x: number; z: number },
      tier: GraphicsTier,
      shelters: ReadonlyArray<{ x: number; z: number; r: number }>,
    ) {
      const step =
        active && Number.isFinite(dt) ? Math.max(0, Math.min(0.1, dt)) : 0;
      if (!reduced) elapsed += step;
      uniforms.wet.value = weather.wet;
      uniforms.time.value = elapsed;
      puddles.visible = weather.wet >= 0.12;
      rainbow.visible = weather.rainbow > 0.01;
      rainbowMaterials.forEach((m) => (m.opacity = weather.rainbow * 0.48));
      rain.visible = weather.rain > 0.01 && !reduced;
      rainMaterial.opacity = weather.rain * 0.52;
      rainGeometry.setDrawRange(0, DROP_COUNTS[tier] * 2);
      if (rain.visible) {
        // Snap the weather volume to ground cells so drops do not slide with Monster.
        const ax = Math.floor(player.x / 8) * 8,
          az = Math.floor(player.z / 8) * 8;
        if (ax !== rainAnchorX || az !== rainAnchorZ) {
          rainAnchorX = ax;
          rainAnchorZ = az;
          dropBase.forEach((p, i) => {
            floors[i] = height(p.x + ax, p.z + az) + 0.12;
            sheltered[i] = shelters.some(
              (s) => Math.hypot(p.x + ax - s.x, p.z + az - s.z) < s.r,
            )
              ? 1
              : 0;
          });
        }
        for (let i = 0; i < DROP_COUNTS[tier]; i++) {
          const p = dropBase[i],
            y = floors[i] + ((((p.phase - elapsed * 7) % 14) + 14) % 14),
            x = p.x + ax,
            z = p.z + az,
            length = sheltered[i] ? 0 : 0.26;
          rainPositions.set([x, y, z, x + length * 0.2, y + length, z], i * 6);
        }
        rainGeometry.attributes.position.needsUpdate = true;
      }
      for (const s of splashes) {
        s.age += step;
        s.group.visible = s.age < 0.85 && weather.wet >= 0.12;
        if (!s.group.visible) continue;
        const t = reduced ? 0.3 : s.age;
        s.ring.scale.setScalar((0.16 + t * 1.25) * s.strength);
        s.material.opacity = (1 - s.age / 0.85) * 0.6;
        s.drops.forEach((drop, i) => {
          drop.visible = !reduced && tier !== 'simple' && s.age < 0.55;
          const a = (i * Math.PI) / 3;
          drop.position.set(
            Math.cos(a) * t * s.strength,
            Math.max(0, Math.sin((t / 0.55) * Math.PI)) * s.strength * 0.65,
            Math.sin(a) * t * s.strength,
          );
          drop.scale.set(0.8, 1.5, 0.8);
        });
      }
    },
  };
}
