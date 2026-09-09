'use client';
import { useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Check,
  LockKeyhole,
  RotateCw,
  Shirt,
  Sparkles,
  Star,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  COSMETICS,
  isUnlocked,
  itemsFor,
  type Cosmetic,
  type Outfit,
  type OutfitSlot,
} from '@/lib/wardrobe';
export function WardrobePanel({
  stars,
  outfit,
  slot,
  selection,
  message,
  onSlot,
  onSelection,
  onEquip,
  onClose,
  onTurn,
}: {
  stars: number;
  outfit: Outfit;
  slot: OutfitSlot;
  selection: number;
  message: string;
  onSlot: (slot: OutfitSlot) => void;
  onSelection: (n: number) => void;
  onEquip: (item: Cosmetic) => void;
  onClose: () => void;
  onTurn: () => void;
}) {
  const list = useRef<HTMLDivElement>(null);
  const items = itemsFor(slot);
  const next = [...COSMETICS]
    .filter((item) => item.stars > stars)
    .sort((a, b) => a.stars - b.stars)[0];
  useEffect(() => {
    list.current
      ?.querySelector<HTMLElement>('[data-choice="' + selection + '"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [selection, slot]);
  return (
    <section className="dressing-room" aria-labelledby="wardrobe-title">
      <div className="wardrobe-preview-note">
        <span className="eyebrow">LOOKING LOVELY, MONSTER</span>
        <button className="turn-button" onClick={onTurn}>
          <RotateCw size={18} /> Turn Monster{' '}
          <span className="pad-key x-key">X</span>
        </button>
        <small>Right stick turns Monster too</small>
      </div>
      <div className="wardrobe-panel">
        <div className="wardrobe-heading">
          <span className="eyebrow">
            <Shirt size={16} /> MONSTER’S DRESS-UP BOX
          </span>
          <span className="wardrobe-stars">
            <Star size={17} fill="currentColor" /> {stars}
          </span>
        </div>
        <h2 id="wardrobe-title">What shall we wear?</h2>
        <p className="wardrobe-intro">
          Choose a hat and a little something extra.
        </p>
        <div className="wardrobe-tabs">
          <button aria-pressed={slot === 'hat'} onClick={() => onSlot('hat')}>
            <span aria-hidden="true">🎩</span> Hats
          </button>
          <button
            aria-pressed={slot === 'accessory'}
            onClick={() => onSlot('accessory')}
          >
            <span aria-hidden="true">🎀</span> Accessories
          </button>
          <span>LB / RB · Q / E</span>
        </div>
        <div className="wardrobe-choices" ref={list}>
          <div className="wardrobe-grid">
            {items.map((item, index) => {
              const unlocked = isUnlocked(item, stars),
                wearing = outfit[slot] === item.id;
              return (
                <button
                  key={item.id}
                  data-choice={index}
                  className={
                    'outfit-card ' +
                    (selection === index ? 'selected ' : '') +
                    (wearing ? 'wearing ' : '') +
                    (!unlocked ? 'locked' : '')
                  }
                  aria-pressed={wearing}
                  aria-disabled={!unlocked}
                  aria-label={
                    item.name +
                    (wearing
                      ? ', wearing'
                      : unlocked
                        ? ', ready to wear'
                        : ', unlocks at ' + item.stars + ' stars')
                  }
                  onFocus={() => onSelection(index)}
                  onClick={() => {
                    onSelection(index);
                    onEquip(item);
                  }}
                >
                  <span
                    className="outfit-icon"
                    style={{ backgroundColor: item.colour }}
                    aria-hidden="true"
                  >
                    {item.icon}
                    {!unlocked && <LockKeyhole size={15} />}
                    {wearing && (
                      <span className="wearing-check">
                        <Check size={13} />
                      </span>
                    )}
                  </span>
                  <strong>{item.name}</strong>
                  <small>
                    {wearing
                      ? 'Wearing'
                      : unlocked
                        ? 'Ready to wear'
                        : item.stars -
                          stars +
                          ' more ' +
                          (item.stars - stars === 1 ? 'star' : 'stars')}
                  </small>
                </button>
              );
            })}
          </div>
          <button
            data-choice={items.length}
            className={
              'wardrobe-done primary-button ' +
              (selection === items.length ? 'selected' : '')
            }
            onFocus={() => onSelection(items.length)}
            onClick={onClose}
          >
            <Check size={20} /> All dressed!{' '}
            <span className="pad-key a-key">A</span>
          </button>
        </div>
        <output className="wardrobe-message">
          {message || 'Your outfit saves as you choose. Lovely!'}
        </output>
        {next && (
          <div className="next-outfit">
            <Sparkles size={17} />
            <div>
              <span>Next surprise: {next.name}</span>
              <Progress
                value={Math.min(100, (stars / next.stars) * 100)}
                aria-label={
                  stars + ' of ' + next.stars + ' stars towards ' + next.name
                }
              />
            </div>
            <span>
              {stars}/{next.stars}
              <Star size={12} />
            </span>
          </div>
        )}
        <div className="wardrobe-help">
          <span>← → ↑ ↓ choose · A wear</span>
          <button onClick={onClose}>
            <ArrowLeft size={14} /> B back
          </button>
        </div>
      </div>
    </section>
  );
}
