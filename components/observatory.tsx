'use client';
import { useEffect, useRef, useState } from 'react';
import { Telescope, Orbit, Ruler, Volume2, Check, Star } from 'lucide-react';
import {
  PLANETS,
  OBSERVATORY_VIEWS,
  planetFor,
  type PlanetId,
  type ObservatoryView,
} from '@/lib/observatory';
import type { AudioDirector } from '@/lib/audio';
import { PlanetPicture } from './planet-picture';
import { ObservatoryStage } from './observatory-stage';

const viewNames = {
  telescope: 'Look closer',
  orbits: 'Around the Sun',
  sizes: 'How big?',
};
const viewIcons = { telescope: Telescope, orbits: Orbit, sizes: Ruler };
export function Observatory({
  collection,
  active,
  audio,
  onObserve,
  onBack,
}: {
  collection: PlanetId[];
  active: boolean;
  audio: AudioDirector;
  onObserve: (id: PlanetId) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<PlanetId>('earth'),
    [view, setView] = useState<ObservatoryView>('telescope'),
    [inspected, setInspected] = useState<PlanetId | null>(null);
  const root = useRef<HTMLDivElement>(null),
    line = useRef('observatory-intro');
  const say = (id: string) => {
    line.current = id;
    void audio.line(id);
  };
  const chooseView = (next: ObservatoryView) => {
    setView(next);
    say('observatory-' + next);
  };
  useEffect(() => {
    if (active) {
      void audio.line(line.current);
      root.current
        ?.querySelector<HTMLButtonElement>('[data-game-autofocus]')
        ?.focus({ preventScroll: true });
    }
    return () => audio.stop();
  }, [active, audio]);
  const select = (id: PlanetId) => {
    setSelected(id);
    setInspected(null);
  };
  const inspect = (id: PlanetId) => {
    setSelected(id);
    setInspected(id);
    const first = !collection.includes(id);
    onObserve(id);
    if (first) audio.chime();
    say('observatory-fact-' + id);
  };
  const planet = planetFor(selected),
    order = PLANETS.findIndex((p) => p.id === selected) + 1;
  return (
    <div className="observatory" ref={root}>
      <div className="observatory-heading">
        <div>
          <small>NOVA’S OBSERVATORY</small>
          <h1>{viewNames[view]}</h1>
        </div>
        <div
          className="planet-collection"
          aria-label={collection.length + ' of 8 planet stamps'}
        >
          <Star />
          <strong>{collection.length} / 8</strong>
        </div>
        <button
          data-repeat-prompt
          className="round-control"
          onClick={() => void audio.line(line.current)}
          aria-label="Hear the observatory instructions"
        >
          <b className="pad-key y-key">Y</b>
          <Volume2 />
        </button>
      </div>
      <div className="observatory-workspace">
        <div className="observatory-window">
          <ObservatoryStage id={selected} view={view} active={active} />
          <div className="observatory-view-note">
            {view === 'orbits'
              ? 'A little model: distances, sizes and speeds are shortened.'
              : view === 'sizes'
                ? 'Planet widths use the same scale. Rings are left out.'
                : 'Our illustrated planet viewer'}
          </div>
        </div>
        <div className="observatory-controls">
          <div className="planet-targets" aria-label="Choose a planet">
            {PLANETS.map((p) => (
              <button
                key={p.id}
                data-game-choice
                data-planet={p.id}
                data-game-autofocus={selected === p.id || undefined}
                aria-label={
                  p.name +
                  (collection.includes(p.id) ? ', stamp collected' : '')
                }
                aria-pressed={selected === p.id}
                onFocus={() => {
                  if (selected !== p.id) select(p.id);
                }}
                onClick={() => inspect(p.id)}
              >
                <PlanetPicture id={p.id} />
                <span>{p.name}</span>
                {collection.includes(p.id) && (
                  <Check className="planet-stamp" />
                )}
              </button>
            ))}
          </div>
          <div
            className={
              'planet-fact ' + (inspected === selected ? 'planet-seen' : '')
            }
            aria-live="polite"
          >
            <div className="planet-title">
              <h2>{planet.name}</h2>
              <span>
                <b>{order}</b> from the Sun
              </span>
            </div>
            <p>{planet.fact}</p>
            <div className="planet-stamp-line">
              {inspected === selected ? (
                <>
                  <Check />{' '}
                  {collection.length === 8
                    ? 'All eight planet stamps!'
                    : 'A planet for your collection'}
                </>
              ) : (
                <>
                  <b className="pad-key a-key">A</b> Look and listen
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="observatory-footer">
        <div className="observatory-views">
          {OBSERVATORY_VIEWS.map((v) => {
            const Icon = viewIcons[v];
            return (
              <button
                key={v}
                data-game-choice
                aria-pressed={view === v}
                onClick={() => chooseView(v)}
              >
                <Icon />
                {viewNames[v]}
              </button>
            );
          })}
        </div>
        <button
          hidden
          data-observatory-switch
          onClick={() =>
            chooseView(
              OBSERVATORY_VIEWS[(OBSERVATORY_VIEWS.indexOf(view) + 1) % 3],
            )
          }
        >
          Change view
        </button>
        <button className="back-control" onClick={onBack}>
          <b className="pad-key b-key">B</b> Back
        </button>
        <span className="observatory-pad-note">
          ✚ Choose <b className="pad-key x-key">X</b> Change view
        </span>
      </div>
    </div>
  );
}
