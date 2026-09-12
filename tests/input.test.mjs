import test from 'node:test';
import assert from 'node:assert/strict';
import { GameInput } from '../lib/input.ts';
import { registerGameTools } from '../lib/webmcp.ts';
test('Xbox controls use rising button edges, stick deadzone and disconnect pause', () => {
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  let poll;
  const connected = [];
  let pad = null;
  const events = new Map(),
    actions = [],
    moves = [];
  globalThis.window = {
    addEventListener: (n, f) => events.set(n, f),
    removeEventListener() {},
  };
  globalThis.document = {
    hidden: false,
    addEventListener() {},
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
    (x, y, turn) => moves.push([x, y, turn]),
    (c) => connected.push(c),
  );
  pad = {
    connected: true,
    mapping: 'standard',
    id: 'Test Xbox',
    axes: [0.1, 0.12, 0],
    buttons: Array.from({ length: 16 }, () => ({ pressed: false })),
  };
  pad.buttons[0].pressed = true;
  poll(1000);
  poll(1100);
  assert.equal(actions.filter((a) => a === 'confirm').length, 1);
  assert.deepEqual(moves.at(-1), [0, 0, 0]);
  pad.buttons[0].pressed = false;
  poll(1200);
  pad.buttons[0].pressed = true;
  poll(1300);
  assert.equal(actions.filter((a) => a === 'confirm').length, 2);
  pad.buttons[4].pressed = true;
  pad.buttons[5].pressed = true;
  poll(1350);
  poll(1360);
  assert.equal(actions.filter((a) => a === 'previousTab').length, 0);
  assert.equal(actions.filter((a) => a === 'nextTab').length, 0);
  let consumed = 0;
  const keyboardEvent = (code) => ({
    code,
    repeat: false,
    preventDefault() {},
    stopPropagation() {
      consumed++;
    },
  });
  events.get('keydown')(keyboardEvent('KeyQ'));
  events.get('keydown')(keyboardEvent('KeyE'));
  assert.equal(actions.filter((a) => a === 'previousTab').length, 0);
  assert.equal(actions.filter((a) => a === 'nextTab').length, 0);
  const backsBefore = actions.filter((a) => a === 'back').length;
  events.get('keydown')(keyboardEvent('Escape'));
  assert.equal(actions.filter((a) => a === 'back').length, backsBefore + 1);
  assert.equal(
    consumed,
    1,
    'Handled Escape cannot also dismiss the underlying dialog',
  );
  const beforeTriggers = actions.length;
  pad.buttons[6].pressed = pad.buttons[7].pressed = true;
  poll(1370);
  assert.equal(actions.length, beforeTriggers);
  pad.buttons[1].pressed = pad.buttons[9].pressed = true;
  poll(1380);
  assert.ok(actions.includes('back'));
  assert.ok(actions.includes('pause'));
  pad.axes[0] = 1;
  poll(1400);
  assert.equal(moves.at(-1)[0], 1);
  assert.ok(actions.includes('right'));
  pad = null;
  poll(1500);
  assert.equal(actions.at(-1), 'suspend');
  assert.deepEqual(connected, [true, false]);
  input.dispose();
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.requestAnimationFrame;
  delete globalThis.cancelAnimationFrame;
  if (oldNavigator)
    Object.defineProperty(globalThis, 'navigator', oldNavigator);
});
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
