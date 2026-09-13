'use client';
import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Sprout,
  Undo2,
} from 'lucide-react';
import type { ProgressData } from '@/lib/learning';
import type { AudioDirector } from '@/lib/audio';
import { SHOP_ITEMS, plantSeed, waterPlant, clearPlot } from '@/lib/adventure';
import { harvestPlant, PRODUCE, gardenVisitors } from '@/lib/garden';
import { SPECIAL_FLOWERS, flowerFor } from '@/lib/flowers';
import { GardenPreview } from './garden-preview';
import { FlowerAlbum } from './flower-album';
import { FlowerPicture } from './flower-picture';
import { GamePicture } from './game-picture';

const SEED_CHOICES = [
  ...SHOP_ITEMS.filter((i) => i.kind === 'seed'),
  ...SPECIAL_FLOWERS,
];
export function GardenPanel({
  progress: p,
  onChange,
  audio,
  onShop,
}: {
  progress: ProgressData;
  onChange: (p: ProgressData) => void;
  audio: AudioDirector;
  onShop: () => void;
}) {
  const [seed, setSeed] = useState('daisy'),
    [page, setPage] = useState(0),
    [clearing, setClearing] = useState(false),
    [pending, setPending] = useState<number | null>(null),
    [album, setAlbum] = useState<string | null>(null),
    [message, setMessage] = useState('');
  const line = useRef('garden');
  const root = useRef<HTMLDivElement>(null),
    returnFocus = useRef<'empty' | 'book' | null>(null),
    pageFocus = useRef(false),
    clearReturn = useRef(-1);
  useEffect(() => {
    if (!pageFocus.current) return;
    root.current
      ?.querySelector<HTMLButtonElement>('[data-selected-seed]')
      ?.focus({ preventScroll: true });
    pageFocus.current = false;
  }, [page]);
  useEffect(() => {
    if (pending !== null)
      root.current
        ?.querySelector<HTMLButtonElement>(
          '[data-choice-scope] [data-game-choice]',
        )
        ?.focus({ preventScroll: true });
    else if (clearReturn.current !== -1) {
      root.current
        ?.querySelector<HTMLButtonElement>(
          '[data-garden-slot="' + clearReturn.current + '"]',
        )
        ?.focus({ preventScroll: true });
      clearReturn.current = -1;
    }
  }, [pending]);
  useEffect(() => {
    if (album !== null || !returnFocus.current) return;
    const selector =
      returnFocus.current === 'empty'
        ? '[data-garden-empty]'
        : '.garden-book-open';
    (
      root.current?.querySelector<HTMLButtonElement>(selector) ??
      root.current?.querySelector<HTMLButtonElement>('[data-selected-seed]')
    )?.focus({ preventScroll: true });
    returnFocus.current = null;
  }, [album]);
  const owned = SEED_CHOICES.filter((s) => (p.adventure.seeds[s.id] ?? 0) > 0),
    selected = owned.find((s) => s.id === seed) ?? owned[0],
    pages = Math.ceil(owned.length / 4),
    currentPage = Math.min(page, Math.max(0, pages - 1)),
    visible = owned.slice(currentPage * 4, currentPage * 4 + 4);
  const say = (id: string) => {
    line.current = id;
    void audio.line(id);
  };
  const update = (next: ProgressData, text: string, id: string) => {
    if (next !== p) {
      onChange(next);
      setMessage(text);
      say(id);
    }
  };
  if (album !== null)
    return (
      <FlowerAlbum
        progress={p}
        audio={audio}
        initial={album}
        onShop={onShop}
        onBack={() => {
          returnFocus.current = 'book';
          setAlbum(null);
          say('garden');
        }}
        onSeed={(next, id) => {
          returnFocus.current = 'empty';
          if (next !== p) onChange(next);
          setSeed(id);
          setPage(
            Math.floor(
              SEED_CHOICES.filter(
                (s) => (next.adventure.seeds[s.id] ?? 0) > 0,
              ).findIndex((s) => s.id === id) / 4,
            ),
          );
          setClearing(false);
          setAlbum(null);
          const full = next.adventure.plots.every(Boolean);
          setMessage(
            full
              ? 'Your seed is ready. Make space when you want to plant it.'
              : 'Choose an empty patch',
          );
          say(full ? 'flower-garden-full' : 'flower-seed-ready');
        }}
      />
    );
  return (
    <div className="garden-play-panel" ref={root}>
      <button
        hidden
        data-repeat-prompt
        onClick={() => void audio.line(line.current)}
      >
        Listen again
      </button>
      <div className="garden-workspace">
        <aside className="garden-view">
          <GardenPreview plots={p.adventure.plots} />
          <div className="garden-visitors">
            {Object.entries(gardenVisitors(p.adventure.plots))
              .filter(([, visible]) => visible)
              .map(([id]) => (
                <span key={id}>
                  {id === 'bee' ? '🐝' : id === 'bird' ? '🐦' : '🦋'}
                </span>
              ))}
          </div>
          <button
            data-game-choice
            className="garden-book-open"
            onClick={() => setAlbum('daisy')}
          >
            <BookOpen />
            <strong>My flower book</strong>
            <span>{p.adventure.flowers.length} / 10</span>
          </button>
          <div className="garden-pantry">
            <strong>For Bramble</strong>
            {PRODUCE.map((id) => (
              <span key={id}>
                <GamePicture symbol={id === 'tomato' ? '🍅' : '🫑'} />
                {p.adventure.pantry[id]}
              </span>
            ))}
          </div>
        </aside>
        <div className="garden-controls">
          <div className="garden-tools">
            <button
              data-game-choice
              aria-pressed={!clearing}
              onClick={() => {
                setClearing(false);
                say('garden');
              }}
            >
              <Sprout />
              Grow
            </button>
            <button
              data-game-choice
              aria-pressed={clearing}
              onClick={() => setClearing(true)}
            >
              <Undo2 />
              Make space
            </button>
            <button data-game-choice onClick={onShop}>
              🐰 Seeds
            </button>
          </div>
          <div className="garden-seed-picker">
            <div className="garden-seed-label">
              <strong>{selected?.name ?? 'Choose seeds at Poppy’s'}</strong>
              {pages > 1 && (
                <span>
                  {currentPage + 1} / {pages}
                </span>
              )}
            </div>
            <div className="garden-seed-row">
              {pages > 1 && (
                <button
                  data-game-choice
                  className="seed-page"
                  disabled={currentPage === 0}
                  aria-label="Previous seeds"
                  onClick={() => {
                    pageFocus.current = true;
                    setPage(currentPage - 1);
                    setSeed(owned[(currentPage - 1) * 4].id);
                  }}
                >
                  <ChevronLeft />
                </button>
              )}
              <div className="garden-seed-tray">
                {visible.map((s) => (
                  <button
                    key={s.id}
                    data-game-choice
                    aria-pressed={selected?.id === s.id}
                    data-selected-seed={selected?.id === s.id || undefined}
                    aria-label={
                      s.name +
                      ', ' +
                      p.adventure.seeds[s.id] +
                      (p.adventure.seeds[s.id] === 1 ? ' seed' : ' seeds')
                    }
                    onClick={() => {
                      setSeed(s.id);
                      setClearing(false);
                    }}
                  >
                    {flowerFor(s.id) ? (
                      <FlowerPicture id={s.id} />
                    ) : (
                      <GamePicture symbol={'icon' in s ? s.icon : '🌱'} />
                    )}
                    <small>{p.adventure.seeds[s.id]}</small>
                  </button>
                ))}
              </div>
              {pages > 1 && (
                <button
                  data-game-choice
                  className="seed-page"
                  disabled={currentPage === pages - 1}
                  aria-label="More seeds"
                  onClick={() => {
                    pageFocus.current = true;
                    setPage(currentPage + 1);
                    setSeed(owned[(currentPage + 1) * 4].id);
                  }}
                >
                  <ChevronRight />
                </button>
              )}
            </div>
          </div>
          <div className="garden-plots">
            {p.adventure.plots.map((plant, i) => {
              const s = plant
                  ? SEED_CHOICES.find((s) => s.id === plant.seed)
                  : null,
                flower = plant ? flowerFor(plant.seed) : null;
              return (
                <button
                  key={i}
                  data-game-choice
                  data-garden-empty={!plant || undefined}
                  data-garden-slot={i}
                  className={
                    'garden-plot ' + (plant?.water === 3 ? 'blooming' : '')
                  }
                  aria-label={
                    'Garden patch ' +
                    (i + 1) +
                    (plant
                      ? ', ' + s?.name + ', watered ' + plant.water + ' times'
                      : ', empty')
                  }
                  onClick={() => {
                    if (clearing && plant) {
                      clearReturn.current = i;
                      setPending(i);
                      return;
                    }
                    if (plant?.water === 3) {
                      if (
                        PRODUCE.includes(plant.seed as (typeof PRODUCE)[number])
                      ) {
                        const next = harvestPlant(p, i);
                        if (next !== p)
                          update(
                            next,
                            'A basket for Bramble!',
                            'garden-harvest',
                          );
                        else {
                          setMessage(
                            'Your baskets are full. Let’s visit Bramble.',
                          );
                          say('garden-full');
                        }
                      } else if (flower) setAlbum(plant.seed);
                      else {
                        setMessage('Lovely plants for our little visitors');
                        say('garden-visitors');
                      }
                    } else if (plant) {
                      const next = waterPlant(p, i),
                        first =
                          next.adventure.flowers.length >
                          p.adventure.flowers.length;
                      update(
                        next,
                        first
                          ? 'A new flower for your book! ⭐ +1'
                          : plant.water === 2
                            ? 'You grew it!'
                            : 'A little drink',
                        first
                          ? 'flower-grown'
                          : plant.water === 2
                            ? 'grown'
                            : 'watered',
                      );
                    } else if (!clearing && selected)
                      update(
                        plantSeed(p, i, selected.id),
                        'A seed is planted',
                        'planted',
                      );
                    else if (!clearing) {
                      setMessage('Let’s choose some seeds');
                      onShop();
                    }
                  }}
                >
                  <span className="garden-patch-number">{i + 1}</span>
                  {plant?.water === 3 ? (
                    flower ? (
                      <FlowerPicture id={plant.seed} />
                    ) : (
                      <GamePicture symbol={s && 'icon' in s ? s.icon : '🌿'} />
                    )
                  ) : plant ? (
                    <span className="garden-sprout">
                      {plant.water ? '🌿' : '🌱'}
                    </span>
                  ) : (
                    <Sprout className="empty-patch-picture" />
                  )}
                  <small>
                    {plant?.water === 3 ? (
                      PRODUCE.includes(
                        plant.seed as (typeof PRODUCE)[number],
                      ) ? (
                        'Pick a basket'
                      ) : (
                        (flower?.name ?? s?.name.replace(' seeds', ''))
                      )
                    ) : plant ? (
                      <span className="plant-drinks">
                        {[0, 1, 2].map((n) => (
                          <Droplets
                            key={n}
                            className={n < plant.water ? 'watered' : ''}
                          />
                        ))}
                      </span>
                    ) : clearing ? (
                      'Empty patch'
                    ) : selected ? (
                      'Plant here'
                    ) : (
                      'Choose seeds'
                    )}
                  </small>
                </button>
              );
            })}
          </div>
          {pending !== null && (
            <div className="clear-confirm" data-choice-scope>
              <p>Make this patch empty?</p>
              <button
                data-game-choice
                onClick={() => {
                  update(
                    clearPlot(p, pending),
                    'Ready for a new seed',
                    'put-away',
                  );
                  setPending(null);
                }}
              >
                <b className="pad-key a-key">A</b>Yes
              </button>
              <button data-reject onClick={() => setPending(null)}>
                <b className="pad-key b-key">B</b>Keep it
              </button>
            </div>
          )}
        </div>
      </div>
      <output aria-live="polite" className="home-feedback">
        {message}
      </output>
    </div>
  );
}
