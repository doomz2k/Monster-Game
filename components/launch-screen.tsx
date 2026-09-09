'use client';
import {
  ArrowRight,
  Gamepad2,
  Settings,
  Shirt,
  Sparkles,
  Star,
} from 'lucide-react';
import { COSMETICS } from '@/lib/wardrobe';
export function LaunchScreen({
  stars,
  ready,
  connected,
  selection,
  onSelection,
  onPlay,
  onDress,
  onParents,
}: {
  stars: number;
  ready: boolean;
  connected: boolean;
  selection: number;
  onSelection: (n: number) => void;
  onPlay: () => void;
  onDress: () => void;
  onParents: () => void;
}) {
  const next = [...COSMETICS]
    .filter((item) => item.stars > stars)
    .sort((a, b) => a.stars - b.stars)[0];
  return (
    <section className="launch-screen" aria-labelledby="launch-title">
      <div className="launch-stars">
        <Star size={20} fill="currentColor" /> {stars}{' '}
        <span>happy discoveries</span>
      </div>
      <div className="launch-copy">
        <div className="launch-eyebrow">
          <Sparkles size={20} /> CLO’S LITTLE WORLD
        </div>
        <h2 id="launch-title" className="launch-title">
          Monster
          <span>
            Game<span className="title-sparkle">✦</span>
          </span>
        </h2>
        <p className="launch-intro">
          A little friend.
          <br />A big world to discover.
        </p>
        <div className="launch-actions">
          <button
            className={'launch-play ' + (selection === 0 ? 'selected' : '')}
            disabled={!ready}
            onFocus={() => onSelection(0)}
            onClick={onPlay}
          >
            <span className="pad-key a-key">A</span>
            {ready
              ? stars
                ? 'Continue adventure'
                : 'Let’s play'
              : 'Growing your world…'}
            <ArrowRight size={24} />
          </button>
          <button
            className={'launch-dress ' + (selection === 1 ? 'selected' : '')}
            disabled={!ready}
            onFocus={() => onSelection(1)}
            onClick={onDress}
          >
            <Shirt size={24} />
            <span>
              Dress up Clo<small>Hats, little treasures & you</small>
            </span>
            <ArrowRight size={20} />
          </button>
          <button
            className={'launch-parents ' + (selection === 2 ? 'selected' : '')}
            onFocus={() => onSelection(2)}
            onClick={onParents}
          >
            <Settings size={17} /> For grown-ups
          </button>
        </div>
        <div className="launch-connection">
          <Gamepad2 size={20} />
          {connected
            ? 'Controller ready · choose with ↑ ↓ and A'
            : 'Xbox controller, keyboard or touch'}
          <small>Click once to enable sound.</small>
        </div>
      </div>
      <div className="launch-stage-note">
        <span className="eyebrow">MEET YOUR ADVENTURE BUDDY</span>
        <strong>Hello, I’m Clo!</strong>
        <p>
          {next ? (
            <>
              {next.icon} A new dress-up surprise in {next.stars - stars}{' '}
              {next.stars - stars === 1 ? 'star' : 'stars'}.
            </>
          ) : (
            'A whole dress-up box of happy discoveries.'
          )}
        </p>
      </div>
      <span className="launch-bottom-note">
        No rush. Just play, learn & grow.
      </span>
    </section>
  );
}
