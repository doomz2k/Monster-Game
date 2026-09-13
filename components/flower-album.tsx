'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, LockKeyhole, Sprout, Volume2, ArrowRight } from 'lucide-react';
import {
  FLOWERS,
  flowerFor,
  flowerAvailable,
  takeFlowerSeed,
} from '@/lib/flowers';
import type { ProgressData } from '@/lib/learning';
import type { AudioDirector } from '@/lib/audio';
import { FlowerPicture } from './flower-picture';
import { GardenPreview } from './garden-preview';
import type { Plant } from '@/lib/adventure';
const EMPTY_PLOTS: Plant[] = [];

export function FlowerAlbum({
  progress: p,
  audio,
  initial,
  onSeed,
  onShop,
  onBack,
}: {
  progress: ProgressData;
  audio: AudioDirector;
  initial: string;
  onSeed: (next: ProgressData, id: string) => void;
  onShop: () => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState(flowerFor(initial)?.id ?? 'daisy');
  const [inspection, setInspection] = useState(0);
  const root = useRef<HTMLDivElement>(null),
    line = useRef('flowers-intro');
  const flower = flowerFor(selected)!,
    grown = p.adventure.flowers.includes(selected),
    special = flower.needs.length > 0,
    available = flowerAvailable(p, selected),
    hasSeed = (p.adventure.seeds[selected] ?? 0) > 0;
  const say = (id: string) => {
    line.current = id;
    void audio.line(id);
  };
  useEffect(() => {
    void audio.line('flowers-intro');
    root.current
      ?.querySelector<HTMLButtonElement>('[data-flower-selected]')
      ?.focus({ preventScroll: true });
  }, [audio]);
  useEffect(() => {
    if (inspection)
      root.current
        ?.querySelector<HTMLButtonElement>(
          '[data-flower-action]:not(:disabled)',
        )
        ?.focus({ preventScroll: true });
  }, [inspection]);
  return (
    <div className="flower-album" ref={root}>
      <div className="flower-album-heading">
        <button data-game-choice data-reject onClick={onBack}>
          <b className="pad-key b-key">B</b>My garden
        </button>
        <h2>
          My flower book{' '}
          <span>
            {p.adventure.flowers.length} / {FLOWERS.length}
          </span>
        </h2>
        <button
          data-repeat-prompt
          className="round-control"
          aria-label="Hear about this flower"
          onClick={() => say(line.current)}
        >
          <b className="pad-key y-key">Y</b>
          <Volume2 />
        </button>
      </div>
      <div className="flower-album-workspace">
        <div className="flower-album-preview">
          <GardenPreview plots={EMPTY_PLOTS} spotlight={selected} />
          <strong>{flower.name}</strong>
          <span>
            {grown
              ? 'Grown by you'
              : special
                ? 'A special seed from Tilly'
                : 'Grow this flower for your book'}
          </span>
        </div>
        <div className="flower-album-choices">
          <div className="flower-catalogue">
            {FLOWERS.map((f) => (
              <button
                key={f.id}
                data-game-choice
                data-flower-selected={selected === f.id || undefined}
                aria-pressed={selected === f.id}
                aria-label={
                  f.name +
                  (p.adventure.flowers.includes(f.id)
                    ? ', grown'
                    : f.needs.length && !flowerAvailable(p, f.id)
                      ? ', grow the pictured pair first'
                      : '')
                }
                onFocus={() => setSelected(f.id)}
                onClick={() => {
                  setSelected(f.id);
                  setInspection((n) => n + 1);
                  say('flower-' + f.id);
                }}
              >
                <FlowerPicture id={f.id} />
                <strong>{f.name}</strong>
                {p.adventure.flowers.includes(f.id) ? (
                  <Check className="flower-stamp" />
                ) : f.needs.length && !flowerAvailable(p, f.id) ? (
                  <LockKeyhole className="flower-lock" />
                ) : null}
              </button>
            ))}
          </div>
          <div className="flower-seed-action">
            {special && (
              <div className="flower-pair">
                <span>Grow these two</span>
                {flower.needs.map((id) => (
                  <span
                    key={id}
                    aria-label={
                      id +
                      (p.adventure.flowers.includes(id)
                        ? ', grown'
                        : ', still to grow')
                    }
                  >
                    <FlowerPicture id={id} />
                    {p.adventure.flowers.includes(id) ? <Check /> : <Sprout />}
                  </span>
                ))}
                <ArrowRight />
                <FlowerPicture id={selected} />
              </div>
            )}
            <button
              data-game-choice
              className="adventure-primary"
              data-flower-action
              disabled={special && !available}
              onClick={() => {
                if (hasSeed) onSeed(p, selected);
                else if (special) {
                  const next = takeFlowerSeed(p, selected);
                  if (next !== p) onSeed(next, selected);
                } else onShop();
              }}
            >
              <b className="pad-key a-key">A</b>
              {hasSeed
                ? 'Plant this seed'
                : special
                  ? available
                    ? 'Take a free seed'
                    : 'Grow the flower pair'
                  : 'Seeds at Poppy’s'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
