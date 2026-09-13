import * as THREE from 'three';
import { planetFor, type PlanetId } from './observatory';

const noise = `
float hash3(vec3 p) { return fract(sin(dot(p,vec3(12.9898,78.233,39.425)))*43758.5453); }
float noise3(vec3 p) {
  vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float terrain(vec3 p) { return noise3(p)*0.55+noise3(p*2.1)*0.28+noise3(p*4.3)*0.12+noise3(p*8.7)*0.05; }
`;
/** Illustrated procedural surfaces, not geographic maps or spacecraft photographs. */
export function createPlanet(id: PlanetId | 'sun' | 'moon', simple = false) {
  const root = new THREE.Group(),
    body = new THREE.Group();
  root.add(body);
  root.name = 'planet-' + id;
  root.rotation.z = id === 'uranus' ? 1.706 : id === 'saturn' ? 0.47 : 0.13;
  root.rotation.x = id === 'saturn' ? 0.45 : 0;
  root.rotation.y = id === 'uranus' ? 0.45 : 0;
  const colour =
    id === 'sun' ? '#ffc665' : id === 'moon' ? '#c8c6c4' : planetFor(id).colour;
  const mat = new THREE.MeshStandardMaterial({
    color: colour,
    roughness: 0.85,
    emissive: id === 'sun' ? '#ef941a' : '#000000',
    emissiveIntensity: id === 'sun' ? 0.65 : 0,
  });
  const paint =
    id === 'earth'
      ? `
    float land=smoothstep(.50,.535,terrain(p*3.0+vec3(2.5,1.2,.7)));
    vec3 ground=mix(vec3(.24,.48,.31),vec3(.63,.66,.39),terrain(p*9.0));
    vec3 ocean=mix(vec3(.06,.32,.53),vec3(.13,.51,.67),n);
    diffuseColor.rgb=mix(ocean,ground,land);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.92,.95,.91),smoothstep(.88,.98,abs(p.y)));
    float cloud=smoothstep(.64,.79,terrain(p*5.0+vec3(1,5,2)));
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.93,.96,.96),cloud*.82);
  `
      : id === 'jupiter' || id === 'saturn'
        ? `
    float stripe=sin(p.y*${id === 'jupiter' ? '38.0' : '50.0'}+terrain(p*7.0)*3.5)*.5+.5;
    diffuseColor.rgb*=mix(${id === 'jupiter' ? '.62' : '.84'},1.10,stripe);
    diffuseColor.rgb*=.91+n*.18;
    ${id === 'jupiter' ? 'float spot=1.0-smoothstep(.8,1.0,length((p.xy-vec2(.28,-.27))/vec2(.28,.12))); diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.60,.25,.14),spot*step(.6,p.z)*.85);' : ''}
  `
        : id === 'mars'
          ? `
    diffuseColor.rgb*=.73+n*.48;
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.86,.87,.84),smoothstep(.94,.995,abs(p.y))*.9);
  `
          : id === 'uranus' || id === 'neptune'
            ? `
    float belt=sin(p.y*25.0+terrain(p*5.0)*2.0)*.5+.5;
    diffuseColor.rgb*=.87+belt*.16+n*.07;
  `
            : id === 'sun'
              ? `diffuseColor.rgb*=.80+n*.35;`
              : `diffuseColor.rgb*=.72+n*.50;`;
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader =
      'varying vec3 planetPosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nplanetPosition=position;',
    );
    shader.fragmentShader =
      'varying vec3 planetPosition;\n' + noise + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      '#include <color_fragment>\n vec3 p=normalize(planetPosition); float n=terrain(p*12.0);\n' +
        paint,
    );
  };
  mat.customProgramCacheKey = () => 'illustrated-planet-' + id;
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(1, simple ? 28 : 56, simple ? 20 : 40),
    mat,
  );
  if (id === 'jupiter' || id === 'saturn') globe.scale.y = 0.94;
  body.add(globe);
  if (id === 'mercury' || id === 'moon') {
    const craterMat = new THREE.MeshStandardMaterial({
      color: id === 'moon' ? '#a8a6a4' : '#969087',
      roughness: 1,
    });
    for (let i = 0; i < (simple ? 14 : 30); i++) {
      const a = i * 2.39996,
        y = 1 - (2 * (i + 0.5)) / (simple ? 14 : 30),
        r = Math.sqrt(1 - y * y);
      const crater = new THREE.Mesh(
        new THREE.TorusGeometry(0.038 + (i % 5) * 0.019, 0.009, 5, 16),
        craterMat,
      );
      crater.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      crater.lookAt(crater.position.clone().multiplyScalar(2));
      body.add(crater);
    }
  }
  if (id === 'saturn' || id === 'uranus') {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.18, id === 'saturn' ? 2.15 : 1.65, 96),
      new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        uniforms: {
          tint: {
            value: new THREE.Color(id === 'saturn' ? '#d7c5a0' : '#b9c7cb'),
          },
          strength: { value: id === 'saturn' ? 0.87 : 0.25 },
        },
        vertexShader:
          'varying vec3 ringP; void main(){ringP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader:
          'varying vec3 ringP; uniform vec3 tint; uniform float strength; void main(){float r=length(ringP.xy);float stripe=.65+.35*sin(r*145.0);float gap=1.0-smoothstep(1.65,1.68,r)+smoothstep(1.75,1.78,r);gl_FragColor=vec4(tint*(.80+.20*stripe),strength*stripe*gap);}',
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.name = 'planet-rings';
    root.add(ring);
  }
  return {
    root,
    body,
    animate: (seconds: number) => {
      body.rotation.y = Number.isFinite(seconds) ? seconds * 0.045 : 0;
    },
  };
}
export function disposePlanetScene(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>();
  root.traverse((o) => {
    if (
      o instanceof THREE.Mesh ||
      o instanceof THREE.Line ||
      o instanceof THREE.Points
    ) {
      geometries.add(o.geometry);
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
        materials.add(m),
      );
    }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
}
