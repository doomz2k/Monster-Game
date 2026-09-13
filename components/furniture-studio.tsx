'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Undo2,
  PackageOpen,
} from 'lucide-react';
import { SHOP_ITEMS, placeFurniture } from '@/lib/adventure';
import {
  furnitureSnapshot,
  restoreFurniture,
  rotateFurniture,
  layoutFields,
  type FurnitureArea,
  type FurnitureLayout,
} from '@/lib/furniture-layout';
import type { ProgressData } from '@/lib/learning';
import type { AudioDirector } from '@/lib/audio';
import { FurniturePreview } from './furniture-preview';
import { ShopPicture } from './shop-picture';

export function FurnitureStudio({
  progress: p,
  onChange,
  audio,
}: {
  progress: ProgressData;
  onChange: (p: ProgressData) => void;
  audio: AudioDirector;
}) {
  const [page, setPage] = useState(0),
    [slot, setSlot] = useState(0),
    [area, setArea] = useState<FurnitureArea>('house'),
    [item, setItem] = useState<string | null>(p.adventure.inventory[0] ?? null),
    [tool, setTool] = useState<'place' | 'turn' | 'remove'>('place'),
    [undo, setUndo] = useState<FurnitureLayout[]>([]),
    [message, setMessage] = useState('Choose a thing, then a numbered space');
  const shelf = useRef<HTMLDivElement>(null),
    repeatLine = useRef('room-place');
  const [itemsKey] = layoutFields(area);
  useEffect(() => {
    shelf.current
      ?.querySelector<HTMLElement>('[data-game-choice]')
      ?.focus({ preventScroll: true });
  }, [page]);
  const say = (line: string) => {
    repeatLine.current = line;
    void audio.line(line);
  };
  const apply = (next: ProgressData, text: string) => {
    if (next === p) return;
    setUndo((history) => [...history.slice(-19), furnitureSnapshot(p)]);
    onChange(next);
    setMessage(text);
    say(tool === 'remove' ? 'put-away' : 'ready');
  };
  return (
    <div className="furniture-studio">
      <button
        hidden
        data-repeat-prompt
        onClick={() => {
          void audio.line(repeatLine.current);
        }}
      >
        Listen again
      </button>
      <div className="furniture-shelf" ref={shelf}>
        {p.adventure.inventory.slice(page * 6, page * 6 + 6).map((id) => {
          const thing = SHOP_ITEMS.find((s) => s.id === id)!;
          return (
            <button
              key={id}
              data-game-choice
              aria-pressed={item === id && tool === 'place'}
              onClick={() => {
                setItem(id);
                setArea(thing.kind === 'garden' ? 'garden' : 'house');
                setTool('place');
                setMessage(thing.name + ' — choose a space');
                say('room-place');
              }}
            >
              <ShopPicture id={id} />
              <small>{thing.name}</small>
            </button>
          );
        })}
      </div>
      <div className="furniture-toolbar">
        <nav className="furniture-pages" aria-label="Furniture pages">
          <button
            data-game-choice
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            aria-label="Previous furniture"
          >
            <ArrowLeft />
          </button>
          <span>
            {page + 1} / {Math.ceil(p.adventure.inventory.length / 6)}
          </span>
          <button
            data-game-choice
            disabled={(page + 1) * 6 >= p.adventure.inventory.length}
            onClick={() => setPage(page + 1)}
            aria-label="More furniture"
          >
            <ArrowRight />
          </button>
        </nav>
        <button
          data-game-choice
          aria-pressed={tool === 'turn'}
          onClick={() => {
            setTool('turn');
            setMessage('Choose a space to turn');
            say('room-turn');
          }}
        >
          <RotateCw /> Turn
        </button>
        <button
          data-game-choice
          aria-pressed={tool === 'remove'}
          onClick={() => {
            setTool('remove');
            setMessage('Choose a thing to put away');
            say('room-remove');
          }}
        >
          <PackageOpen /> Put away
        </button>
        <button
          data-game-choice
          disabled={!undo.length}
          onClick={() => {
            const previous = undo.at(-1);
            if (!previous) return;
            onChange(restoreFurniture(p, previous));
            setUndo(undo.slice(0, -1));
            setMessage('Back the way it was');
            say('room-undo');
          }}
        >
          <Undo2 /> Undo
        </button>
      </div>
      <div className="furniture-workbench">
        <FurniturePreview
          adventure={p.adventure}
          slot={slot}
          item={item}
          tool={tool}
          area={area}
        />
        <div className="furniture-placement">
          <div className="furniture-space-grid">
            {p.adventure[itemsKey].map((id, i) => {
              const placed = SHOP_ITEMS.find((s) => s.id === id);
              return (
                <button
                  key={i}
                  data-game-choice
                  aria-label={
                    'Space ' +
                    (i + 1) +
                    (placed ? ', ' + placed.name : ', empty')
                  }
                  data-current={i === slot}
                  onFocus={() => setSlot(i)}
                  onClick={() => {
                    setSlot(i);
                    apply(
                      tool === 'turn'
                        ? rotateFurniture(p, i, area)
                        : placeFurniture(
                            p,
                            i,
                            tool === 'remove' ? null : item,
                            area,
                          ),
                      tool === 'turn'
                        ? 'Turned around'
                        : tool === 'remove'
                          ? 'Back on your shelf'
                          : 'Just right!',
                    );
                  }}
                >
                  <b>{i + 1}</b>
                  {placed ? <ShopPicture id={placed.id} /> : <span>＋</span>}
                  <small>{placed?.name ?? 'Put it here'}</small>
                </button>
              );
            })}
          </div>
          <output aria-live="polite" className="furniture-message">
            {message}
          </output>
        </div>
      </div>
    </div>
  );
}
