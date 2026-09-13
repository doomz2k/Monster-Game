'use client';
import { useEffect, useRef, useState } from 'react';
import { VoiceReview } from './voice-review';
import audit from '@/lib/audio-data/audio-audit.json';
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
  BLENDING_WORDS,
  SOUND_GROUPS,
  PHONICS_SOURCE,
  PRONUNCIATION_SOURCE,
} from '@/lib/phonics';
import {
  candidatePath,
  approvedPath,
  reviewSource,
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
  const [reviewer, setReviewer] = useState(''),
    [reviewerRole, setReviewerRole] = useState<
      'parent' | 'uk-phonics-specialist'
    >('parent');
  const currentReviews = useRef(reviews);
  useEffect(() => {
    currentReviews.current = reviews;
  }, [reviews]);
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
    const grapheme = selected;
    try {
      const data = await importRecording(file);
      update({
        ...currentReviews.current,
        [grapheme]: { data, approved: false },
      });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not import the recording.',
      );
    }
  };
  const path = candidatePath(selected, reviews),
    checked = SOUNDS.filter((s) => approvedPath(s.grapheme, reviews)).length;
  const technicalIssue =
    !reviews[selected]?.data &&
    (audit.phonemes as Record<string, { warnings: string[] }>)[
      selected
    ]?.warnings.includes('near-clipping');
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
        <label htmlFor="activity-examples">
          Activity examples
          <select
            id="activity-examples"
            className="setting-select"
            value={progress.preferences.examples}
            onChange={(e) =>
              onProgress({
                ...progress,
                preferences: {
                  ...progress.preferences,
                  examples: e.target.value === 'always' ? 'always' : 'remember',
                },
              })
            }
          >
            <option value="remember">Remember familiar activities</option>
            <option value="always">Show before every question</option>
          </select>
        </label>
        <label htmlFor="maths-review">
          Maths review
          <select
            id="maths-review"
            className="setting-select"
            value={String(progress.preferences.reviewMaths)}
            onChange={(e) =>
              onProgress({
                ...progress,
                preferences: {
                  ...progress.preferences,
                  reviewMaths: e.target.value === 'true',
                },
              })
            }
          >
            <option value="true">Mix in a little review</option>
            <option value="false">Follow the varied question banks</option>
          </select>
        </label>
      </div>
      <p className="parent-intro">
        New activities and ones that needed another try keep their examples. Y
        always shows an example. An addition or subtraction fact can return
        after other questions, within your chosen number range. Changes apply to
        the next activity.
      </p>
      <div className="reviewer-details">
        <label htmlFor="reviewer-name">
          Reviewer name
          <input
            id="reviewer-name"
            value={reviewer}
            maxLength={120}
            onChange={(e) => setReviewer(e.target.value)}
            autoComplete="name"
          />
        </label>
        <label htmlFor="reviewer-role">
          Review role
          <select
            id="reviewer-role"
            value={reviewerRole}
            onChange={(e) =>
              setReviewerRole(e.target.value as typeof reviewerRole)
            }
          >
            <option value="parent">Parent: local approval</option>
            <option value="uk-phonics-specialist">UK phonics specialist</option>
          </select>
        </label>
      </div>
      <h3>
        Sound studio{' '}
        <span>
          {checked} / {SOUNDS.length} checked
        </span>
      </h3>
      <p>
        Clover’s school uses Read Write Inc. Use the official pronunciation
        guide to compare each clip, then check it in a blend below. Check the
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
            {approvedPath(sound.grapheme, reviews) && <Check size={11} />}
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
          {technicalIssue &&
            ' This candidate exceeds the peak limit. Add a replacement before approving it.'}
        </p>
        <div className="blend-checks">
          <strong>Check in a word</strong>
          <p>
            Adult audition only: compare each pure sound and the joined word
            with the official guidance. These previews do not approve any audio.
          </p>
          {BLENDING_WORDS.filter((w) => w.parts.includes(selected))
            .slice(0, 4)
            .map((w) => (
              <button
                key={w.word}
                className="secondary-button"
                disabled={w.parts.some((g) => !candidatePath(g, reviews))}
                onClick={() =>
                  void audio?.run(
                    w.parts.map((g) => ({
                      type: 'clip' as const,
                      url: candidatePath(g, reviews)!,
                    })),
                  )
                }
              >
                {w.word} · {w.parts.join(' · ')}
              </button>
            ))}
        </div>
        <p className="audio-origin">
          {reviews[selected]?.checkedAt
            ? `Last recorded review: ${reviews[selected].reviewer ?? 'unnamed'} · ${reviews[selected].reviewerRole ?? 'parent'} · ${reviews[selected].checkedAt?.slice(0, 10)}`
            : 'Awaiting review. No specialist sign-off recorded.'}{' '}
          Old approvals without a recording fingerprint need a fresh check.
        </p>
        <label className="review-checkbox" htmlFor="approve-recording">
          <Checkbox
            id="approve-recording"
            checked={Boolean(approvedPath(selected, reviews))}
            disabled={!path || !reviewer.trim() || technicalIssue}
            onCheckedChange={(approved) =>
              update({
                ...reviews,
                [selected]: {
                  ...reviews[selected],
                  approved,
                  standard: approved ? 'rwi-set1-v2' : undefined,
                  approvedSource: approved
                    ? reviewSource(selected, reviews)
                    : undefined,
                  reviewer: reviewer.trim(),
                  reviewerRole,
                  checkedAt: approved ? new Date().toISOString() : undefined,
                },
              })
            }
          />
          <span>
            I listened and checked this is the correct British pure sound, with
            no letter name, added “uh”, or extra syllable. I also checked it in
            a blend where available. Approve this exact recording for play on
            this device.
          </span>
        </label>
      </div>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      <VoiceReview audio={audio} phonics={reviews} reviewer={reviewer} />
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
          Press. This independent game is not endorsed or certified by them.
          Parent approval is a local decision, not specialist certification. The
          supplied candidate recordings have not been teacher-verified.
          Instructions use recorded British Kokoro voices. Browser
          text-to-speech is disabled, and no synthetic fallback is allowed for
          isolated sounds.
        </p>
      </div>
    </div>
  );
}
