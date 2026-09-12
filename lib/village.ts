import * as THREE from 'three';
import { PLACES, SHOP_ITEMS, type AdventureProgress } from './adventure';
import { createNeighbour } from './neighbours';

export function createVillage(height: (x: number, z: number) => number) {
  const root = new THREE.Group(),
    moon = new THREE.Group(),
    home = new THREE.Group(),
    furnishings = new THREE.Group(),
    beds = new THREE.Group();
  root.name = 'Neighbourhood';
  moon.name = 'Moon meadow';
  function mesh(
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    colour: string,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = sx,
    sz = sx,
  ) {
    const m = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: colour, roughness: 0.85 }),
    );
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  const box = (
    p: THREE.Object3D,
    c: string,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) => mesh(p, new THREE.BoxGeometry(1, 1, 1), c, x, y, z, sx, sy, sz);
  const ball = (
    p: THREE.Object3D,
    c: string,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy = sx,
    sz = sx,
  ) => mesh(p, new THREE.SphereGeometry(1, 16, 12), c, x, y, z, sx, sy, sz);
  function marker(
    parent: THREE.Object3D,
    icon: string,
    x: number,
    y: number,
    z: number,
  ) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff9e9';
    ctx.beginPath();
    ctx.arc(64, 64, 57, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '66px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, 64, 68);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
    sprite.position.set(x, y, z);
    sprite.scale.set(1.2, 1.2, 1);
    parent.add(sprite);
    return sprite;
  }
  const neighbours = PLACES.filter((p) => p.id !== 'home').map((place) => {
    const npc = createNeighbour(place.id);
    npc.root.position.set(
      place.x,
      place.id === 'moon' ? 0 : height(place.x, place.z),
      place.z,
    );
    (place.id === 'moon' ? moon : root).add(npc.root);
    marker(npc.root, place.icon, 0, 3.1, 0);
    return { ...npc, id: place.id };
  });
  // Open-front home: the roof lifts away as Monster approaches.
  home.position.set(11, height(11, 12), 8.5);
  root.add(home);
  home.add(furnishings);
  box(home, '#efdca9', 0, 0.03, 0, 7.2, 0.14, 5.5);
  box(home, '#f9dfb1', 0, 1.8, -2.5, 7, 3.6, 0.22);
  box(home, '#f5d3a1', -3.4, 1.8, 0, 0.22, 3.6, 5);
  box(home, '#f5d3a1', 3.4, 1.8, 0, 0.22, 3.6, 5);
  for (const side of [-1, 1]) {
    box(home, '#79bdb8', side * 2, 1.9, -2.35, 1.5, 1.6, 0.08);
    box(home, '#fff7d7', side * 2, 1.9, -2.27, 0.08, 1.6, 0.05);
  }
  const roof = new THREE.Group();
  home.add(roof);
  for (const side of [-1, 1]) {
    const panel = box(roof, '#d88978', side * 1.8, 4.2, 0, 4.3, 0.3, 6.3);
    panel.rotation.z = -side * 0.4;
  }
  box(roof, '#c67969', 2.2, 4.7, -1.2, 0.75, 1.8, 0.75);
  box(home, '#c4a47b', 0, 0.03, 3.3, 7.6, 0.18, 1.3);
  marker(home, '🏡', 0, 3, 3);
  for (let i = 0; i < 7; i++) {
    box(
      root,
      '#e2d1a7',
      7.5 + i * 1.3,
      height(11, 18) + 0.65,
      20.8,
      0.12,
      1.3,
      0.12,
    );
  }
  box(root, '#f3dfb4', 11.4, height(11, 18) + 0.86, 20.8, 8, 0.13, 0.13);
  root.add(beds);
  beds.position.set(8.5, height(11, 17), 16.8);
  for (let i = 0; i < 6; i++)
    box(
      beds,
      '#926447',
      (i % 3) * 2.1,
      0.08,
      Math.floor(i / 3) * 1.7,
      1.7,
      0.17,
      1.35,
    );
  const crops = new THREE.Group();
  beds.add(crops);
  // Poppy's seed and furniture market, with recognisable sample goods.
  for (let i = 0; i < 2; i++) {
    const stall = new THREE.Group();
    root.add(stall);
    stall.position.set(-15 + i * 6, height(-12, 16), 13);
    box(stall, '#d9ad7c', 0, 0.7, 0, 3.6, 1.4, 1.8);
    for (const side of [-1, 1])
      box(stall, '#b18862', side * 1.7, 1.8, -0.5, 0.12, 3.6, 0.12);
    for (let stripe = 0; stripe < 6; stripe++)
      box(
        stall,
        stripe % 2 ? '#fff2d7' : i ? '#ae91d2' : '#86bba5',
        -1.75 + stripe * 0.7,
        3.1,
        0,
        0.7,
        0.18,
        2.8,
      );
    marker(stall, i ? '🛋️' : '🌱', 0, 2.4, 0.65);
    for (let k = 0; k < 3; k++)
      ball(
        stall,
        ['#ed9db2', '#eccb63', '#9bbf68'][k],
        k - 1,
        1.58,
        0.25,
        0.29,
      );
  }
  const pizzeria = new THREE.Group();
  root.add(pizzeria);
  pizzeria.position.set(0, height(0, -18), -18);
  box(pizzeria, '#f6d9ad', 0, 1.6, -1, 6.7, 3.2, 2.6);
  box(pizzeria, '#b97757', 0, 0.65, 0.65, 6.8, 1.3, 1.1);
  for (let i = 0; i < 10; i++)
    box(
      pizzeria,
      i % 2 ? '#fff2d9' : '#d8715e',
      -3.15 + i * 0.7,
      3.1,
      0,
      0.7,
      0.2,
      3.9,
    );
  ball(pizzeria, '#bd6b4d', 1.7, 1.7, -0.1, 1.2, 1.15, 0.8);
  ball(pizzeria, '#593d35', 1.7, 1.5, 0.65, 0.58, 0.55, 0.07);
  ball(pizzeria, '#f1ad42', 1.7, 1.31, 0.73, 0.35, 0.17, 0.05);
  box(pizzeria, '#aa6148', 1.8, 3.7, -1, 0.6, 2.8, 0.7);
  for (let i = 0; i < 3; i++) {
    mesh(
      pizzeria,
      new THREE.CylinderGeometry(0.43, 0.43, 0.08, 24),
      '#eac578',
      -2 + i * 1.15,
      1.35,
      0.75,
    );
    mesh(
      pizzeria,
      new THREE.CylinderGeometry(0.35, 0.35, 0.025, 24),
      '#d97652',
      -2 + i * 1.15,
      1.41,
      0.75,
    );
  }
  marker(pizzeria, '🍕', -1, 4.2, 0.2);
  const rocket = new THREE.Group();
  root.add(rocket);
  rocket.position.set(-13, height(-13, -30), -30.8);
  mesh(
    rocket,
    new THREE.CylinderGeometry(1.1, 1.25, 3.7, 32),
    '#e5ece4',
    0,
    2.5,
    0,
  );
  mesh(rocket, new THREE.ConeGeometry(1.1, 1.8, 32), '#e79293', 0, 5.25, 0);
  ball(rocket, '#6596c0', 0, 3.2, 1.02, 0.57, 0.57, 0.12);
  const parts: THREE.Object3D[] = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    parts.push(
      box(
        rocket,
        ['#a799d9', '#83cbb3', '#f5ce6a'][i],
        Math.cos(a) * 1.25,
        0.7,
        Math.sin(a) * 1.25,
        0.55,
        1.4,
        1.2,
      ),
    );
  }
  marker(rocket, '🚀', 0, 6.8, 0);
  // The moon is a separate playable location, sharing the same movement rig.
  mesh(moon, new THREE.CylinderGeometry(51, 54, 2, 96), '#b4aecb', 0, -1.1, 0);
  for (let i = 0; i < 34; i++) {
    const a = i * 2.39996,
      radius = 13 + (i % 7) * 4;
    const crater = mesh(
      moon,
      new THREE.TorusGeometry(1 + (i % 3) * 0.5, 0.12, 6, 20),
      '#9793b3',
      Math.cos(a) * radius,
      0.02,
      Math.sin(a) * radius,
    );
    crater.rotation.x = Math.PI / 2;
  }
  const stars = new Float32Array(600 * 3);
  for (let i = 0; i < 600; i++) {
    const a = i * 2.39996;
    stars[i * 3] = Math.cos(a) * 100;
    stars[i * 3 + 1] = 12 + ((i * 17) % 85);
    stars[i * 3 + 2] = Math.sin(a) * 100;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(stars, 3));
  moon.add(
    new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({ color: '#fff1c9', size: 0.35 }),
    ),
  );
  const earth = ball(moon, '#579ed0', -27, 24, -55, 7);
  (earth.material as THREE.MeshStandardMaterial).emissive.set('#24536a');
  for (let i = 0; i < 5; i++)
    ball(moon, '#7cb58f', -29 + i * 1.6, 22 + (i % 3) * 2, -48.9, 1.4, 2, 0.2);
  marker(moon, '🚀', 0, 2.4, 6);
  const landing = box(moon, '#716f9b', 0, 0.03, 6, 5, 0.15, 5);
  landing.name = 'Return launch pad';
  moon.visible = false;
  let contentsKey = '';
  function clear(group: THREE.Group) {
    group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
          m.dispose(),
        );
      }
    });
    group.clear();
  }
  function update(a: AdventureProgress, playerX: number, playerZ: number) {
    roof.visible = Math.hypot(playerX - 11, playerZ - 8.5) > 8;
    rocket.rotation.z = Math.max(0, 3 - a.rounds.rocket) * 0.11;
    parts.forEach((part, i) => {
      part.visible = a.rounds.rocket > i;
    });
    const key = JSON.stringify([a.plots, a.furniture]);
    if (key === contentsKey) return;
    contentsKey = key;
    clear(furnishings);
    clear(crops);
    a.plots.forEach((plant, i) => {
      if (!plant) return;
      const colour =
        SHOP_ITEMS.find((item) => item.id === plant.seed)?.colour ?? '#efb465';
      const x = (i % 3) * 2.1,
        z = Math.floor(i / 3) * 1.7,
        h = 0.25 + plant.water * 0.22;
      mesh(
        crops,
        new THREE.CylinderGeometry(0.035, 0.045, h, 8),
        '#6d9f55',
        x,
        0.2 + h / 2,
        z,
      );
      ball(crops, '#79b566', x - 0.15, 0.2 + h / 2, z, 0.22, 0.08, 0.14);
      if (plant.water === 3) {
        for (let p = 0; p < 5; p++) {
          const t = (p / 5) * Math.PI * 2;
          ball(
            crops,
            colour,
            x + Math.cos(t) * 0.19,
            0.2 + h + Math.sin(t) * 0.19,
            z,
            0.17,
            0.17,
            0.06,
          );
        }
        ball(crops, '#ffe498', x, 0.2 + h, z + 0.06, 0.12);
      } else ball(crops, '#9bc46d', x, 0.2 + h, z, 0.09 + plant.water * 0.04);
    });
    a.furniture.forEach((id, i) => {
      if (!id) return;
      const item = SHOP_ITEMS.find((it) => it.id === id);
      if (!item) return;
      const g = new THREE.Group();
      furnishings.add(g);
      g.position.set(((i % 3) - 1) * 2.1, 0.17, Math.floor(i / 3) * 2 - 1.2);
      const c = item.colour;
      if (id === 'sofa') {
        box(g, c, 0, 0.43, 0, 1.75, 0.5, 0.9);
        box(g, c, 0, 0.85, -0.35, 1.75, 0.7, 0.24);
        for (const side of [-1, 1])
          box(g, '#eeb2c9', side * 0.76, 0.66, 0, 0.23, 0.65, 0.94);
      } else if (id === 'bed') {
        box(g, '#c39172', 0, 0.27, 0, 1.35, 0.4, 1.8);
        box(g, c, 0, 0.53, 0.12, 1.32, 0.18, 1.5);
        ball(g, '#fff1cf', 0, 0.7, -0.6, 0.52, 0.1, 0.24);
      } else if (id === 'rug') {
        mesh(
          g,
          new THREE.CylinderGeometry(0.84, 0.84, 0.04, 32),
          c,
          0,
          0.04,
          0,
          1,
          1,
          0.8,
        );
      } else if (id === 'books') {
        box(g, '#c59372', 0, 0.7, 0, 1.3, 1.4, 0.45);
        for (let j = 0; j < 6; j++)
          box(
            g,
            ['#87b3cc', '#dda76f', '#a498cd'][j % 3],
            -0.47 + j * 0.19,
            0.95,
            0.27,
            0.15,
            0.56,
            0.28,
          );
      } else if (id === 'lamp' || id === 'lantern') {
        box(g, '#997958', 0, 0.7, 0, 0.12, 1.4, 0.12);
        ball(g, c, 0, 1.4, 0, 0.4, 0.32, 0.4);
      } else if (id === 'mushroom') {
        mesh(
          g,
          new THREE.CylinderGeometry(0.15, 0.2, 0.5, 12),
          '#f5ddb5',
          0,
          0.25,
          0,
        );
        ball(g, c, 0, 0.62, 0, 0.55, 0.27, 0.55);
      } else if (id === 'birdbath') {
        mesh(g, new THREE.CylinderGeometry(0.12, 0.24, 0.8, 12), c, 0, 0.4, 0);
        mesh(g, new THREE.CylinderGeometry(0.6, 0.36, 0.2, 24), c, 0, 0.88, 0);
      } else if (id === 'swing') {
        for (const side of [-1, 1])
          box(g, c, side * 0.7, 0.9, 0, 0.13, 1.8, 0.13);
        box(g, c, 0, 1.75, 0, 1.6, 0.13, 0.16);
        for (const side of [-1, 1])
          box(g, '#ece2bd', side * 0.44, 1.2, 0, 0.04, 1.1, 0.04);
        box(g, '#a8795f', 0, 0.64, 0, 1.1, 0.12, 0.5);
      } else {
        box(g, c, 0, 0.75, 0, 1.7, 0.14, 1.1);
        for (const side of [-1, 1])
          box(g, '#aa835e', side * 0.6, 0.38, 0, 0.17, 0.75, 0.7);
      }
      if (item.kind === 'garden')
        g.position.set(
          ((i % 3) - 1) * 2.3,
          0.05,
          6.7 + Math.floor(i / 3) * 1.5,
        );
    });
  }
  return { root, moon, neighbours, update };
}
