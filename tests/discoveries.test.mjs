import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { freshProgress, readProgress } from '../lib/learning.ts';
import {
  finishMission,
  missionFor,
  changeRegion,
  SHOP_ITEMS,
} from '../lib/adventure.ts';
import { DISCOVERIES, nearbyDiscovery } from '../lib/discovery-catalogue.ts';
import { collectDiscovery } from '../lib/discoveries.ts';
import {
  canClaimFriendGift,
  claimFriendGift,
  FRIEND_GIFTS,
  friendshipLevel,
} from '../lib/friendship.ts';
import { exportSave, parseSavedProgress } from '../lib/save-recovery.ts';

test('a discovery needs the correct region and proximity, awards exactly once and survives export', () => {
  const p = freshProgress(),
    d = DISCOVERIES[0];
  for (const [x, z] of [
    [0, 0],
    [NaN, d.z],
    [Infinity, d.z],
    [d.x + 3.21, d.z],
  ])
    assert.equal(collectDiscovery(p, d.id, x, z), p);
  assert.equal(collectDiscovery(p, 'unknown', d.x, d.z), p);
  const saved = collectDiscovery(p, d.id, d.x, d.z);
  assert.equal(saved.adventure.wallet, 1);
  assert.equal(saved.adventure.earned, 1);
  assert.equal(collectDiscovery(saved, d.id, d.x, d.z), saved);
  assert.equal(nearbyDiscovery('island', d.x, d.z, []).id, d.id);
  assert.equal(nearbyDiscovery('island', d.x, d.z, [d.id]), null);
  assert.equal(nearbyDiscovery('moon', d.x, d.z, []), null);
  assert.deepEqual(
    parseSavedProgress(exportSave(saved)).adventure,
    saved.adventure,
  );
});
test('moon discoveries are locked until repaired travel and every catalogue item is reachable by its region', () => {
  let p = freshProgress();
  const moon = DISCOVERIES.find((d) => d.region === 'moon');
  assert.equal(collectDiscovery(p, moon.id, moon.x, moon.z), p);
  for (const d of DISCOVERIES.filter((d) => d.region === 'island')) {
    assert.ok(Math.hypot(d.x, d.z) < 80);
    p = collectDiscovery(p, d.id, d.x, d.z);
  }
  for (let i = 0; i < 3; i++) p = finishMission(p, missionFor('rocket', p));
  p = changeRegion(p, 'moon');
  for (const d of DISCOVERIES.filter((d) => d.region === 'moon')) {
    assert.ok(Math.hypot(d.x, d.z) < 48);
    p = collectDiscovery(p, d.id, d.x, d.z);
  }
  assert.equal(p.adventure.discoveries.length, 12);
  assert.equal(p.adventure.wallet, 18);
  assert.deepEqual(readProgress(JSON.stringify(p)).adventure, p.adventure);
});
test('old saves keep stars and inventory; malformed collection fields cannot introduce unknown IDs', () => {
  const p = freshProgress();
  p.adventure.earned = 8;
  p.adventure.wallet = 6;
  p.adventure.inventory.push('sofa');
  delete p.adventure.discoveries;
  delete p.adventure.friendshipGifts;
  const migrated = readProgress(JSON.stringify(p));
  assert.equal(migrated.adventure.wallet, 6);
  assert.ok(migrated.adventure.inventory.includes('sofa'));
  assert.deepEqual(migrated.adventure.discoveries, []);
  migrated.adventure.discoveries = [
    'welcome-daisy',
    'welcome-daisy',
    'moon-pebble',
    'garbage',
    null,
  ];
  migrated.adventure.friendshipGifts = ['home', 'meadow', 'garbage', null];
  const clean = readProgress(JSON.stringify(migrated));
  assert.deepEqual(clean.adventure.discoveries, ['welcome-daisy']);
  assert.deepEqual(clean.adventure.friendshipGifts, []);
});
test('friendship gifts need three helps, cannot repeat and compensate for an already owned gift', () => {
  for (const [id, gift] of Object.entries(FRIEND_GIFTS)) {
    const p = freshProgress();
    assert.ok(SHOP_ITEMS.some((i) => i.id === gift && i.kind !== 'seed'));
    assert.equal(canClaimFriendGift(p, id), false);
    assert.equal(claimFriendGift(p, id), p);
    p.adventure.rounds[id] = 3;
    if (id === 'moon') p.adventure.rounds.rocket = 3;
    const awarded = claimFriendGift(p, id);
    assert.ok(awarded.adventure.inventory.includes(gift));
    assert.equal(awarded.adventure.wallet, 0);
    assert.equal(claimFriendGift(awarded, id), awarded);
    assert.equal(
      canClaimFriendGift(readProgress(JSON.stringify(awarded)), id),
      false,
    );
    p.adventure.inventory.push(gift);
    const compensation = claimFriendGift(p, id);
    assert.equal(compensation.adventure.wallet, 2);
    assert.equal(compensation.adventure.earned, 2);
    assert.equal(
      compensation.adventure.inventory.filter((x) => x === gift).length,
      1,
    );
  }
  assert.deepEqual(
    [0, 1, 2, 3, 5, 6, 9, 10, 100].map(friendshipLevel),
    [0, 1, 1, 2, 2, 3, 3, 4, 4],
  );
});
test('every discovery has matching recorded British narration and a distinct world location', () => {
  const script = JSON.parse(
    readFileSync(
      new URL('../lib/audio-data/adventure-script.json', import.meta.url),
    ),
  );
  const clips = JSON.parse(
    readFileSync(
      new URL('../lib/audio-data/voice-clips.json', import.meta.url),
    ),
  );
  assert.equal(new Set(DISCOVERIES.map((d) => d.id)).size, DISCOVERIES.length);
  for (const d of DISCOVERIES)
    for (const id of ['discovery-' + d.id, 'discovery-clue-' + d.id]) {
      assert.equal(clips[id].text, script[id].text);
      assert.match(clips[id].voice, /^b[fm]_/);
    }
});
