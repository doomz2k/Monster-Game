import test from 'node:test';
import assert from 'node:assert/strict';
import { freshProgress, readProgress } from '../lib/learning.ts';
import { buyItem, SHOP_ITEMS } from '../lib/adventure.ts';
import {
  chooseWish,
  ShopPurchase,
  shopAvailability,
} from '../lib/shop-state.ts';
import { claimFriendGift } from '../lib/friendship.ts';
import script from '../lib/audio-data/adventure-script.json' with { type: 'json' };

test('one inspection spends once even if confirm arrives twice with stale or updated state', () => {
  const p = freshProgress();
  p.adventure.wallet = 20;
  const purchase = new ShopPurchase('tomato'),
    next = purchase.commit(p);
  assert.equal(next.adventure.wallet, 18);
  assert.equal(
    next.adventure.seeds.tomato,
    (p.adventure.seeds.tomato ?? 0) + 1,
  );
  assert.equal(purchase.commit(p), p);
  assert.equal(purchase.commit(next), next);
  const another = new ShopPurchase('tomato').commit(next);
  assert.equal(another.adventure.wallet, 16);
  assert.equal(another.adventure.seeds.tomato, next.adventure.seeds.tomato + 1);
});
test('failed purchases preserve stars and can be retried after earning enough', () => {
  const p = freshProgress(),
    purchase = new ShopPurchase('swing');
  assert.equal(purchase.commit(p), p);
  p.adventure.wallet = 6;
  assert.equal(purchase.commit(p).adventure.wallet, 0);
  for (const id of ['invented', 'table', 'moonflower', 'daisy']) {
    p.adventure.seeds.daisy = 99;
    assert.equal(new ShopPurchase(id).commit(p), p, id);
  }
});
test('shop states explain unlock, capacity, ownership and affordability independently', () => {
  const p = freshProgress();
  assert.equal(shopAvailability(p, 'invented'), 'missing');
  assert.equal(shopAvailability(p, 'table'), 'owned');
  assert.equal(shopAvailability(p, 'moonflower'), 'moon');
  p.adventure.rounds.rocket = 3;
  assert.equal(shopAvailability(p, 'moonflower'), 'stars');
  p.adventure.wallet = 6;
  assert.equal(shopAvailability(p, 'moonflower'), 'ready');
  p.adventure.seeds.moonflower = 99;
  assert.equal(shopAvailability(p, 'moonflower'), 'full');
});
test('saving a goal never spends stars and persists without changing other play', () => {
  const p = freshProgress(),
    next = chooseWish(p, 'swing');
  assert.equal(next.adventure.wish, 'swing');
  assert.equal(next.adventure.wallet, p.adventure.wallet);
  assert.equal(next.adventure.inventory, p.adventure.inventory);
  assert.deepEqual(readProgress(JSON.stringify(next)), next);
  assert.equal(chooseWish(next, 'swing'), next);
  assert.equal(chooseWish(next, 'invented'), next);
  assert.equal(chooseWish(next, 'table'), next);
  assert.equal(chooseWish(next, null).adventure.wish, null);
  assert.equal(chooseWish(p, 'moonflower').adventure.wish, 'moonflower');
});
test('buying or receiving the goal fulfils it, while other purchases leave it intact', () => {
  const p = chooseWish(freshProgress(), 'sofa');
  p.adventure.wallet = 10;
  assert.equal(buyItem(p, 'tomato').adventure.wish, 'sofa');
  assert.equal(buyItem(p, 'sofa').adventure.wish, null);
  p.adventure.rounds.meadow = 3;
  const gifted = claimFriendGift(p, 'meadow');
  assert.equal(gifted.adventure.wish, null);
  assert.equal(gifted.adventure.wallet, 10);
});
test('old and malformed saving goals load safely without removing real inventory', () => {
  for (const goal of [undefined, 'invented', 'table', {}, 1]) {
    const p = freshProgress();
    p.adventure.wish = goal;
    const loaded = readProgress(JSON.stringify(p));
    assert.equal(loaded.adventure.wish, null);
    assert.deepEqual(loaded.adventure.inventory, ['table']);
  }
});
test('every shop item has a British character recording naming its price', () => {
  const words = ['', 'one', 'two', 'three', 'four', 'five', 'six'];
  for (const item of SHOP_ITEMS) {
    const line = script['shop-item-' + item.id];
    assert.equal(line?.voice, 'poppy', item.id);
    assert.ok(line.text.includes(words[item.price] + ' star'), item.id);
  }
});
