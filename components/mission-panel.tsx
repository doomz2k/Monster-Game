'use client';
import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Undo2, Volume2 } from 'lucide-react';
import { type Mission, placeFor } from '@/lib/adventure';
import { AudioDirector, approvedPath, type SoundReviews } from '@/lib/audio';
import { soundFor } from '@/lib/phonics';
import { QuantityDial } from './quantity-dial';
import { PizzaKitchen } from './pizza-kitchen';
import script from '@/lib/audio-data/adventure-script.json';
export function MissionPanel({
  mission: m,
  audio,
  reviews,
  onComplete,
  onAgain,
  onBack,
}: {
  mission: Mission;
  audio: AudioDirector;
  reviews: SoundReviews;
  onComplete: () => void;
  onAgain: () => void;
  onBack: () => void;
}) {
  const [quantity, setQuantity] = useState(0),
    [letters, setLetters] = useState<string[]>([]),
    [answer, setAnswer] = useState(''),
    [done, setDone] = useState(false),
    [feedback, setFeedback] = useState('');
  const adultNeeded = m.parts.some((g) => !approvedPath(g, reviews));
  const [modelled, setModelled] = useState(!m.introduce && !adultNeeded);
  const completed = useRef(false);
  const friend = placeFor(m.npc);
  const speak = () =>
    audio.lines(
      [adultNeeded ? 'grown-up' : m.prompt],
      adultNeeded ? [] : m.parts,
    );
  useEffect(() => {
    if (m.kind !== 'pizza') void speak();
    return () => audio.stop();
  }, [m, audio, reviews]); // eslint-disable-line react-hooks/exhaustive-deps
  const finish = (correct: boolean) => {
    if (completed.current) return;
    if (!correct) {
      setFeedback('Let’s try again');
      void audio.line(m.voice + '-retry');
      return;
    }
    completed.current = true;
    setDone(true);
    onComplete();
    audio.chime();
    void audio.line(
      m.npc === 'rocket' && m.round < 3 ? 'part' : m.voice + '-success',
    );
  };
  const numberChanged = (n: number) => {
    setQuantity(n);
    setFeedback('');
    void audio.line('number-' + n);
  };
  if (done)
    return (
      <div className="mission-celebration">
        <div className="reward-stars">⭐ ⭐</div>
        <h2>You helped {friend.friend}!</h2>
        {m.npc === 'rocket' && m.round < 3 && (
          <p>
            {
              [
                'Control panel fixed!',
                'Fuel tank filled!',
                'The rocket is ready!',
              ][m.round]
            }
          </p>
        )}
        <div className="big-actions">
          <button data-game-choice className="picture-choice" onClick={onAgain}>
            <RotateCcw />
            <span>Play again</span>
            <b className="pad-key a-key">A</b>
          </button>
          <button data-game-choice className="picture-choice" onClick={onBack}>
            <span className="choice-picture">🌳</span>
            <span>Explore</span>
          </button>
        </div>
      </div>
    );
  return (
    <div className={'mission-panel mission-' + m.kind}>
      <div className="mission-heading">
        <span className="friend-avatar" style={{ background: friend.colour }}>
          {friend.icon}
        </span>
        <div>
          <p>{friend.friend} needs a hand</p>
          <h2>{m.title}</h2>
        </div>
        <button
          data-repeat-prompt={m.kind !== 'pizza' ? true : undefined}
          className="round-control"
          onClick={() => {
            if (m.kind === 'pizza')
              document
                .querySelector<HTMLButtonElement>(
                  '.pizza-kitchen [data-repeat-prompt]',
                )
                ?.click();
            else void speak();
          }}
          aria-label="Listen again"
        >
          <Volume2 />
        </button>
      </div>
      {m.kind !== 'pizza' && (
        <p className="mission-prompt">
          {(script as Record<string, { text: string }>)[m.prompt]?.text}
        </p>
      )}
      {m.kind === 'pizza' && m.recipe ? (
        <PizzaKitchen
          recipe={m.recipe}
          max={m.total}
          audio={audio}
          onComplete={() => finish(true)}
        />
      ) : (
        <>
          {(m.kind === 'sound' || m.kind === 'spell') && !modelled ? (
            <div className="sound-teaching">
              <div className="sound-target">{m.parts.join(' · ')}</div>
              <p>
                {adultNeeded
                  ? 'Grown-up: say the pure sounds together.'
                  : 'Listen, then say it together.'}
              </p>
              {m.parts.map((g) => (
                <p key={g} className="sound-tip">
                  {soundFor(g)?.tip}
                </p>
              ))}
              <button
                data-game-choice
                className="adventure-primary"
                onClick={() => setModelled(true)}
              >
                <b className="pad-key a-key">A</b> Ready to try
              </button>
            </div>
          ) : (
            <>
              {(m.kind === 'pack' || m.kind === 'add' || m.kind === 'take') && (
                <div className="counting-workbench">
                  <div className="counting-picture">
                    {m.kind === 'pack' ? (
                      <>
                        <div className="request-picture">
                          <span>{m.npc === 'rocket' ? '🚀' : '🌙'}</span>
                          <strong>{m.target}</strong>
                          <span>{m.icon}</span>
                        </div>
                        <div
                          className="counting-collection"
                          aria-label={`${quantity} collected`}
                        >
                          {Array.from({ length: quantity }, (_, i) => (
                            <span key={i}>{m.icon}</span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="number-equation">
                          <b>{m.total}</b>
                          <span>{m.kind === 'add' ? '+' : '−'}</span>
                          <b>{m.second}</b>
                          <span>=</span>
                          <b>?</b>
                        </div>
                        <div className="maths-scene">
                          <div
                            className="quantity-group"
                            aria-label={`${m.total} ${m.kind === 'take' ? 'with ' + m.second + ' taken away' : 'objects'}`}
                          >
                            {Array.from({ length: m.total }, (_, i) => (
                              <span
                                key={i}
                                className={
                                  'visual-counter ' +
                                  (m.kind === 'take' && i >= m.target
                                    ? 'crossed-out'
                                    : '')
                                }
                              >
                                {m.icon}
                              </span>
                            ))}
                          </div>
                          {m.kind === 'add' && (
                            <>
                              <span className="math-symbol">+</span>
                              <div
                                className="quantity-group"
                                aria-label={`${m.second} more`}
                              >
                                {Array.from({ length: m.second }, (_, i) => (
                                  <span className="visual-counter" key={i}>
                                    {m.icon}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <QuantityDial
                    value={quantity}
                    max={Math.max(m.total, ...m.choices.map(Number))}
                    onChange={numberChanged}
                    onConfirm={() => finish(quantity === m.target)}
                  />
                </div>
              )}
              {m.kind === 'pattern' && (
                <>
                  <div className="pattern-sequence">
                    {m.sequence.map((shape, i) => (
                      <span key={i}>{shape}</span>
                    ))}
                    <span className="pattern-gap">{answer || '?'}</span>
                  </div>
                  <div className="answer-row picture-answers">
                    {m.choices.map((shape) => (
                      <button
                        data-game-choice
                        key={shape}
                        aria-pressed={shape === answer}
                        onClick={() => {
                          setAnswer(shape);
                          finish(shape === m.answer);
                        }}
                      >
                        {shape}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {m.kind === 'sound' && (
                <div className="answer-row letter-answers">
                  {m.choices.map((g) => (
                    <button
                      data-game-choice
                      key={g}
                      aria-pressed={answer === g}
                      className={answer === g ? 'chosen' : ''}
                      onClick={() => {
                        setAnswer(g);
                        finish(g === m.answer);
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
              {m.kind === 'spell' && (
                <>
                  <div className="word-picture">{m.icon}</div>
                  <div className="word-spaces">
                    {m.parts.map((_, i) => (
                      <span key={i}>{letters[i] || '·'}</span>
                    ))}
                  </div>
                  <div className="answer-row letter-answers">
                    {m.choices.map((g) => (
                      <button
                        data-game-choice
                        key={g}
                        onClick={() => {
                          const next = [...letters, g];
                          if (letters.length < m.parts.length) {
                            setLetters(next);
                            if (next.length === m.parts.length)
                              finish(next.join('') === m.answer);
                          }
                        }}
                      >
                        {g}
                      </button>
                    ))}
                    <button
                      data-game-choice
                      data-game-undo
                      onClick={() => setLetters(letters.slice(0, -1))}
                      aria-label="Take the last letter back"
                    >
                      <Undo2 />
                    </button>
                  </div>
                </>
              )}
              {m.kind === 'space' && (
                <div className="answer-row space-answers">
                  {m.choices.map((symbol) => (
                    <button
                      data-game-choice
                      key={symbol}
                      aria-label={
                        {
                          '🌍': 'Earth',
                          '☀️': 'The Sun',
                          '🌙': 'The Moon',
                          '🪐': 'Saturn',
                        }[symbol]
                      }
                      aria-pressed={answer === symbol}
                      onClick={() => {
                        setAnswer(symbol);
                        finish(symbol === m.answer);
                      }}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              )}
              <div className="mission-footer">
                <output aria-live="polite">{feedback}</output>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
