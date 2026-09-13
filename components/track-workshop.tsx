'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  RotateCw,
  RotateCcw,
  Volume2,
  Flag,
  Check,
} from 'lucide-react';
import {
  trackTask,
  inspectTrack,
  nextTrackHint,
  trackRidePoint,
} from '@/lib/track-workshop';
import type { ProgressData } from '@/lib/learning';
import type { AudioDirector } from '@/lib/audio';
import { NeighbourPortrait } from './neighbour-portrait';
import { GamePicture } from './game-picture';
import { TrackPiecePicture, TrackRoverPicture } from './track-piece';
import { useGamePreferences } from './game-preferences';

export function TrackWorkshop({
  progress: p,
  active,
  audio,
  onComplete,
  onBack,
}: {
  progress: ProgressData;
  active: boolean;
  audio: AudioDirector;
  onComplete: (round: number, turns: readonly number[]) => boolean;
  onBack: () => void;
}) {
  const [round, setRound] = useState(p.adventure.workshop),
    [turns, setTurns] = useState(() => trackTask(p.adventure.workshop).turns),
    [history, setHistory] = useState<number[][]>([]),
    [phase, setPhase] = useState<'build' | 'drive' | 'done'>('build'),
    [help, setHelp] = useState(p.adventure.workshop < 2),
    [tried, setTried] = useState(false),
    [travel, setTravel] = useState(0),
    [route, setRoute] = useState<number[]>([]);
  const root = useRef<HTMLDivElement>(null),
    elapsed = useRef(0),
    finishRef = useRef(() => {}),
    finished = useRef(false),
    line = useRef('workshop-intro'),
    lastEdited = useRef(4);
  const { reducedMotion } = useGamePreferences(),
    task = trackTask(round),
    inspection = inspectTrack(task, turns),
    hint = inspection.connected ? null : nextTrackHint(task, turns),
    rideTask = { ...task, path: route.length ? route : task.path },
    ride = trackRidePoint(rideTask, travel);
  const say = (id: string) => {
    line.current = id;
    void audio.line(id);
  };
  const finish = () => {
    if (finished.current) return;
    if (onComplete(round, turns)) {
      finished.current = true;
      setTravel(ride.duration);
      setPhase('done');
      audio.chime();
      say('workshop-success');
    } else {
      setPhase('build');
      setTried(true);
      say('workshop-try');
    }
  };
  useLayoutEffect(() => {
    finishRef.current = finish;
  });
  useEffect(() => {
    if (active) void audio.line(line.current);
  }, [active, audio]);
  useEffect(() => {
    if (!active) return;
    const selector =
      phase === 'build' && !inspection.connected
        ? '[data-track-cell]:not(:disabled)'
        : '[data-workshop-go]';
    root.current
      ?.querySelector<HTMLButtonElement>(selector)
      ?.focus({ preventScroll: true });
  }, [active, phase, round, inspection.connected]);
  useEffect(() => {
    if (!active || phase !== 'drive') return;
    let frame = 0,
      last = 0,
      drawn = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min(50, now - last) : 0;
      last = now;
      if (!document.hidden) {
        elapsed.current += reducedMotion ? ride.duration : dt;
        if (now - drawn >= 1000 / 30) {
          setTravel(elapsed.current);
          drawn = now;
        }
        if (elapsed.current >= ride.duration) {
          finishRef.current();
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, phase, ride.duration, reducedMotion]);
  const rotate = (cell: number) => {
    if (phase !== 'build') return;
    const next = [...turns];
    next[cell] = (next[cell] + 1) % 4;
    lastEdited.current = cell;
    setHistory((h) => [...h, turns].slice(-24));
    setTurns(next);
    setTried(false);
    if (inspectTrack(task, next).connected) say('workshop-ready');
  };
  const undo = () => {
    if (phase !== 'build' || !history.length) return;
    setTurns(history[history.length - 1]);
    setHistory(history.slice(0, -1));
    setTried(false);
    requestAnimationFrame(() =>
      root.current
        ?.querySelector<HTMLButtonElement>(
          '[data-track-cell="' + lastEdited.current + '"]',
        )
        ?.focus({ preventScroll: true }),
    );
  };
  const go = () => {
    if (phase === 'done') {
      const next = trackTask(p.adventure.workshop);
      setRound(next.round);
      setTurns(next.turns);
      setHistory([]);
      setPhase('build');
      setHelp(next.round < 2);
      setTried(false);
      setRoute([]);
      setTravel(0);
      finished.current = false;
      say('workshop-intro');
      return;
    }
    if (phase === 'drive') {
      finish();
      return;
    }
    if (!inspection.connected) {
      setTried(true);
      setHelp(true);
      say('workshop-try');
      return;
    }
    setRoute(inspection.visited);
    elapsed.current = 0;
    setTravel(0);
    setPhase('drive');
    say('workshop-drive');
  };
  const firstRow = Math.floor(task.path[0] / 3),
    lastRow = Math.floor(task.path[task.path.length - 1] / 3);
  return (
    <div className="track-workshop" ref={root}>
      <div className="track-heading">
        <div>
          <small>PIP’S TINKERING TABLE</small>
          <h1>
            {phase === 'done' ? 'All the way home!' : 'A road for our rover'}
          </h1>
        </div>
        <button
          className="round-control"
          data-repeat-prompt
          aria-label="Show how to turn the track"
          onClick={() => {
            setHelp(true);
            say(phase === 'build' ? 'workshop-help' : line.current);
          }}
        >
          <b className="pad-key y-key">Y</b>
          <Volume2 />
        </button>
      </div>
      <div className="track-workspace">
        <div className="track-table">
          <div
            className="track-start"
            style={{ top: ((firstRow + 0.5) / 3) * 100 + '%' }}
          >
            <ArrowRight />
          </div>
          <div
            className="track-finish"
            style={{ top: ((lastRow + 0.5) / 3) * 100 + '%' }}
          >
            <Flag />
          </div>
          <div className="track-grid">
            {Array.from({ length: 9 }, (_, cell) => {
              const piece = task.pieces.find((p) => p.cell === cell);
              if (!piece)
                return (
                  <div key={cell} className="track-scenery">
                    <GamePicture symbol={cell % 2 ? '🌼' : '🌳'} />
                  </div>
                );
              const picture = (
                <>
                  <TrackPiecePicture ports={piece.ports} turn={turns[cell]} />
                  {phase === 'build' && (help || tried) && hint === cell && (
                    <TrackPiecePicture ports={piece.ports} ghost />
                  )}
                  {piece.editable && <RotateCw className="track-turn-mark" />}
                </>
              );
              return piece.editable ? (
                <button
                  key={cell}
                  data-game-choice
                  data-game-autofocus={
                    (!inspection.connected &&
                      cell === task.pieces.find((p) => p.editable)?.cell) ||
                    undefined
                  }
                  data-track-cell={cell}
                  className={
                    'track-tile track-turnable ' +
                    (hint === cell && (help || tried) ? 'track-highlight' : '')
                  }
                  disabled={phase !== 'build'}
                  aria-label={'Turn track ' + (cell + 1)}
                  onClick={() => rotate(cell)}
                >
                  {picture}
                </button>
              ) : (
                <div className="track-tile track-fixed" key={cell}>
                  {picture}
                </div>
              );
            })}
          </div>
          {(phase === 'drive' || phase === 'done') && (
            <div
              className="track-cart"
              style={{
                left: ((ride.x + 0.5) / 3) * 100 + '%',
                top: ((ride.y + 0.5) / 3) * 100 + '%',
                transform: 'translate(-50%,-50%) rotate(' + ride.angle + 'deg)',
              }}
            >
              <TrackRoverPicture colour={p.appearance.colour} />
            </div>
          )}
        </div>
        <aside className="track-coach">
          <NeighbourPortrait
            id="rocket"
            active={active}
            isTalking={() => audio.busy}
          />
          <div className="track-status" aria-live="polite">
            {phase === 'done' ? (
              <>
                <div className="track-prize">
                  <GamePicture symbol="⭐" />
                  <GamePicture symbol="⭐" />
                </div>
                <h2>We made a road!</h2>
              </>
            ) : phase === 'drive' ? (
              <>
                <h2>Off we go!</h2>
                <p>Follow our little rover</p>
              </>
            ) : (
              <>
                <h2>
                  {inspection.connected
                    ? 'Ready to roll!'
                    : tried
                      ? 'Try the glowing piece'
                      : 'Turn the little tracks'}
                </h2>
                <p>
                  {inspection.connected ? (
                    <>
                      <Check /> Our road joins up
                    </>
                  ) : (
                    <>Join the arrow to the flag</>
                  )}
                </p>
              </>
            )}
          </div>
          <button
            className="adventure-primary"
            data-game-choice
            data-workshop-go
            data-game-autofocus={
              phase !== 'build' || inspection.connected || undefined
            }
            onClick={go}
          >
            <b className="pad-key a-key">A</b>
            {phase === 'done'
              ? 'Another road'
              : phase === 'drive'
                ? 'Arrive now'
                : 'Try our rover'}
          </button>
          <button
            className="track-undo"
            data-game-choice
            data-game-undo
            disabled={!history.length || phase !== 'build'}
            onClick={undo}
          >
            <b className="pad-key x-key">X</b>
            <RotateCcw />
            One turn back
          </button>
        </aside>
      </div>
      <div className="track-footer">
        <button className="back-control" onClick={onBack}>
          <b className="pad-key b-key">B</b>Back
        </button>
        <span>
          {phase === 'build' ? '✚ Choose a track' : 'Our little road'}
        </span>
        <span>
          <b className="pad-key a-key">A</b>
          {phase === 'build'
            ? 'Turn it'
            : phase === 'drive'
              ? 'Arrive now'
              : 'Another road'}
        </span>
      </div>
    </div>
  );
}
