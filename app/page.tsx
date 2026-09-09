'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  House,
  Map,
  Pause,
  Play,
  Settings,
  Shirt,
  Star,
  RotateCcw,
  Footprints,
  Hand,
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
import { ParentPanel } from '@/components/parent-panel';
import { LaunchScreen } from '@/components/launch-screen';
import { WardrobePanel } from '@/components/wardrobe-panel';
import {
  equipItem,
  isUnlocked,
  itemsFor,
  moveWardrobeSelection,
  newlyUnlocked,
  type Cosmetic,
  type OutfitSlot,
} from '@/lib/wardrobe';
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
import {
  ArrivalGuide,
  explorationSpeech,
  movePictureSelection,
  pauseSpeech,
} from '@/lib/play-guidance';
type Mode =
  | 'welcome'
  | 'explore'
  | 'challenge'
  | 'map'
  | 'pause'
  | 'parents'
  | 'wardrobe';
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
  const [wardrobeReturn, setWardrobeReturn] = useState<
    'welcome' | 'pause' | 'challenge'
  >('welcome');
  const [parentsReturn, setParentsReturn] = useState<'welcome' | 'pause'>(
    'pause',
  );
  const [wardrobeSlot, setWardrobeSlot] = useState<OutfitSlot>('hat');
  const [wardrobeMessage, setWardrobeMessage] = useState('');
  const [unlocks, setUnlocks] = useState<Cosmetic[]>([]);
  const answered = useRef(false);
  const [arrivalGuide] = useState(() => new ArrivalGuide());
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
    showcase: 'launch',
    outfit: progress.outfit,
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
        outfit: latest.current.progress.outfit,
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
    if (!ready || failed) return;
    audioDirector?.unlock();
    setMode('explore');
    setQuestion(null);
    setSelection(0);
    void audioDirector?.say(
      progress.completed.length
        ? 'Welcome back! ' + explorationSpeech(position.near, target)
        : 'Hello! I’m Monster. ' + explorationSpeech(position.near, target),
    );
  };
  const openParents = () => {
    stop();
    setParentsReturn(mode === 'welcome' ? 'welcome' : 'pause');
    setMode('parents');
  };
  const openWardrobe = (from: 'welcome' | 'pause' | 'challenge') => {
    if (!ready || failed) return;
    stop();
    audioDirector.unlock();
    setWardrobeReturn(from);
    setWardrobeSlot('hat');
    setSelection(
      Math.max(
        0,
        itemsFor('hat').findIndex((item) => item.id === progress.outfit.hat),
      ),
    );
    setWardrobeMessage('');
    setMode('wardrobe');
    void audioDirector.say(
      'Let’s dress up Monster! Choose a hat or an accessory.',
    );
  };
  const switchWardrobe = (slot: OutfitSlot) => {
    setWardrobeSlot(slot);
    setSelection(
      Math.max(
        0,
        itemsFor(slot).findIndex((item) => item.id === progress.outfit[slot]),
      ),
    );
    setWardrobeMessage('');
  };
  const wear = (item: Cosmetic) => {
    audioDirector.unlock();
    if (!isUnlocked(item, progress.completed.length)) {
      const remaining = item.stars - progress.completed.length;
      const message =
        remaining +
        ' more ' +
        (remaining === 1 ? 'star' : 'stars') +
        ' to discover the ' +
        item.name.toLowerCase() +
        '. Keep exploring!';
      setWardrobeMessage(message);
      void audioDirector.say(message);
      return;
    }
    setProgress((p) => ({
      ...p,
      outfit: equipItem(p.outfit, item.id, p.completed.length),
    }));
    setWardrobeMessage(
      item.id.startsWith('no-')
        ? 'Just right. Looking lovely, Monster!'
        : item.name + '. Looking lovely, Monster!',
    );
    audioDirector.chime();
    void audioDirector.say(
      item.id.startsWith('no-')
        ? 'Looking lovely, Monster!'
        : item.name + '. Looking lovely, Monster!',
    );
  };
  const launch = () => {
    stop();
    setQuestion(null);
    setSuccess(false);
    setSelection(0);
    setMode('welcome');
  };
  const pause = () => {
    if (mode === 'pause') {
      setMode(resumeMode);
      return;
    }
    if (mode === 'parents' || mode === 'wardrobe' || mode === 'welcome') return;
    setResumeMode(mode);
    audioDirector.stop();
    setMode('pause');
    setSelection(0);
    void audioDirector.say('Take a little rest. Press A to play again.');
  };
  const close = () => {
    stop();
    if (mode === 'wardrobe') {
      setMode(wardrobeReturn);
      setSelection(wardrobeReturn === 'challenge' ? 0 : 1);
    } else if (mode === 'parents') {
      setMode(parentsReturn);
      setSelection(parentsReturn === 'welcome' ? 2 : 4);
    } else if (mode === 'pause') setMode(resumeMode);
    else if (mode === 'challenge' || mode === 'map') {
      setMode('explore');
      setQuestion(null);
    } else if (mode === 'explore') pause();
  };
  const listen = (q = question) => {
    audioDirector?.unlock();
    setNotice('');
    if (mode === 'wardrobe') {
      const item = itemsFor(wardrobeSlot)[selection];
      void audioDirector.say(
        item
          ? item.name +
              (isUnlocked(item, progress.completed.length)
                ? '. Press A to wear it.'
                : '. Keep playing to earn ' + item.stars + ' stars.')
          : 'All dressed! Press A to go back.',
      );
      return;
    }
    if (mode === 'welcome') {
      void audioDirector.say(
        'Hello Clover! I’m Monster. Choose let’s play, or dress me up for our adventure!',
      );
      return;
    }
    if (mode === 'map') {
      void audioDirector.say(ZONES[selection].name + '. Press A to visit.');
      return;
    }
    if (mode === 'pause') {
      void audioDirector.say(pauseSpeech(selection, muted));
      return;
    }
    if (mode === 'explore' || !q) {
      if (position.near)
        arrivalGuide.acknowledge(position.near, performance.now());
      void audioDirector.say(explorationSpeech(position.near, target));
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
    setUnlocks([]);
    answered.current = false;
    setSelection(0);
    setFeedback('');
    setNotice('');
    setTeach(Boolean(q.introduce));
    const led = Boolean(q.parts?.some((g) => !approvedPath(g, reviews)));
    setParentLed(led);
    setMode('challenge');
    arrivalGuide.acknowledge(id, performance.now());
    if (led)
      void audioDirector.say(
        'Let’s ask a grown-up to say these sounds with us.',
      );
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
      setSelection(0);
      setFeedback('Lovely work, Clover!');
      const before = latest.current.progress;
      const earned = award(before, activity, question);
      const rewards = newlyUnlocked(
        before.completed.length,
        earned.completed.length,
      );
      setProgress(earned);
      setUnlocks(rewards);
      audioDirector?.chime();
      world.current?.celebrate();
      void audioDirector?.say(
        question.encouragement +
          (rewards.length
            ? ' A new dress-up surprise! You found the ' +
              rewards.map((item) => item.name).join(' and ') +
              '.'
            : ''),
      );
    } else {
      setFeedback('Let’s try another one. You’ve got this!');
      void audioDirector?.say('Let’s have another try. Take your time.');
    }
  };
  const travel = (id: ZoneId) => {
    stop();
    setTarget(id);
    setQuestion(null);
    setMode('explore');
    arrivalGuide.acknowledge(id, performance.now());
    world.current?.travel(id);
    void audioDirector?.say(
      'Welcome to ' +
        ZONES.find((z) => z.id === id)!.name +
        '. ' +
        explorationSpeech(id, id),
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
    void audioDirector.say(
      'Where shall we go? ' +
        ZONES.find((z) => z.id === target)!.name +
        '. Press A to visit.',
    );
  };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    audioDirector.setMuted(next);
  };
  const selectPicture = (index: number) => {
    setSelection(index);
    audioDirector.unlock();
    if (mode === 'map')
      void audioDirector.say(ZONES[index].name + '. Press A to visit.');
    if (mode === 'pause') void audioDirector.say(pauseSpeech(index, muted));
  };
  const handleAction = (action: Action) => {
    if (mode === 'parents' && action !== 'back') return;
    if (mode === 'wardrobe') {
      if (action === 'previousTab' || action === 'nextTab') {
        switchWardrobe(wardrobeSlot === 'hat' ? 'accessory' : 'hat');
        return;
      }
      if (action === 'map') {
        world.current?.turnShowcase();
        return;
      }
      if (
        action === 'left' ||
        action === 'right' ||
        action === 'up' ||
        action === 'down'
      ) {
        setSelection((index) =>
          moveWardrobeSelection(index, action, itemsFor(wardrobeSlot).length),
        );
        return;
      }
      if (action === 'confirm') {
        const item = itemsFor(wardrobeSlot)[selection];
        if (item) wear(item);
        else close();
        return;
      }
    }
    if (mode === 'welcome' && action === 'map') {
      openWardrobe('welcome');
      return;
    }
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
      if (mode === 'map' || mode === 'pause') {
        selectPicture(
          movePictureSelection(
            selection,
            action as 'left' | 'right' | 'up' | 'down',
            mode === 'map' ? 4 : 6,
          ),
        );
        return;
      }
      const delta = action === 'left' || action === 'up' ? -1 : 1;
      const length =
        mode === 'challenge' && !success && !teach && !parentLed
          ? (question?.options.length ?? 1)
          : mode === 'welcome'
            ? 3
            : mode === 'challenge' && success && unlocks.length
              ? 2
              : 1;
      if (length > 1) setSelection((i) => (i + delta + length) % length);
      return;
    }
    if (action !== 'confirm') return;
    audioDirector?.unlock();
    if (mode === 'welcome') {
      if (selection === 0) start();
      if (selection === 1) openWardrobe('welcome');
      if (selection === 2) openParents();
    } else if (mode === 'explore') {
      if (position.near) openQuestion(position.near);
      else world.current?.jump();
    } else if (mode === 'challenge') {
      if (teach || parentLed) finishTeaching();
      else if (success) {
        if (selection === 1 && unlocks.length) openWardrobe('challenge');
        else openQuestion(activity);
      } else choose(selection);
    } else if (mode === 'map') travel(ZONES[selection % 4].id);
    else if (mode === 'pause') {
      if (selection === 0) setMode(resumeMode);
      if (selection === 1) openWardrobe('pause');
      if (selection === 2) openMap();
      if (selection === 3) toggleMute();
      if (selection === 4) openParents();
      if (selection === 5) launch();
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
      showcase:
        mode === 'welcome' ? 'launch' : mode === 'wardrobe' ? 'wardrobe' : null,
      outfit: progress.outfit,
    });
    visitAction.current = travel;
    handlers.current = handleAction;
  });
  useEffect(() => {
    const now = performance.now();
    const near = arrivalGuide.offer(
      mode === 'explore' ? position.near : null,
      now,
    );
    if (near && audioDirector.trySay(explorationSpeech(near, target))) {
      arrivalGuide.acknowledge(near, now);
    }
  }, [mode, position, target, audioDirector, arrivalGuide]);
  const nearby = ZONES.find((z) => z.id === position.near);
  const rounds = progress.rounds;
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
    <main
      className={
        'game-shell ' +
        (connected ? 'controller-active ' : '') +
        (mode === 'explore' ? 'playing' : '') +
        (mode === 'welcome'
          ? ' showcase-mode launch-mode'
          : mode === 'wardrobe'
            ? ' showcase-mode wardrobe-mode'
            : '')
      }
    >
      <div ref={host} className="world-canvas" />
      <div className="world-vignette" />
      {mode === 'explore' && (
        <button
          className={'world-pause' + (notice ? ' has-notice' : '')}
          aria-label={
            notice ? 'Pause game. Grown-up help available.' : 'Pause game'
          }
          onClick={pause}
        >
          <Pause size={25} aria-hidden="true" />
        </button>
      )}
      {mode === 'welcome' && (
        <LaunchScreen
          stars={progress.completed.length}
          ready={ready && !failed && saveReady}
          connected={connected}
          selection={selection}
          onSelection={setSelection}
          onPlay={start}
          onDress={() => openWardrobe('welcome')}
          onParents={openParents}
        />
      )}
      {mode === 'wardrobe' && (
        <WardrobePanel
          stars={progress.completed.length}
          outfit={progress.outfit}
          slot={wardrobeSlot}
          selection={selection}
          message={wardrobeMessage}
          onSlot={switchWardrobe}
          onSelection={setSelection}
          onEquip={wear}
          onClose={close}
          onTurn={() => world.current?.turnShowcase()}
        />
      )}
      {mode === 'explore' && nearby && (
        <button
          className="activity-cue"
          aria-label={'Play at ' + nearby.name}
          onClick={() => openQuestion(nearby.id)}
        >
          <span className="activity-picture" aria-hidden="true">
            {nearby.icon}
          </span>
          <Key letter="a" />
        </button>
      )}
      {mode === 'explore' && !nearby && (
        <button
          className="touch-hop"
          aria-label="Hop, Monster"
          onClick={() => world.current?.jump()}
        >
          <Footprints size={30} aria-hidden="true" />
        </button>
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
      {notice && !modal && mode !== 'explore' && (
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
            'game-dialog ' +
            (mode === 'parents' ? 'parents-dialog' : 'picture-dialog')
          }
        >
          <div className="dialog-top">
            <span className="dialog-picture" aria-hidden="true">
              {mode === 'challenge' ? (
                ZONES.find((z) => z.id === activity)!.icon
              ) : mode === 'map' ? (
                <Map />
              ) : mode === 'pause' ? (
                <Pause />
              ) : (
                <Settings />
              )}
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
          <DialogTitle
            className={
              mode === 'parents' || (parentLed && mode === 'challenge')
                ? 'dialog-title'
                : 'sr-only'
            }
          >
            {modalTitle}
          </DialogTitle>
          <DialogDescription
            className={
              mode === 'parents' || (parentLed && mode === 'challenge')
                ? 'dialog-description'
                : 'sr-only'
            }
          >
            {mode === 'map'
              ? 'Pick a place, and Monster will hop over.'
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
                            : question?.speech}
          </DialogDescription>
          {mode === 'map' && (
            <div className="places-grid">
              {ZONES.map((z, i) => (
                <button
                  key={z.id}
                  className={
                    'place-card ' + (selection === i ? 'selected' : '')
                  }
                  aria-label={'Visit ' + z.name}
                  onFocus={() => selectPicture(i)}
                  onClick={() => travel(z.id)}
                >
                  <span className="place-emoji" aria-hidden="true">
                    {z.icon}
                  </span>
                  {selection === i && <Key letter="a" />}
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
                {
                  text: 'Dress up Monster',
                  Icon: Shirt,
                  fn: () => openWardrobe('pause'),
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
                  fn: openParents,
                },
                { text: 'Launch screen', Icon: House, fn: launch },
              ].map(({ text, Icon, fn }, i) => (
                <button
                  key={i}
                  className={
                    'menu-button ' + (selection === i ? 'selected' : '')
                  }
                  aria-label={text}
                  onFocus={() => selectPicture(i)}
                  onClick={fn}
                >
                  <Icon size={42} aria-hidden="true" />
                  {selection === i && <Key letter="a" />}
                </button>
              ))}
              <span
                className="pause-stars"
                aria-label={progress.completed.length + ' stars earned'}
              >
                <Star size={24} fill="currentColor" aria-hidden="true" />{' '}
                {progress.completed.length}
              </span>
              <details className="grownup-help">
                <summary>Grown-up help</summary>
                <p>
                  Move with the left stick or arrow keys. A / Space hops or
                  plays; Y repeats the spoken guide. X / M opens the map. B /
                  Escape goes back. Menu / P pauses.
                </p>
                <p>
                  {connected
                    ? 'Controller connected.'
                    : 'Keyboard and touch controls are available.'}{' '}
                  Progress is saved on this device.
                </p>
                {question && <p>Activity prompt: {question.speech}</p>}
                {notice && <output>{notice}</output>}
              </details>
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
                  {parentLed && (
                    <p>
                      {question.parts?.map((g) => soundFor(g)?.tip).join(' ')}
                    </p>
                  )}
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
                        <span className="sr-only">Hear the sound</span>
                      </button>
                    ) : (
                      <p className="grownup-tip">
                        Grown-up: model the sound
                        {(question.parts?.length ?? 0) > 1 ? 's' : ''} above,
                        then choose the arrow.
                      </p>
                    )}
                    <button className="primary-button" onClick={finishTeaching}>
                      <Key letter="a" />
                      <span className="sr-only">Ready to try</span>
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              ) : success ? (
                <div className="success-scene">
                  <div className="success-star">
                    <Star size={76} fill="currentColor" strokeWidth={1.5} />
                  </div>
                  <p className="sr-only">{question.encouragement}</p>
                  {unlocks.length > 0 && (
                    <div className="outfit-reward">
                      <span className="sr-only">A new dress-up surprise!</span>
                      {unlocks.map((item) => (
                        <div key={item.id}>
                          <span aria-hidden="true">{item.icon}</span>
                          <strong className="sr-only">{item.name}</strong>
                        </div>
                      ))}
                      <button
                        className={
                          'secondary-button ' +
                          (selection === 1 ? 'selected' : '')
                        }
                        onFocus={() => setSelection(1)}
                        onClick={() => openWardrobe('challenge')}
                      >
                        <Shirt size={32} aria-hidden="true" />
                        <span className="sr-only">Try it on</span>
                      </button>
                    </div>
                  )}
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
                    className={
                      'primary-button ' + (selection === 0 ? 'selected' : '')
                    }
                    onFocus={() => setSelection(0)}
                    onClick={() => openQuestion(activity)}
                  >
                    <Key letter="a" />
                    <RotateCcw size={30} aria-hidden="true" />
                    <span className="sr-only">Play another</span>
                    <ArrowRight size={20} />
                  </button>
                  <button className="text-button" onClick={close}>
                    <Key letter="b" />
                    <Footprints size={28} aria-hidden="true" />
                    <span className="sr-only">Back to exploring</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="question-visual">
                    {(question.kind === 'shape' ||
                      question.kind === 'compare') && (
                      <button
                        className="listen-orb"
                        onClick={() => listen()}
                        aria-label="Hear what to find"
                      >
                        <Volume2 size={48} aria-hidden="true" />
                      </button>
                    )}
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
                        <span className="sr-only">Listen</span>
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
                    {!['shape', 'compare', 'sound'].includes(question.kind) && (
                      <button
                        className="secondary-button"
                        onClick={() => listen()}
                      >
                        <Key letter="y" />
                        <Volume2 size={25} aria-hidden="true" />
                        <span className="sr-only">Listen again</span>
                      </button>
                    )}
                    <span
                      className="picture-choice-hint"
                      aria-label="Move left or right, then press A to choose"
                    >
                      <ChevronLeft />
                      <Hand />
                      <ChevronRight />
                      <Key letter="a" />
                    </span>
                  </div>
                  {(muted || notice) && (
                    <details className="grownup-help">
                      <summary>Grown-up help</summary>
                      <p>{question.speech}</p>
                    </details>
                  )}
                  {feedback && (
                    <output className="feedback picture-feedback">
                      <RotateCcw size={24} aria-hidden="true" />
                      <span className="sr-only">{feedback}</span>
                    </output>
                  )}
                </>
              )}
            </>
          )}
          {notice && mode !== 'pause' && (
            <output className="notice">{notice}</output>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
