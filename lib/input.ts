import { deadzone } from './learning';
export type Action =
  | 'confirm'
  | 'back'
  | 'map'
  | 'listen'
  | 'pause'
  | 'suspend'
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
  public touch = { x: 0, y: 0 };
  constructor(
    private action: (a: Action) => void,
    private movement: (x: number, y: number, turn: number) => void,
    private connection: (connected: boolean, name: string) => void,
  ) {
    window.addEventListener('keydown', this.down);
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
    if (Boolean(pad) !== this.connected) {
      const wasConnected = this.connected;
      this.connected = Boolean(pad);
      this.connection(this.connected, pad?.id ?? '');
      this.previous = [];
      if (wasConnected && !pad) this.action('suspend');
    }
    let x =
      Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) -
      Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft')) +
      this.touch.x;
    let y =
      Number(this.keys.has('KeyS') || this.keys.has('ArrowDown')) -
      Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) +
      this.touch.y;
    let turn = 0;
    if (pad && !document.hidden) {
      const pressed = pad.buttons.map((b) => b.pressed),
        map: Record<number, Action> = {
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
      for (const [key, a] of Object.entries(map)) {
        const i = Number(key);
        if (pressed[i] && !this.previous[i]) this.action(a);
      }
      this.previous = pressed;
      const px = deadzone(pad.axes[0] ?? 0),
        py = deadzone(pad.axes[1] ?? 0);
      x += px + Number(pressed[15]) - Number(pressed[14]);
      y += py + Number(pressed[13]) - Number(pressed[12]);
      turn = deadzone(pad.axes[2] ?? 0);
      const direction =
        Math.abs(px) > 0.55
          ? px > 0
            ? 'right'
            : 'left'
          : Math.abs(py) > 0.55
            ? py > 0
              ? 'down'
              : 'up'
            : '';
      if (
        direction &&
        (direction !== this.axisDirection || now - this.lastRepeat > 300)
      ) {
        this.action(direction as Action);
        this.lastRepeat = now;
      }
      this.axisDirection = direction;
    }
    this.movement(
      Math.max(-1, Math.min(1, x)),
      Math.max(-1, Math.min(1, y)),
      turn,
    );
  };
  dispose() {
    cancelAnimationFrame(this.frame);
    window.removeEventListener('keydown', this.down);
    window.removeEventListener('keyup', this.up);
    window.removeEventListener('blur', this.clear);
    document.removeEventListener('visibilitychange', this.visibility);
    this.clear();
  }
}
