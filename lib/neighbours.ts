import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { placeFor, type PlaceId } from './adventure';

export function createNeighbour(
  id: PlaceId,
  options: { visitor?: boolean } = {},
) {
  const place = placeFor(id),
    kind = place.kind,
    root = new THREE.Group(),
    body = new THREE.Group(),
    head = new THREE.Group();
  root.name = options.visitor ? 'A village friend' : place.friend;
  body.name = 'Neighbour body';
  head.name = 'Neighbour head';
  root.add(body);
  body.add(head);
  head.position.y = 1.58;
  const sphere = new THREE.SphereGeometry(1, 28, 20),
    roundBox = new RoundedBoxGeometry(1, 1, 1, 2, 0.13),
    materials = new Map<string, THREE.MeshStandardMaterial>();
  function mat(c: string, gloss = false) {
    const key = c + gloss;
    if (!materials.has(key))
      materials.set(
        key,
        new THREE.MeshStandardMaterial({
          color: c,
          roughness: gloss ? 0.22 : 0.76,
        }),
      );
    return materials.get(key)!;
  }
  function mesh(
    p: THREE.Object3D,
    g: THREE.BufferGeometry,
    c: string,
    name: string,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = sx,
    sz = sx,
    gloss = false,
  ) {
    const m = new THREE.Mesh(g, mat(c, gloss));
    m.name = name;
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.castShadow = m.receiveShadow = true;
    p.add(m);
    return m;
  }
  const ball = (
    p: THREE.Object3D,
    c: string,
    name: string,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy = sx,
    sz = sx,
    gloss = false,
  ) => mesh(p, sphere, c, name, x, y, z, sx, sy, sz, gloss);
  const box = (
    p: THREE.Object3D,
    c: string,
    name: string,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) => mesh(p, roundBox, c, name, x, y, z, sx, sy, sz);
  const palette: Record<string, string> = {
    fox: options.visitor ? '#c69b79' : '#df965d',
    owl: '#a691bc',
    penguin: '#456e8c',
    frog: options.visitor ? '#aeb67c' : '#8aba69',
    rabbit: options.visitor ? '#c3ad92' : '#e6c3b4',
    alien: id === 'moon' ? '#afa0da' : '#87c5b2',
  };
  const colour = palette[kind] ?? '#d9b374',
    cream = '#fff0d3';
  const torso = ball(
    body,
    colour,
    'Soft body',
    0,
    0.76,
    0,
    kind === 'penguin' ? 0.61 : 0.53,
    kind === 'owl' ? 0.65 : 0.7,
    0.43,
  );
  ball(
    body,
    cream,
    'Tummy',
    0,
    0.71,
    0.36,
    kind === 'owl' ? 0.41 : 0.36,
    0.44,
    0.105,
  );
  ball(
    head,
    colour,
    'Head',
    0,
    0,
    0,
    kind === 'alien' ? 0.65 : 0.57,
    kind === 'owl' ? 0.48 : 0.52,
    0.43,
  );
  const eyes: { upper: THREE.Mesh; lower: THREE.Mesh; gaze: THREE.Group }[] =
      [],
    brows: THREE.Mesh[] = [],
    ears: THREE.Group[] = [],
    arms: THREE.Group[] = [],
    feet: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'left' : 'right',
      eyeX = side * (kind === 'frog' ? 0.36 : 0.225),
      eyeY = kind === 'frog' ? 0.38 : 0.09;
    if (kind === 'frog')
      ball(head, colour, 'Eye mound ' + suffix, eyeX, eyeY, 0.13, 0.26);
    if (kind === 'owl')
      ball(
        head,
        '#d9c9d8',
        'Facial feathers ' + suffix,
        side * 0.24,
        0.06,
        0.32,
        0.29,
        0.3,
        0.13,
      );
    const eye = new THREE.Group();
    eye.position.set(eyeX, eyeY, 0.4);
    head.add(eye);
    ball(
      eye,
      '#fffaeb',
      'Eye white ' + suffix,
      0,
      0,
      0,
      0.168,
      0.202,
      0.13,
      true,
    );
    const gaze = new THREE.Group();
    eye.add(gaze);
    ball(
      gaze,
      kind === 'frog' ? '#887046' : kind === 'alien' ? '#536f8f' : '#5d6471',
      'Iris ' + suffix,
      -side * 0.008,
      0,
      0.121,
      0.092,
      0.12,
      0.033,
      true,
    );
    ball(
      gaze,
      '#27363d',
      'Pupil ' + suffix,
      -side * 0.008,
      0,
      0.147,
      0.055,
      0.081,
      0.02,
      true,
    );
    ball(
      gaze,
      '#ffffff',
      'Catchlight ' + suffix,
      -0.026,
      0.041,
      0.168,
      0.019,
      0.024,
      0.009,
      true,
    );
    const lids = new THREE.Group();
    lids.scale.set(0.181, 0.214, 0.18);
    eye.add(lids);
    const upper = mesh(
      lids,
      new THREE.SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      colour,
      'Upper eyelid ' + suffix,
      0,
      0,
      0,
    );
    const lower = mesh(
      lids,
      new THREE.SphereGeometry(
        1,
        28,
        16,
        0,
        Math.PI * 2,
        Math.PI / 2,
        Math.PI / 2,
      ),
      colour,
      'Lower eyelid ' + suffix,
      0,
      0,
      0,
    );
    upper.rotation.x = -1.28;
    lower.rotation.x = 1.42;
    eyes.push({ upper, lower, gaze });
    const brow = ball(
      head,
      kind === 'frog' ? '#6c9c54' : colour,
      'Eyebrow ' + suffix,
      eyeX,
      eyeY + 0.255,
      0.405,
      0.15,
      0.038,
      0.045,
    );
    brow.rotation.z = -side * 0.08;
    brows.push(brow);
    if (kind !== 'penguin')
      ball(
        head,
        kind === 'frog' ? '#d1cf79' : '#e8ac9c',
        'Warm cheek ' + suffix,
        side * 0.36,
        -0.12,
        0.377,
        0.11,
        0.055,
        0.045,
      );
    const arm = new THREE.Group();
    arm.name = 'Arm ' + suffix;
    arm.position.set(side * 0.55, 1.01, 0);
    body.add(arm);
    arms.push(arm);
    const wing = kind === 'owl' || kind === 'penguin';
    ball(
      arm,
      colour,
      'Hand ' + suffix,
      0,
      -0.22,
      0,
      wing ? 0.18 : 0.14,
      wing ? 0.4 : 0.32,
      0.18,
    );
    if (kind === 'owl')
      for (let i = 0; i < 3; i++)
        ball(
          arm,
          '#bfadcb',
          'Wing feather ' + suffix + i,
          (i - 1) * 0.08,
          -0.38,
          0.07,
          0.065,
          0.23,
          0.055,
        );
    const foot = new THREE.Group();
    foot.name = 'Foot ' + suffix;
    foot.position.set(side * 0.245, 0.14, 0.12);
    body.add(foot);
    feet.push(foot);
    ball(
      foot,
      kind === 'penguin' ? '#dfa953' : colour,
      'Toe ' + suffix,
      0,
      0,
      0,
      0.215,
      0.14,
      0.3,
    );
    if (kind === 'frog' || kind === 'penguin')
      for (let i = 0; i < 3; i++)
        ball(
          foot,
          kind === 'frog' ? '#82ae5d' : '#dfa953',
          'Little toe ' + suffix + i,
          (i - 1) * 0.11,
          -0.015,
          0.2,
          0.075,
          0.065,
          0.14,
        );
    if (kind === 'rabbit') {
      const ear = new THREE.Group();
      ear.position.set(side * 0.26, 0.43, 0);
      head.add(ear);
      ears.push(ear);
      ball(ear, colour, 'Rabbit ear ' + suffix, 0, 0.27, 0, 0.17, 0.48, 0.13);
      ball(
        ear,
        '#d99eae',
        'Ear velvet ' + suffix,
        0,
        0.29,
        0.108,
        0.085,
        0.35,
        0.032,
      );
    }
    if (kind === 'fox' || kind === 'owl') {
      const ear = new THREE.Group();
      ear.position.set(side * 0.38, 0.4, -0.03);
      head.add(ear);
      ears.push(ear);
      mesh(
        ear,
        new THREE.ConeGeometry(0.21, 0.5, 24),
        colour,
        'Pointed ear ' + suffix,
        0,
        0.16,
        0,
      ).rotation.z = -side * 0.26;
      mesh(
        ear,
        new THREE.ConeGeometry(0.12, 0.3, 18),
        kind === 'fox' ? '#efd1b0' : '#c8b8d4',
        'Ear inner ' + suffix,
        0,
        0.15,
        0.105,
        1,
        1,
        0.2,
      ).rotation.z = -side * 0.26;
    }
    if (kind === 'alien') {
      const antenna = new THREE.Group();
      antenna.position.set(side * 0.36, 0.43, 0);
      head.add(antenna);
      ears.push(antenna);
      ball(
        antenna,
        colour,
        'Antenna ' + suffix,
        0,
        0.19,
        0,
        0.035,
        0.22,
        0.035,
      );
      ball(antenna, '#f0d884', 'Antenna glow ' + suffix, 0, 0.4, 0, 0.085);
    }
  }
  const mouth = ball(
    head,
    '#6e4850',
    'Talking mouth',
    0,
    -0.2,
    0.445,
    0.115,
    0.025,
    0.025,
  );
  const smileCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.13, -0.18, 0.448),
    new THREE.Vector3(0, -0.23, 0.464),
    new THREE.Vector3(0.13, -0.18, 0.448),
  ]);
  const smile = mesh(
    head,
    new THREE.TubeGeometry(smileCurve, 20, 0.014, 8, false),
    '#755256',
    'Kind smile',
    0,
    0,
    0,
  );
  let tail: THREE.Group | null = null;
  if (kind === 'fox') {
    for (const side of [-1, 1])
      ball(head, cream, 'Muzzle', side * 0.12, -0.145, 0.38, 0.19, 0.13, 0.16);
    ball(
      head,
      '#45414b',
      'Velvet nose',
      0,
      -0.1,
      0.548,
      0.09,
      0.057,
      0.054,
      true,
    );
    mouth.position.set(0, -0.265, 0.466);
    smile.position.y = -0.075;
    tail = new THREE.Group();
    tail.position.set(0.27, 0.5, -0.32);
    body.add(tail);
    ball(
      tail,
      colour,
      'Bushy tail',
      0.35,
      0.04,
      -0.28,
      0.24,
      0.27,
      0.56,
    ).rotation.y = -0.45;
    ball(
      tail,
      cream,
      'White tail tip',
      0.52,
      0.07,
      -0.64,
      0.18,
      0.2,
      0.26,
    ).rotation.y = -0.45;
    if (!options.visitor) {
      box(body, '#fff3d8', 'Chef apron', 0, 0.78, 0.437, 0.57, 0.65, 0.045);
      box(body, '#d78571', 'Apron pocket', 0, 0.64, 0.467, 0.3, 0.2, 0.035);
      for (const side of [-1, 1])
        box(
          body,
          '#fff3d8',
          'Apron strap',
          side * 0.22,
          1.08,
          0.4,
          0.07,
          0.34,
          0.04,
        ).rotation.z = -side * 0.13;
      ball(head, '#fff6e5', 'Chef hat band', 0, 0.55, 0, 0.35, 0.14, 0.31);
      for (const side of [-1, 0, 1])
        ball(
          head,
          '#fff6e5',
          'Chef hat puff',
          side * 0.2,
          0.78,
          0,
          0.24,
          0.25,
          0.24,
        );
    }
  }
  if (kind === 'owl' || kind === 'penguin')
    ball(head, '#e2b362', 'Beak', 0, -0.13, 0.455, 0.1, 0.095, 0.17);
  if (kind === 'owl') {
    for (const side of [-1, 1]) {
      mesh(
        head,
        new THREE.TorusGeometry(0.21, 0.018, 8, 36),
        '#a78660',
        'Reading glasses',
        side * 0.225,
        0.09,
        0.548,
      );
      for (let i = 0; i < 3; i++)
        ball(
          body,
          '#beadc8',
          'Chest feather',
          side * (0.11 + i * 0.04),
          0.86 - i * 0.13,
          0.454,
          0.065,
          0.09,
          0.018,
        );
    }
    box(head, '#a78660', 'Glasses bridge', 0, 0.09, 0.55, 0.075, 0.02, 0.024);
    box(arms[0], '#6f91a5', 'Story book', 0, -0.24, 0.16, 0.32, 0.42, 0.1);
    box(arms[0], cream, 'Book pages', 0.016, -0.24, 0.217, 0.27, 0.36, 0.025);
  }
  if (kind === 'penguin') {
    ball(head, '#759ead', 'Sailor cap', 0, 0.45, 0, 0.39, 0.12, 0.33);
    box(head, '#f5e6c4', 'Cap brim', 0, 0.39, 0.24, 0.72, 0.06, 0.33);
    for (let i = 0; i < 3; i++)
      box(
        body,
        i % 2 ? '#e3b865' : '#fff1d4',
        'Sailor scarf',
        0.08,
        1.19 - i * 0.11,
        0.44,
        0.16,
        0.115,
        0.04,
      );
  }
  if (kind === 'frog') {
    box(body, '#83a5ab', 'Garden dungarees', 0, 0.72, 0.425, 0.48, 0.46, 0.06);
    for (const side of [-1, 1]) {
      box(
        body,
        '#83a5ab',
        'Dungaree strap',
        side * 0.17,
        1.03,
        0.39,
        0.09,
        0.35,
        0.06,
      );
      ball(body, '#efdb97', 'Wooden button', side * 0.17, 0.94, 0.46, 0.035);
    }
  }
  if (kind === 'rabbit') {
    tail = new THREE.Group();
    tail.position.set(0, 0.43, -0.48);
    body.add(tail);
    ball(tail, cream, 'Cotton tail', 0, 0, 0, 0.25);
    box(
      body,
      options.visitor ? '#98b3a2' : '#cd9ca7',
      'Seed apron',
      0,
      0.75,
      0.44,
      0.51,
      0.58,
      0.035,
    );
    box(body, '#b58792', 'Seed pocket', 0, 0.63, 0.47, 0.31, 0.17, 0.025);
    ball(head, '#c78592', 'Pink nose', 0, -0.13, 0.45, 0.055, 0.043, 0.04);
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      ball(
        head,
        '#f0d090',
        'Hair flower',
        -0.42 + Math.cos(a) * 0.08,
        0.49 + Math.sin(a) * 0.08,
        0.16,
        0.06,
        0.06,
        0.035,
      );
    }
    ball(head, '#b87d62', 'Flower middle', -0.42, 0.49, 0.19, 0.04);
  }
  if (kind === 'alien') {
    const suit = id === 'moon' ? '#e8e1d7' : '#bdab8b';
    box(body, suit, 'Explorer jacket', 0, 0.78, 0.36, 0.55, 0.53, 0.17);
    box(body, '#6d8090', 'Control badge', 0.12, 0.85, 0.46, 0.2, 0.2, 0.035);
    ball(body, '#e5c871', 'Badge light', 0.12, 0.86, 0.487, 0.035);
    for (const foot of feet)
      ball(foot, '#718392', 'Explorer boot', 0, 0, 0.015, 0.23, 0.145, 0.3);
    if (id === 'rocket')
      for (const side of [-1, 1]) {
        ball(
          head,
          '#9b815e',
          'Pilot goggles',
          side * 0.22,
          0.32,
          0.34,
          0.19,
          0.13,
          0.06,
        );
        ball(
          head,
          '#95bed0',
          'Goggle glass',
          side * 0.22,
          0.32,
          0.393,
          0.135,
          0.08,
          0.017,
          true,
        );
      }
  }
  const scarfColour =
    kind === 'fox'
      ? '#c97b79'
      : kind === 'owl'
        ? '#93adb1'
        : kind === 'frog'
          ? '#e3c16d'
          : kind === 'rabbit'
            ? '#b794b8'
            : id === 'moon'
              ? '#e6c772'
              : '#d19084';
  const scarf = mesh(
    body,
    new THREE.TorusGeometry(0.34, 0.065, 10, 32),
    scarfColour,
    'Soft neckerchief',
    0,
    1.19,
    0,
  );
  scarf.rotation.x = Math.PI / 2;
  ball(
    body,
    scarfColour,
    'Scarf knot',
    0.15,
    1.14,
    0.38,
    0.095,
    0.11,
    0.06,
  ).rotation.z = -0.2;
  return {
    root,
    arms,
    animate(
      time: number,
      near: boolean,
      talking: boolean,
      reduced: boolean,
      walking = 0,
      greeting?: { age: number; weight: number },
    ) {
      const motion = reduced ? 0 : 1,
        speed = Math.max(0, Math.min(1, walking)),
        stride = time * 7;
      body.position.y =
        (Math.sin(time * 1.6) * 0.018 +
          Math.abs(Math.sin(stride)) * speed * 0.035) *
        motion;
      torso.scale.y =
        (kind === 'owl' ? 0.65 : 0.7) *
        (1 + Math.sin(time * 1.6) * 0.009 * motion);
      body.rotation.z =
        (Math.sin(time * 1.2) * 0.018 + Math.sin(stride) * speed * 0.035) *
        motion;
      head.rotation.z = Math.sin(time * 0.65) * 0.025 * motion;
      head.rotation.y = Math.sin(time * 0.43) * 0.07 * motion;
      const wave =
        !reduced && near && speed < 0.1
          ? greeting
            ? Math.max(
                0,
                Math.min(
                  1,
                  Number.isFinite(greeting.weight) ? greeting.weight : 0,
                ),
              )
            : Number(time % 11 < 2.5)
          : 0;
      arms.forEach((arm, i) => {
        const side = i ? 1 : -1;
        arm.rotation.z =
          side *
          THREE.MathUtils.lerp(
            talking ? 0.45 + Math.sin(time * 2.2) * 0.12 * motion : 0.22,
            2.1 +
              Math.sin(
                (greeting && Number.isFinite(greeting.age)
                  ? greeting.age
                  : time) * 6,
              ) *
                0.16 *
                motion,
            wave,
          );
        arm.rotation.x =
          Math.sin(stride + (i ? Math.PI : 0)) * speed * 0.55 * motion;
      });
      feet.forEach((foot, i) => {
        const step = Math.sin(stride + (i ? Math.PI : 0)) * speed * motion;
        foot.position.y = 0.14 + Math.max(0, step) * 0.1;
        foot.rotation.x = step * 0.2;
      });
      const phase = time % 5.7,
        closed =
          !reduced && phase > 4.9 && phase < 5.14
            ? Math.sin(((phase - 4.9) / 0.24) * Math.PI) ** 2
            : 0;
      eyes.forEach(({ upper, lower, gaze }, i) => {
        upper.rotation.x = -1.28 * (1 - closed);
        lower.rotation.x = 1.42 * (1 - closed);
        gaze.position.set(
          Math.sin(time * 0.5) * 0.014 * motion,
          Math.sin(time * 0.35) * 0.007 * motion,
          0,
        );
        brows[i].position.y =
          (kind === 'frog' ? 0.38 : 0.09) +
          0.255 +
          (talking ? Math.sin(time * 2) * 0.022 * motion : 0);
      });
      mouth.visible = talking;
      smile.visible = !talking;
      mouth.scale.y = talking
        ? 0.03 + Math.abs(Math.sin(time * 8)) * 0.04 * motion
        : 0.025;
      ears.forEach((ear, i) => {
        ear.rotation.z =
          (i ? 1 : -1) * (0.06 + Math.sin(time * 1.4 + i) * 0.07 * motion);
      });
      if (tail) tail.rotation.y = Math.sin(time * 1.4) * 0.17 * motion;
    },
  };
}
