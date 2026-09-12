'use client';
import { useEffect, useState } from 'react';
import type { AudioDirector, SoundReviews } from '@/lib/audio';
import { approvedPath } from '@/lib/audio';
import { SOUNDS } from '@/lib/phonics';
import clips from '@/lib/audio-data/voice-clips.json';
import audit from '@/lib/audio-data/audio-audit.json';
type ListeningReview = {
  status: 'pass' | 'replace';
  sha256: string;
  reviewer: string;
  checkedAt: string;
  notes: string;
};
const STORAGE = 'monster-game-voice-reviews-v1';
export function VoiceReview({
  audio,
  phonics,
  reviewer,
}: {
  audio: AudioDirector | null;
  phonics: SoundReviews;
  reviewer: string;
}) {
  const [selected, setSelected] = useState('welcome'),
    [records, setRecords] = useState<Record<string, ListeningReview>>({}),
    [notes, setNotes] = useState(''),
    [error, setError] = useState('');
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE) ?? '{}');
      const clean = Object.fromEntries(
        Object.entries(raw).filter(([id, value]) => {
          const v = value as ListeningReview;
          return (
            id in clips &&
            v &&
            ['pass', 'replace'].includes(v.status) &&
            typeof v.reviewer === 'string' &&
            typeof v.notes === 'string' &&
            typeof v.checkedAt === 'string' &&
            v.sha256 ===
              (audit.voices as Record<string, { sha256: string }>)[id]?.sha256
          );
        }),
      );
      /* oxlint-disable-next-line react/react-compiler -- Load a local adult review record. */
      setRecords(clean as Record<string, ListeningReview>);
    } catch {
      /* Missing or corrupt review records remain pending. */
    }
  }, []);
  const clip = (
    clips as Record<string, { text: string; voice: string; path: string }>
  )[selected];
  const stats = (
    audit.voices as Record<
      string,
      {
        sha256: string;
        seconds: number;
        peakDbfs: number;
        activeRmsDbfs: number;
        warnings: string[];
      }
    >
  )[selected];
  const save = (status: ListeningReview['status']) => {
    const next = {
      ...records,
      [selected]: {
        status,
        sha256: stats.sha256,
        reviewer: reviewer.trim(),
        checkedAt: new Date().toISOString(),
        notes,
      },
    };
    try {
      localStorage.setItem(STORAGE, JSON.stringify(next));
      setRecords(next);
      setError('');
    } catch {
      setError('The listening review could not be saved.');
    }
  };
  const exportReviews = async () => {
    const sounds = await Promise.all(
      SOUNDS.map(async (s) => {
        const r = phonics[s.grapheme];
        const digest = r?.data
          ? Array.from(
              new Uint8Array(
                await crypto.subtle.digest(
                  'SHA-256',
                  new TextEncoder().encode(r.data),
                ),
              ),
            )
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
          : (audit.phonemes as Record<string, { sha256: string }>)[s.grapheme]
              ?.sha256;
        return {
          grapheme: s.grapheme,
          ipa: s.ipa,
          approved: !!approvedPath(s.grapheme, phonics),
          reviewer: r?.reviewer,
          reviewerRole: r?.reviewerRole,
          checkedAt: r?.checkedAt,
          sha256: digest,
          hashOf: r?.data ? 'imported data URL' : 'bundled file bytes',
        };
      }),
    );
    const blob = new Blob(
      [
        JSON.stringify(
          {
            programme: 'Read Write Inc. Set 1',
            exportedAt: new Date().toISOString(),
            phonics: sounds,
            narration: Object.fromEntries(
              Object.entries(clips).map(([id, c]) => [
                id,
                {
                  text: c.text,
                  voice: c.voice,
                  review: records[id] ?? { status: 'pending' },
                },
              ]),
            ),
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob),
      link = document.createElement('a');
    link.href = url;
    link.download = 'monster-game-listening-review.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section className="voice-review">
      <h3>
        British character listening desk{' '}
        <span>
          {Object.values(records).filter((r) => r.status === 'pass').length} /{' '}
          {Object.keys(clips).length} passed
        </span>
      </h3>
      <p>
        Listen for a warm British accent, clear pronunciation, a comfortable
        pace and even volume. Technical audio checks passed for all{' '}
        {Object.keys(clips).length} narration files; they cannot assess these
        listening qualities.
      </p>
      <label htmlFor="voice-clip">
        Recording
        <select
          id="voice-clip"
          value={selected}
          onChange={(e) => {
            audio?.stop();
            setSelected(e.target.value);
            setNotes(records[e.target.value]?.notes ?? '');
          }}
        >
          {Object.entries(clips).map(([id, c]) => (
            <option key={id} value={id}>
              {c.voice} · {id} {records[id]?.status === 'pass' ? '✓' : ''}
            </option>
          ))}
        </select>
      </label>
      <blockquote>{clip.text}</blockquote>
      <p className="audio-origin">
        {clip.voice} · {stats.seconds}s · peak {stats.peakDbfs} dBFS · active
        RMS {stats.activeRmsDbfs} dBFS ·{' '}
        {records[selected]?.status ?? 'Awaiting listening review'}
      </p>
      <button
        className="secondary-button"
        onClick={() => void audio?.line(selected)}
      >
        Listen to this recording
      </button>
      <label htmlFor="voice-notes">
        Listening notes
        <textarea
          id="voice-notes"
          value={notes}
          maxLength={1200}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Pacing, pronunciation, warmth or replacement needed"
        />
      </label>
      <div className="review-actions">
        <button
          className="secondary-button"
          disabled={!reviewer.trim()}
          onClick={() => save('pass')}
        >
          I listened: passes all four checks
        </button>
        <button
          className="secondary-button"
          disabled={!reviewer.trim()}
          onClick={() => save('replace')}
        >
          Mark for replacement
        </button>
        <button
          className="secondary-button"
          onClick={() =>
            void exportReviews().catch(() =>
              setError('The review export could not be created.'),
            )
          }
        >
          Export review record
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
