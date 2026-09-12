'use client';
import { useEffect, useRef } from 'react';
import type { Action } from '@/lib/input';
import type { AudioDirector } from '@/lib/audio';
import { GamePicture } from './game-picture';
import { TUTORIAL_STEPS } from '@/lib/tutorial';
export function ControllerTutorial({
  step,
  selected,
  audio,
  onAction,
  onFinish,
  onMove,
}: {
  step: number;
  selected: number;
  audio: AudioDirector;
  onAction: (a: Action) => void;
  onFinish: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const start = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    void audio.line('tutorial-' + TUTORIAL_STEPS[step]);
    start.current?.focus({ preventScroll: true });
    return () => audio.stop();
  }, [audio, step]);
  return (
    <section
      className={'controller-tutorial tutorial-' + TUTORIAL_STEPS[step]}
      aria-label="Learn the controls"
    >
      <div className="tutorial-card">
        <div className="tutorial-progress" aria-label={`Step ${step + 1} of 6`}>
          {TUTORIAL_STEPS.map((s, i) => (
            <span key={s} className={i <= step ? 'filled' : ''} />
          ))}
        </div>
        <h2>
          {
            [
              'Let’s play together',
              'Take a little walk',
              'Choose the apple',
              'Press the green A',
              'Red B goes back',
              'You’re ready!',
            ][step]
          }
        </h2>
        {step === 1 ? (
          <div className="tutorial-pad">
            {[
              { x: 0, y: -1, label: 'Walk forwards', icon: '↑' },
              { x: -1, y: 0, label: 'Walk left', icon: '←' },
              { x: 1, y: 0, label: 'Walk right', icon: '→' },
              { x: 0, y: 1, label: 'Walk backwards', icon: '↓' },
            ].map((d, i) => (
              <button
                key={d.label}
                className={'lesson-direction direction-' + i}
                aria-label={d.label}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  onMove(d.x, d.y);
                }}
                onPointerUp={() => onMove(0, 0)}
                onLostPointerCapture={() => onMove(0, 0)}
                onPointerCancel={() => onMove(0, 0)}
              >
                {d.icon}
              </button>
            ))}
          </div>
        ) : step === 2 || step === 3 ? (
          <div className="tutorial-choices">
            {['🌼', '🍎'].map((s, i) => (
              <button
                key={s}
                aria-label={i ? 'Apple' : 'Flower'}
                className={selected === i ? 'selected' : ''}
                onClick={() =>
                  onAction(i ? (step === 2 ? 'right' : 'confirm') : 'left')
                }
              >
                <GamePicture symbol={s} />
              </button>
            ))}
          </div>
        ) : step === 4 ? (
          <div className="tutorial-basket">
            <GamePicture symbol="🧺" />
            <GamePicture symbol="🍎" />
            <button
              className="tutorial-back"
              onClick={() => onAction('back')}
              aria-label="Back"
            >
              <b className="pad-key b-key">B</b>
            </button>
          </div>
        ) : (
          <GamePicture
            symbol={step === 5 ? '⭐' : '🏡'}
            className="tutorial-hero"
          />
        )}
        {[0, 3, 5].includes(step) && (
          <button
            ref={start}
            className="adventure-primary"
            onClick={step === 5 ? onFinish : () => onAction('confirm')}
          >
            <b className="pad-key a-key">A</b>
            {step === 5 ? 'Explore' : step === 3 ? 'Choose' : 'Let’s go'}
          </button>
        )}
        <button
          className="tutorial-listen round-control"
          onClick={() => onAction('listen')}
          aria-label="Listen again"
        >
          <b className="pad-key y-key">Y</b>
        </button>
      </div>
    </section>
  );
}
