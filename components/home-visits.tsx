'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Heart,
  RotateCcw,
  Volume2,
  Users,
  LockKeyhole,
} from 'lucide-react';
import {
  DANCE_MOVES,
  MOVE_LABELS,
  VISITORS,
  visitorAvailable,
  visitorAdmires,
  visitDance,
  type VisitorId,
  type DanceMove,
} from '@/lib/home-visits';
import type { ProgressData } from '@/lib/learning';
import type { AudioDirector } from '@/lib/audio';
import { GamePicture } from './game-picture';
import { HomeVisitStage } from './home-visit-stage';
import { DancePicture } from './dance-picture';

export function HomeVisits({
  progress: p,
  active,
  audio,
  onComplete,
  onMeet,
  onBack,
}: {
  progress: ProgressData;
  active: boolean;
  audio: AudioDirector;
  onComplete: (
    id: VisitorId,
    round: number,
    answers: readonly DanceMove[],
  ) => boolean;
  onMeet: (id: VisitorId) => void;
  onBack: () => void;
}) {
  const [visitor, setVisitor] = useState<VisitorId>('shop'),
    [playing, setPlaying] = useState(false),
    [round, setRound] = useState(0),
    [step, setStep] = useState(0),
    [done, setDone] = useState(false),
    [hint, setHint] = useState(false),
    [move, setMove] = useState<DanceMove | null>(null),
    [take, setTake] = useState(0);
  const root = useRef<HTMLDivElement>(null),
    finished = useRef(false),
    line = useRef('visits-intro');
  const guest = VISITORS.find((v) => v.id === visitor)!,
    sequence = visitDance(visitor, round),
    expected = sequence[step];
  const say = (id: string) => {
    line.current = id;
    void audio.line(id);
  };
  const invite = (id: VisitorId) => {
    if (!visitorAvailable(p, id)) {
      onMeet(id);
      return;
    }
    setVisitor(id);
    setRound(p.adventure.visits[id]);
    setStep(0);
    setHint(false);
    setDone(false);
    setMove(null);
    setPlaying(true);
    finished.current = false;
    say('visit-' + (visitorAdmires(p, id) ? 'admire-' : 'hello-') + id);
  };
  const leave = () => {
    if (playing) {
      setPlaying(false);
      setDone(false);
      setMove(null);
      say('visits-intro');
    } else onBack();
  };
  useEffect(() => {
    if (active) {
      void audio.line(line.current);
      root.current
        ?.querySelector<HTMLButtonElement>('[data-game-autofocus]')
        ?.focus({ preventScroll: true });
    }
    return () => audio.stop();
  }, [active, audio]);
  useEffect(() => {
    if (active)
      root.current
        ?.querySelector<HTMLButtonElement>('[data-game-autofocus]')
        ?.focus({ preventScroll: true });
  }, [playing, done, active]);
  const perform = (answer: DanceMove) => {
    if (finished.current) return;
    setMove(answer);
    setTake((n) => n + 1);
    if (answer !== expected) {
      setHint(true);
      say('visit-move-' + expected);
      return;
    }
    setHint(false);
    if (step + 1 === sequence.length) {
      if (!onComplete(visitor, round, sequence)) return;
      finished.current = true;
      setDone(true);
      audio.chime();
      say('visit-success-' + visitor);
    } else {
      setStep((n) => n + 1);
      say('visit-move-' + sequence[step + 1]);
    }
  };
  return (
    <div className="home-visits" ref={root}>
      <button hidden data-visit-back onClick={leave}>
        Back
      </button>
      <div className="visits-heading">
        <div>
          <small>AT MONSTER’S LITTLE HOME</small>
          <h1>
            {playing
              ? done
                ? 'A lovely dance!'
                : 'Copy ' + guest.name
              : 'A friend round to play'}
          </h1>
        </div>
        <button
          data-repeat-prompt
          className="round-control"
          aria-label="Hear the visit instructions"
          onClick={() =>
            say(playing && !done ? 'visit-move-' + expected : line.current)
          }
        >
          <b className="pad-key y-key">Y</b>
          <Volume2 />
        </button>
      </div>
      <div className="visits-workspace">
        <HomeVisitStage
          progress={p}
          visitor={visitor}
          active={active}
          demonstration={playing && !done ? expected : null}
          move={move}
          take={take}
          celebrating={done}
          isTalking={() => audio.busy}
        />
        <div className="visits-choices">
          {!playing ? (
            <>
              <h2>Who shall we invite?</h2>
              <div className="visitor-grid">
                {VISITORS.map((v) => {
                  const available = visitorAvailable(p, v.id);
                  return (
                    <button
                      key={v.id}
                      data-game-choice
                      data-game-autofocus={v.id === visitor || undefined}
                      aria-pressed={visitor === v.id}
                      aria-label={
                        available
                          ? 'Invite ' + v.name
                          : 'Meet ' + v.name + ' first'
                      }
                      onFocus={() => setVisitor(v.id)}
                      onClick={() => invite(v.id)}
                    >
                      <GamePicture symbol={v.icon} />
                      <strong>{v.name}</strong>
                      {available ? (
                        <Heart size={16} />
                      ) : (
                        <LockKeyhole size={16} />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="visits-intro-copy">
                {visitorAvailable(p, visitor)
                  ? 'A little dance together. No hurry.'
                  : 'Help ' + guest.name + ' once, then invite them round.'}
              </p>
              <button
                data-game-choice
                className="adventure-primary"
                onClick={() => invite(visitor)}
              >
                <b className="pad-key a-key">A</b>
                {visitorAvailable(p, visitor)
                  ? 'Invite ' + guest.name
                  : 'Meet ' + guest.name}
              </button>
            </>
          ) : done ? (
            <>
              <div className="visit-reward">
                <GamePicture symbol="⭐" />
                <GamePicture symbol="⭐" />
              </div>
              <h2>You danced together!</h2>
              <div className="dance-complete-strip">
                {sequence.map((m, i) => (
                  <DancePicture key={i} move={m} />
                ))}
              </div>
              <button
                data-game-choice
                data-game-autofocus
                className="adventure-primary"
                onClick={() => invite(visitor)}
              >
                <b className="pad-key a-key">A</b>
                <RotateCcw />
                Another dance
              </button>
              <button
                data-game-choice
                className="adventure-secondary"
                onClick={leave}
              >
                <Users />
                Another friend
              </button>
            </>
          ) : (
            <>
              <div
                className={'dance-sequence ' + (hint ? 'dance-hint' : '')}
                aria-label="Copy these moves in order"
              >
                {sequence.map((m, i) => (
                  <div
                    key={i}
                    className={
                      i < step
                        ? 'dance-copied'
                        : i === step
                          ? 'dance-current'
                          : ''
                    }
                    aria-label={
                      MOVE_LABELS[m] +
                      (i < step ? ', copied' : i === step ? ', this move' : '')
                    }
                  >
                    <DancePicture move={m} />
                    {i < step ? <Check /> : <span>{i + 1}</span>}
                    {i < sequence.length - 1 && (
                      <ArrowRight className="dance-arrow" />
                    )}
                  </div>
                ))}
              </div>
              <h2>{hint ? 'Copy the glowing picture' : 'Your turn'}</h2>
              <div className="dance-moves">
                {DANCE_MOVES.map((m, i) => (
                  <button
                    key={m}
                    data-game-choice
                    data-game-autofocus={i === 0 || undefined}
                    aria-label={MOVE_LABELS[m]}
                    className={hint && m === expected ? 'dance-help' : ''}
                    onClick={() => perform(m)}
                  >
                    <DancePicture move={m} />
                    <strong>{MOVE_LABELS[m]}</strong>
                  </button>
                ))}
              </div>
              <button
                data-game-choice
                data-game-undo
                disabled={step === 0}
                className="dance-undo"
                onClick={() => {
                  setStep((n) => Math.max(0, n - 1));
                  setHint(false);
                  setMove(null);
                }}
              >
                <b className="pad-key x-key">X</b>One move back
              </button>
            </>
          )}
        </div>
      </div>
      <div className="visits-footer">
        <button className="back-control" onClick={leave}>
          <b className="pad-key b-key">B</b>Back
        </button>
        <span>✚ Choose a picture</span>
        <span>
          <b className="pad-key a-key">A</b>
          {done ? 'Another dance' : playing ? 'Do the move' : 'Invite'}
        </span>
      </div>
    </div>
  );
}
