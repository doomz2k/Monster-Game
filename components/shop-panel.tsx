'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  LockKeyhole,
  Star,
} from 'lucide-react';
import { SHOP_ITEMS } from '@/lib/adventure';
import { ShopPurchase, chooseWish, shopAvailability } from '@/lib/shop-state';
import type { ProgressData } from '@/lib/learning';
import type { AudioDirector } from '@/lib/audio';
import { ShopPreview } from './shop-preview';
import { ShopPicture } from './shop-picture';

export function ShopPanel({
  progress: p,
  onChange,
  audio,
}: {
  progress: ProgressData;
  onChange: (p: ProgressData) => void;
  audio: AudioDirector;
}) {
  const first =
    SHOP_ITEMS.find((item) => item.id === p.adventure.wish) ?? SHOP_ITEMS[0];
  const [category, setCategory] = useState<'seed' | 'furniture' | 'garden'>(
      first.kind,
    ),
    [selected, setSelected] = useState<string>(first.id),
    [page, setPage] = useState(() =>
      Math.floor(
        SHOP_ITEMS.filter((item) => item.kind === first.kind).findIndex(
          (item) => item.id === first.id,
        ) / 6,
      ),
    ),
    [view, setView] = useState<'browse' | 'inspect' | 'receipt'>('browse');
  const root = useRef<HTMLDivElement>(null),
    purchase = useRef<ShopPurchase | null>(null),
    repeatLine = useRef('shop-browse');
  const item = SHOP_ITEMS.find((item) => item.id === selected)!,
    items = SHOP_ITEMS.filter((item) => item.kind === category),
    availability = shopAvailability(p, selected);
  const say = (line: string) => {
    repeatLine.current = line;
    void audio.line(line);
  };
  useEffect(() => {
    const target =
      view === 'browse'
        ? root.current?.querySelector<HTMLButtonElement>(
            '[data-shop-item="' + selected + '"]',
          )
        : root.current?.querySelector<HTMLButtonElement>(
            '[data-choice-scope] [data-game-choice]:not(:disabled)',
          );
    target?.focus({ preventScroll: true });
  }, [view, page, category, selected]);
  const browse = () => {
    setView('browse');
    say('shop-browse');
  };
  return (
    <div className="poppy-shop" ref={root}>
      <button
        hidden
        data-repeat-prompt
        onClick={() => {
          void audio.line(repeatLine.current);
        }}
      >
        Listen again
      </button>
      <div className="poppy-heading">
        <div>
          <span>POPPY’S LITTLE SHOPS</span>
          <h2>Something lovely for home</h2>
        </div>
        <span className="wallet">⭐ {p.adventure.wallet}</span>
      </div>
      {view === 'browse' && (
        <nav className="poppy-tabs" aria-label="Shop shelves">
          {(['seed', 'furniture', 'garden'] as const).map((kind) => (
            <button
              key={kind}
              data-game-choice
              aria-pressed={category === kind}
              onClick={() => {
                setCategory(kind);
                setPage(0);
                setSelected(SHOP_ITEMS.find((item) => item.kind === kind)!.id);
                say('shop-' + kind);
              }}
            >
              <span>
                {kind === 'seed' ? '🌱' : kind === 'furniture' ? '🏡' : '🌳'}
              </span>
              {kind === 'seed'
                ? 'Seeds'
                : kind === 'furniture'
                  ? 'My house'
                  : 'My garden'}
            </button>
          ))}
        </nav>
      )}
      <div className="poppy-workspace">
        <div className="poppy-display">
          <ShopPreview id={selected} />
          <h3>{item.name}</h3>
          {item.kind === 'seed' ? (
            <span>One packet · {p.adventure.seeds[selected] ?? 0} at home</span>
          ) : (
            <span>
              {availability === 'owned'
                ? 'Already at home'
                : item.kind === 'garden'
                  ? 'For your garden'
                  : 'For your house'}
            </span>
          )}
        </div>
        <div className="poppy-shelves">
          {view === 'browse' ? (
            <>
              <div className="poppy-grid">
                {items.slice(page * 6, page * 6 + 6).map((thing) => {
                  const status = shopAvailability(p, thing.id);
                  return (
                    <button
                      key={thing.id}
                      data-game-choice
                      data-shop-item={thing.id}
                      data-game-autofocus={
                        thing.id === selected ? '' : undefined
                      }
                      aria-label={
                        thing.name +
                        (status === 'owned'
                          ? ', already at home'
                          : ', ' +
                            thing.price +
                            (thing.price === 1 ? ' star' : ' stars'))
                      }
                      data-current={thing.id === selected}
                      onFocus={() => setSelected(thing.id)}
                      onClick={() => {
                        setSelected(thing.id);
                        purchase.current = new ShopPurchase(thing.id);
                        setView('inspect');
                        say('shop-item-' + thing.id);
                      }}
                    >
                      <ShopPicture id={thing.id} />
                      <strong>{thing.name}</strong>
                      <span>
                        {status === 'owned' ? (
                          <>
                            <Check size={17} /> Yours
                          </>
                        ) : status === 'moon' ? (
                          <>
                            <LockKeyhole size={15} /> 🚀
                          </>
                        ) : (
                          <>
                            <Star size={17} fill="currentColor" />
                            {thing.price}
                          </>
                        )}
                        {p.adventure.wish === thing.id && (
                          <Heart size={17} fill="#c8849d" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              <nav className="poppy-pages" aria-label="Shop pages">
                <button
                  data-game-choice
                  disabled={page === 0}
                  onClick={() => {
                    const next = page - 1;
                    setPage(next);
                    setSelected(items[next * 6].id);
                  }}
                  aria-label="Previous things"
                >
                  <ArrowLeft />
                </button>
                <span>
                  {page + 1} / {Math.ceil(items.length / 6)}
                </span>
                <button
                  data-game-choice
                  disabled={(page + 1) * 6 >= items.length}
                  onClick={() => {
                    const next = page + 1;
                    setPage(next);
                    setSelected(items[next * 6].id);
                  }}
                  aria-label="More things"
                >
                  <ArrowRight />
                </button>
              </nav>
            </>
          ) : (
            <div className="poppy-inspection" data-choice-scope>
              {view === 'receipt' ? (
                <>
                  <div className="poppy-gift">
                    <Check />
                  </div>
                  <h3>It’s yours!</h3>
                  <p>
                    {item.kind === 'seed'
                      ? 'Ready to plant at home'
                      : item.kind === 'garden'
                        ? 'Ready for your garden'
                        : 'Ready to put in your home'}
                  </p>
                  <button
                    className="poppy-buy"
                    data-game-choice
                    onClick={browse}
                  >
                    <b className="pad-key a-key">A</b> Keep looking
                  </button>
                </>
              ) : (
                <>
                  <div
                    className="poppy-price"
                    aria-label={item.price + ' stars'}
                  >
                    {Array.from({ length: item.price }, (_, i) => (
                      <Star
                        key={i}
                        size={33}
                        fill={i < p.adventure.wallet ? '#ecc456' : 'none'}
                        stroke={i < p.adventure.wallet ? '#b89136' : '#c7cbb8'}
                      />
                    ))}
                  </div>
                  <h3>
                    {availability === 'owned'
                      ? 'Already at home'
                      : availability === 'moon'
                        ? 'Repair Pip’s rocket first'
                        : availability === 'full'
                          ? 'Your seed box is full'
                          : availability === 'stars'
                            ? Math.max(0, item.price - p.adventure.wallet) +
                              ' more stars'
                            : 'Shall we get this?'}
                  </h3>
                  {availability === 'owned' ? (
                    <button
                      className="poppy-buy"
                      data-game-choice
                      onClick={browse}
                    >
                      <b className="pad-key a-key">A</b> Keep looking
                    </button>
                  ) : (
                    <>
                      <button
                        className="poppy-buy"
                        data-game-choice
                        disabled={availability !== 'ready'}
                        onClick={() => {
                          const next = purchase.current?.commit(p) ?? p;
                          if (next === p) return;
                          onChange(next);
                          setView('receipt');
                          say('bought');
                        }}
                      >
                        <b className="pad-key a-key">A</b> Get this · ⭐{' '}
                        {item.price}
                      </button>
                      {availability !== 'full' && (
                        <button
                          className="poppy-wish"
                          data-game-choice
                          aria-pressed={p.adventure.wish === selected}
                          onClick={() => {
                            const wished = p.adventure.wish === selected;
                            onChange(chooseWish(p, wished ? null : selected));
                            say(wished ? 'shop-wish-clear' : 'shop-wish');
                          }}
                        >
                          <Heart
                            fill={
                              p.adventure.wish === selected
                                ? 'currentColor'
                                : 'none'
                            }
                          />
                          {p.adventure.wish === selected
                            ? 'My saving goal'
                            : 'Save for this'}
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
              <button className="poppy-cancel" data-reject onClick={browse}>
                <b className="pad-key b-key">B</b> Back to the shelf
              </button>
            </div>
          )}
        </div>
      </div>
      {p.adventure.wish && (
        <div className="poppy-saving">
          <Heart size={17} />
          <span>
            Saving for{' '}
            {SHOP_ITEMS.find((item) => item.id === p.adventure.wish)!.name}
          </span>
          <Star size={16} fill="currentColor" />
          <span>
            {Math.min(
              p.adventure.wallet,
              SHOP_ITEMS.find((item) => item.id === p.adventure.wish)!.price,
            )}{' '}
            / {SHOP_ITEMS.find((item) => item.id === p.adventure.wish)!.price}
          </span>
        </div>
      )}
    </div>
  );
}
