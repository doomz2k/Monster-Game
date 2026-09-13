import test from 'node:test';
import assert from 'node:assert/strict';
import { GameInput } from '../lib/input.ts';
import { registerGameTools } from '../lib/webmcp.ts';
for (const name of [
  'Xbox Wireless Controller',
  'DualSense Wireless Controller',
  'Generic standard-mapped USB pad',
])
  test(
    name +
      ': safe reconnect, face priority, repeat, hidden tabs and unused triggers',
    () => {
      const oldNavigator = Object.getOwnPropertyDescriptor(
        globalThis,
        'navigator',
      );
      let poll,
        pad = null;
      const events = new Map(),
        actions = [],
        moves = [],
        connections = [];
      globalThis.window = {
        addEventListener: (n, f) => events.set(n, f),
        removeEventListener() {},
      };
      globalThis.document = {
        hidden: false,
        hasFocus: () => false,
        addEventListener: (n, f) => events.set(n, f),
        removeEventListener() {},
      };
      globalThis.requestAnimationFrame = (f) => ((poll = f), 1);
      globalThis.cancelAnimationFrame = () => {};
      Object.defineProperty(globalThis, 'navigator', {
        value: { getGamepads: () => [pad] },
        configurable: true,
      });
      const input = new GameInput(
        (a) => actions.push(a),
        (...v) => moves.push(v),
        (c) => connections.push(c),
      );
      try {
        pad = {
          connected: true,
          index: 0,
          mapping: 'standard',
          id: name,
          axes: [0.1, 0.12, 1],
          buttons: Array.from({ length: 17 }, () => ({ pressed: false })),
        };
        const set = (...indices) =>
          pad.buttons.forEach((b, i) => (b.pressed = indices.includes(i)));
        set(0);
        poll(1000);
        poll(1100);
        assert.deepEqual(
          actions,
          [],
          'Held A during initial connection is ignored until released',
        );
        set();
        poll(1110);
        set(0);
        poll(1150);
        assert.deepEqual(
          actions,
          [],
          'Opening in the background never arms the controller',
        );
        events.get('focus')();
        set();
        poll(1200);
        set(0);
        poll(1300);
        poll(1350);
        assert.deepEqual(actions, ['confirm']);
        assert.deepEqual(moves.at(-1), [0, 0, 0]);
        set();
        poll(1380);
        set(0);
        poll(1400);
        assert.equal(
          actions.length,
          1,
          'A bounce cannot advance a second screen',
        );
        set();
        poll(1600);
        set(0);
        poll(1700);
        assert.equal(actions.length, 2);
        set(0, 1, 9);
        poll(1720);
        assert.equal(actions.at(-1), 'pause');
        assert.equal(actions.length, 3, 'Start wins, one action only');
        set();
        poll(1800);
        set(0, 1);
        poll(1810);
        assert.equal(actions.at(-1), 'back');
        set(4, 5, 6, 7, 8, 10, 11);
        poll(2100);
        assert.equal(
          actions.length,
          4,
          'No trigger, shoulder or stick-click bindings',
        );
        set(15);
        poll(2200);
        poll(2400);
        poll(2510);
        assert.deepEqual(actions.slice(-2), ['right', 'right']);
        assert.equal(moves.at(-1)[0], 1);
        pad = null;
        poll(2600);
        assert.equal(actions.at(-1), 'suspend');
        assert.deepEqual(moves.at(-1), [0, 0, 0]);
        pad = {
          connected: true,
          index: 1,
          mapping: 'standard',
          id: name,
          axes: [1, 0, 0],
          buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: i === 0 })),
        };
        const before = actions.length;
        poll(2700);
        assert.equal(actions.length, before);
        assert.deepEqual(moves.at(-1), [0, 0, 0]);
        set();
        pad.axes[0] = 0;
        poll(2800);
        set(0);
        poll(3000);
        assert.equal(actions.at(-1), 'confirm');
        events.get('blur')();
        poll(3100);
        assert.equal(actions.length, before + 1);
        set();
        poll(3120);
        set(0, 15);
        pad.axes[0] = 1;
        poll(3150);
        assert.equal(
          actions.length,
          before + 1,
          'A fresh press while another window has focus is ignored',
        );
        assert.deepEqual(moves.at(-1), [0, 0, 0]);
        events.get('keydown')({
          code: 'Enter',
          repeat: false,
          preventDefault() {
            throw new Error('Unfocused key consumed');
          },
        });
        assert.equal(actions.length, before + 1);
        events.get('focus')();
        poll(3160);
        assert.equal(
          actions.length,
          before + 1,
          'Held buttons cannot resume the game on focus',
        );
        assert.deepEqual(moves.at(-1), [0, 0, 0]);
        pad.axes[0] = 0;
        document.hidden = true;
        events.get('visibilitychange')();
        poll(3200);
        assert.deepEqual(moves.at(-1), [0, 0, 0]);
        document.hidden = false;
        events.get('focus')();
        poll(3300);
        assert.equal(actions.length, before + 1);
        set();
        poll(3400);
        set(0);
        poll(3500);
        assert.equal(actions.length, before + 2);
        let consumed = 0;
        events.get('keydown')({
          code: 'Escape',
          repeat: false,
          preventDefault() {},
          stopPropagation() {
            consumed++;
          },
        });
        assert.equal(consumed, 1);
        assert.equal(actions.at(-1), 'back');
        assert.deepEqual(connections, [true, false, true]);
      } finally {
        input.dispose();
        delete globalThis.window;
        delete globalThis.document;
        delete globalThis.requestAnimationFrame;
        delete globalThis.cancelAnimationFrame;
        if (oldNavigator)
          Object.defineProperty(globalThis, 'navigator', oldNavigator);
      }
    },
  );
test('agent tools validate navigation, preserve assessment boundaries and unregister', async () => {
  const registered = [],
    visited = [];
  const cleanup = registerGameTools(
    { registerTool: (tool, options) => registered.push({ tool, options }) },
    {
      state: () => ({ stars: 2 }),
      visit: async (id) => {
        visited.push(id);
        return { area: id };
      },
    },
  );
  assert.deepEqual(
    registered.map((x) => x.tool.name),
    ['get_monster_game_state', 'visit_monster_learning_area'],
  );
  assert.equal(registered[0].tool.annotations.readOnlyHint, true);
  assert.deepEqual(registered[0].tool.execute({}), { stars: 2 });
  assert.deepEqual(await registered[1].tool.execute({ area: 'woods' }), {
    area: 'woods',
  });
  assert.throws(() => registered[1].tool.execute({ area: 'invalid' }));
  assert.throws(() =>
    registered[1].tool.execute({ area: 'woods', answer: 'm' }),
  );
  assert.deepEqual(visited, ['woods']);
  cleanup();
  assert.ok(registered.every((x) => x.options.signal.aborted));
});
