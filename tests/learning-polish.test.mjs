import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { quantityHint, firstMismatch } from '../lib/learning-hints.ts';
import { tutorialAction } from '../lib/tutorial.ts';
import { environmentalMix } from '../lib/soundscape.ts';
import { placeFor, missionFor } from '../lib/adventure.ts';
import { freshProgress, readProgress } from '../lib/learning.ts';
import audit from '../lib/audio-data/audio-audit.json';
import voices from '../lib/audio-data/voice-clips.json';
import phonemes from '../lib/audio-data/phonemes.json';
test('number hints identify only missing and extra slots including zero and maximum quantities', () => {
  for (let target = 0; target <= 10; target++)
    for (let chosen = 0; chosen <= 10; chosen++) {
      const h = quantityHint(chosen, target);
      assert.equal(
        h.slots.filter((x) => x === 'matched').length,
        Math.min(chosen, target),
      );
      assert.equal(
        h.slots.filter((x) => x === 'missing').length,
        Math.max(0, target - chosen),
      );
      assert.equal(
        h.slots.filter((x) => x === 'extra').length,
        Math.max(0, chosen - target),
      );
      assert.equal(h.difference, Math.abs(target - chosen));
    }
  assert.equal(firstMismatch(['m', 't', 't'], ['m', 'a', 't']), 1);
  assert.equal(firstMismatch(['sh', 'i', 'p'], ['sh', 'i', 'p']), -1);
});
test('controller lesson requires actual movement and the correct action at each stage; completion survives save', () => {
  assert.equal(tutorialAction(0, 'confirm', 0), 1);
  assert.equal(
    tutorialAction(1, 'right', 0),
    1,
    'Renderer movement, not a key, completes the walk',
  );
  assert.equal(tutorialAction(2, 'confirm', 0), 2);
  assert.equal(tutorialAction(2, 'right', 0), 3);
  assert.equal(tutorialAction(3, 'confirm', 1), 4);
  assert.equal(tutorialAction(4, 'confirm', 1), 4);
  assert.equal(tutorialAction(4, 'back', 1), 5);
  const p = freshProgress();
  assert.equal(p.tutorialComplete, false);
  p.tutorialComplete = true;
  assert.equal(readProgress(JSON.stringify(p)).tutorialComplete, true);
});
test('spatial foley is local, bounded, inactive when paused, and no shore/birds/oven on the Moon', () => {
  for (const key of ['cove', 'woods', 'meadow', 'rocket', 'moon']) {
    const p = placeFor(key);
    const scene = {
      active: true,
      region: 'island',
      x: p.x,
      z: p.z,
      moving: false,
    };
    const m = environmentalMix(scene);
    for (const v of Object.values(m)) {
      assert.ok(v.gain >= 0 && v.gain <= 1);
      assert.ok(Math.abs(v.pan) <= 0.85);
    }
    for (const v of Object.values(
      environmentalMix({ ...scene, active: false }),
    ))
      assert.equal(v.gain, 0);
    const moon = environmentalMix({ ...scene, region: 'moon' });
    for (const k of ['shore', 'birds', 'oven']) assert.equal(moon[k].gain, 0);
  }
  const p = placeFor('cove');
  assert.equal(
    environmentalMix({
      active: true,
      region: 'island',
      x: p.x,
      z: p.z,
      moving: false,
    }).shore.gain,
    1,
  );
});
test('every audited fingerprint matches the actual recording; all narration decodes cleanly', () => {
  for (const [kind, manifest] of [
    ['voices', voices],
    ['phonemes', phonemes],
  ])
    for (const [id, c] of Object.entries(manifest)) {
      assert.equal(
        audit[kind][id].sha256,
        createHash('sha256')
          .update(readFileSync(new URL('../public' + c.path, import.meta.url)))
          .digest('hex'),
        id,
      );
      assert.ok(audit[kind][id].seconds > 0.05);
      if (kind === 'voices') assert.ok(audit[kind][id].peakDbfs < 0, id);
      if (kind === 'voices') assert.deepEqual(audit[kind][id].warnings, [], id);
    }
});
test('all generated activity kinds have a recorded British demonstration', () => {
  const p = freshProgress();
  p.knownSounds = ['m', 'a', 's', 'd', 't'];
  for (const npc of ['meadow', 'woods', 'garden', 'cove', 'rocket', 'moon'])
    for (let r = 0; r < 144; r++) {
      p.adventure.rounds[npc] = r;
      const m = missionFor(npc, p);
      assert.ok(voices[`demo-${m.voice}-${m.kind}`], `${m.voice} ${m.kind}`);
    }
});
