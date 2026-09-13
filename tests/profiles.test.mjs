import test from 'node:test';
import assert from 'node:assert/strict';
import { freshProgress } from '../lib/learning.ts';
import {
  SAVE_KEY,
  BACKUP_KEY,
  saveRecoverably,
  readBackups,
} from '../lib/save-recovery.ts';
import {
  PROFILE_IDS,
  PROFILES_KEY,
  defaultProfiles,
  readProfiles,
  profileStorage,
  loadProfile,
  renameProfile,
  createProfile,
  activateProfile,
} from '../lib/profiles.ts';
const memory = () => {
  const data = new Map();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
};
test('the original adventure and recovery bytes retain their existing keys without migration writes', () => {
  const store = memory(),
    p = freshProgress();
  p.adventure.wallet = 9;
  p.adventure.earned = p.adventure.wallet;
  saveRecoverably(store, p);
  p.adventure.wallet = 12;
  p.adventure.earned = p.adventure.wallet;
  saveRecoverably(store, p);
  const bytes = new Map(store.data);
  assert.deepEqual(readProfiles(store), defaultProfiles());
  assert.deepEqual(loadProfile(store, 'original').progress, p);
  assert.deepEqual(store.data, bytes);
  assert.equal(
    profileStorage(store, 'original').getItem(SAVE_KEY),
    store.getItem(SAVE_KEY),
  );
  assert.equal(
    profileStorage(store, 'original').getItem(BACKUP_KEY),
    store.getItem(BACKUP_KEY),
  );
});
test('four adventures keep independent appearance, rewards, practice and recovery copies through switches', () => {
  const store = memory(),
    original = freshProgress();
  original.adventure.wallet = 23;
  original.adventure.earned = original.adventure.wallet;
  original.appearance.eyes = 'three';
  saveRecoverably(store, original);
  const originalBytes = store.getItem(SAVE_KEY);
  for (const [i, id] of PROFILE_IDS.slice(1).entries()) {
    const added = createProfile(store, 'Friend ' + i);
    assert.equal(added.profile.id, id);
    assert.equal(readProfiles(store).activeId, 'original');
    assert.equal(store.getItem(SAVE_KEY), originalBytes);
    const p = loadProfile(store, id).progress;
    assert.equal(p.adventure.wallet, 0);
    assert.equal(p.tutorialComplete, false);
    for (let n = 1; n <= 4; n++) {
      p.adventure.wallet = 10 * (i + 1) + n;
      p.adventure.earned = p.adventure.wallet;
      saveRecoverably(profileStorage(store, id), p);
    }
    assert.equal(readBackups(profileStorage(store, id)).length, 3);
    assert.equal(
      readBackups(profileStorage(store, id))[0].progress.adventure.wallet,
      10 * (i + 1) + 3,
    );
    activateProfile(store, 'original', original, id);
    assert.equal(readProfiles(store).activeId, id);
    assert.equal(
      loadProfile(store, id).progress.adventure.wallet,
      10 * (i + 1) + 4,
    );
    activateProfile(store, id, p, 'original');
    assert.deepEqual(loadProfile(store, 'original').progress, original);
  }
  assert.equal(readProfiles(store).profiles.length, 4);
  assert.throws(() => createProfile(store, 'Fifth'));
  assert.equal(store.getItem(SAVE_KEY), originalBytes);
});
test('names are bounded local metadata and renaming never alters a progress save', () => {
  const store = memory();
  saveRecoverably(store, freshProgress());
  const before = store.getItem(SAVE_KEY);
  const renamed = renameProfile(
    store,
    'original',
    '  A\n little\u0000 friend  ',
  );
  assert.equal(renamed.profiles[0].name, 'A little friend');
  assert.equal(store.getItem(SAVE_KEY), before);
  assert.equal(
    renameProfile(store, 'original', 'X'.repeat(100)).profiles[0].name.length,
    24,
  );
  assert.throws(() => renameProfile(store, 'friend-3', 'Missing'));
  assert.throws(() => profileStorage(store, '../../other'));
  assert.throws(() =>
    profileStorage(store, 'friend-1').setItem(
      'monster-game-sound-reviews',
      'bad',
    ),
  );
});
test('damaged lists recover existing adventure namespaces and never reuse or overwrite their saved data', () => {
  const store = memory();
  const added = createProfile(store, 'Another');
  const bytes = profileStorage(store, added.profile.id).getItem(SAVE_KEY);
  store.setItem(PROFILES_KEY, '{damaged');
  assert.equal(readProfiles(store).profiles.length, 2);
  assert.equal(readProfiles(store).activeId, 'original');
  assert.equal(createProfile(store, 'Next').profile.id, 'friend-2');
  assert.equal(profileStorage(store, 'friend-1').getItem(SAVE_KEY), bytes);
  store.setItem(
    PROFILES_KEY,
    JSON.stringify({
      version: 1,
      activeId: 'unknown',
      profiles: [
        null,
        { id: '../outside', name: 'Invalid' },
        { id: 'original', name: 23 },
      ],
    }),
  );
  const recovered = readProfiles(store);
  assert.equal(recovered.activeId, 'original');
  assert.equal(recovered.profiles.length, 3);
});
test('failed writes do not select another child or replace either primary save', () => {
  const store = memory(),
    p = freshProgress();
  saveRecoverably(store, p);
  createProfile(store, 'Friend');
  const before = new Map(store.data),
    changed = { ...p, knownSounds: ['m'] };
  const full = {
    getItem: store.getItem,
    setItem() {
      throw new Error('Full');
    },
  };
  assert.throws(() => activateProfile(full, 'original', changed, 'friend-1'));
  assert.deepEqual(store.data, before);
  const listFull = {
    getItem: store.getItem,
    setItem(key, value) {
      if (key === PROFILES_KEY) throw new Error('List write failed');
      store.setItem(key, value);
    },
  };
  assert.throws(() => activateProfile(listFull, 'original', p, 'friend-1'));
  assert.equal(readProfiles(store).activeId, 'original');
  assert.throws(() => createProfile(listFull, 'Still safe'));
  assert.equal(
    readProfiles(store).profiles.length,
    3,
    'An orphaned new save is recoverable after a failed metadata write',
  );
  assert.equal(store.getItem(SAVE_KEY), before.get(SAVE_KEY));
});
test('only the selected child’s backups can recover corruption, and unrecoverable data is kept untouched', () => {
  const store = memory(),
    p = freshProgress();
  p.adventure.wallet = 37;
  p.adventure.earned = p.adventure.wallet;
  saveRecoverably(store, p);
  createProfile(store, 'Friend');
  const child = profileStorage(store, 'friend-1');
  const next = freshProgress();
  next.adventure.wallet = 2;
  next.adventure.earned = next.adventure.wallet;
  saveRecoverably(child, next);
  child.setItem(SAVE_KEY, 'bad');
  const recovered = loadProfile(store, 'friend-1');
  assert.equal(recovered.recovered, true);
  assert.equal(recovered.progress.adventure.wallet, 0);
  child.setItem(BACKUP_KEY, 'bad');
  const before = new Map(store.data);
  assert.throws(() => loadProfile(store, 'friend-1'));
  assert.throws(() => activateProfile(store, 'original', p, 'friend-1'));
  assert.deepEqual(store.data, before);
  assert.equal(loadProfile(store, 'original').progress.adventure.wallet, 37);
  // A volatile unsaved session can leave a damaged namespace without writing over it.
  activateProfile(store, 'friend-1', null, 'original');
  assert.equal(child.getItem(SAVE_KEY), 'bad');
});
