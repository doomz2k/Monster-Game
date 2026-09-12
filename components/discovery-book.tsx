'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  Volume2,
} from 'lucide-react';
import { DISCOVERIES, discoveryFor } from '@/lib/discovery-catalogue';
import type { ProgressData } from '@/lib/learning';
import type { AudioDirector } from '@/lib/audio';
import { placeFor } from '@/lib/adventure';
import { GamePicture } from './game-picture';

export function DiscoveryBook({
  progress,
  audio,
  initialId,
  onFind,
  onClose,
  onExplore,
}: {
  progress: ProgressData;
  audio: AudioDirector;
  initialId: string | null;
  onFind: (id: string) => void;
  onClose: () => void;
  onExplore: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(initialId);
  const [page, setPage] = useState(
    initialId
      ? Math.floor(DISCOVERIES.findIndex((d) => d.id === initialId) / 6)
      : 0,
  );
  const root = useRef<HTMLElement>(null);
  const entry = selected ? discoveryFor(selected) : undefined;
  const found = !!entry && progress.adventure.discoveries.includes(entry.id);
  const repeat = () =>
    void audio.line(
      entry ? 'discovery-' + (found ? '' : 'clue-') + entry.id : 'scrapbook',
    );
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      root.current
        ?.querySelector<HTMLElement>('[data-game-choice]:not(:disabled)')
        ?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [selected, page]);
  const back = () => (selected ? setSelected(null) : onClose());
  return (
    <section
      ref={root}
      className="discovery-book"
      aria-label="My discovery scrapbook"
    >
      <header className="book-heading">
        <button onClick={back} data-book-back className="book-back">
          <b className="pad-key b-key">B</b>
          <ArrowLeft /> Back
        </button>
        <h1>
          <BookOpen /> My little discoveries
        </h1>
        <button onClick={repeat} data-repeat-prompt aria-label="Hear this page">
          <b className="pad-key y-key">Y</b>
          <Volume2 />
        </button>
      </header>
      {entry ? (
        <article
          className={'discovery-spread ' + (found ? 'found' : 'unfound')}
        >
          <div
            className="discovery-art"
            style={
              { '--discovery-colour': entry.colour } as React.CSSProperties
            }
          >
            <GamePicture symbol={entry.picture} label={entry.name} />
            <span className="book-stamp">
              {found ? <Check /> : <Compass />}
            </span>
          </div>
          <div className="discovery-story">
            <p className="game-eyebrow">
              {found ? 'A MEMORY TO KEEP' : 'A LITTLE ADVENTURE'}
            </p>
            <h2>{entry.name}</h2>
            <p>{found ? entry.note : entry.clue}</p>
            {found ? (
              <button
                data-game-choice
                className="adventure-primary"
                onClick={onExplore}
              >
                <b className="pad-key a-key">A</b> Explore again
              </button>
            ) : (
              <button
                data-game-choice
                className="adventure-primary"
                onClick={() => onFind(entry.id)}
              >
                <b className="pad-key a-key">A</b>
                <Compass /> Let’s look
              </button>
            )}
            <button
              data-game-choice
              className="book-secondary"
              onClick={() => setSelected(null)}
            >
              <BookOpen /> Our pictures
            </button>
            {!found && (
              <small>
                {placeFor(entry.friend).friend} can show us the way.
              </small>
            )}
          </div>
        </article>
      ) : (
        <>
          <div className="book-progress">
            <span>
              {progress.adventure.discoveries.length} / {DISCOVERIES.length}{' '}
              little memories
            </span>
            <span>Choose a picture</span>
          </div>
          <div className="discovery-grid">
            {DISCOVERIES.slice(page * 6, page * 6 + 6).map((d) => {
              const collected = progress.adventure.discoveries.includes(d.id);
              return (
                <button
                  key={d.id}
                  data-game-choice
                  className={'discovery-card ' + (collected ? 'collected' : '')}
                  aria-label={
                    d.name + (collected ? ', found' : ', find a clue')
                  }
                  onClick={() => {
                    setSelected(d.id);
                    void audio.line(
                      'discovery-' + (collected ? '' : 'clue-') + d.id,
                    );
                  }}
                >
                  <GamePicture symbol={d.picture} />
                  <strong>{d.name}</strong>
                  <span className="discovery-card-mark">
                    {collected ? <Check /> : <Compass />}
                  </span>
                </button>
              );
            })}
          </div>
          <nav className="book-pages" aria-label="Scrapbook pages">
            <button
              data-game-choice
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              aria-label="Previous pictures"
            >
              <ArrowLeft />
            </button>
            <span>
              {page + 1} / {Math.ceil(DISCOVERIES.length / 6)}
            </span>
            <button
              data-game-choice
              disabled={(page + 1) * 6 >= DISCOVERIES.length}
              onClick={() => setPage(page + 1)}
              aria-label="More pictures"
            >
              <ArrowRight />
            </button>
          </nav>
        </>
      )}
    </section>
  );
}
