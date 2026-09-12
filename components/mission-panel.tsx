'use client';
import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Undo2, Volume2 } from 'lucide-react';
import { type Mission, placeFor } from '@/lib/adventure';
import { AudioDirector, approvedPath, type SoundReviews } from '@/lib/audio';
import { soundFor } from '@/lib/phonics';
import { SPACE_OBJECTS } from '@/lib/space-learning';
import { LessonDemo } from './lesson-demo';
import { GamePicture } from './game-picture';
import { QuantityHint } from './quantity-hint';
import { firstMismatch } from '@/lib/learning-hints';
import { SpaceObject } from './space-object';
import { QuantityDial } from './quantity-dial';
import { PizzaKitchen } from './pizza-kitchen';
import type { PizzaParcel } from '@/lib/delivery-state';
import script from '@/lib/audio-data/adventure-script.json';
export function MissionPanel({
  mission: m,
  active = true,
  audio,
  reviews,
  onComplete,
  onAgain,
  onBack,
  delivery,
  onDeliver,
}: {
  mission: Mission;
  active?: boolean;
  audio: AudioDirector;
  reviews: SoundReviews;
  onComplete: () => number;
  onAgain: () => void;
  onBack: () => void;
  delivery?: PizzaParcel | null;
  onDeliver?: () => void;
}) {
  const [quantity, setQuantity] = useState(0),
    [letters, setLetters] = useState<string[]>([]),
    [answer, setAnswer] = useState(''),
    [done, setDone] = useState(false),
    [feedback, setFeedback] = useState('');
  const [demo, setDemo] = useState(true);
  const [earnedStars, setEarnedStars] = useState(2);
  const adultNeeded = m.parts.some((g) => !approvedPath(g, reviews));
  const [modelled, setModelled] = useState(!m.introduce && !adultNeeded);
  const completed = useRef(false);
  const celebration = useRef<HTMLDivElement>(null);
  const activityContent = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active && !demo && !done)
      activityContent.current
        ?.querySelector<HTMLButtonElement>('[data-game-choice]:not(:disabled)')
        ?.focus({ preventScroll: true });
  }, [active, demo, done, modelled]);
  useEffect(() => {
    if (done)
      celebration.current
        ?.querySelector<HTMLButtonElement>('[data-game-choice]')
        ?.focus();
  }, [done]);
  const friend = placeFor(m.npc);
  const speak = () =>
    audio.lines(
      [adultNeeded ? 'grown-up' : m.prompt],
      adultNeeded ? [] : m.parts,
    );
  useEffect(() => {
    if (active && !demo && m.kind !== 'pizza') void speak();
    return () => audio.stop();
  }, [m, audio, reviews, demo, active]); // eslint-disable-line react-hooks/exhaustive-deps
  const finish = (correct: boolean) => {
    if (completed.current) return;
    if (!correct) {
      setFeedback(
        m.kind === 'spell'
          ? 'Look at the glowing sound space. X takes the last sound back.'
          : m.kind === 'pattern'
            ? 'Look at the repeating group.'
            : m.kind === 'space'
              ? 'Look closely, then listen again.'
              : m.kind === 'sound'
                ? 'Listen to the sound again.'
                : 'Let’s count together',
      );
      const count = ['pack', 'add', 'take'].includes(m.kind);
      if (count)
        void audio.line(
          'hint-' + m.voice + (quantity < m.target ? '-more' : '-fewer'),
        );
      else if (m.kind === 'sound') void speak();
      else
        void audio.line(
          m.kind === 'spell'
            ? 'hint-spell'
            : m.kind === 'pattern'
              ? 'hint-pattern'
              : m.voice + '-retry',
        );
      return;
    }
    completed.current = true;
    setDone(true);
    const earned = onComplete();
    setEarnedStars(earned);
    audio.chime();
    void audio.line(
      earned > 2 && m.kind === 'pizza'
        ? 'garden-pizza-success'
        : m.npc === 'rocket' && m.round < 3
          ? 'part'
          : m.voice + '-success',
    );
  };
  const numberChanged = (n: number) => {
    setQuantity(n);
    setFeedback('');
    void audio.line('number-' + n);
  };
  if (done)
    return (
      <div className="mission-celebration" ref={celebration}>
        <button
          data-repeat-prompt
          className="round-control celebration-listen"
          aria-label="Hear what to do next"
          onClick={() =>
            void audio.line(
              delivery
                ? 'delivery-route-' + delivery.recipient
                : m.voice + '-success',
            )
          }
        >
          <Volume2 />
        </button>
        <div className="reward-stars">{'⭐ '.repeat(earnedStars)}</div>
        <h2>You helped {friend.friend}!</h2>
        {earnedStars > 2 && m.kind === 'pizza' && (
          <p>
            Your garden helped too! +{earnedStars - 2} garden{' '}
            {earnedStars === 3 ? 'star' : 'stars'}
          </p>
        )}
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
          {m.kind === 'pizza' && delivery && onDeliver && (
            <button
              data-game-choice
              className="picture-choice delivery-choice"
              onClick={onDeliver}
            >
              <span className="delivery-pictures">
                <GamePicture symbol="🍕" />
                <span>→</span>
                <GamePicture
                  symbol={
                    delivery.recipient === 'rocket'
                      ? '🧑‍🚀'
                      : placeFor(delivery.recipient).icon
                  }
                />
              </span>
              <span>Deliver to {placeFor(delivery.recipient).friend}</span>
              <b className="pad-key a-key">A</b>
            </button>
          )}
          <button data-game-choice className="picture-choice" onClick={onAgain}>
            <RotateCcw />
            <span>Play again</span>
            {!delivery && <b className="pad-key a-key">A</b>}
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
      {demo && active && (
        <LessonDemo mission={m} audio={audio} onReady={() => setDemo(false)} />
      )}
      <div ref={activityContent} className="mission-content" hidden={demo}>
        <div className="mission-heading">
          <span className="friend-avatar" style={{ background: friend.colour }}>
            {friend.icon}
          </span>
          <div>
            <p>{friend.friend} needs a hand</p>
            <h2>{m.title}</h2>
          </div>
          <button
            data-repeat-prompt={!demo || undefined}
            className="round-control"
            onClick={() => {
              setDemo(true);
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
            active={active && !demo}
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
                {(m.kind === 'pack' ||
                  m.kind === 'add' ||
                  m.kind === 'take') && (
                  <div className="counting-workbench">
                    <div className="counting-picture">
                      {m.kind === 'pack' ? (
                        <>
                          <div className="request-picture">
                            <span>
                              <GamePicture
                                symbol={m.npc === 'rocket' ? '🚀' : '🌙'}
                              />
                            </span>
                            <strong>{m.target}</strong>
                            <span>
                              <GamePicture symbol={m.icon} />
                            </span>
                          </div>
                          <div
                            className="counting-collection"
                            aria-label={`${quantity} collected`}
                          >
                            {Array.from({ length: quantity }, (_, i) => (
                              <span key={i}>
                                <GamePicture symbol={m.icon} />
                              </span>
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
                                  <GamePicture symbol={m.icon} />
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
                                      <GamePicture symbol={m.icon} />
                                    </span>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    {feedback && (
                      <QuantityHint
                        chosen={quantity}
                        target={m.target}
                        symbol={m.icon}
                      />
                    )}
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
                    <div
                      className={
                        'pattern-sequence ' + (feedback ? 'pattern-hint' : '')
                      }
                    >
                      {m.sequence.map((shape, i) => (
                        <span key={i}>
                          <GamePicture symbol={shape} />
                        </span>
                      ))}
                      <span className="pattern-gap">
                        {answer ? <GamePicture symbol={answer} /> : '?'}
                      </span>
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
                          <GamePicture symbol={shape} />
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
                    <div className="word-picture">
                      <GamePicture symbol={m.icon} />
                    </div>
                    <div className="word-spaces">
                      {m.parts.map((_, i) => (
                        <span
                          key={i}
                          className={
                            feedback && firstMismatch(letters, m.parts) === i
                              ? 'hint-sound'
                              : ''
                          }
                        >
                          {letters[i] || '·'}
                        </span>
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
                        onClick={() => {
                          setLetters(letters.slice(0, -1));
                          setFeedback('');
                        }}
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
                        aria-label={SPACE_OBJECTS[symbol]?.name ?? symbol}
                        aria-pressed={answer === symbol}
                        onClick={() => {
                          setAnswer(symbol);
                          finish(symbol === m.answer);
                        }}
                      >
                        <SpaceObject id={symbol} />
                        <strong>{SPACE_OBJECTS[symbol]?.name ?? symbol}</strong>
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
    </div>
  );
}
