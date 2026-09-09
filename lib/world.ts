import * as THREE from 'three';
import { ZONES, clampToIsland, nearestZone, type ZoneId } from './learning';
export type WorldState = {
  active: boolean;
  welcome: boolean;
  moveX: number;
  moveY: number;
  turn: number;
  completed: string[];
  target: ZoneId;
};
export type WorldUpdate = {
  x: number;
  z: number;
  zone: ZoneId;
  near: ZoneId | null;
};
const height = (x: number, z: number) =>
  0.32 +
  Math.sin(x * 0.105) * 0.5 +
  Math.cos(z * 0.12) * 0.45 +
  Math.sin((x + z) * 0.09) * 0.3;
export class MonsterWorld {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(48, 1, 0.1, 220);
  private renderer: THREE.WebGLRenderer;
  private frame = 0;
  private observer: ResizeObserver;
  private player = new THREE.Group();
  private rig = new THREE.Group();
  private arms = [new THREE.Group(), new THREE.Group()];
  private feet = [new THREE.Group(), new THREE.Group()];
  private eyes = new THREE.Group();
  private shadow: THREE.Mesh;
  private guide: THREE.Mesh;
  private ornaments: {
    object: THREE.Object3D;
    phase: number;
    y: number;
    kind: 'cloud' | 'butterfly' | 'marker';
  }[] = [];
  private colliders: { x: number; z: number; r: number }[] = [];
  private particles: {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
  }[] = [];
  private materials = new Map<string, THREE.MeshStandardMaterial>();
  private sphere = new THREE.SphereGeometry(1, 18, 12);
  private smallSphere = new THREE.SphereGeometry(1, 8, 6);
  private box = new THREE.BoxGeometry(1, 1, 1);
  private cylinder = new THREE.CylinderGeometry(1, 1, 1, 10);
  private cone = new THREE.ConeGeometry(1, 1, 12);
  private growingPlants: THREE.Group[] = [];
  private walkTime = 0;
  private jumpY = 0;
  private jumpVelocity = 0;
  private angle = 0;
  private celebration = 0;
  private disposed = false;
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    .matches;
  constructor(
    private host: HTMLElement,
    private state: () => WorldState,
    private update: (data: WorldUpdate) => void,
    private onError: () => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor('#b6e6ed');
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute(
      'aria-label',
      'Clo exploring a three-dimensional island with meadows, woods, a beach and a garden',
    );
    this.renderer.domElement.addEventListener(
      'webglcontextlost',
      this.contextLost,
    );
    this.scene.fog = new THREE.Fog('#b6e6ed', 58, 125);
    this.scene.add(new THREE.HemisphereLight('#ffffe8', '#79a976', 2.5));
    const light = new THREE.DirectionalLight('#fff2c6', 3.4);
    light.position.set(-22, 40, 16);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    Object.assign(light.shadow.camera, {
      left: -40,
      right: 40,
      top: 40,
      bottom: -40,
      near: 1,
      far: 110,
    });
    light.shadow.normalBias = 0.04;
    this.scene.add(light);
    this.buildIsland();
    this.buildMonster();
    this.scene.add(this.player);
    this.player.position.set(0, height(0, 5), 5);
    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.88, 24),
      new THREE.MeshBasicMaterial({
        color: '#325939',
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.shadow);
    this.guide = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16),
      new THREE.MeshBasicMaterial({ color: '#fffab9' }),
    );
    this.scene.add(this.guide);
    this.camera.position.set(8, 11, 22);
    this.camera.lookAt(-1, 1, 0);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();
    let last = performance.now(),
      elapsed = 0,
      report = 0;
    const animate = (now: number) => {
      if (this.disposed) return;
      this.frame = requestAnimationFrame(animate);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (document.hidden) return;
      elapsed += dt;
      report += dt;
      this.tick(dt, elapsed);
      if (report > 0.12) {
        report = 0;
        const { x, z } = this.player.position;
        const zone = nearestZone(x, z);
        this.update({
          x,
          z,
          zone: zone.id,
          near: Math.hypot(x - zone.x, z - zone.z) < 3.8 ? zone.id : null,
        });
      }
      this.renderer.render(this.scene, this.camera);
    };
    this.frame = requestAnimationFrame(animate);
  }
  private contextLost = (e: Event) => {
    e.preventDefault();
    this.onError();
  };
  private mat(c: string) {
    if (!this.materials.has(c))
      this.materials.set(
        c,
        new THREE.MeshStandardMaterial({ color: c, roughness: 0.83 }),
      );
    return this.materials.get(c)!;
  }
  private mesh(
    p: THREE.Object3D,
    g: THREE.BufferGeometry,
    c: string,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = sx,
    sz = sx,
  ) {
    const m = new THREE.Mesh(g, this.mat(c));
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.castShadow = true;
    m.receiveShadow = true;
    p.add(m);
    return m;
  }
  private ball(
    p: THREE.Object3D,
    c: string,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = sx,
    sz = sx,
  ) {
    return this.mesh(p, this.sphere, c, x, y, z, sx, sy, sz);
  }
  private label(text: string, colour: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fffdf0';
    ctx.beginPath();
    ctx.roundRect(7, 7, 498, 146, 38);
    ctx.fill();
    ctx.strokeStyle = colour;
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.fillStyle = colour;
    ctx.font = 'bold 66px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 84);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
    s.scale.set(4.8, 1.5, 1);
    return s;
  }
  private buildIsland() {
    const ground = new THREE.PlaneGeometry(110, 110, 100, 100);
    ground.rotateX(-Math.PI / 2);
    const pos = ground.attributes.position,
      colours: number[] = [],
      c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        z = pos.getZ(i),
        r = Math.hypot(x, z);
      pos.setY(i, height(x, z) - Math.max(0, r - 39) * 0.42);
      c.set('#91c65c');
      if (x < -8)
        c.lerp(new THREE.Color('#80ad8c'), Math.min(1, (-x - 8) / 10));
      if (x > 10)
        c.lerp(new THREE.Color('#efcf87'), Math.min(1, (x - 10) / 10));
      if (z > 12)
        c.lerp(new THREE.Color('#a6c776'), Math.min(1, (z - 12) / 10));
      c.multiplyScalar(0.97 + Math.sin(x * 0.8) * Math.cos(z * 0.7) * 0.035);
      colours.push(c.r, c.g, c.b);
    }
    ground.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
    ground.computeVertexNormals();
    const earth = new THREE.Mesh(
      ground,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
    );
    earth.receiveShadow = true;
    this.scene.add(earth);
    const sea = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000),
      new THREE.MeshStandardMaterial({
        color: '#67cddc',
        roughness: 0.3,
        metalness: 0.12,
      }),
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -1.25;
    this.scene.add(sea);
    for (let r = 42; r < 49; r += 2) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(r, r + 0.14, 128),
        new THREE.MeshBasicMaterial({
          color: '#d7faff',
          transparent: true,
          opacity: 0.38,
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -1.22;
      this.scene.add(ring);
    }
    ZONES.forEach((zone) => {
      const vertices: number[] = [],
        indices: number[] = [];
      for (let i = 0; i <= 55; i++) {
        const f = i / 55,
          x = zone.x * f,
          z = zone.z * f,
          a = Math.atan2(zone.z, zone.x) + Math.PI / 2;
        for (const side of [-1, 1]) {
          const px = x + Math.cos(a) * 1.25 * side,
            pz = z + Math.sin(a) * 1.25 * side;
          vertices.push(px, height(px, pz) + 0.022, pz);
        }
      }
      for (let i = 0; i < 55; i++) {
        const n = i * 2;
        indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3),
      );
      geo.setIndex(indices);
      geo.computeVertexNormals();
      const path = new THREE.Mesh(geo, this.mat('#eddaa4'));
      path.material.side = THREE.DoubleSide;
      path.receiveShadow = true;
      this.scene.add(path);
      const activity = new THREE.Group();
      activity.position.set(zone.x, height(zone.x, zone.z), zone.z);
      this.scene.add(activity);
      this.mesh(activity, this.cylinder, '#ebd797', 0, 0.12, 0, 2.5, 0.22, 2.5);
      this.mesh(
        activity,
        this.cylinder,
        zone.colour,
        0,
        0.28,
        0,
        1.9,
        0.14,
        1.9,
      );
      this.mesh(activity, this.cylinder, '#fff6ce', 0, 0.38, 0, 1.7, 0.1, 1.7);
      const marker = new THREE.Group();
      activity.add(marker);
      marker.position.y = 2.4;
      marker.add(this.label(zone.symbol, zone.colour));
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.88, 0.08, 8, 40),
        this.mat('#ffcf46'),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -1.75;
      marker.add(ring);
      this.ornaments.push({ object: marker, phase: 0, y: 2.4, kind: 'marker' });
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        this.ball(
          activity,
          '#fff3a6',
          Math.cos(a) * 2.05,
          0.75 + Math.sin(i) * 0.2,
          Math.sin(a) * 2.05,
          0.1,
        );
      }
    });
    let seed = 149;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < 86; i++) {
      const x = (random() - 0.5) * 75,
        z = (random() - 0.5) * 75;
      if (
        Math.hypot(x, z) > 37 ||
        Math.hypot(x, z) < 8 ||
        Math.abs(x) < 3.2 ||
        Math.abs(z) < 3.2 ||
        ZONES.some((a) => Math.hypot(x - a.x, z - a.z) < 5)
      )
        continue;
      const tree = new THREE.Group();
      tree.position.set(x, height(x, z), z);
      this.scene.add(tree);
      const scale = 0.7 + random() * 0.65;
      tree.scale.setScalar(scale);
      this.mesh(tree, this.cylinder, '#94704f', 0, 1.35, 0, 0.24, 2.7, 0.24);
      if (x > 17) {
        for (let j = 0; j < 6; j++) {
          const a = (j * Math.PI) / 3;
          const leaf = this.ball(
            tree,
            '#60b17a',
            Math.cos(a) * 0.85,
            2.8,
            Math.sin(a) * 0.85,
            1.25,
            0.18,
            0.43,
          );
          leaf.rotation.y = -a;
          leaf.rotation.z = Math.cos(a) * 0.25;
        }
        this.ball(tree, '#aa784e', 0.17, 2.6, 0.3, 0.24);
      } else {
        const palette =
          x < -8
            ? ['#a293d1', '#c2a9df', '#91b1ba']
            : z > 12
              ? ['#edafc0', '#f2c1c5', '#b7d884']
              : ['#73b677', '#8bc16b', '#acd07b'];
        this.ball(tree, palette[i % 3], 0, 3.2, 0, 1.4, 1.55, 1.3);
        this.ball(tree, palette[(i + 1) % 3], -0.85, 2.8, 0.2, 0.86, 1, 0.95);
        this.ball(tree, palette[i % 3], 0.75, 3.55, 0.1, 0.85, 1, 0.9);
        if (z > 12)
          for (let j = 0; j < 4; j++)
            this.ball(
              tree,
              '#ec6e61',
              Math.cos(j * 2) * 0.8,
              2.6 + random(),
              Math.sin(j * 2) * 0.9,
              0.19,
            );
      }
      this.colliders.push({ x, z, r: 0.6 * scale });
    }
    for (let i = 0; i < 100; i++) {
      const x = (random() - 0.5) * 76,
        z = (random() - 0.5) * 76;
      if (
        Math.hypot(x, z) > 36 ||
        Math.abs(x) < 2 ||
        Math.abs(z) < 2 ||
        ZONES.some((a) => Math.hypot(x - a.x, z - a.z) < 3)
      )
        continue;
      const g = new THREE.Group();
      g.position.set(x, height(x, z), z);
      this.scene.add(g);
      if (x > 16) {
        this.mesh(
          g,
          this.sphere,
          ['#fff0c9', '#f7bbaa', '#e5bde1'][i % 3],
          0,
          0.12,
          0,
          0.22,
          0.13,
          0.3,
        );
        continue;
      }
      this.mesh(g, this.cylinder, '#55925a', 0, 0.25, 0, 0.025, 0.5, 0.025);
      for (let j = 0; j < 5; j++) {
        const a = (j * Math.PI * 2) / 5;
        this.mesh(
          g,
          this.smallSphere,
          ['#fff9df', '#ffc4bf', '#fff6b0'][i % 3],
          Math.cos(a) * 0.13,
          0.48,
          Math.sin(a) * 0.13,
          0.12,
          0.05,
          0.12,
        );
      }
      this.mesh(g, this.smallSphere, '#f5c442', 0, 0.52, 0, 0.07, 0.05, 0.07);
    }
    for (let i = 0; i < 7; i++) {
      const x = -25 + random() * 12,
        z = -9 - random() * 7,
        g = new THREE.Group();
      g.position.set(x, height(x, z), z);
      g.scale.setScalar(0.7 + random());
      this.scene.add(g);
      this.mesh(g, this.cylinder, '#fff1d5', 0, 0.8, 0, 0.2, 1.6, 0.2);
      this.ball(g, '#dca0d1', 0, 1.5, 0, 1.05, 0.48, 1.05);
      for (let j = 0; j < 5; j++)
        this.ball(
          g,
          '#fff8e5',
          Math.cos(j * 1.3) * 0.6,
          1.83,
          Math.sin(j * 1.3) * 0.6,
          0.12,
          0.04,
          0.12,
        );
    }
    const castle = new THREE.Group();
    castle.position.set(27, height(27, -8), -8);
    this.scene.add(castle);
    this.mesh(castle, this.box, '#e6bb74', 0, 1, 0, 2, 2, 1.5);
    for (const x of [-1.4, 1.4]) {
      this.mesh(castle, this.cylinder, '#f0cf93', x, 1.3, 0, 0.65, 2.6, 0.65);
      this.mesh(castle, this.cone, '#e79179', x, 3, 0, 0.82, 1, 0.82);
    }
    this.mesh(castle, this.box, '#957855', 0, 0.55, 0.77, 0.6, 1.1, 0.02);
    this.mesh(castle, this.cylinder, '#a1815e', 0, 3, 0, 0.035, 2, 0.035);
    this.mesh(castle, this.box, '#ef947c', 0.38, 3.7, 0, 0.7, 0.45, 0.025);
    for (let i = 0; i < 12; i++) {
      const g = new THREE.Group(),
        a = (i * Math.PI * 2) / 12;
      g.position.set(Math.cos(a) * 50, 13 + random() * 9, Math.sin(a) * 50);
      this.scene.add(g);
      for (let j = 0; j < 4; j++)
        this.ball(
          g,
          '#fffef2',
          j * 1.8,
          Math.sin(j) * 0.55,
          0,
          2,
          1.1,
          1.4,
        ).castShadow = false;
      this.ornaments.push({
        object: g,
        phase: i,
        y: g.position.y,
        kind: 'cloud',
      });
    }
    for (let i = 0; i < 10; i++) {
      const g = new THREE.Group();
      g.position.set(
        (random() - 0.5) * 36,
        2 + random() * 2,
        (random() - 0.5) * 36,
      );
      this.scene.add(g);
      this.ball(g, '#765b4f', 0, 0, 0, 0.035, 0.13, 0.035);
      for (const side of [-1, 1])
        this.ball(
          g,
          i % 2 ? '#ffd571' : '#e79acb',
          side * 0.14,
          0,
          0,
          0.17,
          0.2,
          0.025,
        ).name = 'wing';
      this.ornaments.push({
        object: g,
        phase: i * 1.7,
        y: g.position.y,
        kind: 'butterfly',
      });
    }
    // Space delivery, a sea explorer and a growing garden echo Clover's original games.
    const rocket = new THREE.Group();
    rocket.position.set(-25, height(-25, 3), 3);
    rocket.rotation.z = -0.12;
    this.scene.add(rocket);
    this.mesh(rocket, this.cylinder, '#f5efd8', 0, 1.8, 0, 0.65, 2.7, 0.65);
    this.mesh(rocket, this.cone, '#e69c9c', 0, 3.55, 0, 0.7, 1, 0.7);
    this.ball(rocket, '#6aadb8', 0, 2.2, 0.6, 0.31, 0.37, 0.08);
    for (const side of [-1, 1])
      this.mesh(
        rocket,
        this.cone,
        '#e49b97',
        side * 0.65,
        0.7,
        0,
        0.35,
        1.3,
        0.55,
      );
    this.mesh(rocket, this.cylinder, '#a499ac', 0, 0.35, 0, 0.43, 0.4, 0.43);
    const friend = new THREE.Group();
    friend.position.set(-17, height(-17, -4), -4);
    this.scene.add(friend);
    this.ball(friend, '#c6a3d3', 0, 0.8, 0, 0.6, 0.8, 0.5);
    for (const side of [-1, 1]) {
      this.ball(friend, '#fffdf1', side * 0.21, 1.12, 0.43, 0.19);
      this.ball(friend, '#45554e', side * 0.21, 1.12, 0.6, 0.075);
      this.ball(friend, '#b189c3', side * 0.38, 0.1, 0.12, 0.25, 0.14, 0.3);
    }
    this.ornaments.push({
      object: friend,
      phase: 2,
      y: friend.position.y,
      kind: 'marker',
    });
    const sub = new THREE.Group();
    sub.position.set(27, height(27, 6) + 0.3, 6);
    this.scene.add(sub);
    this.ball(sub, '#f7d267', 0, 0.9, 0, 1.65, 0.85, 0.7);
    this.mesh(sub, this.cylinder, '#cfad59', 0, 1.7, 0, 0.4, 0.7, 0.4);
    this.mesh(sub, this.cylinder, '#7e9ba2', 0, 2.3, 0, 0.1, 0.7, 0.1);
    this.ball(sub, '#e8c05b', 1.7, 0.9, 0, 0.25, 0.6, 0.8);
    for (const x of [-0.75, 0.2, 0.95]) {
      this.ball(sub, '#efebce', x, 1, 0.61, 0.3, 0.32, 0.1);
      this.ball(sub, '#6aabb7', x, 1, 0.7, 0.23, 0.25, 0.05);
    }
    this.ornaments.push({
      object: sub,
      phase: 3,
      y: sub.position.y,
      kind: 'marker',
    });
    for (let i = 0; i < 5; i++) {
      const plant = new THREE.Group(),
        x = -5 + i * 2.2,
        z = 28;
      plant.position.set(x, height(x, z), z);
      this.scene.add(plant);
      this.mesh(plant, this.cylinder, '#729955', 0, 0.65, 0, 0.07, 1.3, 0.07);
      this.ball(plant, '#7ca468', 0.25, 0.5, 0, 0.33, 0.1, 0.2).rotation.z =
        0.5;
      for (let j = 0; j < 6; j++) {
        const a = (j * Math.PI) / 3;
        this.ball(
          plant,
          ['#eea4bc', '#f5d783', '#c0a1d4'][i % 3],
          Math.cos(a) * 0.28,
          1.35 + Math.sin(a) * 0.28,
          0,
          0.24,
          0.24,
          0.15,
        );
      }
      this.ball(plant, '#e5b34b', 0, 1.35, 0.15, 0.18);
      this.growingPlants.push(plant);
    }
    for (let i = 0; i < 14; i++) {
      const a = (i * Math.PI * 2) / 14;
      this.ball(
        this.scene,
        ['#83bda9', '#a2cabc', '#91c7b7'][i % 3],
        Math.cos(a) * 90,
        -0.5,
        Math.sin(a) * 90,
        12,
        6 + (i % 4) * 2,
        10,
      );
    }
  }
  private buildMonster() {
    const m = this.rig;
    this.player.add(m);
    this.ball(m, '#ffd448', 0, 1.35, 0, 0.84, 1.03, 0.68);
    this.ball(m, '#ffe593', 0, 1.08, 0.57, 0.52, 0.6, 0.16);
    for (const side of [-1, 1]) {
      this.mesh(
        m,
        this.cone,
        '#edbd68',
        side * 0.51,
        2.39,
        -0.04,
        0.19,
        0.5,
        0.18,
      ).rotation.z = -side * 0.28;
      this.ball(m, '#f5d294', side * 0.57, 2.58, -0.04, 0.095);
      this.ball(this.eyes, '#fffefa', side * 0.29, 1.76, 0.57, 0.26, 0.3, 0.19);
      this.ball(
        this.eyes,
        '#394442',
        side * 0.27,
        1.75,
        0.746,
        0.115,
        0.145,
        0.054,
      );
      this.ball(this.eyes, '#ffffff', side * 0.27 - 0.026, 1.8, 0.79, 0.04);
      this.ball(m, '#f39a75', side * 0.49, 1.42, 0.579, 0.17, 0.09, 0.045);
      this.ball(
        m,
        '#c79635',
        side * 0.3,
        2.13,
        0.5,
        0.18,
        0.04,
        0.04,
      ).rotation.z = -side * 0.16;
    }
    m.add(this.eyes);
    this.ball(m, '#774e3a', 0, 1.36, 0.693, 0.24, 0.135, 0.032);
    this.ball(m, '#ffdc57', 0, 1.46, 0.7, 0.27, 0.11, 0.033);
    this.mesh(m, this.box, '#fff9e6', 0.06, 1.325, 0.73, 0.1, 0.09, 0.025);
    this.ball(m, '#ffe06c', 0, 1.54, 0.69, 0.12, 0.095, 0.11);
    this.arms.forEach((arm, i) => {
      const side = i ? 1 : -1;
      arm.position.set(side * 0.75, 1.5, 0);
      m.add(arm);
      this.ball(arm, '#ffd448', side * 0.1, -0.3, 0, 0.22, 0.43, 0.23);
      this.ball(arm, '#ffda56', side * 0.13, -0.58, 0.07, 0.25, 0.23, 0.25);
    });
    this.feet.forEach((foot, i) => {
      foot.position.set(i ? 0.39 : -0.39, 0.37, 0);
      m.add(foot);
      this.ball(foot, '#edb735', 0, -0.16, 0.16, 0.3, 0.22, 0.41);
    });
    for (let i = 0; i < 3; i++)
      this.ball(m, '#e8af3d', 0, 1.7 - i * 0.36, -0.63, 0.15, 0.17, 0.16);
  }
  private tick(dt: number, time: number) {
    const s = this.state(),
      moving = s.active ? Math.min(1, Math.hypot(s.moveX, s.moveY)) : 0;
    if (s.active) {
      this.angle += s.turn * dt * 1.65;
      const length = Math.max(1, Math.hypot(s.moveX, s.moveY)),
        dx =
          ((s.moveX * Math.cos(this.angle) + s.moveY * Math.sin(this.angle)) *
            dt *
            5.3) /
          length,
        dz =
          ((-s.moveX * Math.sin(this.angle) + s.moveY * Math.cos(this.angle)) *
            dt *
            5.3) /
          length;
      if (moving > 0.03) {
        const next = clampToIsland(
          this.player.position.x + dx,
          this.player.position.z + dz,
        );
        for (const o of this.colliders) {
          const x = next.x - o.x,
            z = next.z - o.z,
            d = Math.hypot(x, z),
            r = o.r + 0.43;
          if (d < r) {
            next.x = o.x + (d ? x / d : 1) * r;
            next.z = o.z + (d ? z / d : 0) * r;
          }
        }
        this.player.position.x = next.x;
        this.player.position.z = next.z;
        const target = Math.atan2(dx, dz);
        this.player.rotation.y +=
          Math.atan2(
            Math.sin(target - this.player.rotation.y),
            Math.cos(target - this.player.rotation.y),
          ) *
          (1 - Math.exp(-12 * dt));
        this.walkTime += dt * 10 * moving;
      }
      if (this.jumpY > 0 || this.jumpVelocity > 0) {
        this.jumpVelocity -= 13 * dt;
        this.jumpY = Math.max(0, this.jumpY + this.jumpVelocity * dt);
        if (this.jumpY === 0) this.jumpVelocity = 0;
      }
    }
    const blooms = s.completed.filter((id) => id.startsWith('garden-')).length;
    this.growingPlants.forEach((p, i) =>
      p.scale.setScalar(0.35 + Math.min(1.05, Math.max(0, blooms - i) * 0.28)),
    );
    this.celebration = Math.max(0, this.celebration - dt);
    const wave = this.celebration > 0 || s.welcome,
      bob = this.reducedMotion ? 0 : Math.sin(time * 2.4) * 0.034;
    this.player.position.y =
      height(this.player.position.x, this.player.position.z) + this.jumpY;
    this.rig.position.y =
      bob +
      (moving ? Math.abs(Math.sin(this.walkTime)) * 0.09 : 0) +
      (this.celebration ? Math.abs(Math.sin(time * 8)) * 0.23 : 0);
    this.rig.rotation.z = moving
      ? Math.sin(this.walkTime) * 0.045
      : Math.sin(time * 1.7) * 0.018;
    this.feet[0].rotation.x = Math.sin(this.walkTime) * moving * 0.5;
    this.feet[1].rotation.x = -Math.sin(this.walkTime) * moving * 0.5;
    this.arms[0].rotation.x = -Math.sin(this.walkTime) * moving * 0.55;
    this.arms[1].rotation.x = Math.sin(this.walkTime) * moving * 0.55;
    this.arms[1].rotation.z = wave ? -2.1 + Math.sin(time * 7) * 0.23 : -0.12;
    this.arms[0].rotation.z = this.celebration ? 2.1 : 0.12;
    const blink = Math.sin(time * 0.87) > 0.996;
    this.eyes.scale.y = blink ? 0.09 : 1;
    this.eyes.position.y = blink ? 1.6 : 0;
    this.shadow.position.set(
      this.player.position.x,
      height(this.player.position.x, this.player.position.z) + 0.025,
      this.player.position.z,
    );
    this.shadow.scale.setScalar(1 - this.jumpY * 0.14);
    for (const o of this.ornaments) {
      if (o.kind === 'marker')
        o.object.position.y =
          o.y + (this.reducedMotion ? 0 : Math.sin(time * 2) * 0.12);
      if (o.kind === 'cloud' && !this.reducedMotion) {
        o.object.position.x += dt * 0.14;
        if (o.object.position.x > 80) o.object.position.x = -80;
      }
      if (o.kind === 'butterfly' && !this.reducedMotion) {
        o.object.position.y = o.y + Math.sin(time * 1.8 + o.phase) * 0.35;
        o.object.position.x += Math.cos(time * 0.5 + o.phase) * dt * 0.4;
        o.object.rotation.y = Math.sin(time * 0.5 + o.phase);
        o.object.children.forEach((wing, i) => {
          if (wing.name === 'wing')
            wing.rotation.y = Math.sin(time * 17) * (i === 1 ? 1 : -1) * 0.8;
        });
      }
    }
    const target = ZONES.find((z) => z.id === s.target)!,
      d = Math.hypot(
        target.x - this.player.position.x,
        target.z - this.player.position.z,
      );
    this.guide.visible = s.active && d > 4;
    if (this.guide.visible) {
      const f = Math.min(0.2, 2.5 / d);
      this.guide.position.set(
        THREE.MathUtils.lerp(this.player.position.x, target.x, f),
        this.player.position.y + 0.8 + Math.sin(time * 3) * 0.12,
        THREE.MathUtils.lerp(this.player.position.z, target.z, f),
      );
      this.guide.rotation.y = time;
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.velocity.y -= dt * 3;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.rotation.x += dt * 2;
      p.mesh.rotation.y += dt * 3;
      p.mesh.scale.setScalar(Math.min(1, p.life));
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
      }
    }
    const follow = s.welcome
      ? new THREE.Vector3(8, 11, 22)
      : new THREE.Vector3(
          Math.sin(this.angle) * 10,
          6.5,
          Math.cos(this.angle) * 10,
        ).add(
          new THREE.Vector3(
            this.player.position.x,
            height(this.player.position.x, this.player.position.z),
            this.player.position.z,
          ),
        );
    this.camera.position.lerp(follow, 1 - Math.exp(-3 * dt));
    this.camera.lookAt(
      s.welcome
        ? new THREE.Vector3(-1, 1, 0)
        : new THREE.Vector3(
            this.player.position.x,
            this.player.position.y + 1.1,
            this.player.position.z,
          ),
    );
  }
  jump() {
    if (this.jumpY === 0 && this.state().active) this.jumpVelocity = 5.8;
  }
  travel(id: ZoneId) {
    const z = ZONES.find((z) => z.id === id)!;
    this.player.position.set(z.x, height(z.x, z.z + 3), z.z + 3);
    this.jumpY = 0;
    this.jumpVelocity = 0;
    this.angle = 0;
    this.player.rotation.y = Math.PI;
  }
  celebrate() {
    this.celebration = 3.5;
    for (let i = 0; i < 28; i++) {
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.09 + Math.random() * 0.07),
        this.mat(['#ffd24b', '#ed9fbb', '#9adfe5', '#fff8d3'][i % 4]),
      );
      mesh.position
        .copy(this.player.position)
        .add(new THREE.Vector3(0, 1.5, 0));
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          2 + Math.random() * 3,
          (Math.random() - 0.5) * 4,
        ),
        life: 2 + Math.random(),
      });
    }
  }
  private resize() {
    const { clientWidth: w, clientHeight: h } = this.host;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.renderer.domElement.removeEventListener(
      'webglcontextlost',
      this.contextLost,
    );
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        geometries.add(o.geometry);
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
          materials.add(m),
        );
      }
      if (o instanceof THREE.Sprite) {
        o.material.map?.dispose();
        materials.add(o.material);
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
