import * as THREE from 'three';
import type { GraphicsTier } from './graphics-quality';
import type { daylightPalette } from './daylight';

export function createIslandSky(height: (x: number, z: number) => number) {
  const root = new THREE.Group();
  root.name = 'Island sky and evening lights';
  const colours = {
    top: { value: new THREE.Color('#95cce5') },
    horizon: { value: new THREE.Color('#c3e2d8') },
  };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(190, 24, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: colours,
      vertexShader:
        'varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:
        'uniform vec3 top;uniform vec3 horizon;varying vec3 vDirection;void main(){float h=smoothstep(-.08,.75,normalize(vDirection).y);gl_FragColor=vec4(mix(horizon,top,h),1.);\n#include <colorspace_fragment>\n}',
    }),
  );
  sky.renderOrder = -1000;
  sky.frustumCulled = false;
  root.add(sky);
  const starPositions = new Float32Array(300 * 3);
  for (let i = 0; i < 300; i++) {
    const az = i * 2.399963,
      elevation = 0.12 + (((i * 37) % 100) / 100) * 1.35;
    starPositions.set(
      [
        Math.cos(az) * Math.cos(elevation) * 170,
        Math.sin(elevation) * 170,
        Math.sin(az) * Math.cos(elevation) * 170,
      ],
      i * 3,
    );
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(starPositions, 3),
  );
  const starMaterial = new THREE.PointsMaterial({
    color: '#fff1d1',
    size: 0.32,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  });
  const stars = new THREE.Points(starGeometry, starMaterial);
  stars.renderOrder = -999;
  root.add(stars);
  const flyBase: Array<{ x: number; y: number; z: number }> = [],
    flyPositions = new Float32Array(72 * 3);
  for (let i = 0; i < 72; i++) {
    const [x, z] = [
      [-32, 0],
      [-44, 23],
      [16, 29],
      [0, 35],
    ][i % 4];
    const angle = i * 2.399963,
      r = 2 + (i % 11) * 0.45;
    const px = x + Math.cos(angle) * r,
      pz = z + Math.sin(angle) * r;
    flyBase.push({ x: px, y: height(px, pz) + 0.7 + (i % 5) * 0.3, z: pz });
  }
  const flyGeometry = new THREE.BufferGeometry();
  flyGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(flyPositions, 3),
  );
  const flyMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { opacity: { value: 0 }, scale: { value: 1 } },
    vertexShader:
      'uniform float scale;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(70.*scale/-p.z,2.,9.);}',
    fragmentShader:
      'uniform float opacity;void main(){float d=length(gl_PointCoord-.5)*2.;float a=(1.-smoothstep(.15,1.,d))*opacity;gl_FragColor=vec4(1.,.86,.4,a);}',
  });
  const flies = new THREE.Points(flyGeometry, flyMaterial);
  flies.frustumCulled = false;
  root.add(flies);
  const lanterns: THREE.MeshStandardMaterial[] = [];
  const poolMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { amount: { value: 0 } },
    vertexShader:
      'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:
      'uniform float amount;varying vec2 vUv;void main(){float d=length(vUv-.5)*2.;gl_FragColor=vec4(1.,.7,.28,pow(max(0.,1.-d),2.)*amount*.28);}',
  });
  const poolGeometry = new THREE.PlaneGeometry(3.4, 3.4);
  for (const [x, z] of [
    [8, 21],
    [23, 21],
    [-5, -18],
    [6, -18],
    [-27, 2],
    [-4, 29],
    [24, 4],
    [-18, 20],
  ]) {
    const post = new THREE.Group();
    post.position.set(x, height(x, z), z);
    root.add(post);
    const pool = new THREE.Mesh(poolGeometry, poolMaterial);
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.11;
    post.add(pool);
    const wood = new THREE.MeshStandardMaterial({
      color: '#ae8965',
      roughness: 0.9,
    });
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.09, 1.6, 8),
      wood,
    );
    stem.position.y = 0.8;
    stem.castShadow = true;
    post.add(stem);
    const glass = new THREE.MeshStandardMaterial({
      color: '#efdeb1',
      emissive: '#ffc77f',
      emissiveIntensity: 0,
      roughness: 0.6,
    });
    lanterns.push(glass);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), glass);
    bulb.position.y = 1.65;
    post.add(bulb);
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.29, 0.22, 12), wood);
    hood.position.y = 1.92;
    post.add(hood);
  }
  return {
    root,
    update(
      p: ReturnType<typeof daylightPalette>,
      time: number,
      reduced: boolean,
      camera: THREE.Vector3,
      tier: GraphicsTier,
      pixelRatio: number,
    ) {
      colours.top.value.set(p.top);
      colours.horizon.value.set(p.horizon);
      sky.position.copy(camera);
      stars.position.copy(camera);
      starMaterial.opacity = p.evening * 0.85;
      stars.visible = p.evening > 0.01;
      starGeometry.setDrawRange(0, tier === 'simple' ? 90 : 300);
      const glow = Math.max(0, (p.evening - 0.2) / 0.8);
      flies.visible = glow > 0.01;
      flyMaterial.uniforms.opacity.value = glow * 0.9;
      flyMaterial.uniforms.scale.value = pixelRatio;
      flyGeometry.setDrawRange(0, tier === 'simple' ? 24 : 72);
      flyBase.forEach((f, i) => {
        const t = reduced ? 0 : time;
        flyPositions.set(
          [
            f.x + Math.sin(t * 0.4 + i) * 0.35,
            f.y + Math.sin(t * 0.65 + i * 0.7) * 0.22,
            f.z + Math.cos(t * 0.35 + i) * 0.3,
          ],
          i * 3,
        );
      });
      flyGeometry.attributes.position.needsUpdate = true;
      lanterns.forEach((m) => (m.emissiveIntensity = 0.05 + p.evening * 1.5));
      poolMaterial.uniforms.amount.value = p.evening;
    },
  };
}
