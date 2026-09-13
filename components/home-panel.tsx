'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Sprout,
  Armchair,
  Droplets,
  Undo2,
  ArrowLeft,
  ArrowRight,
  PawPrint,
} from 'lucide-react';
import type { ProgressData } from '@/lib/learning';
import { harvestPlant, PRODUCE, gardenVisitors } from '@/lib/garden';
import { GardenPreview } from './garden-preview';
import { CompanionPanel } from './companion-panel';
import { GamePicture } from './game-picture';
import {
  SHOP_ITEMS,
  buyItem,
  plantSeed,
  waterPlant,
  clearPlot,
  placeFurniture,
} from '@/lib/adventure';
import type { AudioDirector } from '@/lib/audio';

export function ShopPanel({
  progress: p,
  onChange,
  audio,
}: {
  progress: ProgressData;
  onChange: (p: ProgressData) => void;
  audio: AudioDirector;
}) {
  const [category, setCategory] = useState<'seed' | 'furniture' | 'garden'>(
    'seed',
  );
  const [message, setMessage] = useState('');
  return (
    <div className="shop-panel">
      <div className="shop-heading">
        <span className="friend-avatar">🐰</span>
        <div>
          <p>Poppy’s little shops</p>
          <h2>A little something for home</h2>
        </div>
        <span className="wallet">⭐ {p.adventure.wallet}</span>
      </div>
      <div className="picture-tabs">
        {(['seed', 'furniture', 'garden'] as const).map((c) => (
          <button
            data-game-choice
            key={c}
            aria-pressed={c === category}
            onClick={() => setCategory(c)}
          >
            <span>{c === 'seed' ? '🌱' : c === 'furniture' ? '🛋️' : '🌳'}</span>
            {c === 'seed'
              ? 'Seeds'
              : c === 'furniture'
                ? 'My house'
                : 'My garden'}
          </button>
        ))}
      </div>
      <div className="shop-grid">
        {SHOP_ITEMS.filter((i) => i.kind === category).map((item) => {
          const owned =
            item.kind !== 'seed' && p.adventure.inventory.includes(item.id);
          const moonLocked =
            item.id === 'moonflower' && p.adventure.rounds.rocket < 3;
          return (
            <button
              data-game-choice
              key={item.id}
              className={'shop-card ' + (owned ? 'owned' : '')}
              onClick={() => {
                const next = buyItem(p, item.id);
                if (next !== p) {
                  onChange(next);
                  setMessage(item.name + ' is yours!');
                  void audio.line('bought');
                } else {
                  setMessage(
                    owned
                      ? 'Already at home'
                      : moonLocked
                        ? 'Discover the moon first'
                        : 'Earn a few more stars',
                  );
                  void audio.line(owned ? 'owned' : 'expensive');
                }
              }}
            >
              <span
                className="shop-item-picture"
                style={{ background: item.colour + '30' }}
              >
                {item.icon}
              </span>
              <strong>{item.name}</strong>
              <span>
                {owned ? (
                  <>
                    <Check size={17} /> Yours
                  </>
                ) : moonLocked ? (
                  '🌙'
                ) : (
                  <>⭐ {item.price}</>
                )}
              </span>
              {item.kind === 'seed' && (
                <small>
                  {p.adventure.seeds[item.id] ?? 0} in your seed box
                </small>
              )}
            </button>
          );
        })}
      </div>
      <output aria-live="polite" className="home-feedback">
        {message}
      </output>
    </div>
  );
}
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
  const shelf = useRef<HTMLDivElement>(null);
  const [furniturePage, setFurniturePage] = useState(0);
  useEffect(() => {
    shelf.current
      ?.querySelector<HTMLElement>('[data-game-choice]')
      ?.focus({ preventScroll: true });
  }, [furniturePage]);
  const [tab, setTab] = useState<'garden' | 'house' | 'friends'>('garden'),
    [seed, setSeed] = useState('daisy'),
    [item, setItem] = useState<string | null>('table'),
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
      {tab !== 'friends' && (
        <button
          hidden
          data-repeat-prompt
          onClick={() => {
            void audio.line(tab === 'garden' ? 'garden' : 'furniture');
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
            void audio.line('furniture');
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
        <>
          <div className="furniture-shelf" ref={shelf}>
            {p.adventure.inventory
              .slice(furniturePage * 6, furniturePage * 6 + 6)
              .map((id) => {
                const shopItem = SHOP_ITEMS.find((s) => s.id === id)!;
                return (
                  <button
                    data-game-choice
                    key={id}
                    aria-pressed={item === id}
                    onClick={() => setItem(id)}
                  >
                    <span>{shopItem.icon}</span>
                    <small>{shopItem.name}</small>
                  </button>
                );
              })}
            <button
              data-game-choice
              aria-pressed={item === null}
              onClick={() => setItem(null)}
            >
              <Undo2 />
              <small>Put away</small>
            </button>
          </div>
          <nav className="furniture-pages" aria-label="Furniture pages">
            <button
              data-game-choice
              disabled={furniturePage === 0}
              onClick={() => setFurniturePage(furniturePage - 1)}
              aria-label="Previous furniture"
            >
              <ArrowLeft />
            </button>
            <span>
              {furniturePage + 1} /{' '}
              {Math.ceil(p.adventure.inventory.length / 6)}
            </span>
            <button
              data-game-choice
              disabled={(furniturePage + 1) * 6 >= p.adventure.inventory.length}
              onClick={() => setFurniturePage(furniturePage + 1)}
              aria-label="More furniture"
            >
              <ArrowRight />
            </button>
          </nav>
          <div className="room-plan">
            {p.adventure.furniture.map((id, i) => {
              const placed = SHOP_ITEMS.find((s) => s.id === id);
              return (
                <button
                  data-game-choice
                  key={i}
                  aria-label={
                    'Space ' +
                    (i + 1) +
                    (placed ? ', ' + placed.name : ', empty')
                  }
                  onClick={() =>
                    update(
                      placeFurniture(p, i, item),
                      item ? 'Just right!' : 'Put away',
                      item ? 'ready' : 'put-away',
                    )
                  }
                >
                  <span>{placed?.icon ?? '＋'}</span>
                  <small>{placed?.name ?? 'Put it here'}</small>
                </button>
              );
            })}
          </div>
        </>
      )}
      <output aria-live="polite" className="home-feedback">
        {message}
      </output>
    </div>
  );
}
