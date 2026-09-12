import { deadzone } from './learning';
export type Action =
  | 'confirm'
  | 'back'
  | 'map'
  | 'listen'
  | 'pause'
  | 'suspend'
  | 'previousTab'
  | 'nextTab'
  | 'left'
  | 'right'
  | 'up'
  | 'down';
export class GameInput {
  private keys = new Set<string>();
  private frame = 0;
  private previous: boolean[] = [];
  private lastRepeat = 0;
  private axisDirection = '';
  private connected = false;
  private padIdentity = '';
  private armed = false;
  private lastFace = -Infinity;
  public touch = { x: 0, y: 0 };
  constructor(
    private action: (a: Action) => void,
    private movement: (x: number, y: number, turn: number) => void,
    private connection: (connected: boolean, name: string) => void,
  ) {
    window.addEventListener('keydown', this.down, true);
    window.addEventListener('keyup', this.up);
    window.addEventListener('blur', this.clear);
    document.addEventListener('visibilitychange', this.visibility);
    this.frame = requestAnimationFrame(this.poll);
  }
  private down = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (
      target?.closest(
        'input,select,textarea,[role="combobox"],[data-parent-controls]',
      )
    )
      return;
    const mappings: Record<string, Action> = {
      Enter: 'confirm',
      Space: 'confirm',
      Escape: 'back',
      KeyM: 'map',
      KeyY: 'listen',
      KeyP: 'pause',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
      KeyA: 'left',
      KeyD: 'right',
      KeyW: 'up',
      KeyS: 'down',
    };
    const a = mappings[e.code];
    if (a) {
      e.preventDefault();
      e.stopPropagation?.();
      this.keys.add(e.code);
      if (!e.repeat) this.action(a);
    }
  };
  private up = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };
  private clear = () => {
    this.keys.clear();
    this.touch = { x: 0, y: 0 };
    this.movement(0, 0, 0);
    this.armed = false;
    this.axisDirection = '';
  };
  private visibility = () => {
    if (document.hidden) this.clear();
  };
  private poll = (now: number) => {
    this.frame = requestAnimationFrame(this.poll);
    let pad: Gamepad | undefined;
    try {
      pad = Array.from(navigator.getGamepads?.() ?? []).find(
        (p): p is Gamepad => Boolean(p?.connected && p.mapping === 'standard'),
      );
    } catch {
      /* Keyboard remains available when Gamepad API is restricted. */
    }
    const identity = pad ? `${pad.index}:${pad.id}` : '';
    if (identity !== this.padIdentity) {
      const wasConnected = this.connected;
      this.padIdentity = identity;
      this.connected = Boolean(pad);
      this.connection(this.connected, pad?.id ?? '');
      this.previous = [];
      this.armed = false;
      this.axisDirection = '';
      if (wasConnected) this.action('suspend');
    }
    let x =
      Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) -
      Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft')) +
      this.touch.x;
    let y =
      Number(this.keys.has('KeyS') || this.keys.has('ArrowDown')) -
      Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) +
      this.touch.y;
    const turn = 0;
    if (pad && !document.hidden) {
      const pressed = pad.buttons.map((b) => b.pressed);
      const px = deadzone(pad.axes[0] ?? 0),
        py = deadzone(pad.axes[1] ?? 0);
      // Connecting/returning with a held button must never choose an answer.
      if (!this.armed) {
        this.armed =
          ![0, 1, 2, 3, 9, 12, 13, 14, 15].some((i) => pressed[i]) &&
          !px &&
          !py;
        this.previous = pressed;
        this.movement(0, 0, 0);
        return;
      }
      const map: Record<number, Action> = {
        0: 'confirm',
        1: 'back',
        2: 'map',
        3: 'listen',
        9: 'pause',
        12: 'up',
        13: 'down',
        14: 'left',
        15: 'right',
      };
      // One face action per frame; Start and Back win over an accidental A.
      const face = [9, 1, 0, 2, 3].find((i) => pressed[i] && !this.previous[i]);
      if (
        face !== undefined &&
        (face === 9 || face === 1 || now - this.lastFace >= 220)
      ) {
        this.action(map[face]);
        this.lastFace = now;
      }
      this.previous = pressed;
      x += px + Number(pressed[15]) - Number(pressed[14]);
      y += py + Number(pressed[13]) - Number(pressed[12]);
      // All movement uses the left stick or D-pad; no second-stick dependency.
      const dx = px + Number(pressed[15]) - Number(pressed[14]);
      const dy = py + Number(pressed[13]) - Number(pressed[12]);
      const direction =
        Math.abs(dx) > 0.55
          ? dx > 0
            ? 'right'
            : 'left'
          : Math.abs(dy) > 0.55
            ? dy > 0
              ? 'down'
              : 'up'
            : '';
      if (
        face === undefined &&
        direction &&
        (direction !== this.axisDirection || now - this.lastRepeat > 300)
      ) {
        this.action(direction as Action);
        this.lastRepeat = now;
      }
      this.axisDirection = direction;
    }
    if (document.hidden) {
      this.movement(0, 0, 0);
      return;
    }
    this.movement(
      Math.max(-1, Math.min(1, x)),
      Math.max(-1, Math.min(1, y)),
      turn,
    );
  };
  dispose() {
    cancelAnimationFrame(this.frame);
    window.removeEventListener('keydown', this.down, true);
    window.removeEventListener('keyup', this.up);
    window.removeEventListener('blur', this.clear);
    document.removeEventListener('visibilitychange', this.visibility);
    this.clear();
  }
}
