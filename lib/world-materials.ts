import * as THREE from 'three';
/** One owned texture set per world; all meshes share it until world disposal. */
export function worldTextures() {
  const loader = new THREE.TextureLoader();
  function load(name: string, repeat: number) {
    const map = loader.load('/textures/' + name + '.png');
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(repeat, repeat);
    map.anisotropy = 4;
    return map;
  }
  const grass = load('grass', 26),
    timber = load('timber', 1),
    rock = load('rock', 12);
  const stone = load('rock', 1);
  return {
    grass,
    timber,
    rock,
    stone,
    dispose: () => [grass, timber, rock, stone].forEach((t) => t.dispose()),
  };
}
export type WorldTextures = ReturnType<typeof worldTextures>;
export function surfaceMaterial(colour: string, textures: WorldTextures) {
  const c = new THREE.Color(colour);
  // Timber hues get visible grain; saturated painted parts retain their own finish.
  const wood = c.r > c.g * 1.12 && c.g > c.b * 1.16 && c.g < 0.75 && c.b > 0.04;
  return new THREE.MeshStandardMaterial({
    color: colour,
    roughness: 0.9,
    map: wood ? textures.timber : null,
    bumpMap: wood ? textures.timber : null,
    bumpScale: wood ? 0.025 : 0,
  });
}
