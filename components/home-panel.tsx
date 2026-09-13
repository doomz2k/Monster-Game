'use client';
import { useState } from 'react';
import { Sprout, Armchair, PawPrint } from 'lucide-react';
import type { ProgressData } from '@/lib/learning';
import { GardenPanel } from './garden-panel';
import { CompanionPanel } from './companion-panel';
import { HomeRoom } from './home-room';
import type { AudioDirector } from '@/lib/audio';

export function HomePanel({
  progress: p,
  onChange,
  audio,
  onShop,
  onVisit,
  initialTab = 'garden',
}: {
  progress: ProgressData;
  onChange: (p: ProgressData) => void;
  audio: AudioDirector;
  onShop: () => void;
  onVisit: () => void;
  initialTab?: 'garden' | 'house';
}) {
  const [tab, setTab] = useState<'garden' | 'house' | 'friends'>(initialTab);
  return (
    <div className="home-panel">
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
            void audio.line('home-play');
          }}
        >
          <Armchair /> My house
        </button>
        <button
          data-game-choice
          aria-pressed={tab === 'friends'}
          onClick={() => {
            setTab('friends');
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
        <GardenPanel
          progress={p}
          onChange={onChange}
          audio={audio}
          onShop={onShop}
        />
      ) : (
        <HomeRoom
          progress={p}
          onChange={onChange}
          audio={audio}
          onInvite={onVisit}
        />
      )}
    </div>
  );
}
