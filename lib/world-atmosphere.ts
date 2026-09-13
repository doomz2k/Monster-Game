import * as THREE from 'three';
import { GRAPHICS, type GraphicsTier } from './graphics-quality';
import { PLACES } from './adventure';
import { PLAY_RADIUS, SHORE_RADIUS, LANDMARKS } from './world-layout';
import { createNeighbour } from './neighbours';
import { villageStroll } from './neighbour-routines';
import type { WorldTextures } from './world-materials';

/** Shared meshes, instanced meadow and restrained movement keep the bigger world affordable. */
export function createAtmosphere(
  height: (x: number, z: number) => number,
  textures: WorldTextures,
) {
  const root = new THREE.Group(),
    moon = new THREE.Group();
  root.name = 'Living island';
  moon.name = 'Lunar expedition camp';
  const clock = { value: 0 };
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  function material(c: string, kind?: 'wood' | 'stone') {
    const key = c + (kind ?? '');
    if (!materials.has(key))
      materials.set(
        key,
        new THREE.MeshStandardMaterial({
          color: c,
          roughness: 0.92,
          map:
            kind === 'wood'
              ? textures.timber
              : kind === 'stone'
                ? textures.stone
                : null,
        }),
      );
    return materials.get(key)!;
  }
  const cube = new THREE.BoxGeometry(1, 1, 1),
    sphere = new THREE.SphereGeometry(1, 14, 10);
  function mesh(
    p: THREE.Object3D,
    geo: THREE.BufferGeometry,
    c: string,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = sx,
    sz = sx,
    kind?: 'wood' | 'stone',
  ) {
    const o = new THREE.Mesh(geo, material(c, kind));
    o.position.set(x, y, z);
    o.scale.set(sx, sy, sz);
    o.castShadow = o.receiveShadow = true;
    p.add(o);
    return o;
  }
  function box(
    p: THREE.Object3D,
    c: string,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    kind?: 'wood' | 'stone',
  ) {
    return mesh(p, cube, c, x, y, z, sx, sy, sz, kind);
  }
  function at(x: number, z: number, parent = root) {
    const g = new THREE.Group();
    g.position.set(x, parent === moon ? 0 : height(x, z), z);
    parent.add(g);
    return g;
  }
  function pathTo(x: number, z: number) {
    const length = Math.hypot(x, z),
      angle = Math.atan2(z, x) + Math.PI / 2,
      vertices: number[] = [],
      uv: number[] = [],
      indices: number[] = [];
    for (let i = 0; i <= 70; i++)
      for (const side of [-1, 1]) {
        const f = i / 70,
          bend = Math.sin(f * Math.PI) * 3,
          px = x * f + Math.cos(angle) * (side * 1.15 + bend),
          pz = z * f + Math.sin(angle) * (side * 1.15 + bend);
        vertices.push(px, height(px, pz) + 0.04, pz);
        uv.push(side === -1 ? 0 : 1, (f * length) / 3);
      }
    for (let i = 0; i < 70; i++) {
      const n = i * 2;
      indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    const m = new THREE.Mesh(
      g,
      new THREE.MeshStandardMaterial({
        map: textures.stone,
        color: '#d4c89d',
        side: THREE.DoubleSide,
        roughness: 1,
      }),
    );
    m.receiveShadow = true;
    root.add(m);
  }
  const landmarks = LANDMARKS;
  landmarks.forEach(([x, z]) => pathTo(x, z));

  // Wind-swept grass uses one draw call; paths, homes and landmark clearings stay open.
  const grassGeometry = new THREE.BufferGeometry();
  grassGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [-0.075, 0, 0, 0.075, 0, 0, 0.015, 0.5, 0.045],
      3,
    ),
  );
  grassGeometry.computeVertexNormals();
  const grassMaterial = new THREE.MeshStandardMaterial({
    color: '#8ab456',
    roughness: 1,
    side: THREE.DoubleSide,
  });
  grassMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.meadowTime = clock;
    shader.vertexShader =
      'uniform float meadowTime;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
      #ifdef USE_INSTANCING
      transformed.x += sin(meadowTime*1.4 + instanceMatrix[3].x*.32 + instanceMatrix[3].z*.19) * position.y * .26;
      transformed.z += cos(meadowTime*.9 + instanceMatrix[3].z*.4) * position.y * .12;
      #endif`,
      );
  };
  const grass = new THREE.InstancedMesh(grassGeometry, grassMaterial, 18000);
  const dummy = new THREE.Object3D(),
    colour = new THREE.Color();
  let seed = 96237;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  function nearPath(x: number, z: number) {
    return [
      ...PLACES.filter((p) => p.id !== 'moon').map((p) => [p.x, p.z]),
      ...landmarks,
    ].some(([px, pz]) => {
      const f = Math.max(
        0,
        Math.min(1, (x * px + z * pz) / (px * px + pz * pz)),
      );
      return Math.hypot(x - px * f, z - pz * f) < 4;
    });
  }
  let count = 0;
  for (let i = 0; i < 28000 && count < 18000; i++) {
    const x = (random() - 0.5) * 152,
      z = (random() - 0.5) * 152;
    if (
      Math.hypot(x, z) > PLAY_RADIUS - 5 ||
      x > 26 ||
      nearPath(x, z) ||
      PLACES.some((p) => Math.hypot(x - p.x, z - p.z) < 9) ||
      landmarks.some(([px, pz]) => Math.hypot(x - px, z - pz) < 10)
    )
      continue;
    dummy.position.set(x, height(x, z), z);
    dummy.rotation.y = random() * Math.PI * 2;
    dummy.scale.setScalar(0.7 + random() * 0.9);
    dummy.updateMatrix();
    grass.setMatrixAt(count, dummy.matrix);
    colour.setHSL(
      0.23 + random() * 0.05,
      0.35 + random() * 0.16,
      0.34 + random() * 0.18,
    );
    grass.setColorAt(count, colour);
    count++;
  }
  grass.count = count;
  grass.instanceMatrix.needsUpdate = true;
  grass.receiveShadow = true;
  root.add(grass);

  // A moving sea replaces the flat blue plane; shoreline foam advances gently.
  const water = new THREE.ShaderMaterial({
    uniforms: { time: clock },
    vertexShader: `varying vec3 vWorld; void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,
    fragmentShader:
      `uniform float time;varying vec3 vWorld;void main(){vec2 p=vWorld.xz;float r=length(p);float wave=sin(p.x*.31+time*.6)+sin(p.y*.24-time*.45);float ripple=pow(max(0.,sin(p.x*1.5+p.y*.7+wave*.4-time)),16.);float shore=1.-smoothstep(${SHORE_RADIUS.toFixed(1)},110.,r);float foam=pow(max(0.,sin(r*2.5-time*.7)),18.)*shore*.6;vec3 colour=mix(vec3(.09,.38,.48),vec3(.30,.67,.66),shore);colour+=wave*.012+ripple*.035+foam*.25;gl_FragColor=vec4(colour,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`.replace(
        ';#include',
        ';\n#include',
      ),
  });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(1100, 1100), water);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -1.28;
  root.add(sea);

  const windmill = at(-43, -43);
  windmill.name = 'Clover windmill';
  mesh(
    windmill,
    new THREE.CylinderGeometry(1.65, 2.4, 7, 28),
    '#f1dfb8',
    0,
    3.5,
    0,
    1,
    1,
    1,
    'stone',
  );
  mesh(windmill, new THREE.ConeGeometry(2.45, 2.8, 28), '#738c84', 0, 8.2, 0);
  const blades = new THREE.Group();
  blades.position.set(0, 6, 2.15);
  windmill.add(blades);
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = (i * Math.PI) / 2;
    blades.add(arm);
    box(arm, '#a67d54', 0, 2.35, 0, 0.18, 4.7, 0.18, 'wood');
    for (let n = 0; n < 7; n++)
      box(arm, '#e9d3a4', 0.58, 1.1 + n * 0.44, 0, 1.25, 0.29, 0.13, 'wood');
  }
  mesh(blades, sphere, '#9c795b', 0, 0, 0.08, 0.35);
  box(windmill, '#916e55', 0, 0.95, 2.1, 1.1, 1.9, 0.15, 'wood');
  for (const side of [-1, 1])
    box(windmill, '#668f97', side * 0.8, 4, 1.7, 0.6, 0.9, 0.16);

  // Pond, reeds and lily pads. No dangerous pits or collision traps for a young player.
  const pond = at(-44, 23);
  pond.name = 'Lily pond';
  const pool = mesh(
    pond,
    new THREE.CylinderGeometry(6.8, 7, 0.12, 64),
    '#719a94',
    0,
    0.03,
    0,
    1,
    1,
    0.73,
    'stone',
  );
  pool.receiveShadow = true;
  const poolWater = mesh(
    pond,
    new THREE.CircleGeometry(6.5, 64),
    '#76bcb5',
    0,
    0.105,
    0,
    1,
    1,
    0.7,
  );
  poolWater.rotation.x = -Math.PI / 2;
  poolWater.material = new THREE.MeshStandardMaterial({
    color: '#72b7b5',
    roughness: 0.23,
    metalness: 0.12,
  });
  for (let i = 0; i < 24; i++) {
    const a = i * 2.39996;
    mesh(
      pond,
      sphere,
      '#c7c5ad',
      Math.cos(a) * 6.8,
      0.12,
      Math.sin(a) * 4.8,
      0.45,
      0.26,
      0.4,
      'stone',
    );
  }
  const lilies: THREE.Object3D[] = [];
  for (let i = 0; i < 6; i++) {
    const a = i * 2.4,
      r = 1.5 + (i % 3) * 1.1;
    const g = new THREE.Group();
    g.position.set(Math.cos(a) * r, 0.18, Math.sin(a) * r * 0.65);
    pond.add(g);
    mesh(
      g,
      new THREE.CylinderGeometry(0.57, 0.57, 0.035, 18),
      '#689450',
      0,
      0,
      0,
    );
    for (let j = 0; j < 5; j++) {
      const petal = mesh(
        g,
        sphere,
        '#edbbcd',
        Math.cos(j * 1.257) * 0.16,
        0.13,
        Math.sin(j * 1.257) * 0.16,
        0.2,
        0.12,
        0.09,
      );
      petal.rotation.y = -j * 1.257;
    }
    lilies.push(g);
  }
  for (let i = 0; i < 15; i++) {
    const a = i * 0.22;
    const x = Math.cos(a) * 7,
      z = Math.sin(a) * 4.8;
    box(pond, '#627a40', x, 0.5, z, 0.045, 1, 0.045);
    mesh(pond, sphere, '#876647', x, 1.05, z, 0.07, 0.24, 0.07);
  }
  // A low bridge across the water.
  for (let i = 0; i < 22; i++) {
    const x = -7 + i * 0.66;
    box(
      pond,
      '#cbb086',
      x,
      0.22 + Math.sin((i / 21) * Math.PI) * 0.6,
      0,
      0.64,
      0.18,
      1.8,
      'wood',
    );
  }
  for (const side of [-1, 1])
    for (let i = 0; i < 5; i++) {
      const x = -6 + i * 3;
      box(pond, '#ab8661', x, 0.92, side * 1, 0.14, 1.5, 0.14, 'wood');
    }

  const lighthouse = at(58, 17);
  lighthouse.name = 'Shell cove lighthouse';
  mesh(
    lighthouse,
    new THREE.CylinderGeometry(1.25, 1.8, 8, 32),
    '#f4e9ce',
    0,
    4,
    0,
    1,
    1,
    1,
    'stone',
  );
  for (let i = 0; i < 2; i++)
    mesh(
      lighthouse,
      new THREE.CylinderGeometry(1.5 - i * 0.15, 1.57 - i * 0.15, 1.4, 32),
      '#cd7c67',
      0,
      2.3 + i * 3,
      0,
    );
  mesh(
    lighthouse,
    new THREE.CylinderGeometry(2, 2, 0.2, 32),
    '#526e79',
    0,
    8,
    0,
  );
  mesh(
    lighthouse,
    new THREE.CylinderGeometry(1.1, 1.1, 1.6, 24),
    '#edc77d',
    0,
    8.9,
    0,
  );
  mesh(
    lighthouse,
    new THREE.ConeGeometry(1.6, 1.1, 32),
    '#68838a',
    0,
    10.25,
    0,
  );
  box(lighthouse, '#72848b', 0, 0.9, 1.7, 0.9, 1.8, 0.15, 'wood');
  const beacon = mesh(lighthouse, sphere, '#fff2b0', 0, 8.95, 0, 0.48);
  beacon.material = new THREE.MeshStandardMaterial({
    color: '#fff0b0',
    emissive: '#ffcd66',
    emissiveIntensity: 0.9,
  });

  // Harbour timbers and moored boats.
  const pier = at(42, 2);
  pier.name = 'Harbour boardwalk';
  for (let i = 0; i < 19; i++)
    box(pier, '#c6a87c', i * 0.6, 0.22, 0, 0.57, 0.23, 3.2, 'wood');
  for (const z of [-1.7, 1.7])
    for (let i = 0; i < 5; i++)
      box(pier, '#a68b69', i * 2.7, 0.3, z, 0.22, 1.7, 0.22, 'wood');
  const boats: THREE.Group[] = [];
  for (let i = 0; i < 3; i++) {
    const boat = at(88 + i * 3, -9 + i * 7);
    boat.position.y = -1;
    boat.name = 'Bobbing fishing boat';
    mesh(
      boat,
      sphere,
      ['#c77659', '#6c94ad', '#ccb466'][i],
      0,
      0,
      0,
      1.15,
      0.43,
      2.4,
    );
    mesh(boat, sphere, '#e7cc98', 0, 0.2, 0, 0.91, 0.18, 2.1);
    box(boat, '#a98b61', 0, 2, 0, 0.13, 3.8, 0.13, 'wood');
    const sail = new THREE.BufferGeometry();
    sail.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([0, 1.2, 0, 0, 3.8, 0, 0, 1.2, 1.75], 3),
    );
    sail.computeVertexNormals();
    const cloth = new THREE.Mesh(
      sail,
      new THREE.MeshStandardMaterial({
        color: '#fff0d2',
        side: THREE.DoubleSide,
        roughness: 1,
      }),
    );
    boat.add(cloth);
    boats.push(boat);
  }

  const picnic = at(28, 48);
  picnic.name = 'Orchard picnic';
  for (const z of [-1.2, 1.2]) {
    box(picnic, '#bc9971', 0, 0.65, z, 4.2, 0.2, 0.55, 'wood');
    for (const x of [-1.4, 1.4])
      box(picnic, '#ad8860', x, 0.32, z, 0.15, 0.65, 0.2, 'wood');
  }
  box(picnic, '#d9b98b', 0, 1.1, 0, 4.5, 0.2, 1.5, 'wood');
  for (let i = 0; i < 4; i++) {
    mesh(
      picnic,
      new THREE.CylinderGeometry(0.25, 0.25, 0.04, 18),
      '#f5ead0',
      -1.45 + i * 0.95,
      1.25,
      0,
    );
    mesh(picnic, sphere, '#c97455', -1.45 + i * 0.95, 1.45, 0, 0.17);
  }
  const visitors = [
    { npc: createNeighbour('shop', { visitor: true }), x: 25, z: 45 },
    { npc: createNeighbour('garden', { visitor: true }), x: -49, z: 28 },
    { npc: createNeighbour('meadow', { visitor: true }), x: -7.5, z: -29 },
  ];
  visitors.forEach(({ npc, x, z }) => {
    npc.root.position.set(x, height(x, z), z);
    root.add(npc.root);
    npc.root.scale.setScalar(0.75);
  });

  // Pollen, dragonflies and circling birds contribute motion at several scales.
  const motes = new Float32Array(180 * 3);
  for (let i = 0; i < 180; i++) {
    motes[i * 3] = (random() - 0.5) * 120;
    motes[i * 3 + 1] = 1 + random() * 5;
    motes[i * 3 + 2] = (random() - 0.5) * 120;
  }
  const moteGeometry = new THREE.BufferGeometry();
  moteGeometry.setAttribute('position', new THREE.BufferAttribute(motes, 3));
  const pollen = new THREE.Points(
    moteGeometry,
    new THREE.PointsMaterial({
      color: '#fff1ab',
      size: 0.055,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    }),
  );
  root.add(pollen);
  const birds: THREE.Group[] = [];
  for (let i = 0; i < 9; i++) {
    const bird = new THREE.Group();
    root.add(bird);
    mesh(bird, sphere, '#f1eadc', 0, 0, 0, 0.2, 0.12, 0.32);
    for (const side of [-1, 1]) {
      const wing = box(bird, '#e9e4d5', side * 0.3, 0, 0, 0.55, 0.045, 0.25);
      wing.name = 'wing';
    }
    birds.push(bird);
  }

  // Broad Moon terrain gains expedition landmarks, crystal fields and distant ridges.
  for (let i = 0; i < 55; i++) {
    const a = i * 2.39996,
      r = 25 + (i % 9) * 5.5;
    const rock = mesh(
      moon,
      new THREE.DodecahedronGeometry(1, 0),
      '#a6a7c1',
      Math.cos(a) * r,
      0.15,
      Math.sin(a) * r,
      0.5 + (i % 4) * 0.3,
      0.4 + (i % 3) * 0.35,
      0.6,
      'stone',
    );
    rock.rotation.set(i * 0.2, i, 0.3);
  }
  for (let i = 0; i < 20; i++) {
    const a = (i * Math.PI * 2) / 20;
    mesh(
      moon,
      new THREE.ConeGeometry(1, 1, 7),
      '#817f9f',
      Math.cos(a) * 93,
      4,
      Math.sin(a) * 93,
      8 + (i % 4),
      10 + (i % 6),
      7,
      'stone',
    );
  }
  const station = at(19, -17, moon);
  station.name = 'Nova’s observatory';
  mesh(
    station,
    new THREE.SphereGeometry(1, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2),
    '#e0e0e9',
    0,
    0.05,
    0,
    3.6,
    3,
    3.6,
  );
  box(station, '#8c96b6', 0, 1, 3.05, 1.5, 2, 0.2);
  mesh(
    station,
    new THREE.TorusGeometry(3.6, 0.15, 8, 48),
    '#aba9d5',
    0,
    0.16,
    0,
  ).rotation.x = Math.PI / 2;
  const dish = new THREE.Group();
  station.add(dish);
  dish.position.set(0, 4.3, 0);
  mesh(
    dish,
    new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, 0.5 * Math.PI),
    '#aebbd4',
    0,
    0,
    0,
    1.8,
    0.7,
    1.8,
  ).rotation.x = 0.8;
  const rover = at(-23, -28, moon);
  rover.name = 'Moon rover';
  box(rover, '#ebdec4', 0, 1, 0, 2.2, 0.75, 3);
  box(rover, '#8495ac', 0, 1.7, -0.4, 1.9, 0.7, 1.6);
  for (const side of [-1, 1])
    for (const z of [-1, 0, 1])
      mesh(
        rover,
        new THREE.CylinderGeometry(0.45, 0.45, 0.32, 16),
        '#646a81',
        side * 1.2,
        0.45,
        z,
      ).rotation.z = Math.PI / 2;
  box(rover, '#a6afc6', 0, 2.5, -0.8, 0.12, 1.4, 0.12);
  mesh(rover, sphere, '#748797', 0, 3.2, -0.8, 0.3, 0.2, 0.2);
  for (let i = 0; i < 35; i++)
    for (const side of [-1, 1])
      box(
        moon,
        '#9896b0',
        -23 + side * 1.1,
        0.005,
        -25 + i * 0.65,
        0.4,
        0.008,
        0.24,
      );
  for (let i = 0; i < 18; i++) {
    const a = i * 2.4;
    const cluster = at(
      39 + Math.cos(a) * (2 + (i % 4)),
      -30 + Math.sin(a) * (2 + (i % 4)),
      moon,
    );
    mesh(cluster, new THREE.ConeGeometry(0.35, 1.7, 6), '#bdb5ed', 0, 0.85, 0);
    mesh(cluster, new THREE.ConeGeometry(0.25, 1, 6), '#91bbd2', 0.4, 0.5, 0.2);
  }
  const moonPaths = [
    [-23, -28],
    [19, -17],
    [39, -30],
    [0, 6],
  ];
  moonPaths.forEach(([x, z]) => {
    for (let i = 1; i < 16; i++) {
      const f = i / 16;
      for (const side of [-1, 1])
        mesh(
          moon,
          sphere,
          '#d8c994',
          x * f + side * 0.3,
          0.015,
          z * f,
          0.12,
          0.015,
          0.22,
        );
    }
  });
  return {
    root,
    moon,
    setQuality(tier: GraphicsTier) {
      grass.count = Math.floor(count * GRAPHICS[tier].grass);
      pollen.visible = GRAPHICS[tier].pollen;
    },
    islandColliders: [
      { x: -43, z: -43, r: 2.25 },
      { x: 58, z: 17, r: 1.8 },
      { x: 28, z: 48, r: 2 },
    ],
    moonColliders: [
      { x: 19, z: -17, r: 3.5 },
      { x: -23, z: -28, r: 2 },
    ],
    surfaceHeight(x: number, z: number) {
      if (Math.abs(z - 23) < 1.1 && Math.abs(x + 44) < 7.25) {
        const f = Math.max(0, Math.min(1, (x + 51) / 14));
        return Math.max(
          height(x, z),
          pond.position.y + 0.31 + Math.sin(f * Math.PI) * 0.6,
        );
      }
      return height(x, z);
    },
    update(time: number) {
      clock.value = time;
      blades.rotation.z = -time * 0.14;
      boats.forEach((b, i) => {
        b.position.y = -1 + Math.sin(time * 0.8 + i) * 0.12;
        b.rotation.z = Math.sin(time * 0.65 + i) * 0.035;
      });
      lilies.forEach((l, i) => {
        l.position.y = 0.18 + Math.sin(time + i) * 0.014;
      });
      birds.forEach((b, i) => {
        const a = time * 0.06 + i * 0.7,
          r = 25 + i * 3;
        b.position.set(
          Math.cos(a) * r,
          12 + Math.sin(time * 0.25 + i) * 2 + i * 0.5,
          Math.sin(a) * r,
        );
        b.rotation.y = -a;
        b.children
          .filter((c) => c.name === 'wing')
          .forEach((w, j) => {
            w.rotation.z = Math.sin(time * 3 + i) * (j ? 1 : -1) * 0.22;
          });
      });
      pollen.position.y = Math.sin(time * 0.2) * 0.4;
      pollen.rotation.y = Math.sin(time * 0.05) * 0.03;
      visitors.forEach(({ npc, x, z }, i) => {
        const pose = villageStroll(time, time === 0 ? 0 : i * 9);
        npc.root.position.set(
          x + pose.x,
          height(x + pose.x, z + pose.z),
          z + pose.z,
        );
        npc.root.rotation.y = pose.yaw;
        npc.animate(
          time + i * 2,
          pose.walking === 0,
          false,
          time === 0,
          pose.walking,
        );
      });
      dish.rotation.y = Math.sin(time * 0.12) * 0.35;
    },
  };
}
