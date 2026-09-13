import * as THREE from 'three';
import { createPizzaParcel } from './pizza-parcel';
import {
  GRAPHICS,
  GraphicsGovernor,
  graphicsPixelRatio,
  type GraphicsSnapshot,
  type GraphicsTier,
} from './graphics-quality';
import { chooseCameraYaw, cameraObstructed } from './camera-guidance';
import type { GamePreferences } from './preferences';
import {
  groundHeight as height,
  WORLD_SCALE,
  SHORE_RADIUS,
  LANDMARKS,
  clampToPlayArea,
} from './world-layout';
import { worldTextures } from './world-materials';
import { createAtmosphere } from './world-atmosphere';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createMonster } from './monster-model';
import { ZONES, clampToIsland, nearestZone, type ZoneId } from './learning';
import { COSMETICS, type Outfit } from './wardrobe';
import { createCostume } from './monster-outfit';
import {
  PLACES,
  placeFor,
  type AdventureProgress,
  type PlaceId,
  type Region,
} from './adventure';
import { createVillage } from './village';
import { createDiscoveryMarkers } from './discovery-markers';
import { discoveryFor } from './discovery-catalogue';
import { defaultAppearance, type Appearance } from './appearance';
export type WorldState = {
  active: boolean;
  welcome: boolean;
  moveX: number;
  moveY: number;
  turn: number;
  completed: string[];
  target: ZoneId;
  showcase: 'launch' | 'wardrobe' | null;
  outfit: Outfit;
  appearance?: Appearance;
  adventure?: AdventureProgress;
  destination?: PlaceId;
  talking?: PlaceId | null;
  preferences?: GamePreferences;
  reducedMotion?: boolean;
  visible?: boolean;
  discoveryTarget?: string | null;
  deliveryTarget?: boolean;
};
export type WorldUpdate = {
  x: number;
  z: number;
  zone: ZoneId;
  near: ZoneId | null;
  place?: PlaceId | null;
};
export class MonsterWorld {
  private graphics = new GraphicsGovernor();
  private appliedTier: GraphicsTier | null = null;
  private shadowElapsed = 1;
  private textures = worldTextures();
  private atmosphere: ReturnType<typeof createAtmosphere>;
  private sun = new THREE.DirectionalLight('#ffedc6', 2.35);
  private skyLight = new THREE.HemisphereLight('#c9edff', '#557348', 0.95);
  private scene = new THREE.Scene();
  private showroom = new THREE.Scene();
  private showroomStage = new THREE.Group();
  private costumePieces = new Map<string, THREE.Group>();
  private inShowcase = false;
  private showcaseAngle = 0;
  private savedFacing = 0;
  private camera = new THREE.PerspectiveCamera(48, 1, 0.1, 220);
  private renderer: THREE.WebGLRenderer;
  private environment: THREE.WebGLRenderTarget | null = null;
  private windTime = { value: 0 };
  private frame = 0;
  private observer: ResizeObserver;
  private player = new THREE.Group();
  private character = createMonster();
  private rig = this.character.root;
  private pizzaParcel = createPizzaParcel();
  private appearanceKey = JSON.stringify(defaultAppearance());
  private village: ReturnType<typeof createVillage>;
  private discoveryMarkers: ReturnType<typeof createDiscoveryMarkers>;
  private islandObjects: THREE.Object3D[] = [];
  private region: Region = 'island';
  private shadow: THREE.Mesh;
  private guide: THREE.Mesh;
  private ornaments: {
    object: THREE.Object3D;
    phase: number;
    y: number;
    kind: 'cloud' | 'butterfly' | 'marker' | 'tree';
  }[] = [];
  private colliders: { x: number; z: number; r: number }[] = [];
  private cameraBuildings = [
    { x: 11 * WORLD_SCALE, z: 8.5 * WORLD_SCALE, r: 3.6 },
    { x: 0, z: -18 * WORLD_SCALE, r: 3.6 },
    { x: -15 * WORLD_SCALE, z: 13 * WORLD_SCALE, r: 2 },
    { x: -9 * WORLD_SCALE, z: 13 * WORLD_SCALE, r: 2 },
  ];
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
  private jumpY = 0;
  private jumpVelocity = 0;
  private angle = 0;
  private movementAngle = 0;
  private wasMoving = false;
  private cameraGoal = 0;
  private nextCameraCheck = 0;
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
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setClearColor('#b9dbdf');
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.91;
    const environmentRoom = new RoomEnvironment();
    const environmentGenerator = new THREE.PMREMGenerator(this.renderer);
    this.environment = environmentGenerator.fromScene(environmentRoom, 0.04);
    this.scene.environment = this.showroom.environment =
      this.environment.texture;
    this.scene.environmentIntensity = 0.2;
    this.showroom.environmentIntensity = 0.6;
    environmentRoom.dispose();
    environmentGenerator.dispose();
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute(
      'aria-label',
      'Monster exploring a three-dimensional island with meadows, woods, a beach and a garden',
    );
    this.renderer.domElement.addEventListener(
      'webglcontextlost',
      this.contextLost,
    );
    this.scene.fog = new THREE.Fog('#b9dbdf', 65, 180);
    this.scene.add(this.skyLight);
    const light = this.sun;
    light.position.set(-30, 44, 24);
    this.scene.add(light.target);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    Object.assign(light.shadow.camera, {
      left: -27,
      right: 27,
      top: 27,
      bottom: -27,
      near: 1,
      far: 110,
    });
    light.shadow.normalBias = 0.04;
    this.scene.add(light);
    this.buildIsland();
    this.village = createVillage(height, this.textures);
    this.discoveryMarkers = createDiscoveryMarkers(height);
    this.scene.add(this.discoveryMarkers.island);
    this.village.moon.add(this.discoveryMarkers.moon);
    this.atmosphere = createAtmosphere(height, this.textures);
    this.scene.add(this.atmosphere.root);
    this.village.moon.add(this.atmosphere.moon);
    this.scene.add(this.village.root);
    this.islandObjects = this.scene.children.filter(
      (o) => !(o instanceof THREE.Light),
    );
    this.scene.add(this.village.moon);
    this.colliders = this.colliders.filter(
      (c) =>
        !PLACES.some((p) => Math.hypot(c.x - p.x, c.z - p.z) < 6) &&
        Math.hypot(c.x - 11 * WORLD_SCALE, c.z - 9 * WORLD_SCALE) > 9,
    );
    this.colliders.push(...this.atmosphere.islandColliders);
    this.buildMonster();
    this.buildShowroom();
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
      const frameTime = now - last;
      const dt = Math.min(frameTime / 1000, 0.05);
      last = now;
      const current = this.state();
      if (document.hidden || current.visible === false) {
        this.graphics.pause();
        return;
      }
      this.graphics.setMode(current.preferences?.graphics ?? 'auto');
      if (current.active) this.graphics.sample(frameTime);
      else this.graphics.pause();
      this.applyGraphics();
      elapsed += dt;
      report += dt;
      this.tick(dt, elapsed);
      if (report > 0.12) {
        report = 0;
        const { x, z } = this.player.position;
        const zone = nearestZone(x, z);
        const places = PLACES.filter((p) =>
          this.region === 'moon' ? p.id === 'moon' : p.id !== 'moon',
        );
        const closest = [...places].sort(
          (a, b) => Math.hypot(x - a.x, z - a.z) - Math.hypot(x - b.x, z - b.z),
        )[0];
        this.update({
          x,
          z,
          zone: zone.id,
          near: Math.hypot(x - zone.x, z - zone.z) < 3.8 ? zone.id : null,
          place:
            closest &&
            Math.hypot(x - closest.x, z - closest.z) <
              (closest.id === 'home' ? 5.5 : 4.2)
              ? closest.id
              : null,
        });
      }
      this.shadowElapsed += dt;
      const shadowHz = GRAPHICS[this.graphics.tier].shadowHz;
      if (shadowHz && this.shadowElapsed >= 1 / shadowHz) {
        this.renderer.shadowMap.needsUpdate = true;
        this.shadowElapsed = 0;
      }
      this.renderer.render(
        this.inShowcase ? this.showroom : this.scene,
        this.camera,
      );
    };
    this.frame = requestAnimationFrame(animate);
  }
  private contextLost = (e: Event) => {
    e.preventDefault();
    this.onError();
  };
  graphicsSnapshot(): GraphicsSnapshot {
    const info = this.renderer.info;
    return {
      mode: this.graphics.mode,
      tier: this.graphics.tier,
      fps: this.graphics.fps,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      pixelRatio: this.renderer.getPixelRatio(),
    };
  }
  private applyGraphics() {
    const tier = this.graphics.tier;
    if (tier === this.appliedTier) return;
    this.appliedTier = tier;
    const quality = GRAPHICS[tier];
    const shadowsChanged =
      this.renderer.shadowMap.enabled !== quality.shadowSize > 0;
    this.renderer.shadowMap.enabled = quality.shadowSize > 0;
    if (shadowsChanged) {
      // Three's compiled material variants must refresh when shadow defines change.
      const refresh = (object: THREE.Object3D) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points)
          (Array.isArray(object.material)
            ? object.material
            : [object.material]
          ).forEach((material) => {
            material.needsUpdate = true;
          });
      };
      this.scene.traverse(refresh);
      this.showroom.traverse(refresh);
    }
    this.sun.shadow.map?.dispose();
    this.sun.shadow.map = null;
    this.sun.shadow.mapSize.set(
      quality.shadowSize || 512,
      quality.shadowSize || 512,
    );
    this.renderer.shadowMap.needsUpdate = true;
    this.atmosphere.setQuality(tier);
    this.resize();
  }
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
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fffdf0';
    ctx.beginPath();
    ctx.roundRect(8, 8, 240, 240, 90);
    ctx.fill();
    ctx.strokeStyle = colour;
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.fillStyle = colour;
    ctx.font = '136px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 138);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
    s.scale.set(1.8, 1.8, 1);
    return s;
  }
  private buildIsland() {
    const ground = new THREE.PlaneGeometry(200, 200, 140, 140);
    ground.rotateX(-Math.PI / 2);
    const pos = ground.attributes.position,
      colours: number[] = [],
      c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        z = pos.getZ(i),
        r = Math.hypot(x, z);
      pos.setY(i, height(x, z) - Math.max(0, r - SHORE_RADIUS) * 0.42);
      c.set('#e6ecdd');
      if (x < -8 * WORLD_SCALE)
        c.lerp(
          new THREE.Color('#c7dacf'),
          Math.min(1, (-x - 8 * WORLD_SCALE) / 24),
        );
      if (x > 10 * WORLD_SCALE)
        c.lerp(
          new THREE.Color('#fff0d7'),
          Math.min(1, (x - 10 * WORLD_SCALE) / 24),
        );
      if (z > 12)
        c.lerp(new THREE.Color('#eff0d8'), Math.min(1, (z - 12) / 10));
      c.multiplyScalar(0.97 + Math.sin(x * 0.8) * Math.cos(z * 0.7) * 0.035);
      colours.push(c.r, c.g, c.b);
    }
    ground.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
    ground.computeVertexNormals();
    const terrainMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 1,
      map: this.textures.grass,
    });
    terrainMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.rockMap = { value: this.textures.rock };
      shader.vertexShader =
        'varying vec3 vTerrain;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvTerrain = position;',
        );
      shader.fragmentShader =
        'uniform sampler2D rockMap; varying vec3 vTerrain;\n' +
        shader.fragmentShader.replace(
          '#include <map_fragment>',
          `
        vec4 meadow = texture2D(map, vMapUv);
        vec4 beach = texture2D(rockMap, vMapUv * .65) * vec4(1.12, .95, .7, 1.0);
        float coast = max(smoothstep(22.0, 32.0, vTerrain.x), smoothstep(76.0, 83.0, length(vTerrain.xz)));
        diffuseColor *= mix(meadow, beach, coast);
      `,
        );
    };
    const earth = new THREE.Mesh(ground, terrainMaterial);
    earth.receiveShadow = true;
    this.scene.add(earth);
    const plazaGeometry = new THREE.CircleGeometry(7.5, 64);
    plazaGeometry.rotateX(-Math.PI / 2);
    const plazaPositions = plazaGeometry.attributes.position;
    for (let i = 0; i < plazaPositions.count; i++)
      plazaPositions.setY(
        i,
        height(plazaPositions.getX(i), plazaPositions.getZ(i)) + 0.048,
      );
    plazaGeometry.computeVertexNormals();
    const plaza = new THREE.Mesh(
      plazaGeometry,
      new THREE.MeshStandardMaterial({
        map: this.textures.stone,
        color: '#d8c8a3',
        roughness: 1,
      }),
    );
    plaza.receiveShadow = true;
    this.scene.add(plaza);
    PLACES.filter((p) => p.id !== 'moon').forEach((zone) => {
      const vertices: number[] = [],
        indices: number[] = [],
        uvs: number[] = [];
      for (let i = 0; i <= 70; i++) {
        const f = i / 70,
          bend = Math.sin(f * Math.PI) * 1.8;
        const angle = Math.atan2(zone.z, zone.x) + Math.PI / 2;
        for (const side of [-1, 1]) {
          const x = zone.x * f + Math.cos(angle) * (1.5 * side + bend),
            z = zone.z * f + Math.sin(angle) * (1.5 * side + bend);
          vertices.push(x, height(x, z) + 0.032, z);
          uvs.push(side === -1 ? 0 : 1, f * 14);
        }
      }
      for (let i = 0; i < 70; i++) {
        const n = i * 2;
        indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3),
      );
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      const path = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          map: this.textures.stone,
          color: '#dac99e',
          roughness: 1,
          side: THREE.DoubleSide,
        }),
      );
      path.receiveShadow = true;
      this.scene.add(path);
    });
    let seed = 149;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const canopyInstances = new Map<string, THREE.Matrix4[]>();
    const canopyGeometry = new THREE.IcosahedronGeometry(1, 2);
    const canopyPart = new THREE.Object3D();
    for (let i = 0; i < 190; i++) {
      const x = (random() - 0.5) * 145,
        z = (random() - 0.5) * 145;
      if (
        Math.hypot(x, z) > 73 ||
        Math.hypot(x, z) < 8 ||
        Math.abs(x) < 3.2 ||
        Math.abs(z) < 3.2 ||
        LANDMARKS.some(([px, pz]) => Math.hypot(x - px, z - pz) < 10) ||
        [
          ...PLACES.filter((p) => p.id !== 'moon').map((p) => [p.x, p.z]),
          ...LANDMARKS,
        ].some(([px, pz]) => {
          const f = Math.max(
            0,
            Math.min(1, (x * px + z * pz) / (px * px + pz * pz)),
          );
          return Math.hypot(x - px * f, z - pz * f) < 4;
        }) ||
        PLACES.some((a) => Math.hypot(x - a.x, z - a.z) < 9)
      )
        continue;
      const tree = new THREE.Group();
      tree.position.set(x, height(x, z), z);
      this.scene.add(tree);
      const scale = 0.7 + random() * 0.65;
      tree.scale.setScalar(scale);
      const trunk = this.mesh(
        tree,
        this.cylinder,
        '#b29472',
        0,
        1.35,
        0,
        0.28,
        2.7,
        0.28,
      );
      trunk.material = new THREE.MeshStandardMaterial({
        map: this.textures.timber,
        color: '#bda483',
        roughness: 1,
      });
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
            ? ['#507568', '#769487', '#73977c']
            : z > 12
              ? ['#edafc0', '#f2c1c5', '#b7d884']
              : ['#509153', '#76a852', '#91b766'];
        for (const side of [-1, 1]) {
          const branch = this.mesh(
            tree,
            this.cylinder,
            '#b29472',
            side * 0.3,
            2.3,
            0,
            0.13,
            1.5,
            0.13,
          );
          branch.material = trunk.material;
          branch.rotation.z = -side * 0.5;
        }
        for (let leaf = 0; leaf < 10; leaf++) {
          const a = leaf * 2.39996,
            radius = leaf < 7 ? 1.05 : 0.45;
          canopyPart.position.set(
            x + Math.cos(a) * radius * scale,
            height(x, z) + (2.8 + (leaf % 3) * 0.48) * scale,
            z + Math.sin(a) * radius * scale,
          );
          canopyPart.scale.set(
            0.87 * scale,
            (0.68 + (leaf % 2) * 0.18) * scale,
            0.87 * scale,
          );
          canopyPart.rotation.set(leaf * 0.3, a, 0.12);
          canopyPart.updateMatrix();
          const tone = palette[leaf % 3];
          if (!canopyInstances.has(tone)) canopyInstances.set(tone, []);
          canopyInstances.get(tone)!.push(canopyPart.matrix.clone());
        }
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
    for (const [tone, matrices] of canopyInstances) {
      const material = new THREE.MeshStandardMaterial({
        color: tone,
        roughness: 1,
        flatShading: true,
      });
      material.onBeforeCompile = (shader) => {
        shader.uniforms.windTime = this.windTime;
        shader.vertexShader =
          'uniform float windTime;\n' +
          shader.vertexShader.replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
          #ifdef USE_INSTANCING
          transformed.x += sin(windTime*.85+instanceMatrix[3].x*.3)*.06;
          transformed.z += cos(windTime*.7+instanceMatrix[3].z*.25)*.035;
          #endif`,
          );
      };
      const crowns = new THREE.InstancedMesh(
        canopyGeometry,
        material,
        matrices.length,
      );
      matrices.forEach((matrix, i) => crowns.setMatrixAt(i, matrix));
      crowns.instanceMatrix.needsUpdate = true;
      crowns.castShadow = crowns.receiveShadow = true;
      this.scene.add(crowns);
    }
    for (let i = 0; i < 240; i++) {
      const x = (random() - 0.5) * 145,
        z = (random() - 0.5) * 145;
      if (
        Math.hypot(x, z) > 73 ||
        Math.abs(x) < 2 ||
        Math.abs(z) < 2 ||
        PLACES.some((a) => Math.hypot(x - a.x, z - a.z) < 5)
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
        Math.cos(a) * 150,
        -0.5,
        Math.sin(a) * 150,
        12,
        6 + (i % 4) * 2,
        10,
      );
    }
  }
  private buildMonster() {
    this.player.add(this.rig);
  }
  private buildShowroom() {
    this.showroom.add(
      new THREE.HemisphereLight('#fffbe4', '#8c9e80', 1.25),
      this.showroomStage,
    );
    const key = new THREE.DirectionalLight('#fff0d2', 2.8);
    key.position.set(-3, 5, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, {
      left: -2.5,
      right: 2.5,
      top: 3.5,
      bottom: -1.5,
      near: 0.1,
      far: 15,
    });
    key.shadow.normalBias = 0.018;
    const fill = new THREE.DirectionalLight('#fff9ea', 0.8);
    fill.position.set(3, 2, 4);
    const rim = new THREE.DirectionalLight('#dcefff', 2.1);
    rim.position.set(2, 4, -3);
    this.showroomStage.add(key, key.target, fill, fill.target, rim, rim.target);
    this.mesh(
      this.showroomStage,
      new THREE.CylinderGeometry(1.4, 1.38, 0.18, 96),
      '#e1d5b2',
      0,
      -0.11,
      0,
    );
    this.mesh(
      this.showroomStage,
      new THREE.CylinderGeometry(1.42, 1.42, 0.09, 96),
      '#fff7dc',
      0,
      0,
      0,
    );
    this.mesh(
      this.showroomStage,
      new THREE.TorusGeometry(1.41, 0.03, 12, 96),
      '#c8b982',
      0,
      -0.04,
      0,
    ).rotation.x = Math.PI / 2;
    const size = 128,
      pixels = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const offset = (y * size + x) * 4;
        pixels[offset] = 69;
        pixels[offset + 1] = 57;
        pixels[offset + 2] = 31;
        pixels[offset + 3] = Math.round(
          65 *
            Math.exp(
              -(((x / size - 0.5) * 2) ** 2 + ((y / size - 0.5) * 2) ** 2) * 6,
            ),
        );
      }
    const contactTexture = new THREE.DataTexture(pixels, size, size);
    contactTexture.needsUpdate = true;
    contactTexture.magFilter = THREE.LinearFilter;
    const contact = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 2.2),
      new THREE.MeshBasicMaterial({
        map: contactTexture,
        transparent: true,
        depthWrite: false,
      }),
    );
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.05;
    this.showroomStage.add(contact);
  }
  private tick(dt: number, time: number) {
    const s = this.state();
    this.reducedMotion = s.reducedMotion ?? this.reducedMotion;
    this.windTime.value = this.reducedMotion ? 0 : time;
    this.atmosphere.update(this.windTime.value);
    this.discoveryMarkers.update(
      time,
      s.adventure?.discoveries ?? [],
      this.reducedMotion,
    );
    const moving = s.active ? Math.min(1, Math.hypot(s.moveX, s.moveY)) : 0;
    if (moving > 0.03 && !this.wasMoving) this.movementAngle = this.angle;
    this.wasMoving = moving > 0.03;
    const region = s.adventure?.region ?? 'island';
    if (region !== this.region) {
      this.region = region;
      this.skyLight.intensity = region === 'moon' ? 0.5 : 0.95;
      this.sun.intensity = region === 'moon' ? 1.6 : 2.35;
      this.sun.color.set(region === 'moon' ? '#cbd8ff' : '#ffedc6');
      this.islandObjects.forEach((o) => {
        o.visible = region === 'island';
      });
      this.village.moon.visible = region === 'moon';
      this.scene.fog = new THREE.Fog(
        region === 'moon' ? '#252344' : '#b9dbdf',
        65,
        180,
      );
      this.renderer.setClearColor(region === 'moon' ? '#252344' : '#b9dbdf');
      this.player.position.set(0, 0, region === 'moon' ? 6 : 5);
      this.jumpY = 0;
      this.jumpVelocity = 0;
      this.angle = 0;
      this.movementAngle = 0;
      this.cameraGoal = 0;
      this.wasMoving = false;
    }
    if (s.adventure)
      this.village.update(
        s.adventure,
        this.player.position.x,
        this.player.position.z,
      );
    this.village.animateGarden(time, this.reducedMotion);
    for (const npc of this.village.neighbours) {
      const near =
        Math.hypot(
          npc.root.position.x - this.player.position.x,
          npc.root.position.z - this.player.position.z,
        ) < 7;
      if (near)
        npc.root.rotation.y = Math.atan2(
          this.player.position.x - npc.root.position.x,
          this.player.position.z - npc.root.position.z,
        );
      npc.animate(
        time + PLACES.findIndex((p) => p.id === npc.id) * 0.7,
        near,
        s.talking === npc.id,
        this.reducedMotion,
      );
    }
    const lookKey = JSON.stringify(s.appearance ?? defaultAppearance());
    if (lookKey !== this.appearanceKey) {
      this.appearanceKey = lookKey;
      this.player.remove(this.rig);
      this.pizzaParcel.removeFromParent();
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>(),
        textures = new Set<THREE.Texture>();
      this.rig.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          geometries.add(o.geometry);
          for (const material of Array.isArray(o.material)
            ? o.material
            : [o.material]) {
            materials.add(material);
            if (material instanceof THREE.MeshStandardMaterial) {
              if (material.map) textures.add(material.map);
              if (material.bumpMap) textures.add(material.bumpMap);
            }
          }
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      this.character = createMonster(s.appearance);
      this.rig = this.character.root;
      this.costumePieces.clear();
      this.buildMonster();
    }
    for (const id of Object.values(s.outfit))
      if (
        !id.startsWith('no-') &&
        !this.costumePieces.has(id) &&
        COSMETICS.some((item) => item.id === id)
      ) {
        const piece = createCostume(id);
        this.rig.add(piece);
        this.costumePieces.set(id, piece);
      }
    const show = Boolean(s.showcase);
    if (show !== this.inShowcase) {
      this.inShowcase = show;
      this.resize();
      this.renderer.setClearColor(
        this.region === 'moon' ? '#252344' : '#b9dbdf',
        show ? 0 : 1,
      );
      if (show) {
        this.savedFacing = this.player.rotation.y;
        this.showcaseAngle = 0;
        this.showroom.add(this.player);
        this.player.rotation.y = 0;
      } else {
        this.scene.add(this.player);
        this.player.rotation.y = this.savedFacing;
      }
    }
    for (const [id, piece] of this.costumePieces)
      piece.visible = Object.values(s.outfit).includes(id);
    if (show) {
      if (s.showcase === 'wardrobe') this.showcaseAngle += s.turn * dt * 2;
      this.player.rotation.y = THREE.MathUtils.lerp(
        this.player.rotation.y,
        this.showcaseAngle,
        1 - Math.exp(-7 * dt),
      );
    }
    if (s.active) {
      const length = Math.max(1, Math.hypot(s.moveX, s.moveY)),
        dx =
          ((s.moveX * Math.cos(this.movementAngle) +
            s.moveY * Math.sin(this.movementAngle)) *
            dt *
            6.7) /
          length,
        dz =
          ((-s.moveX * Math.sin(this.movementAngle) +
            s.moveY * Math.cos(this.movementAngle)) *
            dt *
            6.7) /
          length;
      if (moving > 0.03) {
        const next = s.adventure
          ? { x: this.player.position.x + dx, z: this.player.position.z + dz }
          : clampToIsland(
              this.player.position.x + dx,
              this.player.position.z + dz,
            );
        Object.assign(next, clampToPlayArea(next.x, next.z));
        for (const o of this.region === 'island'
          ? this.colliders
          : this.atmosphere.moonColliders) {
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
      }
      if (this.jumpY > 0 || this.jumpVelocity > 0) {
        this.jumpVelocity -= (this.region === 'moon' ? 6 : 13) * dt;
        this.jumpY = Math.max(0, this.jumpY + this.jumpVelocity * dt);
        if (this.jumpY === 0) this.jumpVelocity = 0;
      }
    }
    const blooms = s.completed.filter((id) => id.startsWith('garden-')).length;
    this.growingPlants.forEach((p, i) =>
      p.scale.setScalar(0.35 + Math.min(1.05, Math.max(0, blooms - i) * 0.28)),
    );
    this.celebration = Math.max(0, this.celebration - dt);
    this.player.position.y =
      (this.region === 'moon'
        ? 0
        : this.atmosphere.surfaceHeight(
            this.player.position.x,
            this.player.position.z,
          )) + (show ? 0 : this.jumpY);
    this.showroomStage.position.set(
      this.player.position.x,
      (this.region === 'moon'
        ? 0
        : this.atmosphere.surfaceHeight(
            this.player.position.x,
            this.player.position.z,
          )) - 0.02,
      this.player.position.z,
    );
    this.character.animate({
      delta: dt,
      time,
      speed: moving,
      airborne: show ? 0 : this.jumpY,
      celebrating: this.celebration > 0,
      greeting: s.welcome,
      reducedMotion: this.reducedMotion,
      carrying: !!s.adventure?.deliveries.parcel && !show,
    });
    if (this.pizzaParcel.parent !== this.rig) this.rig.add(this.pizzaParcel);
    this.pizzaParcel.visible = !!s.adventure?.deliveries.parcel && !show;
    this.shadow.position.set(
      this.player.position.x,
      (this.region === 'moon'
        ? 0
        : this.atmosphere.surfaceHeight(
            this.player.position.x,
            this.player.position.z,
          )) + 0.025,
      this.player.position.z,
    );
    this.shadow.scale.setScalar(1 - this.jumpY * 0.14);
    for (const o of this.ornaments) {
      if (o.kind === 'tree' && !this.reducedMotion) {
        o.object.rotation.z = Math.sin(time * 0.8 + o.phase) * 0.014;
        o.object.rotation.x = Math.cos(time * 0.65 + o.phase) * 0.008;
      }
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
    const discovery = s.discoveryTarget
      ? discoveryFor(s.discoveryTarget)
      : undefined;
    const target =
        s.deliveryTarget && s.adventure?.deliveries.parcel
          ? this.region === 'moon'
            ? { x: 0, z: 6 }
            : placeFor(s.adventure.deliveries.parcel.recipient)
          : discovery &&
              discovery.region === this.region &&
              !s.adventure?.discoveries.includes(discovery.id)
            ? discovery
            : s.destination
              ? placeFor(s.destination)
              : ZONES.find((z) => z.id === s.target)!,
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
    if (!show) {
      this.sun.position
        .copy(this.player.position)
        .add(new THREE.Vector3(-30, 44, 24));
      this.sun.target.position.copy(this.player.position);
      this.sun.target.updateMatrixWorld();
    }
    const obstacles =
      this.region === 'island'
        ? [...this.colliders, ...this.cameraBuildings]
        : this.atmosphere.moonColliders;
    const gentleCamera =
      s.preferences?.camera !== 'fixed' && !this.reducedMotion;
    if (!show && time >= this.nextCameraCheck) {
      this.nextCameraCheck = time + 0.8;
      this.cameraGoal = gentleCamera
        ? chooseCameraYaw(
            this.player.position.x,
            this.player.position.z,
            this.angle,
            obstacles,
          )
        : 0;
    }
    if (!show)
      this.angle = THREE.MathUtils.lerp(
        this.angle,
        this.cameraGoal,
        1 - Math.exp(-1.4 * dt),
      );
    const lift =
      !show &&
      gentleCamera &&
      cameraObstructed(
        this.player.position.x,
        this.player.position.z,
        this.angle,
        obstacles,
      )
        ? 2.5
        : 0;
    const follow = show
      ? new THREE.Vector3(
          this.player.position.x + 0.15,
          this.player.position.y + 2.15,
          this.player.position.z + (this.camera.aspect < 0.75 ? 6.7 : 5.4),
        )
      : new THREE.Vector3(
          Math.sin(this.angle) * 12,
          7.8 + lift,
          Math.cos(this.angle) * 12,
        ).add(
          new THREE.Vector3(
            this.player.position.x,
            this.region === 'moon'
              ? 0
              : this.atmosphere.surfaceHeight(
                  this.player.position.x,
                  this.player.position.z,
                ),
            this.player.position.z,
          ),
        );
    if (show) this.camera.position.copy(follow);
    else this.camera.position.lerp(follow, 1 - Math.exp(-3 * dt));
    this.camera.lookAt(
      show
        ? new THREE.Vector3(
            this.player.position.x,
            this.player.position.y + 1.5,
            this.player.position.z,
          )
        : new THREE.Vector3(
            this.player.position.x,
            this.player.position.y + 1.1,
            this.player.position.z,
          ),
    );
  }
  turnShowcase() {
    this.showcaseAngle += Math.PI / 2;
  }
  jump() {
    if (this.jumpY === 0 && this.state().active) this.jumpVelocity = 5.8;
  }
  travel(id: PlaceId) {
    const z = placeFor(id);
    this.player.position.set(
      z.x - 1.6,
      this.region === 'moon' ? 0 : height(z.x, z.z + 3),
      z.z + 3,
    );
    this.jumpY = 0;
    this.jumpVelocity = 0;
    this.angle = 0;
    this.cameraGoal = 0;
    this.wasMoving = false;
    this.player.rotation.y = Math.PI;
    const x = this.player.position.x,
      playerZ = this.player.position.z;
    const zone = nearestZone(x, playerZ);
    this.update({
      x,
      z: playerZ,
      zone: zone.id,
      near: Math.hypot(x - zone.x, playerZ - zone.z) < 3.8 ? zone.id : null,
      place: id,
    });
  }
  celebrate() {
    this.celebration = 3.5;
    for (
      let i = 0;
      i <
      (this.state().preferences?.calm || this.reducedMotion
        ? 5
        : GRAPHICS[this.graphics.tier].particles);
      i++
    ) {
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
    this.renderer.setPixelRatio(
      graphicsPixelRatio(this.graphics.tier, w, h, devicePixelRatio),
    );
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
      materials = new Set<THREE.Material>(),
      textures = new Set<THREE.Texture>();
    const collect = (o: THREE.Object3D) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
        geometries.add(o.geometry);
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
          materials.add(m);
          if (m instanceof THREE.MeshStandardMaterial && m.bumpMap)
            textures.add(m.bumpMap);
          if (
            (m instanceof THREE.MeshStandardMaterial ||
              m instanceof THREE.MeshBasicMaterial) &&
            m.map
          )
            textures.add(m.map);
        });
      }
      if (o instanceof THREE.Sprite) {
        o.material.map?.dispose();
        materials.add(o.material);
      }
    };
    this.scene.traverse(collect);
    this.showroom.traverse(collect);
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    this.textures.dispose();
    this.environment?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
