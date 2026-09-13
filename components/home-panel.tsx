'use client';
import { useState } from 'react';
import { Sprout, Armchair, Droplets, Undo2, PawPrint } from 'lucide-react';
import type { ProgressData } from '@/lib/learning';
import { harvestPlant, PRODUCE, gardenVisitors } from '@/lib/garden';
import { GardenPreview } from './garden-preview';
import { CompanionPanel } from './companion-panel';
import { FurnitureStudio } from './furniture-studio';
import { GamePicture } from './game-picture';
import { SHOP_ITEMS, plantSeed, waterPlant, clearPlot } from '@/lib/adventure';
import type { AudioDirector } from '@/lib/audio';

export function HomePanel({
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
  const [tab, setTab] = useState<'garden' | 'house' | 'friends'>('garden'),
    [seed, setSeed] = useState('daisy'),
    [tool, setTool] = useState<'plant' | 'water' | 'clear'>('plant'),
    [pendingClear, setPendingClear] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const selectedSeed =
    (p.adventure.seeds[seed] ?? 0) > 0
      ? seed
      : (SHOP_ITEMS.find(
          (i) => i.kind === 'seed' && (p.adventure.seeds[i.id] ?? 0) > 0,
        )?.id ?? seed);
  const update = (next: ProgressData, text: string, line: string) => {
    if (next !== p) {
      onChange(next);
      setMessage(text);
      void audio.line(line);
    }
  };
  return (
    <div className="home-panel">
      {tab === 'garden' && (
        <button
          hidden
          data-repeat-prompt
          onClick={() => {
            void audio.line('garden');
          }}
        >
          Listen again
        </button>
      )}
      <div className="shop-heading">
        <span className="friend-avatar">🏡</span>
        <div>
          <p>Made by you</p>
          <h2>My little home</h2>
        </div>
        <span className="wallet">⭐ {p.adventure.wallet}</span>
      </div>
      <div className="picture-tabs">
        <button
          data-game-choice
          aria-pressed={tab === 'garden'}
          onClick={() => {
            setTab('garden');
            setMessage('');
            void audio.line('garden');
          }}
        >
          <Sprout /> My garden
        </button>
        <button
          data-game-choice
          aria-pressed={tab === 'house'}
          onClick={() => {
            setTab('house');
            setMessage('');
            void audio.line('room-place');
          }}
        >
          <Armchair /> My house
        </button>
        <button
          data-game-choice
          aria-pressed={tab === 'friends'}
          onClick={() => {
            setTab('friends');
            setMessage('');
            void audio.line('companions');
          }}
        >
          <PawPrint /> My friends
        </button>
        <button data-game-choice onClick={onShop}>
          <span>🐰</span> Visit Poppy
        </button>
      </div>
      {tab === 'friends' ? (
        <CompanionPanel progress={p} onChange={onChange} audio={audio} />
      ) : tab === 'garden' ? (
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
            <div className="garden-pantry">
              <strong>For Bramble</strong>
              {PRODUCE.map((id) => (
                <span key={id}>
                  <GamePicture symbol={id === 'tomato' ? '🍅' : '🫑'} />{' '}
                  {p.adventure.pantry[id]}{' '}
                  {p.adventure.pantry[id] === 1 ? 'basket' : 'baskets'}
                </span>
              ))}
            </div>
          </aside>
          <div className="garden-controls">
            <div className="garden-tools">
              <button
                data-game-choice
                aria-pressed={tool === 'plant'}
                onClick={() => setTool('plant')}
              >
                <Sprout /> Plant
              </button>
              <button
                data-game-choice
                aria-pressed={tool === 'water'}
                onClick={() => setTool('water')}
              >
                <Droplets /> Water
              </button>
              <button
                data-game-choice
                aria-pressed={tool === 'clear'}
                onClick={() => setTool('clear')}
              >
                <Undo2 /> Make space
              </button>
            </div>
            {tool === 'plant' && (
              <div className="seed-box">
                {SHOP_ITEMS.filter(
                  (i) =>
                    i.kind === 'seed' && (p.adventure.seeds[i.id] ?? 0) > 0,
                ).map((s) => (
                  <button
                    data-game-choice
                    key={s.id}
                    aria-pressed={selectedSeed === s.id}
                    onClick={() => setSeed(s.id)}
                  >
                    <span>{s.icon}</span>
                    <small>{p.adventure.seeds[s.id]}</small>
                  </button>
                ))}
                {!Object.values(p.adventure.seeds).some((n) => n > 0) && (
                  <button data-game-choice onClick={onShop}>
                    🌱 Get seeds from Poppy
                  </button>
                )}
              </div>
            )}
            <div className="garden-plots">
              {p.adventure.plots.map((plant, i) => {
                const s = SHOP_ITEMS.find((s) => s.id === plant?.seed);
                return (
                  <button
                    data-game-choice
                    key={i}
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
                      if (tool === 'clear' && plant) setPendingClear(i);
                      else if (
                        plant?.water === 3 &&
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
                          void audio.line('garden-full');
                        }
                      } else if (plant?.water === 3) {
                        setMessage('Lovely flowers for our little visitors');
                        void audio.line('garden-visitors');
                      } else if (plant)
                        update(
                          waterPlant(p, i),
                          plant.water === 2 ? 'You grew it!' : 'A little drink',
                          plant.water === 2 ? 'grown' : 'watered',
                        );
                      else if (tool === 'plant')
                        update(
                          plantSeed(p, i, selectedSeed),
                          'A seed is planted',
                          'planted',
                        );
                    }}
                  >
                    <span>
                      {plant
                        ? plant.water === 3
                          ? s?.icon
                          : plant.water > 0
                            ? '🌿'
                            : '🌱'
                        : '＋'}
                    </span>
                    <small>
                      {plant
                        ? plant.water === 3 &&
                          PRODUCE.includes(
                            plant.seed as (typeof PRODUCE)[number],
                          )
                          ? 'Pick a basket'
                          : '💧'.repeat(plant.water) +
                            '○'.repeat(3 - plant.water)
                        : 'Plant here'}
                    </small>
                  </button>
                );
              })}
            </div>
            {pendingClear !== null && (
              <div className="clear-confirm" data-choice-scope>
                <p>Make this patch empty?</p>
                <button
                  data-game-choice
                  onClick={() => {
                    update(
                      clearPlot(p, pendingClear),
                      'Ready for a new seed',
                      'put-away',
                    );
                    setPendingClear(null);
                  }}
                >
                  <b className="pad-key a-key">A</b> Yes
                </button>
                <button data-reject onClick={() => setPendingClear(null)}>
                  <b className="pad-key b-key">B</b> Keep it
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <FurnitureStudio progress={p} onChange={onChange} audio={audio} />
      )}
      <output aria-live="polite" className="home-feedback">
        {message}
      </output>
    </div>
  );
}
