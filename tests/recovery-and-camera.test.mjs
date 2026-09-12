import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPreferences, readPreferences } from '../lib/preferences.ts';
import { freshProgress, readProgress } from '../lib/learning.ts';
import {
  SAVE_KEY,
  BACKUP_KEY,
  saveRecoverably,
  loadRecoverableProgress,
  readBackups,
  parseSavedProgress,
  exportSave,
} from '../lib/save-recovery.ts';
import { chooseCameraYaw, cameraObstructed } from '../lib/camera-guidance.ts';
function memory() {
  const data = new Map();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
}
test('preferences migrate and reject malformed levels without changing earned progress', () => {
  assert.deepEqual(readPreferences(null), defaultPreferences());
  const p = readPreferences({
    motion: 'reduced',
    contrast: 'high',
    textSize: 'large',
    calm: true,
    speechVolume: Infinity,
    environmentVolume: -3,
    camera: 'nonsense',
  });
  assert.equal(p.speechVolume, 1);
  assert.equal(p.environmentVolume, 0);
  assert.equal(p.camera, 'gentle');
  assert.equal(p.motion, 'reduced');
  const save = freshProgress();
  save.adventure.earned = 12;
  save.adventure.wallet = 7;
  save.preferences = p;
  const restored = readProgress(JSON.stringify(save));
  assert.deepEqual(restored.preferences, p);
  assert.equal(restored.adventure.wallet, 7);
});
test('automatic recovery retains three distinct valid copies and ignores broken primary/backup entries', () => {
  const storage = memory();
  const p = freshProgress();
  saveRecoverably(storage, p);
  for (let i = 1; i <= 5; i++) {
    p.adventure.earned = i * 2;
    p.adventure.wallet = i * 2;
    saveRecoverably(storage, p, `2026-09-12T22:00:0${i}Z`);
  }
  assert.equal(readBackups(storage).length, 3);
  assert.equal(readBackups(storage)[0].progress.adventure.wallet, 8);
  storage.setItem(SAVE_KEY, '{broken');
  const recovered = loadRecoverableProgress(storage);
  assert.equal(recovered.recovered, true);
  assert.equal(recovered.progress.adventure.wallet, 8);
  const prior = storage.getItem(BACKUP_KEY);
  saveRecoverably(storage, recovered.progress);
  assert.equal(
    storage.getItem(BACKUP_KEY),
    prior,
    'Never rotate corruption into a backup',
  );
  assert.equal(loadRecoverableProgress(storage).recovered, false);
  const backups = JSON.parse(prior);
  backups.unshift({ savedAt: 'invalid', progress: {} });
  storage.setItem(BACKUP_KEY, JSON.stringify(backups));
  assert.equal(readBackups(storage)[0].progress.adventure.wallet, 8);
});
test('save quota failures do not overwrite the original adventure', () => {
  const storage = memory(),
    p = freshProgress();
  saveRecoverably(storage, p);
  const original = storage.getItem(SAVE_KEY);
  const full = {
    getItem: storage.getItem,
    setItem() {
      throw new Error('Quota exceeded');
    },
  };
  const next = { ...p, knownSounds: ['m'] };
  assert.throws(() => saveRecoverably(full, next));
  assert.equal(storage.getItem(SAVE_KEY), original);
});
test('save export round-trips; malformed imports are rejected before any write', () => {
  const p = freshProgress();
  p.tutorialComplete = true;
  p.adventure.earned = 6;
  p.adventure.wallet = 4;
  p.appearance.eyes = 'three';
  assert.deepEqual(parseSavedProgress(exportSave(p)), p);
  assert.deepEqual(
    parseSavedProgress(JSON.stringify(p)),
    p,
    'Original game save remains importable',
  );
  for (const file of [
    'null',
    '[]',
    '{}',
    '{"version":2}',
    'broken',
    'x'.repeat(1000001),
  ])
    assert.throws(() => parseSavedProgress(file));
});
test('camera avoids a blocked view gently and does not oscillate in open ground', () => {
  const obstacles = [{ x: 0, z: 7, r: 2 }];
  assert.equal(cameraObstructed(0, 0, 0, obstacles), true);
  const yaw = chooseCameraYaw(0, 0, 0, obstacles);
  assert.ok(Math.abs(yaw) > 0.4 && Math.abs(yaw) <= 0.9);
  assert.equal(cameraObstructed(0, 0, yaw, obstacles), false);
  assert.equal(chooseCameraYaw(0, 0, 0, []), 0);
  let current = yaw;
  for (let i = 0; i < 10; i++)
    current = chooseCameraYaw(0, 0, current, obstacles);
  assert.equal(current, yaw);
  assert.equal(
    cameraObstructed(0, 0, 0, [{ x: 0, z: -5, r: 2 }]),
    false,
    'Scenery behind the target cannot obstruct the camera',
  );
});
