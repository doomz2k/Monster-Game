'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Gamepad2,
  Map,
  Pause,
  Play,
  Settings,
  Sparkles,
  Star,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ParentPanel } from '@/components/parent-panel';
import type { MonsterWorld, WorldState, WorldUpdate } from '@/lib/world';
import { registerGameTools } from '@/lib/webmcp';
import { GameInput, type Action } from '@/lib/input';
import {
  AudioDirector,
  approvedPath,
  loadReviews,
  type SoundReviews,
  type AudioStep,
} from '@/lib/audio';
import {
  ZONES,
  questionFor,
  award,
  freshProgress,
  readProgress,
  type ProgressData,
  type Question,
  type ZoneId,
} from '@/lib/learning';
import { soundFor } from '@/lib/phonics';
type Mode = 'welcome' | 'explore' | 'challenge' | 'map' | 'pause' | 'parents';
const SAVE = 'monster-game-progress-v1';
function Key({ letter }: { letter: 'a' | 'b' | 'x' | 'y' }) {
  return (
    <span className={'pad-key ' + letter + '-key'}>{letter.toUpperCase()}</span>
  );
}
function Shape({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 100 100" className="shape-picture" aria-label={name}>
      {name === 'circle' ? (
        <circle cx="50" cy="50" r="34" fill="#e7b453" />
      ) : name === 'square' ? (
        <rect x="18" y="18" width="64" height="64" rx="4" fill="#7eabc9" />
      ) : (
        <path d="M50 13L90 84H10Z" fill="#bd8fc7" strokeLinejoin="round" />
      )}
    </svg>
  );
}
function Dice({ number }: { number: number }) {
  const positions: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
  return (
    <svg viewBox="0 0 100 100" className="die" aria-label={number + ' dots'}>
      {(positions[number] ?? []).map((i) => (
        <circle
          key={i}
          cx={22 + (i % 3) * 28}
          cy={22 + Math.floor(i / 3) * 28}
          r="8"
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
function MiniMap({ position }: { position: WorldUpdate }) {
  return (
    <svg viewBox="0 0 180 150" aria-label="Map of four learning areas">
      <path
        d="M30 20Q85 -2 142 27Q179 47 154 111Q119 157 57 132Q-3 119 15 59Z"
        fill="#9cc88a"
        stroke="#e9d9a5"
        strokeWidth="8"
      />
      <path d="M111 14Q168 28 162 85Q152 126 118 139L100 89Z" fill="#f2d49d" />
      <path d="M24 36Q44 13 76 15L71 87L19 97Z" fill="#baa8d5" />
      <path d="M37 114Q89 140 113 131L104 99L64 92Z" fill="#e8b3bd" />
      <path
        d="M88 40L88 113M41 76L135 76"
        fill="none"
        stroke="#f9e9bc"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {ZONES.map((z) => (
        <circle
          key={z.id}
          cx={90 + z.x * 2}
          cy={73 + z.z * 2}
          r="5"
          fill={z.colour}
          stroke="white"
          strokeWidth="2"
        />
      ))}
      <circle
        cx={90 + position.x * 2}
        cy={73 + position.z * 2}
        r="6"
        fill="#ffd646"
        stroke="#684d2e"
        strokeWidth="2"
      />
    </svg>
  );
}
export default function Game() {
  const host = useRef<HTMLDivElement>(null),
    world = useRef<MonsterWorld | null>(null),
    input = useRef<GameInput | null>(null);
  const visitAction = useRef<(id: ZoneId) => void>(() => {});
  const [mode, setMode] = useState<Mode>('welcome'),
    [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false),
    [muted, setMuted] = useState(false),
    [connected, setConnected] = useState(false);
  const [progress, setProgress] = useState<ProgressData>(freshProgress),
    [reviews, setReviews] = useState<SoundReviews>({}),
    [position, setPosition] = useState<WorldUpdate>({
      x: 0,
      z: 5,
      zone: 'meadow',
      near: null,
    });
  const [target, setTarget] = useState<ZoneId>('meadow'),
    [question, setQuestion] = useState<Question | null>(null),
    [activity, setActivity] = useState<ZoneId>('meadow');
  const [selection, setSelection] = useState(0),
    [success, setSuccess] = useState(false),
    [feedback, setFeedback] = useState(''),
    [notice, setNotice] = useState(''),
    [teach, setTeach] = useState(false),
    [parentLed, setParentLed] = useState(false);
  const [saveReady, setSaveReady] = useState(false);
  const [resumeMode, setResumeMode] = useState<Mode>('explore');
  const answered = useRef(false);
  const latest = useRef({
    mode,
    progress,
    reviews,
    position,
    question,
    selection,
    success,
    teach,
    parentLed,
    activity,
    ready,
  });
  const [audioDirector] = useState(
    () => new AudioDirector(() => ({}), setNotice),
  );
  const runtime = useRef<WorldState>({
    active: false,
    welcome: true,
    moveX: 0,
    moveY: 0,
    turn: 0,
    completed: [],
    target: 'meadow',
  });
  const handlers = useRef<(a: Action) => void>(() => {});
  useEffect(() => {
    /* oxlint-disable react/react-compiler -- Hydrate browser-only saved progress after SSR. This is an external storage synchronisation, not derived render state. */
    try {
      setProgress(readProgress(localStorage.getItem(SAVE)));
    } catch {
      setProgress(freshProgress());
    }
    setReviews(loadReviews());
    setSaveReady(true);
    /* oxlint-enable react/react-compiler */
    let alive = true;
    input.current = new GameInput(
      (a) => handlers.current(a),
      (x, y, turn) =>
        Object.assign(runtime.current, { moveX: x, moveY: y, turn }),
      (yes) => setConnected(yes),
    );
    import('@/lib/world')
      .then(({ MonsterWorld }) => {
        if (!alive || !host.current) return;
        try {
          world.current = new MonsterWorld(
            host.current,
            () => runtime.current,
            setPosition,
            () => setFailed(true),
          );
          setReady(true);
        } catch (e) {
          console.error('World initialisation failed', e);
          setFailed(true);
        }
      })
      .catch(() => setFailed(true));
    const blur = () => {
      audioDirector?.stop();
      if (
        latest.current.mode === 'explore' ||
        latest.current.mode === 'challenge'
      ) {
        setResumeMode(latest.current.mode);
        setMode('pause');
      }
    };
    window.addEventListener('blur', blur);
    return () => {
      alive = false;
      world.current?.dispose();
      input.current?.dispose();
      audioDirector?.dispose();
      window.removeEventListener('blur', blur);
    };
  }, [audioDirector]);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: Parameters<typeof registerGameTools>[0];
      }
    ).modelContext;
    return registerGameTools(context, {
      state: () => ({
        mode: latest.current.mode,
        area: latest.current.position.zone,
        stars: latest.current.progress.completed.length,
        knownSounds: latest.current.progress.knownSounds,
        question: latest.current.question
          ? {
              kind: latest.current.question.kind,
              title: latest.current.question.title,
              options: latest.current.question.options,
            }
          : null,
      }),
      visit: async (id) => {
        if (!latest.current.ready)
          throw new Error('The world is still loading.');
        visitAction.current(id as ZoneId);
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        return { area: id, mode: 'explore' };
      },
    });
  }, []);
  useEffect(() => {
    if (saveReady) {
      try {
        localStorage.setItem(SAVE, JSON.stringify(progress));
      } catch {
        // oxlint-disable-next-line react/react-compiler -- Surface a failure from the external storage API.
        setNotice(
          'Progress could not be saved in this browser. You can still play this session.',
        );
      }
    }
  }, [progress, saveReady]);
  const stop = () => {
    audioDirector?.stop();
    setNotice('');
  };
  const start = () => {
    if (!ready) return;
    audioDirector?.unlock();
    setMode('explore');
    void audioDirector?.say(
      'Hello Clover! I’m Clo. Let’s explore! Follow the sparkle to Counting Meadow.',
    );
  };
  const pause = () => {
    if (mode === 'pause') {
      setMode(resumeMode);
      return;
    }
    if (mode === 'parents') return;
    setResumeMode(mode);
    stop();
    setMode('pause');
    setSelection(0);
  };
  const close = () => {
    stop();
    if (mode === 'parents') {
      setMode('pause');
      setSelection(0);
    } else if (mode === 'pause') setMode(resumeMode);
    else if (mode === 'challenge' || mode === 'map') {
      setMode('explore');
      setQuestion(null);
    } else if (mode === 'explore') pause();
  };
  const listen = (q = question) => {
    audioDirector?.unlock();
    setNotice('');
    if (!q) {
      void audioDirector?.say(
        mode === 'welcome'
          ? 'Hello Clover! I’m Clo. Let’s play!'
          : 'Follow the sparkle to ' +
              ZONES.find((z) => z.id === target)!.name +
              '. Press A at the glowing spot to play.',
      );
      return;
    }
    if (success) {
      void audioDirector?.say(q.encouragement);
      return;
    }
    const steps: AudioStep[] = [{ type: 'narration', text: q.speech }];
    if (q.parts?.length) {
      if (q.parts.every((g) => approvedPath(g, reviews)))
        q.parts.forEach((g) => steps.push({ type: 'phoneme', grapheme: g }));
      else {
        setParentLed(true);
        setNotice(
          'Grown-up: say the pure sound' +
            (q.parts.length > 1 ? 's' : '') +
            ' shown, then let Clover choose.',
        );
        return;
      }
    }
    void audioDirector?.run(steps);
  };
  const openQuestion = (id: ZoneId) => {
    stop();
    const p = latest.current.progress,
      q = questionFor(id, p);
    setActivity(id);
    setQuestion(q);
    setSuccess(false);
    answered.current = false;
    setSelection(0);
    setFeedback('');
    setNotice('');
    setTeach(Boolean(q.introduce));
    const led = Boolean(q.parts?.some((g) => !approvedPath(g, reviews)));
    setParentLed(led);
    setMode('challenge');
    if (q.introduce) {
      const s = soundFor(q.introduce)!;
      if (!led)
        void audioDirector?.run([
          {
            type: 'narration',
            text: 'Let’s learn a new sound. Listen, then say it with me.',
          },
          { type: 'phoneme', grapheme: s.grapheme },
        ]);
    } else if (!led) {
      const steps: AudioStep[] = [
        { type: 'narration', text: q.speech },
        ...(q.parts ?? []).map((grapheme) => ({
          type: 'phoneme' as const,
          grapheme,
        })),
      ];
      void audioDirector?.run(steps);
    }
  };
  const finishTeaching = () => {
    if (!question) return;
    const g = question.introduce;
    if (g && !progress.knownSounds.includes(g))
      setProgress((p) => ({
        ...p,
        knownSounds: [...new Set([...p.knownSounds, g])],
      }));
    setTeach(false);
    setParentLed(false);
    setNotice('');
    if (question.parts?.every((g) => approvedPath(g, reviews)))
      listen(question);
  };
  const choose = (index: number) => {
    if (!question || answered.current) return;
    setSelection(index);
    if (question.options[index] === question.answer) {
      answered.current = true;
      setSuccess(true);
      setFeedback('Lovely work, Clover!');
      setProgress((p) => award(p, activity, question));
      audioDirector?.chime();
      world.current?.celebrate();
      void audioDirector?.say(question.encouragement);
    } else {
      setFeedback('Let’s try another one. You’ve got this!');
      void audioDirector?.say('Let’s have another try. Take your time.');
    }
  };
  const travel = (id: ZoneId) => {
    stop();
    setTarget(id);
    setMode('explore');
    world.current?.travel(id);
    void audioDirector?.say(
      'Welcome to ' +
        ZONES.find((z) => z.id === id)!.name +
        '. Press A to play.',
    );
  };
  const openMap = () => {
    if (!ready) return;
    if (mode === 'map') {
      close();
      return;
    }
    stop();
    setMode('map');
    setSelection(ZONES.findIndex((z) => z.id === target));
  };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    audioDirector.setMuted(next);
  };
  const handleAction = (action: Action) => {
    if (action === 'suspend') {
      if (mode === 'explore' || mode === 'challenge') pause();
      return;
    }
    if (action === 'listen') {
      listen();
      return;
    }
    if (action === 'pause') {
      pause();
      return;
    }
    if (action === 'back') {
      close();
      return;
    }
    if (
      action === 'map' &&
      mode !== 'parents' &&
      mode !== 'challenge' &&
      mode !== 'pause'
    ) {
      openMap();
      return;
    }
    if (['left', 'right', 'up', 'down'].includes(action)) {
      const delta = action === 'left' || action === 'up' ? -1 : 1;
      const length =
        mode === 'challenge' && !success && !teach && !parentLed
          ? (question?.options.length ?? 1)
          : mode === 'map'
            ? 4
            : mode === 'pause'
              ? 4
              : 1;
      if (length > 1) setSelection((i) => (i + delta + length) % length);
      return;
    }
    if (action !== 'confirm') return;
    audioDirector?.unlock();
    if (mode === 'welcome') start();
    else if (mode === 'explore') {
      if (position.near) openQuestion(position.near);
      else world.current?.jump();
    } else if (mode === 'challenge') {
      if (teach || parentLed) finishTeaching();
      else if (success) openQuestion(activity);
      else choose(selection);
    } else if (mode === 'map') travel(ZONES[selection % 4].id);
    else if (mode === 'pause') {
      if (selection === 0) setMode(resumeMode);
      if (selection === 1) openMap();
      if (selection === 2) toggleMute();
      if (selection === 3) {
        setMode('parents');
        stop();
      }
    }
  };
  // The imperative animation and controller loops only see committed React state.
  useLayoutEffect(() => {
    audioDirector.setReviews(reviews);
    latest.current = {
      mode,
      progress,
      reviews,
      position,
      question,
      selection,
      success,
      teach,
      parentLed,
      activity,
      ready,
    };
    Object.assign(runtime.current, {
      active: mode === 'explore',
      welcome: mode === 'welcome',
      completed: progress.completed,
      target,
    });
    visitAction.current = travel;
    handlers.current = handleAction;
  });
  const zone = ZONES.find((z) => z.id === position.zone)!,
    destination = ZONES.find((z) => z.id === target)!,
    rounds = progress.rounds,
    visited = ZONES.filter((z) => rounds[z.id] >= 3).length;
  const modal = ['challenge', 'map', 'pause', 'parents'].includes(mode);
  const modalTitle =
    mode === 'map'
      ? 'Where shall we go?'
      : mode === 'pause'
        ? 'Time for a little rest'
        : mode === 'parents'
          ? 'For grown-ups'
          : success
            ? 'You did it!'
            : teach
              ? 'Meet a new sound'
              : parentLed
                ? 'Let’s play together'
                : (question?.title ?? 'Let’s play');
  const touch = (x: number, y: number) => {
    if (input.current) input.current.touch = { x, y };
  };
  return (
    <main className={'game-shell ' + (mode === 'explore' ? 'playing' : '')}>
      <div ref={host} className="world-canvas" />
      <div className="world-vignette" />
      <header className="game-header">
        <div className="brand">
          <span className="brand-symbol">
            <Sparkles size={24} />
          </span>
          <div>
            <span className="brand-kicker">CLO’S</span>
            <h1>
              little world<span>✦</span>
            </h1>
          </div>
        </div>
        <div className="location-pill">
          <Sun size={19} />
          <span>{zone.name}</span>
          <span className="location-dot" />
        </div>
        <div className="header-actions">
          <span
            className="stars-pill"
            aria-label={progress.completed.length + ' stars earned'}
          >
            <Star size={22} fill="currentColor" />
            {progress.completed.length}
            <span>stars</span>
          </span>
          <button
            className="icon-button sound-toggle"
            aria-label={muted ? 'Turn sound on' : 'Mute sound'}
            onClick={toggleMute}
          >
            {muted ? <VolumeX size={21} /> : <Volume2 size={21} />}
          </button>
          <button
            className="icon-button"
            aria-label="Pause game"
            onClick={pause}
          >
            <Pause size={21} />
          </button>
        </div>
      </header>
      <aside className="adventure-card">
        <div className="eyebrow">
          <Sparkles size={15} />
          {visited === 4 ? 'HAPPY LITTLE EXPLORER' : 'A LITTLE ADVENTURE'}
        </div>
        <h2>
          {mode === 'welcome' ? (
            <>
              Big discoveries.
              <br />
              Little steps.
            </>
          ) : (
            <>
              A little wonder
              <br />
              in every corner.
            </>
          )}
        </h2>
        <p>
          {mode === 'welcome' ? (
            <>
              A whole world to explore,
              <br />
              one happy hop at a time.
            </>
          ) : (
            <>
              Play three activities in each place.
              <br />
              {visited} of 4 places explored.
            </>
          )}
        </p>
        {mode !== 'welcome' && (
          <Progress
            value={visited * 25}
            className="adventure-progress"
            aria-label="Places explored"
          />
        )}
        <div className="adventure-divider" />
        <button
          className="destination"
          onClick={() => {
            setTarget(destination.id);
            listen();
          }}
        >
          <span className="destination-icon">{destination.icon}</span>
          <div>
            <strong>{destination.name}</strong>
            <span>{destination.short}</span>
          </div>
          <ArrowRight size={18} />
        </button>
      </aside>
      {mode === 'welcome' && (
        <>
          <div className="world-label">
            <span>✦</span> A world of wonder awaits
          </div>
          <section className="welcome-card">
            <span className="eyebrow">MEET YOUR NEW LITTLE FRIEND</span>
            <h2>
              Hello, I’m Clo<span>!</span>
            </h2>
            <p>Shall we go on an adventure?</p>
            <button
              className="primary-button"
              disabled={!ready || failed}
              onClick={start}
            >
              <Key letter="a" />
              {ready ? 'Let’s play' : 'Growing your world…'}
              <ArrowRight size={22} />
            </button>
            <div className="start-hint">
              <Gamepad2 size={18} />
              {connected
                ? 'Click once for sound · then press A'
                : 'Click to play · Xbox controller or keyboard'}
            </div>
          </section>
        </>
      )}
      {mode === 'explore' && (
        <div className="explore-prompt">
          <button
            className="play-prompt"
            onClick={() =>
              position.near
                ? openQuestion(position.near)
                : world.current?.jump()
            }
          >
            <Key letter="a" />
            {position.near ? 'Let’s play at ' + zone.name : 'Hop, Clo!'}
            {position.near && <Sparkles size={20} />}
          </button>
          <span>
            {position.near
              ? zone.intro
              : 'Follow the sparkle, or explore your own way.'}
          </span>
        </div>
      )}
      {mode === 'explore' && (
        <div className="touch-controls" aria-label="Touch movement controls">
          {[
            { x: 0, y: -1, Icon: ChevronUp, name: 'Move forward' },
            { x: -1, y: 0, Icon: ChevronLeft, name: 'Move left' },
            { x: 0, y: 1, Icon: ChevronDown, name: 'Move back' },
            { x: 1, y: 0, Icon: ChevronRight, name: 'Move right' },
          ].map(({ x, y, Icon, name }, i) => (
            <button
              key={name}
              className={'touch-direction direction-' + i}
              aria-label={name}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                touch(x, y);
              }}
              onPointerUp={() => touch(0, 0)}
              onLostPointerCapture={() => touch(0, 0)}
              onPointerCancel={() => touch(0, 0)}
            >
              <Icon />
            </button>
          ))}
        </div>
      )}
      {failed && (
        <div className="error-card" role="alert">
          <strong>The 3D world couldn’t open.</strong>
          <p>Try Chrome or Edge with graphics acceleration enabled.</p>
          <button
            className="secondary-button"
            onClick={() => location.reload()}
          >
            Try again
          </button>
        </div>
      )}
      <button className="map-card" onClick={openMap} disabled={!ready}>
        <div className="map-heading">
          <span>
            <Map size={17} /> Your little world
          </span>
          <Key letter="x" />
        </div>
        <div className="mini-map">
          <MiniMap position={position} />
          <span className="map-north">N</span>
        </div>
        <span className="map-caption">Four places. So much to discover.</span>
      </button>
      <footer className="control-bar">
        <div className="control-group">
          <span className="stick-key">L</span>
          <span>Move</span>
          <Key letter="a" />
          <span>Hop / Play</span>
          <Key letter="y" />
          <span>Listen</span>
        </div>
        <span className="gentle-note">
          <Sun size={16} /> No rush. Just wonder.
        </span>
        <span className="keyboard-hint">
          {connected
            ? 'Controller connected · right stick to look'
            : 'WASD / arrows · Space · M for map'}
        </span>
      </footer>
      {notice && !modal && (
        <output className="floating-notice">
          {notice}
          <button onClick={() => setNotice('')} aria-label="Dismiss message">
            <X size={16} />
          </button>
        </output>
      )}
      <Dialog
        open={modal}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className={
            'game-dialog ' + (mode === 'parents' ? 'parents-dialog' : '')
          }
        >
          <div className="dialog-top">
            <span className="eyebrow">
              {mode === 'challenge'
                ? ZONES.find((z) => z.id === activity)!.name
                : 'CLO’S LITTLE WORLD'}
            </span>
            <button
              className="icon-button"
              onClick={close}
              aria-label={
                mode === 'challenge' ? 'Return to exploring' : 'Close'
              }
            >
              <X size={20} />
            </button>
          </div>
          <DialogTitle className="dialog-title">{modalTitle}</DialogTitle>
          <DialogDescription className="dialog-description">
            {mode === 'map'
              ? 'Pick a place, and Clo will hop over.'
              : mode === 'pause'
                ? 'Your adventure will be right here.'
                : mode === 'parents'
                  ? 'Learning settings and pronunciation checks.'
                  : success
                    ? 'One happy little discovery.'
                    : teach
                      ? 'Listen, look, and say it together.'
                      : parentLed
                        ? 'A grown-up can say the sounds while we get the recordings ready.'
                        : question?.kind === 'sound'
                          ? 'Listen, then choose the matching letters.'
                          : question?.kind === 'blend'
                            ? 'Say each sound, then blend them together.'
                            : 'Take your time. Let’s try it together.'}
          </DialogDescription>
          {mode === 'map' && (
            <div className="places-grid">
              {ZONES.map((z, i) => (
                <button
                  key={z.id}
                  className={
                    'place-card ' + (selection === i ? 'selected' : '')
                  }
                  onFocus={() => setSelection(i)}
                  onClick={() => travel(z.id)}
                >
                  <span className="place-emoji">{z.icon}</span>
                  <strong>{z.name}</strong>
                  <span>{z.skill}</span>
                  <div className="place-stars">
                    {[0, 1, 2].map((n) => (
                      <Star
                        key={n}
                        size={17}
                        fill={rounds[z.id] > n ? '#e6b737' : 'none'}
                        color={rounds[z.id] > n ? '#e6b737' : '#cad0bb'}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
          {mode === 'pause' && (
            <div className="pause-menu">
              {[
                {
                  text: 'Keep exploring',
                  Icon: Play,
                  fn: () => setMode(resumeMode),
                },
                { text: 'Visit another place', Icon: Map, fn: openMap },
                {
                  text: muted ? 'Turn sound on' : 'Turn sound off',
                  Icon: muted ? VolumeX : Volume2,
                  fn: toggleMute,
                },
                {
                  text: 'Grown-ups',
                  Icon: Settings,
                  fn: () => {
                    setMode('parents');
                    stop();
                  },
                },
              ].map(({ text, Icon, fn }, i) => (
                <button
                  key={i}
                  className={
                    'menu-button ' + (selection === i ? 'selected' : '')
                  }
                  onFocus={() => setSelection(i)}
                  onClick={fn}
                >
                  <Icon size={21} />
                  {text}
                  <ChevronRight size={18} />
                </button>
              ))}
              <p className="saved-note">
                {progress.completed.length} stars · Saved on this device
              </p>
            </div>
          )}
          {mode === 'parents' && (
            <ParentPanel
              progress={progress}
              onProgress={setProgress}
              reviews={reviews}
              onReviews={setReviews}
              audio={audioDirector}
            />
          )}
          {mode === 'challenge' && question && (
            <>
              {(teach || parentLed) && !success ? (
                <div className="teaching">
                  <div className="teaching-sounds">
                    {question.parts?.map((g, i) => (
                      <span key={i}>{g}</span>
                    ))}
                  </div>
                  <p>
                    {question.parts?.map((g) => soundFor(g)?.tip).join(' ')}
                  </p>
                  <div className="teaching-actions">
                    {question.parts?.every((g) => approvedPath(g, reviews)) ? (
                      <button
                        className="secondary-button"
                        onClick={() => {
                          const steps: AudioStep[] = (question.parts ?? []).map(
                            (grapheme) => ({ type: 'phoneme', grapheme }),
                          );
                          void audioDirector?.run(steps);
                        }}
                      >
                        <Volume2 size={20} />
                        Hear the sound
                      </button>
                    ) : (
                      <p className="grownup-tip">
                        Grown-up: model the sound
                        {(question.parts?.length ?? 0) > 1 ? 's' : ''} above,
                        then choose “Ready”.
                      </p>
                    )}
                    <button className="primary-button" onClick={finishTeaching}>
                      <Key letter="a" />
                      Ready to try
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              ) : success ? (
                <div className="success-scene">
                  <div className="success-star">
                    <Star size={76} fill="currentColor" strokeWidth={1.5} />
                  </div>
                  <p>{question.encouragement}</p>
                  {activity === 'garden' && (
                    <div className="bloom-reward">🌷 🌼 🌷</div>
                  )}
                  {activity === 'woods' && (
                    <div className="bloom-reward">🚀 ✨</div>
                  )}
                  {activity === 'cove' && (
                    <div className="bloom-reward">🐠 🫧 🐚</div>
                  )}
                  <button
                    className="primary-button"
                    onClick={() => openQuestion(activity)}
                  >
                    <Key letter="a" />
                    Play another
                    <ArrowRight size={20} />
                  </button>
                  <button className="text-button" onClick={close}>
                    Back to exploring
                  </button>
                </div>
              ) : (
                <>
                  <div className="question-visual">
                    {question.kind === 'count' && (
                      <div className="count-items">
                        {Array.from(
                          { length: question.amount ?? 0 },
                          (_, i) => (
                            <button
                              key={i}
                              className="count-object"
                              onClick={(e) => {
                                e.currentTarget.classList.add('counted');
                                void audioDirector?.say(String(i + 1));
                              }}
                              aria-label={'Count object ' + (i + 1)}
                            >
                              {question.items}
                              <span>{i + 1}</span>
                            </button>
                          ),
                        )}
                      </div>
                    )}
                    {question.kind === 'subtract' && (
                      <div className="count-items">
                        {Array.from(
                          { length: question.amount ?? 0 },
                          (_, i) => (
                            <span
                              key={i}
                              className={
                                'count-object ' +
                                (i >=
                                (question.amount ?? 0) - (question.second ?? 0)
                                  ? 'taken-away'
                                  : '')
                              }
                            >
                              {question.items}
                            </span>
                          ),
                        )}
                      </div>
                    )}
                    {question.kind === 'add' && (
                      <div className="dice-equation">
                        <Dice number={question.amount!} />
                        <span>+</span>
                        <Dice number={question.second!} />
                        <span>= ?</span>
                      </div>
                    )}
                    {question.kind === 'sound' && (
                      <button
                        className="listen-orb"
                        onClick={() => listen()}
                        aria-label="Hear the sound again"
                      >
                        <Volume2 size={48} />
                        <span>Listen</span>
                      </button>
                    )}
                    {question.kind === 'blend' && (
                      <div className="blend-display">
                        {question.parts?.map((g, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (approvedPath(g, reviews))
                                void audioDirector?.run([
                                  { type: 'phoneme', grapheme: g },
                                ]);
                              else {
                                setParentLed(true);
                                setNotice(
                                  'Grown-up: model the sounds together.',
                                );
                              }
                            }}
                          >
                            {g}
                            <span />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div
                    className={
                      'answer-options ' +
                      (question.kind === 'compare' ? 'comparison-options' : '')
                    }
                  >
                    {question.options.map((option, i) => (
                      <button
                        key={option}
                        className={
                          'answer-button ' + (selection === i ? 'selected' : '')
                        }
                        onFocus={() => setSelection(i)}
                        onPointerEnter={() => setSelection(i)}
                        onClick={() => choose(i)}
                        aria-label={
                          question.kind === 'compare'
                            ? (option === 'left' ? 'Left' : 'Right') + ' group'
                            : option
                        }
                      >
                        {question.kind === 'shape' ? (
                          <Shape name={option} />
                        ) : question.kind === 'compare' ? (
                          <div className="fish-group">
                            {Array.from(
                              {
                                length:
                                  option === 'left'
                                    ? question.amount!
                                    : question.second!,
                              },
                              (_, n) => (
                                <span key={n}>🐠</span>
                              ),
                            )}
                          </div>
                        ) : (
                          <span
                            className={
                              question.kind === 'sound' ? 'answer-grapheme' : ''
                            }
                          >
                            {option}
                          </span>
                        )}
                        <span className="answer-selector">
                          {selection === i ? (
                            <Key letter="a" />
                          ) : (
                            <span className="empty-selector" />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="question-footer">
                    <button
                      className="secondary-button"
                      onClick={() => listen()}
                    >
                      <Key letter="y" />
                      Listen again
                    </button>
                    <span>← → choose · A to pick</span>
                  </div>
                  <output className="feedback">
                    {feedback || 'You can have as many tries as you like.'}
                  </output>
                </>
              )}
            </>
          )}
          {notice && <output className="notice">{notice}</output>}
        </DialogContent>
      </Dialog>
    </main>
  );
}
