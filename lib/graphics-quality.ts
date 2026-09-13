export type GraphicsTier = 'rich' | 'balanced' | 'simple';
export type GraphicsMode = 'auto' | GraphicsTier;
export const GRAPHICS = {
  rich: {
    label: 'More detail',
    pixelRatio: 1.5,
    pixels: 2304000,
    shadowSize: 2048,
    shadowHz: 60,
    grass: 1,
    particles: 28,
    pollen: true,
  },
  balanced: {
    label: 'Balanced',
    pixelRatio: 1.25,
    pixels: 1600000,
    shadowSize: 1024,
    shadowHz: 30,
    grass: 0.65,
    particles: 18,
    pollen: true,
  },
  simple: {
    label: 'Simpler graphics',
    pixelRatio: 1,
    pixels: 921600,
    shadowSize: 0,
    shadowHz: 0,
    grass: 0.25,
    particles: 8,
    pollen: false,
  },
} as const;
export const GRAPHICS_MODES: GraphicsMode[] = [
  'auto',
  'rich',
  'balanced',
  'simple',
];
export function graphicsPixelRatio(
  tier: GraphicsTier,
  width: number,
  height: number,
  device = 1,
) {
  const quality = GRAPHICS[tier];
  const area = Math.max(1, width) * Math.max(1, height);
  const ratio = Number.isFinite(device) && device > 0 ? device : 1;
  return Math.min(ratio, quality.pixelRatio, Math.sqrt(quality.pixels / area));
}

/** Uses only visible world frames. Pauses and initial shader work do not lower quality. */
export class GraphicsGovernor {
  mode: GraphicsMode = 'auto';
  tier: GraphicsTier = 'balanced';
  fps: number | null = null;
  private warmup = 2500;
  private elapsed = 0;
  private frames = 0;
  private slow = 0;
  private fast = 0;
  private cooldown = 0;
  private consecutiveStalls = 0;
  setMode(mode: GraphicsMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.tier = mode === 'auto' ? 'balanced' : mode;
    this.pause();
    this.cooldown = 0;
  }
  pause() {
    this.elapsed = this.frames = this.slow = this.fast = 0;
    this.consecutiveStalls = 0;
    this.warmup = 2500;
  }
  sample(milliseconds: number) {
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) return;
    if (milliseconds > 250) {
      this.consecutiveStalls++;
      if (this.consecutiveStalls < 3) {
        this.elapsed = this.frames = 0;
        return;
      }
      // Repeated very slow frames are genuine load, not a single shader stall.
      milliseconds = Math.min(milliseconds, 1000);
    } else this.consecutiveStalls = 0;
    this.cooldown = Math.max(0, this.cooldown - milliseconds);
    if (this.warmup > 0) {
      this.warmup -= milliseconds;
      return;
    }
    this.elapsed += milliseconds;
    this.frames++;
    if (this.elapsed < 3000) return;
    this.fps = (1000 * this.frames) / this.elapsed;
    this.elapsed = this.frames = 0;
    if (this.mode !== 'auto') return;
    this.slow = this.fps < 35 ? this.slow + 1 : 0;
    this.fast = this.fps > 57 ? this.fast + 1 : 0;
    if (this.cooldown > 0) return;
    const tiers: GraphicsTier[] = ['simple', 'balanced', 'rich'];
    const index = tiers.indexOf(this.tier);
    if (this.slow >= 2 && index > 0) this.tier = tiers[index - 1];
    else if (this.fast >= 8 && index < 2) this.tier = tiers[index + 1];
    else return;
    this.slow = this.fast = 0;
    this.cooldown = 15000;
  }
}
export type GraphicsSnapshot = {
  mode: GraphicsMode;
  tier: GraphicsTier;
  fps: number | null;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  pixelRatio: number;
};
