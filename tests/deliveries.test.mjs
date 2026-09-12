import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { freshProgress, readProgress } from '../lib/learning.ts';
import { missionFor, finishMission, placeFor } from '../lib/adventure.ts';
import {
  acceptDelivery,
  deliveryOffer,
  finishDelivery,
} from '../lib/deliveries.ts';
import { readDeliveries, PIZZA_CUSTOMERS } from '../lib/delivery-state.ts';
import { createPizzaParcel } from '../lib/pizza-parcel.ts';
import { createMonster } from '../lib/monster-model.ts';
import clips from '../lib/audio-data/voice-clips.json' with { type: 'json' };

test('a completed pizza can be delivered to its actual customer exactly once', () => {
  let p = freshProgress();
  assert.equal(deliveryOffer(p), null);
  for (let round = 0; round < 12; round++) {
    const mission = missionFor('meadow', p);
    p = finishMission(p, mission);
    const offer = deliveryOffer(p);
    assert.equal(offer.recipient, mission.recipe.customer);
    assert.equal(offer.ticket, round + 1);
    assert.equal(acceptDelivery(p, offer.ticket + 1), p);
    p = acceptDelivery(p, offer.ticket);
    assert.equal(deliveryOffer(p), null);
    assert.equal(acceptDelivery(p, offer.ticket), p);
    const friend = placeFor(offer.recipient),
      wallet = p.adventure.wallet;
    assert.equal(finishDelivery(p, 'meadow', 0, 0), p);
    assert.equal(finishDelivery(p, friend.id, friend.x + 20, friend.z), p);
    assert.equal(finishDelivery(p, friend.id, NaN, friend.z), p);
    const moon = { ...p, adventure: { ...p.adventure, region: 'moon' } };
    assert.equal(finishDelivery(moon, friend.id, friend.x, friend.z), moon);
    p = finishDelivery(p, friend.id, friend.x, friend.z);
    assert.equal(p.adventure.wallet, wallet + 1);
    assert.equal(p.adventure.deliveries.completed, round + 1);
    assert.equal(deliveryOffer(p), null);
    assert.equal(finishDelivery(p, friend.id, friend.x, friend.z), p);
    assert.deepEqual(readProgress(JSON.stringify(p)).adventure, p.adventure);
  }
});
test('an unfinished parcel survives another recipe and save/resume without losing either reward', () => {
  let p = freshProgress();
  p = finishMission(p, missionFor('meadow', p));
  p = acceptDelivery(p, 1);
  p = finishMission(p, missionFor('meadow', p));
  assert.equal(p.adventure.wallet, 4);
  assert.equal(acceptDelivery(p, 2), p);
  p = readProgress(JSON.stringify(p));
  assert.deepEqual(p.adventure.deliveries.parcel, {
    ticket: 1,
    recipient: 'woods',
  });
  const olive = placeFor('woods');
  p = finishDelivery(p, 'woods', olive.x, olive.z);
  assert.equal(p.adventure.wallet, 5);
  assert.deepEqual(deliveryOffer(p), { ticket: 2, recipient: 'garden' });
});
test('delivery migration rejects invented tickets, wrong recipients and completed parcels', () => {
  for (const parcel of [
    { ticket: 3, recipient: 'woods' },
    { ticket: 7, recipient: 'cove' },
    { ticket: 1, recipient: 'moon' },
    { ticket: 1.5, recipient: 'woods' },
    { ticket: -1, recipient: 'woods' },
    { ticket: NaN, recipient: 'woods' },
    { ticket: 1, recipient: 'woods' },
  ])
    assert.equal(readDeliveries({ parcel, lastCompleted: 1 }, 4).parcel, null);
  assert.deepEqual(readDeliveries({ completed: 500, lastCompleted: 50 }, 4), {
    parcel: null,
    lastCompleted: 4,
    completed: 4,
  });
  const p = freshProgress();
  delete p.adventure.deliveries;
  assert.deepEqual(readProgress(JSON.stringify(p)).adventure.deliveries, {
    parcel: null,
    lastCompleted: 0,
    completed: 0,
  });
});
test('every delivery route and thank-you has recorded British narration', () => {
  for (const id of [
    ...PIZZA_CUSTOMERS.flatMap((c) => [
      'delivery-route-' + c,
      'delivery-thanks-' + c,
    ]),
    'delivery-home',
  ]) {
    assert.ok(clips[id], id);
    assert.match(clips[id].voice, /^b[fm]_/);
  }
});
test('pizza box geometry is finite and Monster holds it steadily while walking or resting', () => {
  const box = createPizzaParcel();
  box.traverse((o) => {
    if (o instanceof THREE.Mesh)
      assert.ok(
        Array.from(o.geometry.attributes.position.array).every(Number.isFinite),
      );
  });
  const bounds = new THREE.Box3().setFromObject(box);
  assert.ok(bounds.max.y < 1.5 && bounds.max.z < 1.3);
  const monster = createMonster();
  monster.root.add(box);
  for (const time of [0, 7.5, 11, 17, 22]) {
    monster.animate({
      delta: 1 / 60,
      time,
      speed: 1,
      airborne: 0,
      celebrating: true,
      greeting: true,
      reducedMotion: false,
      carrying: true,
    });
    assert.equal(monster.arms[0].rotation.x, -1.05);
    assert.equal(monster.arms[1].rotation.x, -1.05);
    monster.root.updateMatrixWorld(true);
    assert.ok(box.matrixWorld.elements.every(Number.isFinite));
  }
});
