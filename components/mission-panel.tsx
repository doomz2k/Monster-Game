'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, RotateCcw, Undo2, Volume2 } from 'lucide-react';
import { type Mission, placeFor } from '@/lib/adventure';
import { AudioDirector, approvedPath, type SoundReviews } from '@/lib/audio';
import { soundFor } from '@/lib/phonics';
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
  const [selected, setSelected] = useState<number[]>([]),
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
  const toggle = (i: number) => {
    if (done) return;
    setFeedback('');
    setSelected((old) =>
      old.includes(i) ? old.filter((n) => n !== i) : [...old, i],
    );
  };
  const check = () =>
    finish(
      m.kind === 'pack'
        ? selected.length === m.target
        : m.kind === 'spell'
          ? letters.join('') === m.answer
          : m.kind === 'add' || m.kind === 'take'
            ? answer === m.answer &&
              selected.length ===
                (m.kind === 'add' ? m.total + m.second : m.second)
            : answer === m.answer,
    );
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
              {m.kind === 'pack' && (
                <>
                  <div className="request-picture">
                    <span>
                      {m.npc === 'rocket'
                        ? '🚀'
                        : m.npc === 'moon'
                          ? '🌙'
                          : '🧺'}
                    </span>
                    <strong>{m.target}</strong>
                    <div className="target-dots">
                      {Array.from({ length: m.target }, (_, i) => (
                        <span
                          key={i}
                          className={i < selected.length ? 'filled' : ''}
                        >
                          ●
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="object-tray">
                    {Array.from({ length: m.total }, (_, i) => (
                      <button
                        data-game-choice
                        key={i}
                        className={
                          'count-object ' +
                          (selected.includes(i) ? 'packed' : '')
                        }
                        aria-label={
                          (selected.includes(i) ? 'Unpack' : 'Pack') +
                          ' object ' +
                          (i + 1)
                        }
                        aria-pressed={selected.includes(i)}
                        onClick={() => toggle(i)}
                      >
                        {m.icon}
                        {selected.includes(i) && <Check />}
                      </button>
                    ))}
                  </div>
                  <div className="basket-count">
                    {selected.length}{' '}
                    <span>
                      {m.npc === 'rocket' ? 'in the fuel tank' : 'collected'}
                    </span>
                  </div>
                </>
              )}
              {(m.kind === 'add' || m.kind === 'take') && (
                <>
                  <div className="maths-scene">
                    <div className="quantity-group">
                      {Array.from({ length: m.total }, (_, i) => (
                        <button
                          data-game-choice
                          key={i}
                          aria-label={
                            (m.kind === 'take'
                              ? 'Send fish '
                              : 'Move object ') +
                            (i + 1)
                          }
                          className={
                            'count-object ' +
                            (selected.includes(i) ? 'moved' : '')
                          }
                          onClick={() => toggle(i)}
                        >
                          {m.icon}
                        </button>
                      ))}
                    </div>
                    <span className="math-symbol">
                      {m.kind === 'add' ? '+' : '→'}
                    </span>
                    {m.kind === 'add' ? (
                      <div className="quantity-group">
                        {Array.from({ length: m.second }, (_, i) => (
                          <button
                            data-game-choice
                            key={i}
                            className={
                              'count-object ' +
                              (selected.includes(i + m.total) ? 'moved' : '')
                            }
                            aria-label={'Move object ' + (i + m.total + 1)}
                            onClick={() => toggle(i + m.total)}
                          >
                            {m.icon}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="boat-picture">
                        ⛵<span>{m.second}</span>
                      </div>
                    )}
                  </div>
                  <div className="collection-bed">
                    {selected.length ? (
                      selected.map((i) => (
                        <button
                          data-game-choice
                          key={i}
                          aria-label={'Put object ' + (i + 1) + ' back'}
                          onClick={() => toggle(i)}
                        >
                          {m.icon}
                        </button>
                      ))
                    ) : (
                      <span>
                        {m.kind === 'take' ? '⛵' : '🌱'} Move them here
                      </span>
                    )}
                  </div>
                  <div className="answer-row">
                    {m.choices.map((n) => (
                      <button
                        data-game-choice
                        key={n}
                        className={answer === n ? 'chosen' : ''}
                        aria-pressed={answer === n}
                        onClick={() => {
                          setAnswer(n);
                          void audio.line('number-' + n);
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </>
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
                        onClick={() => setAnswer(shape)}
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
                      onClick={() => setAnswer(g)}
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
                          if (letters.length < m.parts.length)
                            setLetters([...letters, g]);
                        }}
                      >
                        {g}
                      </button>
                    ))}
                    <button
                      data-game-choice
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
                      onClick={() => setAnswer(symbol)}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              )}
              <div className="mission-footer">
                <output aria-live="polite">{feedback}</output>
                <button
                  data-game-choice
                  className="adventure-primary check-answer"
                  onClick={check}
                >
                  <b className="pad-key a-key">A</b>
                  <Check /> Check
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
