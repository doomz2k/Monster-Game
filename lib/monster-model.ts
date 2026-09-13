import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { BODY_SCALE, defaultAppearance, type Appearance } from './appearance';
import type { HomeAction } from './home-play';

export type MonsterPose = {
  delta: number;
  time: number;
  speed: number;
  airborne: number;
  celebrating: boolean;
  greeting: boolean;
  reducedMotion: boolean;
  carrying?: boolean;
  homeActivity?: HomeAction;
};

// A continuous, gently squared silhouette, with a fuller head and a soft tummy.
const profile = new THREE.CatmullRomCurve3(
  [
    [0, 0.31],
    [0.37, 0.36],
    [0.65, 0.53],
    [0.8, 0.81],
    [0.86, 1.13],
    [0.85, 1.48],
    [0.86, 1.8],
    [0.81, 2.06],
    [0.69, 2.26],
    [0.48, 2.4],
    [0, 2.46],
  ].map(([r, y]) => new THREE.Vector3(r, y, 0)),
);
const outline = profile.getPoints(96);
function radiusAt(y: number) {
  for (let i = 1; i < outline.length; i++) {
    const a = outline[i - 1],
      b = outline[i];
    if (y <= b.y)
      return THREE.MathUtils.lerp(
        a.x,
        b.x,
        THREE.MathUtils.clamp((y - a.y) / (b.y - a.y), 0, 1),
      );
  }
  return 0;
}
const frontAt = (x: number, y: number) =>
  Math.sqrt(Math.max(0, radiusAt(y) ** 2 - x ** 2)) * 0.8;

function plushBump() {
  const size = 128,
    pixels = new Uint8Array(size * size);
  let seed = 270319;
  for (let i = 0; i < pixels.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    pixels[i] = 100 + (seed % 56);
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RedFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 7);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  texture.name = 'Fine plush surface';
  return texture;
}

function taperedCurve(
  points: number[][],
  radius: (t: number) => number,
  rings = 40,
  sides = 12,
) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  );
  const frames = curve.computeFrenetFrames(rings, false),
    positions: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  for (let i = 0; i <= rings; i++) {
    const t = i / rings,
      centre = curve.getPointAt(t),
      r = Math.max(0.0005, radius(t));
    for (let j = 0; j <= sides; j++) {
      const angle = (j / sides) * Math.PI * 2;
      const point = centre
        .clone()
        .addScaledVector(frames.normals[i], Math.cos(angle) * r)
        .addScaledVector(frames.binormals[i], Math.sin(angle) * r);
      positions.push(point.x, point.y, point.z);
      uv.push(j / sides, t);
      if (i < rings && j < sides) {
        const a = i * (sides + 1) + j,
          b = a + sides + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createMonster(look: Appearance = defaultAppearance()) {
  const root = new THREE.Group();
  root.name = 'Monster';
  const bumpMap = plushBump();
  const skin = new THREE.MeshPhysicalMaterial({
    color: look.colour,
    roughness: 0.83,
    sheen: 1,
    sheenColor: '#ffe9ab',
    sheenRoughness: 0.65,
    bumpMap,
    bumpScale: 0.012,
  });
  const cream = new THREE.MeshPhysicalMaterial({
    color: look.accent,
    roughness: 0.87,
    sheen: 0.8,
    sheenColor: '#fff7d9',
    bumpMap,
    bumpScale: 0.008,
  });
  const amber = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(look.colour).multiplyScalar(0.82),
    roughness: 0.72,
    sheen: 0.5,
    bumpMap,
    bumpScale: 0.008,
  });
  const white = new THREE.MeshPhysicalMaterial({
    color: '#fffef6',
    roughness: 0.18,
    clearcoat: 0.65,
    clearcoatRoughness: 0.12,
  });
  const pupilMaterial = new THREE.MeshPhysicalMaterial({
    color: '#292a25',
    roughness: 0.07,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
  });
  const pink = new THREE.MeshStandardMaterial({
    color: '#efa575',
    roughness: 0.9,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: '#704832',
    roughness: 0.8,
  });
  const glintMaterial = new THREE.MeshBasicMaterial({ color: '#fffef7' });
  const ballGeometry = new THREE.SphereGeometry(1, 32, 20);
  const detailGeometry = new THREE.SphereGeometry(1, 16, 12);
  function mesh(
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    name: string,
    x = 0,
    y = 0,
    z = 0,
    sx = 1,
    sy = sx,
    sz = sx,
  ) {
    const object = new THREE.Mesh(geometry, material);
    object.name = name;
    object.position.set(x, y, z);
    object.scale.set(sx, sy, sz);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  const ball = (
    parent: THREE.Object3D,
    material: THREE.Material,
    name: string,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy = sx,
    sz = sx,
  ) => mesh(parent, ballGeometry, material, name, x, y, z, sx, sy, sz);
  const body = new THREE.LatheGeometry(
    outline.map((p) => new THREE.Vector2(Math.max(0, p.x), p.y)),
    96,
  );
  body.scale(1, 1, 0.8);
  body.computeVertexNormals();
  mesh(root, body, skin, 'Sculpted body');

  // The tummy is a conforming surface, rather than a separate intersecting ball.
  const patchPositions: number[] = [],
    patchColours: number[] = [],
    patchUV: number[] = [],
    patchIndices: number[] = [];
  const centreColour = new THREE.Color(look.accent),
    edgeColour = new THREE.Color(look.colour);
  for (let r = 0; r <= 24; r++)
    for (let a = 0; a <= 64; a++) {
      const d = r / 24,
        theta = (a / 64) * Math.PI * 2,
        x = Math.cos(theta) * d * 0.53,
        y = 1.01 + Math.sin(theta) * d * 0.54;
      patchPositions.push(x, y, frontAt(x, y) + 0.008);
      patchUV.push(x + 0.5, y / 2);
      const colour = centreColour
        .clone()
        .lerp(edgeColour, THREE.MathUtils.smoothstep(d, 0.83, 1));
      patchColours.push(colour.r, colour.g, colour.b);
      if (r < 24 && a < 64) {
        const i = r * 65 + a;
        patchIndices.push(i, i + 65, i + 1, i + 1, i + 65, i + 66);
      }
    }
  const patch = new THREE.BufferGeometry();
  patch.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(patchPositions, 3),
  );
  patch.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(patchColours, 3),
  );
  patch.setAttribute('uv', new THREE.Float32BufferAttribute(patchUV, 2));
  patch.setIndex(patchIndices);
  patch.computeVertexNormals();
  const tummyMaterial = cream.clone();
  tummyMaterial.color.set('#ffffff');
  tummyMaterial.vertexColors = true;
  mesh(root, patch, tummyMaterial, 'Soft blended tummy');

  // Short, tapered tufts provide a soft silhouette in a single instanced draw.
  const tuftGeometry = taperedCurve(
    [
      [0, 0, 0],
      [0.003, 0.018, 0],
      [0.009, 0.04, 0.002],
    ],
    (t) => 0.009 * (1 - t),
    4,
    4,
  );
  const tufts = new THREE.InstancedMesh(tuftGeometry, skin, 720);
  tufts.name = 'Short plush tufts';
  const helper = new THREE.Object3D(),
    up = new THREE.Vector3(0, 1, 0);
  let count = 0;
  for (let i = 0; i < 1100 && count < 720; i++) {
    const y = 0.49 + ((i * 0.61803398875) % 1) * 1.78,
      angle = i * 2.3999632297,
      r = radiusAt(y);
    const x = Math.cos(angle) * r,
      z = Math.sin(angle) * r * 0.8;
    if (z > 0.2 && (y > 1.23 || Math.abs(x) < 0.55)) continue;
    helper.position.set(x, y, z);
    const slope = (radiusAt(y + 0.01) - radiusAt(y - 0.01)) / 0.02;
    helper.quaternion.setFromUnitVectors(
      up,
      new THREE.Vector3(
        Math.cos(angle),
        -slope,
        Math.sin(angle) / 0.8,
      ).normalize(),
    );
    helper.scale.setScalar(0.6 + (i % 7) * 0.07);
    helper.updateMatrix();
    tufts.setMatrixAt(count++, helper.matrix);
  }
  tufts.count = count;
  tufts.instanceMatrix.needsUpdate = true;
  tufts.castShadow = true;
  root.add(tufts);

  const arms: THREE.Group[] = [],
    feet: THREE.Group[] = [],
    ears: THREE.Group[] = [],
    brows: THREE.Group[] = [];
  const eyes: { upper: THREE.Mesh; lower: THREE.Mesh; gaze: THREE.Group }[] =
    [];
  const hornMaterial = new THREE.MeshPhysicalMaterial({
    color: '#f6deb0',
    roughness: 0.46,
    clearcoat: 0.18,
  });
  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'left' : 'right';
    const horn = taperedCurve(
      [
        [side * 0.65, 2.19, -0.08],
        [side * 0.77, 2.4, -0.1],
        [side * 0.9, 2.63, -0.1],
        [side * 0.85, 2.8, -0.08],
      ],
      (t) =>
        0.145 *
        Math.pow(1 - t, 0.76) *
        (1 + Math.sin(t * Math.PI * 17) * 0.035),
      48,
      16,
    );
    mesh(root, horn, hornMaterial, 'Curved horn ' + suffix);
    const ear = new THREE.Group();
    ear.name = 'Ear ' + suffix;
    ear.position.set(side * 0.79, 1.91, -0.01);
    ball(
      ear,
      skin,
      'Ear outer ' + suffix,
      side * 0.105,
      0.01,
      0,
      0.21,
      0.26,
      0.12,
    ).rotation.z = -side * 0.3;
    ball(
      ear,
      cream,
      'Ear inner ' + suffix,
      side * 0.13,
      0.025,
      0.09,
      0.1,
      0.16,
      0.025,
    ).rotation.z = -side * 0.3;
    root.add(ear);
    ears.push(ear);

    const eye = new THREE.Group();
    eye.name = 'Eye ' + suffix;
    eye.position.set(side * 0.29, 1.79, 0.645);
    root.add(eye);
    mesh(
      eye,
      new THREE.SphereGeometry(1, 48, 32),
      white,
      'Eye white ' + suffix,
      0,
      0,
      0,
      0.252,
      0.29,
      0.186,
    );
    const gaze = new THREE.Group();
    eye.add(gaze);
    const irisGeometry = new THREE.SphereGeometry(1, 48, 24),
      irisPositions = irisGeometry.getAttribute('position'),
      irisColours: number[] = [];
    for (let v = 0; v < irisPositions.count; v++) {
      const x = irisPositions.getX(v),
        y = irisPositions.getY(v),
        distance = Math.hypot(x, y),
        angle = Math.atan2(y, x);
      const filament =
        (Math.sin(angle * 37 + distance * 13) + Math.sin(angle * 71)) * 0.06;
      const colour = new THREE.Color(look.iris).lerp(
        new THREE.Color(look.iris).lerp(new THREE.Color('#ffffff'), 0.35),
        THREE.MathUtils.clamp((1 - distance) * 0.7 + filament, 0, 1),
      );
      if (distance > 0.84)
        colour.lerp(
          new THREE.Color('#514731'),
          THREE.MathUtils.smoothstep(distance, 0.84, 1),
        );
      irisColours.push(colour.r, colour.g, colour.b);
    }
    irisGeometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(irisColours, 3),
    );
    const irisMaterial = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.23,
      clearcoat: 1,
    });
    mesh(
      gaze,
      irisGeometry,
      irisMaterial,
      'Hazel iris ' + suffix,
      -side * 0.016,
      -0.008,
      0.177,
      0.137,
      0.155,
      0.038,
    );
    ball(
      gaze,
      pupilMaterial,
      'Pupil ' + suffix,
      -side * 0.016,
      -0.008,
      0.208,
      0.073,
      0.093,
      0.018,
    );
    mesh(
      gaze,
      detailGeometry,
      glintMaterial,
      'Eye catchlight ' + suffix,
      -0.048,
      0.052,
      0.217,
      0.034,
      0.037,
      0.008,
    );
    mesh(
      gaze,
      detailGeometry,
      glintMaterial,
      'Small catchlight ' + suffix,
      0.036,
      -0.042,
      0.217,
      0.012,
      0.013,
      0.005,
    );
    const lidSpace = new THREE.Group();
    lidSpace.scale.set(0.26, 0.3, 0.24);
    eye.add(lidSpace);
    const upper = mesh(
      lidSpace,
      new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
      skin,
      'Upper eyelid ' + suffix,
    );
    const lower = mesh(
      lidSpace,
      new THREE.SphereGeometry(
        1,
        48,
        24,
        0,
        Math.PI * 2,
        Math.PI / 2,
        Math.PI / 2,
      ),
      skin,
      'Lower eyelid ' + suffix,
    );
    eyes.push({ upper, lower, gaze });

    const brow = new THREE.Group();
    brow.name = 'Brow ' + suffix;
    brow.position.set(side * 0.29, 2.14, 0.59);
    mesh(
      brow,
      taperedCurve(
        [
          [-0.17, 0, -0.02],
          [-0.06, 0.048, 0.035],
          [0.07, 0.049, 0.035],
          [0.17, 0.01, -0.02],
        ],
        (t) => 0.026 * Math.sin(Math.PI * t) + 0.006,
        24,
        8,
      ),
      amber,
      'Soft eyebrow ' + suffix,
    );
    root.add(brow);
    brows.push(brow);
    ball(
      root,
      pink,
      'Warm cheek ' + suffix,
      side * 0.51,
      1.44,
      frontAt(side * 0.51, 1.44) + 0.018,
      0.155,
      0.07,
      0.026,
    );
    for (let i = 0; i < 3; i++) {
      const x = side * (0.44 + i * 0.062),
        y = 1.45 + (i % 2) * 0.034;
      mesh(
        root,
        detailGeometry,
        amber,
        'Freckle ' + suffix + i,
        x,
        y,
        frontAt(x, y) + 0.046,
        0.017,
        0.018,
        0.006,
      );
    }

    const arm = new THREE.Group();
    arm.name = 'Arm ' + suffix;
    arm.position.set(side * 0.76, 1.43, 0);
    root.add(arm);
    arms.push(arm);
    ball(arm, skin, 'Shoulder ' + suffix, 0, -0.07, 0, 0.19, 0.26, 0.19);
    mesh(
      arm,
      taperedCurve(
        [
          [0, 0, 0],
          [side * 0.08, -0.2, 0],
          [side * 0.12, -0.4, 0.06],
        ],
        (t) => 0.15 + Math.sin(t * Math.PI) * 0.025,
        28,
        16,
      ),
      skin,
      'Soft arm ' + suffix,
    );
    ball(
      arm,
      skin,
      'Palm ' + suffix,
      side * 0.12,
      -0.48,
      0.09,
      0.235,
      0.23,
      0.22,
    );
    for (let f = 0; f < 3; f++)
      ball(
        arm,
        skin,
        'Finger ' + suffix + f,
        side * 0.12 + (f - 1) * 0.13,
        -0.63 + Math.abs(f - 1) * 0.025,
        0.19,
        0.083,
        0.13,
        0.098,
      );
    ball(
      arm,
      skin,
      'Thumb ' + suffix,
      -side * 0.05,
      -0.45,
      0.25,
      0.1,
      0.135,
      0.1,
    ).rotation.z = side * 0.4;
    ball(
      arm,
      cream,
      'Palm pad ' + suffix,
      side * 0.12,
      -0.5,
      0.291,
      0.115,
      0.105,
      0.024,
    );

    const foot = new THREE.Group();
    foot.name = 'Foot ' + suffix;
    foot.position.set(side * 0.39, 0.27, 0.04);
    root.add(foot);
    feet.push(foot);
    ball(foot, amber, 'Foot sole ' + suffix, 0, -0.075, 0.12, 0.3, 0.165, 0.36);
    ball(foot, skin, 'Foot top ' + suffix, 0, -0.018, 0.12, 0.285, 0.17, 0.34);
    for (let t = 0; t < 3; t++) {
      ball(
        foot,
        skin,
        'Toe ' + suffix + t,
        (t - 1) * 0.15,
        -0.085,
        0.38,
        0.09,
        0.1,
        0.135,
      );
      mesh(
        foot,
        detailGeometry,
        cream,
        'Toe tip ' + suffix + t,
        (t - 1) * 0.15,
        -0.041,
        0.456,
        0.049,
        0.029,
        0.056,
      );
    }
  }

  ball(root, skin, 'Button nose', 0, 1.53, 0.754, 0.145, 0.09, 0.108);
  ball(
    root,
    cream,
    'Nose soft highlight',
    -0.025,
    1.561,
    0.839,
    0.05,
    0.018,
    0.01,
  );
  const smile = new THREE.Group();
  smile.name = 'Smile';
  root.add(smile);
  const mouth = new THREE.Shape();
  mouth.moveTo(-0.26, 1.405);
  mouth.bezierCurveTo(-0.12, 1.35, 0.12, 1.35, 0.26, 1.405);
  mouth.bezierCurveTo(0.17, 1.2, -0.17, 1.2, -0.26, 1.405);
  const mouthGeometry = new THREE.ShapeGeometry(mouth, 36),
    mouthPositions = mouthGeometry.getAttribute('position');
  for (let i = 0; i < mouthPositions.count; i++)
    mouthPositions.setZ(
      i,
      frontAt(mouthPositions.getX(i), mouthPositions.getY(i)) + 0.024,
    );
  mouthGeometry.computeVertexNormals();
  mesh(smile, mouthGeometry, dark, 'Smiling mouth');
  mesh(
    smile,
    taperedCurve(
      [
        [-0.26, 1.405, frontAt(-0.26, 1.405) + 0.031],
        [-0.14, 1.282, 0.712],
        [0, 1.256, 0.725],
        [0.14, 1.282, 0.712],
        [0.26, 1.405, frontAt(0.26, 1.405) + 0.031],
      ],
      (t) => 0.009 + Math.sin(t * Math.PI) * 0.012,
      40,
      8,
    ),
    amber,
    'Smile lower lip',
  );
  mesh(
    smile,
    new RoundedBoxGeometry(0.088, 0.094, 0.038, 3, 0.015),
    white,
    'Little tooth',
    0.065,
    1.334,
    0.73,
  );
  ball(smile, pink, 'Little tongue', -0.035, 1.278, 0.716, 0.073, 0.022, 0.014);

  const tail = new THREE.Group();
  tail.name = 'Curled tail';
  tail.position.set(0, 0.53, -0.48);
  root.add(tail);
  mesh(
    tail,
    taperedCurve(
      [
        [0, 0, 0],
        [0.11, -0.02, -0.29],
        [0.26, 0.04, -0.52],
        [0.39, 0.18, -0.54],
        [0.33, 0.29, -0.47],
      ],
      (t) => 0.13 * Math.pow(1 - t, 0.6),
      40,
      12,
    ),
    skin,
    'Curled tail mesh',
  );
  for (let i = 0; i < 3; i++)
    ball(
      root,
      amber,
      'Back marking ' + i,
      0,
      1.85 - i * 0.32,
      -frontAt(0, 1.85 - i * 0.32),
      0.13,
      0.15,
      0.045,
    );

  // Apply choices to the whole rig, so layered clothing shares its proportions.
  const bodyScale = BODY_SCALE[look.shape];
  tufts.visible = look.texture === 'plush';
  for (const material of [skin, cream, amber, tummyMaterial]) {
    material.roughness =
      look.texture === 'shiny' ? 0.2 : look.texture === 'smooth' ? 0.62 : 0.83;
    material.sheen = look.texture === 'plush' ? 1 : 0;
    material.clearcoat = look.texture === 'shiny' ? 0.8 : 0;
    material.bumpScale =
      look.texture === 'smooth' || look.texture === 'shiny'
        ? 0
        : look.texture === 'scales'
          ? 0.04
          : 0.012;
  }
  if (look.pattern !== 'plain') {
    const size = 128,
      pixels = new Uint8Array(size * size * 4);
    const primary = new THREE.Color(look.colour),
      accent = new THREE.Color(look.accent);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const u = (x % 32) - 16,
          v = (y % 32) - 16;
        const marked =
          look.pattern === 'spots'
            ? u * u + v * v < 55
            : look.pattern === 'stripes'
              ? (y + x * 0.25) % 28 < 8
              : look.pattern === 'diamonds'
                ? Math.abs(u) + Math.abs(v) < 10
                : (Math.floor(x / 8) * 17 + Math.floor(y / 8) * 31) % 11 < 3;
        const c = marked ? accent : primary,
          i = (y * size + x) * 4;
        pixels[i] = Math.round(c.r * 255);
        pixels[i + 1] = Math.round(c.g * 255);
        pixels[i + 2] = Math.round(c.b * 255);
        pixels[i + 3] = 255;
      }
    const texture = new THREE.DataTexture(pixels, size, size);
    texture.needsUpdate = true;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    skin.map = texture;
    skin.color.set('#ffffff');
  }
  for (const side of ['left', 'right']) {
    const horn = root.getObjectByName('Curved horn ' + side)!;
    horn.visible = look.horns === 'curved';
    if (look.horns === 'spikes' || look.horns === 'antennae') {
      const sign = side === 'left' ? -1 : 1;
      mesh(
        root,
        new THREE.ConeGeometry(
          look.horns === 'spikes' ? 0.18 : 0.055,
          0.55,
          16,
        ),
        hornMaterial,
        'Chosen horn ' + side,
        sign * 0.55,
        2.54,
        0,
      );
      if (look.horns === 'antennae')
        ball(root, cream, 'Antenna tip ' + side, sign * 0.55, 2.83, 0, 0.13);
    }
    const ear = root.getObjectByName('Ear ' + side)!;
    ear.visible = look.ears !== 'none';
    if (look.ears === 'long') ear.scale.y = 1.8;
    const eye = root.getObjectByName('Eye ' + side)!;
    eye.scale.setScalar(
      look.eyeSize === 'big' ? 1.17 : look.eyeSize === 'little' ? 0.8 : 1,
    );
    root.getObjectByName('Warm cheek ' + side)!.visible = look.face !== 'plain';
    for (let i = 0; i < 3; i++)
      root.getObjectByName('Freckle ' + side + i)!.visible =
        look.face === 'freckles';
  }
  if (look.eyes === 'one') {
    root.getObjectByName('Eye left')!.visible = false;
    root.getObjectByName('Brow left')!.visible = false;
    root.getObjectByName('Eye right')!.position.x = 0;
    root.getObjectByName('Brow right')!.position.x = 0;
  } else if (look.eyes === 'three') {
    const third = root.getObjectByName('Eye right')!.clone();
    third.name = 'Eye middle';
    third.position.set(0, 2.07, 0.57);
    third.scale.multiplyScalar(0.72);
    root.add(third);
    root.getObjectByName('Eye left')!.position.x = -0.4;
    root.getObjectByName('Eye right')!.position.x = 0.4;
    const upper = third.getObjectByName('Upper eyelid right') as THREE.Mesh,
      lower = third.getObjectByName('Lower eyelid right') as THREE.Mesh;
    eyes.push({ upper, lower, gaze: third.children[1] as THREE.Group });
  }
  tail.visible = look.tail !== 'none';
  if (look.tail === 'long') tail.scale.set(1.3, 1, 1.8);
  let speed = 0,
    stride = 0,
    lastAirborne = 0,
    landing = 0;
  function animate(pose: MonsterPose) {
    const { time, delta } = pose;
    speed = THREE.MathUtils.lerp(speed, pose.speed, 1 - Math.exp(-12 * delta));
    stride += delta * 9 * speed;
    if (lastAirborne > 0 && pose.airborne === 0) landing = 0.065;
    lastAirborne = pose.airborne;
    landing *= Math.exp(-10 * delta);
    const gentle = pose.reducedMotion ? 0 : 1;
    const idle =
      (1 - Math.min(1, speed * 3)) *
      gentle *
      Number(
        !pose.celebrating &&
          pose.airborne === 0 &&
          !pose.carrying &&
          !pose.homeActivity,
      );
    // Smooth envelopes keep little gestures from snapping on or off.
    const gesture = (start: number, duration: number) => {
      const phase = ((time % 23) - start) / duration;
      return phase > 0 && phase < 1 ? Math.sin(phase * Math.PI) ** 2 * idle : 0;
    };
    const scratch = gesture(7, 3.1),
      stretchArms = gesture(16, 3.4),
      curious = gesture(11, 3);
    const wobble = Math.sin(stride * 2) * speed * 0.018 * gentle;
    const stretch =
      (pose.airborne > 0 ? 0.035 : 0) - landing + wobble + stretchArms * 0.035;
    root.scale.set(
      bodyScale[0] * (1 - stretch * 0.45),
      bodyScale[1] * (1 + stretch + Math.sin(time * 2) * 0.004 * gentle),
      bodyScale[2] * (1 - stretch * 0.45),
    );
    root.position.y =
      Math.sin(time * 2) * 0.018 * gentle +
      Math.abs(Math.sin(stride)) * speed * 0.085 * gentle +
      stretchArms * 0.035 +
      (pose.celebrating ? Math.abs(Math.sin(time * 7)) * 0.12 * gentle : 0);
    root.rotation.z =
      Math.sin(stride) * speed * 0.075 * gentle +
      Math.sin(time * 1.4) * 0.018 * idle +
      scratch * 0.075 -
      curious * 0.08;
    root.rotation.x = speed * 0.045 * gentle - stretchArms * 0.035;
    root.rotation.y =
      Math.sin(time * 0.7) * 0.045 * idle +
      Math.sin(stride) * speed * 0.028 * gentle;
    feet.forEach((foot, i) => {
      const phase = stride + i * Math.PI;
      foot.position.y =
        0.27 + Math.max(0, Math.sin(phase)) * speed * 0.13 * gentle;
      foot.position.z = 0.04 + Math.cos(phase) * speed * 0.1;
      foot.rotation.x = Math.sin(phase) * speed * 0.35;
    });
    arms[0].rotation.x =
      -Math.sin(stride) * speed * 0.55 * gentle -
      scratch * (0.85 + Math.sin(time * 19) * 0.14) -
      stretchArms * 0.2;
    arms[1].rotation.x =
      Math.sin(stride) * speed * 0.55 * gentle - stretchArms * 0.2;
    const wave = pose.greeting && time % 23 < 2.7;
    arms[0].rotation.z = pose.celebrating
      ? 1.85
      : 0.09 + scratch * 2.05 + stretchArms * 2.35;
    arms[1].rotation.z =
      pose.celebrating || wave
        ? -1.95 + Math.sin(time * 7) * 0.14 * gentle
        : -0.09 - stretchArms * 2.35;
    if (pose.carrying) {
      arms[0].rotation.set(-1.05, 0, -0.12);
      arms[1].rotation.set(-1.05, 0, 0.12);
    }
    const atHome = pose.homeActivity;
    if (atHome) {
      root.rotation.set(0, 0, 0);
      root.position.y = Math.sin(time * 1.6) * 0.013 * gentle;
      if (['sit', 'read', 'swing', 'picnic'].includes(atHome)) {
        feet.forEach((foot, i) => {
          foot.position.y = 0.13;
          foot.position.z = 0.63;
          foot.rotation.x = -0.32 + Math.sin(time * 2 + i) * 0.06 * gentle;
        });
        arms[0].rotation.set(-0.35, 0, -0.1);
        arms[1].rotation.set(-0.35, 0, 0.1);
      }
      if (atHome === 'read' || atHome === 'picnic') {
        arms[0].rotation.set(-0.86, 0, -0.15);
        arms[1].rotation.set(-0.86, 0, 0.15);
      }
      if (atHome === 'sleep') {
        root.rotation.x = -Math.PI / 2;
        arms[0].rotation.set(-0.25, 0, -0.15);
        arms[1].rotation.set(-0.25, 0, 0.15);
      }
      if (atHome === 'dance') {
        root.rotation.z = Math.sin(time * 2.7) * 0.09 * gentle;
        root.rotation.y = Math.sin(time * 1.4) * 0.18 * gentle;
        root.position.y = Math.abs(Math.sin(time * 2.7)) * 0.09 * gentle;
        arms[0].rotation.z = 1.25 + Math.sin(time * 2.7) * 0.16 * gentle;
        arms[1].rotation.z = -1.25 + Math.sin(time * 2.7) * 0.16 * gentle;
      }
      if (atHome === 'splash' || atHome === 'light') {
        arms[0].rotation.x = -1 + Math.sin(time * 2.1) * 0.12 * gentle;
        arms[1].rotation.x = -0.7;
        root.rotation.x = 0.08;
      }
    }
    const phase = time % 5.7,
      blink =
        !pose.reducedMotion && phase > 4.9 && phase < 5.14
          ? Math.sin(((phase - 4.9) / 0.24) * Math.PI) ** 2
          : 0;
    const doublePhase = time % 13.7;
    const doubleBlink =
      !pose.reducedMotion && doublePhase > 12.7 && doublePhase < 13.15
        ? Math.sin(((doublePhase - 12.7) / 0.45) * Math.PI * 2) ** 2
        : 0;
    const eyelid =
      pose.homeActivity === 'sleep'
        ? 0.94
        : Math.max(blink, doubleBlink, stretchArms * 0.7);
    eyes.forEach(({ upper, lower, gaze }) => {
      upper.rotation.x = -1.24 * (1 - eyelid);
      lower.rotation.x = 1.42 * (1 - eyelid);
      gaze.position.set(
        Math.sin(time * 0.47) * 0.023 * gentle + curious * 0.026,
        Math.sin(time * 0.31) * 0.012 * gentle + scratch * 0.015,
        0,
      );
    });
    ears.forEach((ear, i) => {
      ear.rotation.z =
        Math.sin(time * 2.1 + i) * 0.027 * gentle +
        Math.sin(stride + i) * speed * 0.035;
    });
    brows.forEach((brow, i) => {
      brow.rotation.z =
        (i ? -1 : 1) *
        (pose.celebrating ? 0.09 : 0.02 + curious * (i ? 0.04 : 0.14));
    });
    tail.rotation.y =
      Math.sin(time * 2.5) * (0.09 + speed * 0.23 + scratch * 0.16) * gentle;
  }
  animate({
    delta: 0,
    time: 0,
    speed: 0,
    airborne: 0,
    celebrating: false,
    greeting: false,
    reducedMotion: false,
  });
  return { root, arms, feet, eyes, animate };
}
