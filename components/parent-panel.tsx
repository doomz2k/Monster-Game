'use client';
import { useState } from 'react';
import { Check, ExternalLink, Upload, Volume2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SOUNDS,
  SOUND_GROUPS,
  PHONICS_SOURCE,
  PRONUNCIATION_SOURCE,
} from '@/lib/phonics';
import {
  candidatePath,
  importRecording,
  saveReviews,
  type SoundReviews,
  type AudioDirector,
} from '@/lib/audio';
import type { ProgressData } from '@/lib/learning';
export function ParentPanel({
  progress,
  onProgress,
  reviews,
  onReviews,
  audio,
}: {
  progress: ProgressData;
  onProgress: (p: ProgressData) => void;
  reviews: SoundReviews;
  onReviews: (r: SoundReviews) => void;
  audio: AudioDirector | null;
}) {
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('m');
  const s = SOUNDS.find((s) => s.grapheme === selected)!;
  const update = (next: SoundReviews) => {
    try {
      saveReviews(next);
      onReviews(next);
      setError('');
    } catch {
      setError(
        'This browser could not save the sound. Try a smaller recording, or make space in browser storage.',
      );
    }
  };
  const load = async (file: File) => {
    try {
      const data = await importRecording(file);
      update({ ...reviews, [selected]: { data, approved: false } });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not import the recording.',
      );
    }
  };
  const path = candidatePath(selected, reviews),
    checked = SOUNDS.filter(
      (s) =>
        reviews[s.grapheme]?.approved && candidatePath(s.grapheme, reviews),
    ).length;
  return (
    <div className="parent-panel" data-parent-controls>
      <p className="parent-intro">
        A gentle practice companion for Clover. Progress and sound checks stay
        in this browser.
      </p>
      <div className="parent-settings">
        <label htmlFor="sound-limit">
          Sounds to practise
          <Select
            value={String(progress.soundLimit)}
            onValueChange={(v) => {
              if (v) onProgress({ ...progress, soundLimit: Number(v) });
            }}
          >
            <SelectTrigger id="sound-limit" className="setting-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOUND_GROUPS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n === 5
                    ? 'First five: m a s d t'
                    : n === 32
                      ? 'All Set 1 correspondences'
                      : 'First ' + n + ' sounds'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label htmlFor="maths-range">
          Maths range
          <Select
            value={String(progress.mathsMax)}
            onValueChange={(v) => {
              if (v) onProgress({ ...progress, mathsMax: Number(v) as 5 | 10 });
            }}
          >
            <SelectTrigger id="maths-range" className="setting-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Numbers up to 5</SelectItem>
              <SelectItem value="10">Numbers up to 10</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>
      <h3>
        Sound studio{' '}
        <span>
          {checked} / {SOUNDS.length} checked
        </span>
      </h3>
      <p>
        Use the official pronunciation guide to compare each clip. Check the
        sound is British English, uses the sound rather than the letter name,
        and adds no “uh”. Imported clips also need a check.
      </p>
      <p className="source-links">
        <a href={PRONUNCIATION_SOURCE} target="_blank" rel="noreferrer">
          Ruth Miskin pronunciation films <ExternalLink size={14} />
        </a>
        <a href={PHONICS_SOURCE} target="_blank" rel="noreferrer">
          Oxford Owl Set 1 guide <ExternalLink size={14} />
        </a>
      </p>
      <fieldset className="sound-grid" aria-label="Select a sound to review">
        {SOUNDS.map((sound) => (
          <button
            key={sound.grapheme}
            className={
              'sound-chip ' + (sound.grapheme === selected ? 'selected' : '')
            }
            onClick={() => {
              audio?.stop();
              setSelected(sound.grapheme);
              setError('');
            }}
            aria-pressed={sound.grapheme === selected}
          >
            {sound.grapheme}
            {reviews[sound.grapheme]?.approved && <Check size={11} />}
          </button>
        ))}
      </fieldset>
      <div className="sound-review">
        <div className="sound-review-heading">
          <span className="grapheme-display">{selected}</span>
          <div>
            <strong>
              /{s.ipa}/ · as in {s.example}
            </strong>
            <p>{s.tip}</p>
          </div>
        </div>
        <div className="review-actions">
          <button
            className="secondary-button"
            disabled={!path}
            onClick={() => {
              if (path) void audio?.run([{ type: 'clip', url: path }]);
            }}
          >
            <Volume2 size={18} />
            Preview candidate
          </button>
          <label className="upload-button">
            <Upload size={18} />
            Add recording
            <input
              type="file"
              accept="audio/*,.ogg,.wav,.mp3,.m4a,.webm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void load(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        <p className="audio-origin">
          {reviews[selected]?.data
            ? 'Your recording.'
            : path
              ? 'Unverified candidate from your clover-games sound lab.'
              : 'No recording yet. Add one, or say this sound together.'}{' '}
          Previewing does not enable a recording.
        </p>
        <label className="review-checkbox" htmlFor="approve-recording">
          <Checkbox
            id="approve-recording"
            checked={Boolean(reviews[selected]?.approved)}
            disabled={!path}
            onCheckedChange={(approved) =>
              update({
                ...reviews,
                [selected]: {
                  ...reviews[selected],
                  approved,
                  checkedAt: approved ? new Date().toISOString() : undefined,
                },
              })
            }
          />
          <span>I checked this clip against the guide. Use it in play.</span>
        </label>
      </div>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      <div className="parent-note">
        <strong>About the phonics</strong>
        <p>
          We use the published Read Write Inc. Set 1 sequence, lowercase
          letters, and words built only from introduced sounds. A sound is shown
          and practised before recognition. Progress in the game is practice,
          not a reading assessment.
        </p>
        <p>
          Read Write Inc. is a programme from Ruth Miskin and Oxford University
          Press. This independent game is not endorsed or certified by them. The
          supplied candidate recordings have not been teacher-verified. Ordinary
          text-to-speech is used only for instructions and whole words, never as
          a fallback for isolated sounds.
        </p>
      </div>
    </div>
  );
}
