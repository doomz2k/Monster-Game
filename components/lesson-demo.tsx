'use client';
import { useEffect, useRef, useState } from 'react';
import type { Mission } from '@/lib/adventure';
import type { AudioDirector } from '@/lib/audio';
import { GamePicture } from './game-picture';
import { NeighbourPortrait } from './neighbour-portrait';

export function LessonDemo({
  mission: m,
  audio,
  onReady,
}: {
  mission: Mission;
  audio: AudioDirector;
  onReady: () => void;
}) {
  const [phase, setPhase] = useState(0),
    ready = useRef<HTMLButtonElement>(null);
  const counting = ['pack', 'pizza', 'add', 'take'].includes(m.kind);
  const voiceId = `demo-${m.voice}-${m.kind}`;
  const replay = () => {
    setPhase(0);
    void audio.line(voiceId);
  };
  useEffect(() => {
    void audio.line(voiceId);
    ready.current?.focus({ preventScroll: true });
    return () => audio.stop();
  }, [audio, voiceId]);
  useEffect(() => {
    if (phase >= 3) return;
    const timer = setTimeout(() => setPhase(phase + 1), 1600);
    return () => clearTimeout(timer);
  }, [phase]);
  return (
    <div className="lesson-demo" data-choice-scope>
      <button
        className="demo-replay round-control"
        data-repeat-prompt
        onClick={replay}
        aria-label="Watch the example again"
      >
        <b className="pad-key y-key">Y</b>
      </button>
      <NeighbourPortrait id={m.npc} talking={audio.busy} />
      <div className="demo-example">
        <p className="eyebrow">Watch me</p>
        {counting ? (
          <>
            <div className="demo-equation">
              {m.kind === 'take' ? '3 − 1 = ' : '1 + 1 = '}
              <b>{phase >= 2 ? '2' : '?'}</b>
            </div>
            <div className="demo-objects">
              {[0, 1, ...(m.kind === 'take' ? [2] : [])].map((i) => (
                <span
                  key={i}
                  className={
                    (i === 1 && phase < 1 ? 'waiting ' : '') +
                    (m.kind === 'take' && i === 2 && phase >= 1
                      ? 'crossed-out'
                      : '')
                  }
                >
                  <GamePicture symbol={m.kind === 'pizza' ? '🍅' : '🍎'} />
                </span>
              ))}
            </div>
            <div className="demo-control">
              <b>←</b>
              <output>{phase >= 2 ? 2 : phase}</output>
              <b>→</b>
              <b
                className={'pad-key a-key ' + (phase === 3 ? 'demo-press' : '')}
              >
                A
              </b>
            </div>
          </>
        ) : m.kind === 'pattern' ? (
          <div className="demo-pattern">
            {['🔵', '🔺', '🔵', phase >= 2 ? '🔺' : '?'].map((s, i) => (
              <GamePicture key={i} symbol={s} />
            ))}
          </div>
        ) : m.kind === 'spell' ? (
          <div className="demo-spelling">
            <GamePicture symbol="🟫" />
            <div>
              {['m', 'a', 't'].map((s, i) => (
                <b key={i}>{phase > i ? s : '·'}</b>
              ))}
            </div>
            <span className="pad-key a-key">A</span>
            <span className="pad-key x-key">X</span>
          </div>
        ) : m.kind === 'sound' ? (
          <div className="demo-sound">
            <span>♪</span>
            <b className={phase >= 2 ? 'demo-press' : ''}>m</b>
            <span className="pad-key a-key">A</span>
          </div>
        ) : (
          <div className="demo-pattern">
            <GamePicture
              symbol="🚀"
              className={phase >= 2 ? 'demo-selected-picture' : ''}
            />
            <GamePicture symbol="⛵" />
            <GamePicture symbol="🚲" />
            <b className={'pad-key a-key ' + (phase >= 2 ? 'demo-press' : '')}>
              A
            </b>
          </div>
        )}
        <p>
          {counting
            ? 'Move to choose a number. A checks it.'
            : m.kind === 'spell'
              ? 'Choose each sound. X takes the last one back.'
              : 'Look, listen, choose. Then press A.'}
        </p>
        <button
          ref={ready}
          data-game-choice
          className="adventure-primary"
          onClick={onReady}
        >
          <b className="pad-key a-key">A</b> My turn
        </button>
      </div>
    </div>
  );
}
