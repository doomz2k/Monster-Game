'use client';
import { useEffect, useRef, useState } from 'react';
import { Armchair, Sprout, Move, Play, Users } from 'lucide-react';
import type { ProgressData } from '@/lib/learning';
import type { AudioDirector } from '@/lib/audio';
import { homeActivity, toggleFurnitureLight } from '@/lib/home-play';
import { layoutFields, type FurnitureArea } from '@/lib/furniture-layout';
import { SHOP_ITEMS } from '@/lib/adventure';
import { HomePlayPreview } from './home-play-preview';
import { FurnitureStudio } from './furniture-studio';
import { ShopPicture } from './shop-picture';

export function HomeRoom({
  progress: p,
  onChange,
  audio,
  onInvite,
}: {
  progress: ProgressData;
  onChange: (p: ProgressData) => void;
  audio: AudioDirector;
  onInvite: () => void;
}) {
  const [area, setArea] = useState<FurnitureArea>('house'),
    [slot, setSlot] = useState(() =>
      Math.max(0, p.adventure.furniture.findIndex(Boolean)),
    ),
    [editing, setEditing] = useState(false),
    [playing, setPlaying] = useState(false),
    [take, setTake] = useState(0);
  const root = useRef<HTMLDivElement>(null),
    repeat = useRef('home-play');
  const [items] = layoutFields(area),
    task = homeActivity(p.adventure, area, slot);
  const say = (id: string) => {
    repeat.current = id;
    void audio.line(id);
  };
  const stop = () => {
    setPlaying(false);
    say('home-play');
  };
  useEffect(() => {
    if (editing) return;
    (
      root.current?.querySelector<HTMLButtonElement>(
        '[data-room-slot="' + slot + '"]:not(:disabled)',
      ) ?? root.current?.querySelector<HTMLButtonElement>('[data-room-arrange]')
    )?.focus({ preventScroll: true });
  }, [area, editing, slot]);
  if (editing)
    return (
      <div className="home-room-editor">
        <button
          className="room-return"
          data-game-choice
          data-reject
          onClick={() => {
            setEditing(false);
            say('home-play');
          }}
        >
          <b className="pad-key b-key">B</b>
          <Play size={18} /> Play here
        </button>
        <FurnitureStudio progress={p} onChange={onChange} audio={audio} />
      </div>
    );
  return (
    <div className="home-room" ref={root}>
      <button
        hidden
        data-repeat-prompt
        onClick={() => void audio.line(repeat.current)}
      >
        Listen again
      </button>
      <div className="home-room-toolbar">
        {(['house', 'garden'] as const).map((place) => (
          <button
            key={place}
            data-game-choice
            aria-pressed={area === place}
            onClick={() => {
              setArea(place);
              setSlot(
                Math.max(
                  0,
                  p.adventure[layoutFields(place)[0]].findIndex(Boolean),
                ),
              );
              setPlaying(false);
              say('home-play');
            }}
          >
            {place === 'house' ? <Armchair /> : <Sprout />}
            {place === 'house' ? 'Inside' : 'Outside'}
          </button>
        ))}
        <button data-game-choice onClick={onInvite}>
          <Users /> Invite a friend
        </button>
        <button
          data-room-arrange
          data-game-choice
          onClick={() => {
            setEditing(true);
            setPlaying(false);
            say('room-place');
          }}
        >
          <Move /> Move things
        </button>
      </div>
      <div className="home-room-workspace">
        <HomePlayPreview
          progress={p}
          area={area}
          slot={slot}
          playing={playing}
          take={take}
        />
        <div className="home-room-choices">
          <h3>{playing && task ? task.label : 'Somewhere to play'}</h3>
          <div className="home-activity-grid">
            {p.adventure[items].map((id, i) => {
              const activity = homeActivity(p.adventure, area, i),
                name = SHOP_ITEMS.find((item) => item.id === id)?.name;
              return (
                <button
                  key={i}
                  data-game-choice
                  data-room-slot={i}
                  data-current={slot === i}
                  disabled={!activity}
                  aria-label={
                    activity
                      ? activity.label + ', ' + name
                      : 'Empty space ' + (i + 1)
                  }
                  onFocus={() => {
                    if (slot !== i) {
                      setSlot(i);
                      setPlaying(false);
                    }
                  }}
                  onClick={() => {
                    if (!activity) return;
                    setSlot(i);
                    setTake((n) => n + 1);
                    setPlaying(true);
                    if (activity.action === 'light') {
                      const next = toggleFurnitureLight(p, activity.id);
                      onChange(next);
                      say(
                        next.adventure.unlit.includes(activity.id)
                          ? 'home-light-off'
                          : 'home-light-on',
                      );
                    } else say('home-' + activity.action);
                  }}
                >
                  {id ? (
                    <ShopPicture id={id} />
                  ) : (
                    <span className="room-empty">＋</span>
                  )}
                  <strong>{activity?.label ?? 'Add something'}</strong>
                  {activity && <small>{name}</small>}
                  {activity?.action === 'light' && (
                    <span className="room-light-state">
                      {p.adventure.unlit.includes(id!) ? 'Off' : 'On'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {playing ? (
            <button className="room-stop" data-reject onClick={stop}>
              <b className="pad-key b-key">B</b> All done
            </button>
          ) : (
            <p className="room-play-hint">
              <b className="pad-key a-key">A</b> Let’s try it
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
