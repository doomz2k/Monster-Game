import * as THREE from 'three';
import { WORLD_SCALE, SHORE_RADIUS } from './world-layout';
import { surfaceMaterial, type WorldTextures } from './world-materials';
import { PLACES, SHOP_ITEMS, type AdventureProgress } from './adventure';
import { createNeighbour } from './neighbours';
import { createGardenPlant, createGardenWildlife } from './garden-models';
import { createRocketModel } from './rocket-model';
import { createFurniture } from './furniture-model';
import { flowerFor } from './flowers';
import { furniturePosition, layoutFields } from './furniture-layout';

export function createVillage(
  height: (x: number, z: number) => number,
  textures: WorldTextures,
) {
  const root = new THREE.Group(),
    moon = new THREE.Group(),
    home = new THREE.Group(),
    furnishings = new THREE.Group(),
    beds = new THREE.Group();
  root.name = 'Neighbourhood';
  const windows: THREE.MeshStandardMaterial[] = [];
  const eveningWindow = new THREE.Color('#bd8d50');
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
    const m = new THREE.Mesh(geometry, surfaceMaterial(colour, textures));
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
    const pane = box(home, '#79bdb8', side * 2, 1.9, -2.35, 1.5, 1.6, 0.08);
    const glass = new THREE.MeshStandardMaterial({
      color: '#79bdb8',
      emissive: '#ffc078',
      emissiveIntensity: 0,
      roughness: 0.5,
    });
    pane.material.dispose();
    pane.material = glass;
    windows.push(glass);
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
  const rocketModel = createRocketModel(0);
  const rocket = rocketModel.root;
  root.add(rocket);
  rocket.position.set(-13, height(-13, -30), -30.8);
  marker(rocket, '🚀', 0, 6.8, 0);
  // The moon is a separate playable location, sharing the same movement rig.
  const moonGround = mesh(
    moon,
    new THREE.CylinderGeometry(SHORE_RADIUS, SHORE_RADIUS + 3, 2, 128),
    '#c8c5db',
    0,
    -1.02,
    0,
  );
  moonGround.material = new THREE.MeshStandardMaterial({
    map: textures.rock,
    color: '#aaaac6',
    roughness: 1,
  });
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
  const landing = new THREE.Group();
  landing.position.set(0, 0, 6);
  moon.add(landing);
  landing.name = 'Return launch pad';
  mesh(
    landing,
    new THREE.CylinderGeometry(3.3, 3.6, 0.24, 48),
    '#575975',
    0,
    0.02,
    0,
  );
  mesh(
    landing,
    new THREE.CylinderGeometry(2.9, 2.9, 0.03, 48),
    '#b4b8cf',
    0,
    0.16,
    0,
  );
  const landingRing = mesh(
    landing,
    new THREE.TorusGeometry(2.55, 0.06, 8, 64),
    '#f4d581',
    0,
    0.2,
    0,
  );
  landingRing.rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const lamp = ball(
      landing,
      '#a5e0d6',
      Math.cos(a) * 3.15,
      0.25,
      Math.sin(a) * 3.15,
      0.13,
      0.08,
      0.13,
    );
    (lamp.material as THREE.MeshStandardMaterial).emissive.set('#5caaab');
    (lamp.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6;
  }
  // The return craft sits behind the walkable centre of the pad.
  const returnCraft = createRocketModel(3).root;
  returnCraft.position.set(0, 0, -3.5);
  returnCraft.scale.setScalar(0.65);
  landing.add(returnCraft);
  moon.visible = false;
  // Increase distances, keeping houses and characters at their original human scale.
  const npcRoots = new Set<THREE.Object3D>(neighbours.map((n) => n.root));
  for (const object of root.children) {
    if (npcRoots.has(object)) continue;
    const oldGround = height(object.position.x, object.position.z);
    object.position.x *= WORLD_SCALE;
    object.position.z *= WORLD_SCALE;
    object.position.y +=
      height(object.position.x, object.position.z) - oldGround;
  }
  home.position.y = height(home.position.x, home.position.z);
  beds.position.y = height(beds.position.x, beds.position.z);
  let contentsKey = '';
  let flowerSpots: { id: string; x: number; z: number }[] = [];
  let furnitureModels: ReturnType<typeof createFurniture>[] = [];
  let plantModels: ReturnType<typeof createGardenPlant>[] = [];
  let wildlife: ReturnType<typeof createGardenWildlife> | null = null;
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
    roof.visible =
      Math.hypot(playerX - home.position.x, playerZ - home.position.z) > 8;
    rocketModel.setRepairStage(a.rounds.rocket);
    const key = JSON.stringify([
      a.plots,
      a.furniture,
      a.furnitureTurns,
      a.gardenFurniture,
      a.gardenTurns,
      a.unlit,
    ]);
    if (key === contentsKey) return;
    contentsKey = key;
    clear(furnishings);
    furnitureModels = [];
    clear(crops);
    plantModels = [];
    flowerSpots = [];
    wildlife = createGardenWildlife(a.plots);
    crops.add(wildlife.root);
    a.plots.forEach((plant, i) => {
      if (!plant) return;
      const model = createGardenPlant(plant.seed, plant.water);
      model.root.position.set((i % 3) * 2.1, 0.22, Math.floor(i / 3) * 1.7);
      crops.add(model.root);
      plantModels.push(model);
      if (plant.water >= 3 && flowerFor(plant.seed))
        flowerSpots.push({
          id: 'flower-' + i,
          x: beds.position.x + model.root.position.x,
          z: beds.position.z + model.root.position.z,
        });
    });
    for (const [listKey, turnsKey] of [
      layoutFields('house'),
      layoutFields('garden'),
    ])
      a[listKey].forEach((id, i) => {
        const item = SHOP_ITEMS.find((it) => it.id === id);
        if (!item) return;
        const model = createFurniture(item.id, item.colour, textures.timber);
        model.setLit(!a.unlit.includes(item.id));
        const position = furniturePosition(i, item.kind === 'garden');
        model.root.position.set(position.x, position.y, position.z);
        model.root.rotation.y = ((a[turnsKey][i] ?? 0) * Math.PI) / 2;
        furnishings.add(model.root);
        furnitureModels.push(model);
      });
  }
  return {
    root,
    moon,
    neighbours,
    update,
    flowerSpots: () => flowerSpots,
    setEvening(amount: number) {
      windows.forEach((m) => {
        m.color.set('#79bdb8').lerp(eveningWindow, amount);
        m.emissiveIntensity = amount * 0.6;
      });
    },
    animateGarden(time: number, reduced: boolean) {
      furnitureModels.forEach((m) => m.animate(time, reduced));
      plantModels.forEach((m, i) => m.animate(time + i, reduced));
      wildlife?.animate(time, reduced);
    },
  };
}
