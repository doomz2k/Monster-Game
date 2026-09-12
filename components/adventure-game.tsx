'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Check,
  Map,
  Play,
  RotateCw,
  Shirt,
  Volume2,
  X,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Footprints,
  BookOpen,
  Heart,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { ControllerTutorial } from './controller-tutorial';
import { tutorialAction, TUTORIAL_STEPS } from '@/lib/tutorial';
import { PreferencesContext, useMotionPreference } from './game-preferences';
import { SaveAndComfort } from './save-and-comfort';
import { DiscoveryBook } from './discovery-book';
import { GamePicture } from './game-picture';
import { NeighbourPortrait } from './neighbour-portrait';
import { collectDiscovery } from '@/lib/discoveries';
import { discoveryFor, nearbyDiscovery } from '@/lib/discovery-catalogue';
import {
  canClaimFriendGift,
  claimFriendGift,
  FRIEND_GIFTS,
  friendshipLevel,
} from '@/lib/friendship';
import { loadRecoverableProgress, saveRecoverably } from '@/lib/save-recovery';
import { ParentPanel } from '@/components/parent-panel';
import { AppearancePanel } from '@/components/appearance-panel';
import { MissionPanel } from '@/components/mission-panel';
import { HomePanel, ShopPanel } from '@/components/home-panel';
import { AudioDirector, loadReviews, type SoundReviews } from '@/lib/audio';
import { GameInput, type Action } from '@/lib/input';
import { freshProgress, type ProgressData } from '@/lib/learning';
import {
  OUTFIT_SLOTS,
  SLOT_LABELS,
  equipItem,
  isUnlocked,
  itemsFor,
  type OutfitSlot,
} from '@/lib/wardrobe';
import {
  PLACES,
  SHOP_ITEMS,
  changeRegion,
  finishMission,
  lifetimeStars,
  missionFor,
  placeFor,
  rocketParts,
  type Mission,
  type PlaceId,
  type QuestId,
  type Region,
} from '@/lib/adventure';
import { moveMenuFocus } from '@/lib/menu-navigation';
import { registerGameTools, type GameToolAPI } from '@/lib/webmcp';
import type { MonsterWorld, WorldState, WorldUpdate } from '@/lib/world';
import type { Appearance } from '@/lib/appearance';
import script from '@/lib/audio-data/adventure-script.json';

type Mode =
  | 'tutorial'
  | 'welcome'
  | 'explore'
  | 'creator'
  | 'map'
  | 'pause'
  | 'parents'
  | 'dialogue'
  | 'mission'
  | 'home'
  | 'shop'
  | 'flight'
  | 'scrapbook';
const CHOICE = { 'data-game-choice': true };
export default function AdventureGame() {
  const host = useRef<HTMLDivElement>(null),
    surface = useRef<HTMLDivElement>(null),
    modalSurface = useRef<HTMLDivElement>(null),
    missionSurface = useRef<HTMLDivElement>(null),
    bookSurface = useRef<HTMLDivElement>(null),
    world = useRef<MonsterWorld | null>(null),
    input = useRef<GameInput | null>(null),
    actionRef = useRef<(action: Action) => void>(() => {});
  const [p, setP] = useState<ProgressData>(freshProgress),
    [loaded, setLoaded] = useState(false),
    [ready, setReady] = useState(false),
    [error, setError] = useState(''),
    [failed, setFailed] = useState(false),
    [connected, setConnected] = useState(false);
  const reducedMotion = useMotionPreference(p.preferences);
  const [mode, setMode] = useState<Mode>('welcome'),
    [place, setPlace] = useState<PlaceId>('home'),
    [position, setPosition] = useState<WorldUpdate>({
      x: 0,
      z: 5,
      zone: 'meadow',
      near: null,
      place: null,
    });
  const [reviews, setReviews] = useState<SoundReviews>({}),
    [muted, setMuted] = useState(false),
    [audio] = useState(() => new AudioDirector(() => ({}), setError));
  const [mission, setMission] = useState<Mission | null>(null),
    [creatorTab, setCreatorTab] = useState<'look' | 'clothes'>('look'),
    [slot, setSlot] = useState<OutfitSlot>('hat'),
    [creatorMessage, setCreatorMessage] = useState('');
  const [tutorialStep, setTutorialStep] = useState(0),
    [tutorialChoice, setTutorialChoice] = useState(0);
  const walkStart = useRef({ x: 0, z: 0 });
  const finishTutorial = () => {
    setP((old) => ({ ...old, tutorialComplete: true }));
    go('explore', 'explore');
  };
  const teach = (action: Action) => {
    audio.unlock();
    if (tutorialStep === 0 && action === 'back') {
      go('welcome');
      return;
    }
    if (action === 'listen') {
      say('tutorial-' + TUTORIAL_STEPS[tutorialStep]);
      return;
    }
    if (tutorialStep === 5 && action === 'confirm') {
      finishTutorial();
      return;
    }
    const next = tutorialAction(tutorialStep, action, tutorialChoice);
    if (next === 1 && tutorialStep !== 1)
      walkStart.current = { x: position.x, z: position.z };
    if (next === 3) setTutorialChoice(1);
    if (next === 2) setTutorialChoice(0);
    setTutorialStep(next);
  };
  const [bookEntry, setBookEntry] = useState<string | null>(null),
    [discoveryTarget, setDiscoveryTarget] = useState<string | null>(null);
  const bookReturnMode = useRef<Mode>('explore');
  const [flightTo, setFlightTo] = useState<Region>('moon');
  const [parentReturnMode, setParentReturnMode] = useState<Mode>('explore');
  const returnMode = useRef<Mode>('welcome'),
    resumeMode = useRef<Mode>('explore'),
    currentMode = useRef<Mode>('welcome');
  const runtime = useRef<WorldState>({
    active: false,
    welcome: true,
    moveX: 0,
    moveY: 0,
    turn: 0,
    completed: [],
    target: 'meadow',
    showcase: 'launch',
    outfit: p.outfit,
    appearance: p.appearance,
    adventure: p.adventure,
    destination: 'home',
  });
  const recentArrival = useRef<{
    id: PlaceId | null;
    at: number;
    said: boolean;
  }>({ id: null, at: 0, said: false });
  const agentAPI = useRef<GameToolAPI>({
    state: () => ({}),
    visit: async () => ({}),
  });
  const stars = lifetimeStars(p),
    nearby = position.place ? placeFor(position.place) : null,
    find = nearbyDiscovery(
      p.adventure.region,
      position.x,
      position.z,
      p.adventure.discoveries,
    );
  const nearLaunchPad =
    p.adventure.region === 'moon' &&
    Math.hypot(position.x, position.z - 6) < 3.6;
  const openBook = (id: string | null = null) => {
    bookReturnMode.current =
      mode === 'map' || mode === 'pause' ? mode : 'explore';
    setBookEntry(id);
    go('scrapbook', id ? 'discovery-' + id : 'scrapbook');
  };
  const collect = () => {
    if (!find) return;
    const next = collectDiscovery(p, find.id, position.x, position.z);
    if (next === p) return;
    setP(next);
    setDiscoveryTarget(null);
    world.current?.celebrate();
    audio.chime();
    openBook(find.id);
  };
  const modal = ![
    'welcome',
    'tutorial',
    'explore',
    'creator',
    'flight',
    'mission',
    'scrapbook',
  ].includes(mode);
  const change = (next: ProgressData) => setP(next);
  const stop = () => {
    audio.stop();
    setError('');
  };
  const say = (id: string) => {
    audio.unlock();
    setError('');
    void audio.line(id);
  };
  const go = (next: Mode, line?: string) => {
    stop();
    setMode(next);
    if (line) say(line);
  };

  useEffect(() => {
    /* oxlint-disable react/react-compiler -- Hydrate and subscribe to browser storage, input and rendering APIs. */
    try {
      const saved = loadRecoverableProgress(localStorage);
      setP(saved.progress);
      if (saved.recovered)
        setError('Your adventure was recovered from a safe copy.');
      const silent = localStorage.getItem('monster-game-muted') === 'true';
      setMuted(silent);
      audio.setMuted(silent);
    } catch {
      setP(freshProgress());
    }
    setReviews(loadReviews());
    setLoaded(true);
    /* oxlint-enable react/react-compiler */
    let alive = true;
    input.current = new GameInput(
      (action) => actionRef.current(action),
      (x, y, turn) =>
        Object.assign(runtime.current, { moveX: x, moveY: y, turn }),
      (yes) => setConnected(yes),
    );
    void import('@/lib/world')
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
          console.error(e);
          setFailed(true);
        }
      })
      .catch((e) => {
        console.error(e);
        if (alive) setFailed(true);
      });
    const blur = () => {
      audio.stop();
      if (
        currentMode.current === 'explore' ||
        currentMode.current === 'mission' ||
        currentMode.current === 'tutorial'
      ) {
        resumeMode.current = currentMode.current;
        setMode('pause');
      }
    };
    window.addEventListener('blur', blur);
    return () => {
      alive = false;
      input.current?.dispose();
      world.current?.dispose();
      audio.dispose();
      window.removeEventListener('blur', blur);
    };
  }, [audio]);
  useEffect(() => {
    if (!loaded) return;
    try {
      saveRecoverably(localStorage, p);
    } catch {
      /* oxlint-disable-next-line react/react-compiler -- Report a browser storage failure. */ setError(
        'This browser could not save your adventure.',
      );
    }
  }, [p, loaded]);
  useEffect(
    () =>
      registerGameTools(
        (
          navigator as Navigator & {
            modelContext?: Parameters<typeof registerGameTools>[0];
          }
        ).modelContext,
        {
          state: () => agentAPI.current.state(),
          visit: (id) => agentAPI.current.visit(id),
        },
      ),
    [],
  );
  useEffect(() => {
    if (mode !== 'flight') return;
    const timer = setTimeout(() => {
      setP((old) => changeRegion(old, flightTo));
      setPlace(flightTo === 'moon' ? 'moon' : 'home');
      setMode('explore');
    }, 3400);
    return () => clearTimeout(timer);
  }, [mode, flightTo]);
  useEffect(() => {
    if (mode === 'explore' || mode === 'parents' || mode === 'flight') return;
    const frame = requestAnimationFrame(() => {
      const root =
        mode === 'scrapbook'
          ? bookSurface.current
          : mode === 'mission'
            ? missionSurface.current
            : modal
              ? modalSurface.current
              : surface.current;
      root
        ?.querySelector<HTMLElement>('[data-game-choice]:not(:disabled)')
        ?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [mode, modal, mission, creatorTab, slot, ready]);
  useEffect(() => {
    if (mode !== 'explore') return;
    const id = position.place ?? null,
      now = performance.now();
    if (recentArrival.current.id !== id)
      recentArrival.current = { id, at: now, said: false };
    if (
      id &&
      !recentArrival.current.said &&
      now - recentArrival.current.at > 900 &&
      !audio.busy
    ) {
      recentArrival.current.said = true;
      void audio.line('visit-' + id);
    }
  }, [mode, position, audio]);

  useEffect(() => {
    if (
      mode === 'tutorial' &&
      tutorialStep === 1 &&
      Math.hypot(
        position.x - walkStart.current.x,
        position.z - walkStart.current.z,
      ) > 2.5
    ) {
      /* oxlint-disable-next-line react/react-compiler -- The renderer reports actual movement. */
      setTutorialStep(2);
      setTutorialChoice(0);
      audio.chime();
    }
  }, [mode, tutorialStep, position, audio]);

  useEffect(() => {
    audio.setScene({
      active: mode === 'explore' || (mode === 'tutorial' && tutorialStep === 1),
      region: p.adventure.region,
      x: position.x,
      z: position.z,
      moving: Math.hypot(runtime.current.moveX, runtime.current.moveY) > 0.1,
    });
  }, [audio, mode, tutorialStep, position, p.adventure.region]);

  useEffect(() => {
    audio.setLevels(
      p.preferences.speechVolume,
      p.preferences.environmentVolume * (p.preferences.calm ? 0.4 : 1),
    );
  }, [audio, p.preferences]);

  const openCreator = () => {
    returnMode.current = mode === 'welcome' ? 'welcome' : 'explore';
    setCreatorTab('look');
    go('creator', 'creator');
  };
  const start = () => {
    if (!ready || !loaded) return;
    if (!p.tutorialComplete) {
      setTutorialStep(0);
      setTutorialChoice(0);
      go('tutorial');
    } else go('explore', 'explore');
  };
  const talk = (id: PlaceId) => {
    setPlace(id);
    if (id === 'home') go('home', 'home');
    else if (id === 'shop') go('shop', 'poppy-hello');
    else
      go(
        'dialogue',
        id === 'rocket' && rocketParts(p) === 3
          ? 'pip-repaired'
          : placeFor(id).intro,
      );
  };
  const visit = (id: PlaceId) => {
    if (id === 'moon' && p.adventure.region !== 'moon') {
      setPlace('rocket');
      if (rocketParts(p) < 3) {
        go('dialogue', 'pip-hello');
        return;
      }
      launch('moon');
      return;
    }
    if (id !== 'moon' && p.adventure.region === 'moon') {
      launch('island');
      return;
    }
    setPlace(id);
    setDiscoveryTarget(null);
    world.current?.travel(id);
    recentArrival.current = { id, at: 0, said: true };
    go('explore', 'visit-' + id);
  };
  const launch = (region: Region) => {
    if (region === 'moon' && rocketParts(p) < 3) return;
    setFlightTo(region);
    go('flight', region === 'moon' ? 'launch' : 'return');
  };
  const beginMission = () => {
    const next = missionFor(place as QuestId, p);
    setMission(next);
    go('mission');
  };
  const complete = () => {
    if (!mission) return 0;
    const next = finishMission(p, mission);
    setP(next);
    world.current?.celebrate();
    return next.adventure.wallet - p.adventure.wallet;
  };
  const repeat = () => {
    if (mode === 'scrapbook') {
      bookSurface.current
        ?.querySelector<HTMLButtonElement>('[data-repeat-prompt]')
        ?.click();
      return;
    }
    if (mode === 'tutorial') {
      teach('listen');
      return;
    }
    if (mode === 'mission' && mission) {
      missionSurface.current
        ?.querySelector<HTMLButtonElement>('[data-repeat-prompt]')
        ?.click();
      return;
    }
    say(
      mode === 'welcome'
        ? 'welcome'
        : mode === 'creator'
          ? 'creator'
          : mode === 'dialogue'
            ? placeFor(place).intro
            : mode === 'home'
              ? 'home'
              : mode === 'shop'
                ? 'poppy-hello'
                : mode === 'map'
                  ? 'map'
                  : mode === 'pause'
                    ? 'pause'
                    : 'explore',
    );
  };
  const back = () => {
    if (mode === 'scrapbook') {
      bookSurface.current
        ?.querySelector<HTMLButtonElement>('[data-book-back]')
        ?.click();
      return;
    }
    if (mode === 'tutorial') {
      teach('back');
      return;
    }
    const reject =
      modalSurface.current?.querySelector<HTMLButtonElement>('[data-reject]');
    if (reject) {
      reject.click();
      return;
    }
    stop();
    if (mode === 'parents') setMode(parentReturnMode);
    else if (mode === 'creator') setMode(returnMode.current);
    else if (mode === 'mission') setMode('dialogue');
    else if (mode === 'pause') setMode(resumeMode.current);
    else if (mode === 'explore') {
      resumeMode.current = 'explore';
      setMode('pause');
    } else if (mode !== 'welcome') setMode('explore');
  };
  const openParents = () => {
    if (mode === 'parents') {
      back();
      return;
    }
    setParentReturnMode(mode);
    go('parents');
  };
  const handleAction = (action: Action) => {
    if (action === 'pause') {
      openParents();
      return;
    }
    if (mode === 'tutorial' && action !== 'suspend') {
      teach(action);
      return;
    }
    if (action === 'back') {
      back();
      return;
    }
    if (action === 'suspend') {
      if (mode === 'explore' || mode === 'mission' || mode === 'tutorial') {
        resumeMode.current = mode;
        go('pause');
      }
      return;
    }
    if (mode === 'parents') return;
    if (action === 'listen') {
      repeat();
      return;
    }
    if (action === 'map') {
      if (mode === 'mission')
        missionSurface.current
          ?.querySelector<HTMLButtonElement>('[data-game-undo]')
          ?.click();
      if (mode === 'creator') world.current?.turnShowcase();
      else if (mode === 'explore' || mode === 'pause') go('map', 'map');
      return;
    }
    if (mode === 'explore') {
      if (action === 'confirm') {
        audio.unlock();
        if (find) collect();
        else if (nearLaunchPad) launch('island');
        else if (position.place) talk(position.place);
        else world.current?.jump();
      }
      return;
    }
    const base =
      mode === 'scrapbook'
        ? bookSurface.current
        : mode === 'mission'
          ? missionSurface.current
          : modal
            ? modalSurface.current
            : surface.current;
    const root =
      base?.querySelector<HTMLElement>('[data-choice-scope]') ?? base;
    if (!root) return;
    if (mode === 'mission' && root.querySelector('[data-quantity-dial]')) {
      const selector =
        action === 'left' || action === 'down'
          ? '[data-quantity-less]'
          : action === 'right' || action === 'up'
            ? '[data-quantity-more]'
            : action === 'confirm'
              ? '[data-game-confirm]'
              : null;
      if (selector) {
        audio.unlock();
        root
          .querySelector<HTMLButtonElement>(selector + ':not(:disabled)')
          ?.click();
        return;
      }
    }
    if (
      action === 'left' ||
      action === 'right' ||
      action === 'up' ||
      action === 'down'
    )
      moveMenuFocus(root, action);
    if (action === 'confirm') {
      audio.unlock();
      const button = document.activeElement;
      if (button instanceof HTMLButtonElement && root.contains(button))
        button.click();
      else
        root
          .querySelector<HTMLButtonElement>('[data-game-choice]:not(:disabled)')
          ?.click();
    }
  };
  useLayoutEffect(() => {
    actionRef.current = handleAction;
    currentMode.current = mode;
    audio.setReviews(reviews);
    agentAPI.current = {
      state: () => ({
        mode,
        region: p.adventure.region,
        place,
        nearby: position.place,
        wallet: p.adventure.wallet,
        lifetimeStars: stars,
        rocketParts: rocketParts(p),
        introducedSounds: p.knownSounds,
        activity: mode === 'mission' ? mission?.kind : null,
      }),
      visit: async (id) => {
        if (mode === 'parents')
          return { error: 'Close grown-up settings first.' };
        visit(id as PlaceId);
        return { area: id };
      },
    };
    Object.assign(runtime.current, {
      active: mode === 'explore' || (mode === 'tutorial' && tutorialStep === 1),
      welcome: mode === 'welcome',
      preferences: p.preferences,
      reducedMotion,
      visible:
        mode !== 'mission' &&
        mode !== 'parents' &&
        mode !== 'scrapbook' &&
        mode !== 'dialogue' &&
        mode !== 'home',
      discoveryTarget,
      completed: p.completed,
      appearance: p.appearance,
      outfit: p.outfit,
      adventure: p.adventure,
      destination:
        p.adventure.region === 'moon'
          ? 'moon'
          : place === 'moon'
            ? 'rocket'
            : place,
      talking: mode === 'dialogue' || mode === 'mission' ? place : null,
      showcase:
        mode === 'welcome' ? 'launch' : mode === 'creator' ? 'wardrobe' : null,
    });
  });
  const setAppearance = (appearance: Appearance) =>
    setP((old) => ({ ...old, appearance }));
  const modalTitle =
    mode === 'parents'
      ? 'For grown-ups'
      : mode === 'map'
        ? 'Where shall we go?'
        : mode === 'pause'
          ? 'A little rest'
          : mode === 'dialogue'
            ? placeFor(place).friend
            : mode === 'shop'
              ? 'Poppy’s little shops'
              : mode === 'home'
                ? 'My little home'
                : (mission?.title ?? 'Our adventure');
  const touching = (x: number, y: number) => {
    if (input.current) input.current.touch = { x, y };
  };
  return (
    <PreferencesContext.Provider
      value={{ preferences: p.preferences, reducedMotion }}
    >
      <main
        data-reduced-motion={reducedMotion}
        data-contrast={p.preferences.contrast}
        data-text-size={p.preferences.textSize}
        data-calm={p.preferences.calm}
        className={
          'game-shell adventure-shell ' +
          (connected ? 'controller-active ' : '') +
          (mode === 'explore' ? 'playing ' : '') +
          (mode === 'creator'
            ? 'showcase-mode wardrobe-mode '
            : mode === 'welcome'
              ? 'showcase-mode launch-mode '
              : '') +
          (p.adventure.region === 'moon' ? 'on-moon' : '')
        }
      >
        <div ref={host} className="world-canvas" />
        <div className="world-vignette" />
        <div ref={surface}>
          {mode === 'tutorial' && (
            <ControllerTutorial
              step={tutorialStep}
              selected={tutorialChoice}
              audio={audio}
              onAction={teach}
              onFinish={finishTutorial}
              onMove={touching}
            />
          )}
          {mode === 'welcome' && (
            <section className="adventure-launch">
              <div className="launch-title-block">
                <span className="game-eyebrow">CLOVER’S LITTLE WORLD</span>
                <h1>
                  Monster
                  <br />
                  <em>& friends</em>
                </h1>
                <p>Your monster. Your adventure.</p>
              </div>
              <div className="launch-picture-actions">
                <button
                  {...CHOICE}
                  className="launch-adventure"
                  disabled={!ready || !loaded || failed}
                  onClick={start}
                >
                  <span className="choice-picture">🌳</span>
                  <strong>
                    {ready ? 'Let’s play' : 'Growing your world…'}
                  </strong>
                  <b className="pad-key a-key">A</b>
                </button>
                <button
                  {...CHOICE}
                  onClick={openCreator}
                  disabled={!ready || !loaded || failed}
                >
                  <span className="choice-picture">🎨</span>
                  <strong>Make my monster</strong>
                </button>
              </div>
              <span className="launch-buddy-note">Hello, little friend.</span>
            </section>
          )}
          {(mode === 'explore' ||
            (mode === 'tutorial' && tutorialStep === 1)) && (
            <>
              <div className="adventure-hud">
                <span className="wallet">⭐ {p.adventure.wallet}</span>
                <button
                  {...CHOICE}
                  className="map-control"
                  aria-label="Picture map"
                  onClick={() => go('map', 'map')}
                >
                  <b className="pad-key x-key">X</b>
                  <Map />
                </button>
              </div>
              {find && mode === 'explore' && (
                <button
                  className="talk-cue discovery-cue"
                  onClick={collect}
                  aria-label={'Discover ' + find.name}
                >
                  <GamePicture symbol={find.picture} />
                  <b className="pad-key a-key">A</b>
                </button>
              )}
              {nearLaunchPad && !find && (
                <button
                  className="talk-cue"
                  onClick={() => launch('island')}
                  aria-label="Fly home from the landing pad"
                >
                  <GamePicture symbol="🚀" />
                  <b className="pad-key a-key">A</b>
                </button>
              )}
              {nearby && !find && !nearLaunchPad && (
                <button
                  className="talk-cue"
                  onClick={() => talk(nearby.id)}
                  aria-label={'Visit ' + nearby.friend}
                >
                  <span>{nearby.icon}</span>
                  <b className="pad-key a-key">A</b>
                </button>
              )}
              {p.adventure.region === 'moon' && (
                <button
                  className="return-rocket"
                  onClick={() => launch('island')}
                  aria-label="Fly home"
                >
                  🚀 🏡
                </button>
              )}
              <div className="touch-controls" aria-label="Touch movement">
                {[
                  { x: 0, y: -1, Icon: ChevronUp },
                  { x: -1, y: 0, Icon: ChevronLeft },
                  { x: 0, y: 1, Icon: ChevronDown },
                  { x: 1, y: 0, Icon: ChevronRight },
                ].map(({ x, y, Icon }, i) => (
                  <button
                    key={i}
                    aria-label={['Forward', 'Left', 'Back', 'Right'][i]}
                    className={'touch-direction direction-' + i}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      touching(x, y);
                    }}
                    onPointerUp={() => touching(0, 0)}
                    onLostPointerCapture={() => touching(0, 0)}
                    onPointerCancel={() => touching(0, 0)}
                  >
                    <Icon />
                  </button>
                ))}
              </div>
              {!nearby && !find && !nearLaunchPad && (
                <button
                  className="touch-hop"
                  aria-label="Hop"
                  onClick={() => world.current?.jump()}
                >
                  <Footprints />
                </button>
              )}
            </>
          )}
          {(mode === 'scrapbook' ||
            (mode === 'parents' && parentReturnMode === 'scrapbook')) && (
            <div ref={bookSurface} hidden={mode !== 'scrapbook'}>
              <DiscoveryBook
                progress={p}
                audio={audio}
                initialId={bookEntry}
                onClose={() => go(bookReturnMode.current)}
                onExplore={() => go('explore')}
                onFind={(id) => {
                  const d = discoveryFor(id);
                  if (!d) return;
                  visit(d.friend);
                  setDiscoveryTarget(id);
                }}
              />
            </div>
          )}
          {mode === 'creator' && (
            <section className="monster-studio">
              <div className="studio-preview-actions">
                <button
                  onClick={() => world.current?.turnShowcase()}
                  aria-label="Turn Monster"
                >
                  <b className="pad-key x-key">X</b>
                  <RotateCw />
                </button>
                <button
                  {...CHOICE}
                  className="adventure-primary"
                  onClick={() => {
                    go(returnMode.current, 'ready');
                  }}
                >
                  <b className="pad-key a-key">A</b>
                  <Check /> That’s me!
                </button>
              </div>
              <div className="studio-panel">
                <div className="studio-heading">
                  <h2>Make my monster</h2>
                  <span>⭐ {stars}</span>
                </div>
                <div className="picture-tabs">
                  <button
                    {...CHOICE}
                    aria-pressed={creatorTab === 'look'}
                    onClick={() => setCreatorTab('look')}
                  >
                    <span>🎨</span> My monster
                  </button>
                  <button
                    {...CHOICE}
                    aria-pressed={creatorTab === 'clothes'}
                    onClick={() => setCreatorTab('clothes')}
                  >
                    <Shirt /> Dress up
                  </button>
                </div>
                {creatorTab === 'look' ? (
                  <AppearancePanel
                    value={p.appearance}
                    onChange={setAppearance}
                  />
                ) : (
                  <>
                    <div className="outfit-shelves">
                      {OUTFIT_SLOTS.map((s) => (
                        <button
                          {...CHOICE}
                          key={s}
                          aria-pressed={slot === s}
                          onClick={() => setSlot(s)}
                        >
                          {SLOT_LABELS[s]}
                        </button>
                      ))}
                    </div>
                    <div className="new-outfit-grid">
                      {itemsFor(slot).map((item) => {
                        const wearing = p.outfit[slot] === item.id,
                          unlocked = isUnlocked(item, stars);
                        return (
                          <button
                            {...CHOICE}
                            key={item.id}
                            aria-pressed={wearing}
                            className={!unlocked ? 'locked-outfit' : ''}
                            onClick={() => {
                              if (unlocked) {
                                setP((old) => ({
                                  ...old,
                                  outfit: equipItem(
                                    old.outfit,
                                    item.id,
                                    lifetimeStars(old),
                                  ),
                                }));
                                setCreatorMessage(
                                  item.id.startsWith('no-')
                                    ? 'All comfy!'
                                    : item.name,
                                );
                                audio.chime();
                              } else
                                setCreatorMessage(
                                  'Find ' +
                                    (item.stars - stars) +
                                    ' more stars for ' +
                                    item.name,
                                );
                            }}
                          >
                            <span style={{ background: item.colour }}>
                              {item.icon}
                              {wearing && <Check />}
                            </span>
                            <strong>{item.name}</strong>
                            {!unlocked && <small>⭐ {item.stars}</small>}
                          </button>
                        );
                      })}
                    </div>
                    <p className="outfit-layer-note">
                      One from every shelf. Mix them all together!
                    </p>
                  </>
                )}
                <output aria-live="polite">{creatorMessage}</output>
              </div>
            </section>
          )}
          {mode === 'flight' && (
            <section className="rocket-flight">
              <div className="flight-stars">✦ · ✧ · ✦</div>
              <div className="flying-rocket">🚀</div>
              <h2>{flightTo === 'moon' ? 'To the moon!' : 'Home we go!'}</h2>
              <button {...CHOICE} onClick={back}>
                <b className="pad-key b-key">B</b> Back
              </button>
            </section>
          )}
        </div>
        {failed && (
          <div className="error-card" role="alert">
            <strong>The 3D world couldn’t open.</strong>
            <p>Try Chrome or Edge with graphics acceleration enabled.</p>
            <button onClick={() => location.reload()}>Try again</button>
          </div>
        )}
        {mission &&
          (mode === 'mission' || mode === 'pause' || mode === 'parents') && (
            <section
              ref={missionSurface}
              className={'activity-screen activity-' + mission.npc}
              hidden={mode !== 'mission'}
              aria-label={mission.title}
            >
              <div className="activity-topbar">
                <button className="back-control" onClick={back}>
                  <b className="pad-key b-key">B</b> Back
                </button>
                <span>MONSTER & FRIENDS</span>
                <span className="activity-wallet">⭐ {p.adventure.wallet}</span>
              </div>
              <MissionPanel
                key={mission.npc + '-' + mission.round}
                mission={mission}
                active={mode === 'mission'}
                audio={audio}
                reviews={reviews}
                onComplete={complete}
                onAgain={beginMission}
                onBack={() => {
                  if (mission.npc === 'rocket' && rocketParts(p) === 3)
                    go('dialogue', 'pip-repaired');
                  else go('explore');
                }}
              />
              <div className="activity-controls">
                <span>✚ Choose</span>
                <span>
                  <b className="pad-key a-key">A</b> Yes
                </span>
                <button onClick={repeat}>
                  <b className="pad-key y-key">Y</b> Listen
                </button>
                {mission.kind === 'spell' && (
                  <span>
                    <b className="pad-key x-key">X</b> Undo
                  </span>
                )}
              </div>
            </section>
          )}

        <Dialog
          open={modal}
          onOpenChange={(open) => {
            if (!open) back();
          }}
        >
          <DialogContent
            data-reduced-motion={reducedMotion}
            data-contrast={p.preferences.contrast}
            data-text-size={p.preferences.textSize}
            data-calm={p.preferences.calm}
            showCloseButton={false}
            className={
              'adventure-dialog ' +
              (mode === 'parents'
                ? 'adult-dialog'
                : mode === 'dialogue'
                  ? 'conversation-dialog'
                  : mode === 'home'
                    ? 'home-dialog'
                    : '')
            }
            finalFocus={() =>
              (mode === 'mission'
                ? missionSurface.current
                : surface.current
              )?.querySelector<HTMLElement>(
                '[data-game-choice]:not(:disabled)',
              ) ?? false
            }
            initialFocus={() =>
              modalSurface.current?.querySelector<HTMLElement>(
                '[data-game-choice]:not(:disabled)',
              ) ?? false
            }
          >
            <div ref={modalSurface}>
              <div className="adventure-dialog-top">
                <DialogTitle className="sr-only">{modalTitle}</DialogTitle>
                <DialogDescription className="sr-only">
                  Use the control pad to choose. Green A confirms. Red B goes
                  back.
                </DialogDescription>
                <button className="back-control" onClick={back}>
                  <b className="pad-key b-key">B</b>
                  <ArrowLeft /> Back
                </button>
                <button
                  className="round-control"
                  onClick={repeat}
                  aria-label="Listen again"
                >
                  <b className="pad-key y-key">Y</b>
                  <Volume2 />
                </button>
              </div>
              {mode === 'map' && (
                <>
                  <h2>Where shall we go?</h2>
                  <div className="village-map">
                    {PLACES.map((dest) => (
                      <button
                        {...CHOICE}
                        key={dest.id}
                        className={
                          'destination-card ' +
                          (dest.id === 'moon' && rocketParts(p) < 3
                            ? 'undiscovered'
                            : '')
                        }
                        style={
                          {
                            '--place-colour': dest.colour,
                          } as React.CSSProperties
                        }
                        onClick={() => visit(dest.id)}
                      >
                        <span>{dest.icon}</span>
                        <strong>
                          {dest.friend === 'Monster' ? 'My home' : dest.friend}
                        </strong>
                        <small>
                          {dest.id === 'moon' && rocketParts(p) < 3
                            ? 'Mend Pip’s rocket'
                            : dest.name}
                        </small>
                        {!['home', 'shop'].includes(dest.id) && (
                          <span className="friend-stamps">
                            {'★'.repeat(
                              Math.min(
                                3,
                                p.adventure.rounds[dest.id as QuestId],
                              ),
                            )}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    {...CHOICE}
                    className="scrapbook-open"
                    onClick={() => openBook()}
                  >
                    <BookOpen /> My discoveries{' '}
                    <span>{p.adventure.discoveries.length} / 12</span>
                  </button>
                </>
              )}
              {mode === 'pause' && (
                <>
                  <h2>A little rest</h2>
                  <div className="big-actions pause-pictures">
                    <button {...CHOICE} onClick={() => go(resumeMode.current)}>
                      <Play />
                      <span>Play</span>
                    </button>
                    <button {...CHOICE} onClick={openCreator}>
                      <span>🎨</span>
                      <span>My monster</span>
                    </button>
                    <button {...CHOICE} onClick={() => go('map', 'map')}>
                      <Map />
                      <span>Our island</span>
                    </button>
                    <button {...CHOICE} onClick={() => openBook()}>
                      <BookOpen />
                      <span>My discoveries</span>
                    </button>
                  </div>
                </>
              )}
              {mode === 'parents' && (
                <>
                  <h2>For grown-ups</h2>
                  <p className="parent-controls-note">
                    Start opens this menu. On a keyboard, press P. Green A
                    confirms; red B goes back. X opens the picture map; Y
                    repeats guidance. Shoulder and trigger buttons are unused.
                  </p>
                  <button
                    className="adult-sound-button"
                    onClick={() => {
                      const next = !muted;
                      setMuted(next);
                      audio.setMuted(next);
                      try {
                        localStorage.setItem(
                          'monster-game-muted',
                          String(next),
                        );
                      } catch {
                        setError('Sound preference could not be saved.');
                      }
                    }}
                  >
                    {muted ? 'Turn sound on' : 'Mute sound'}
                  </button>
                  <p>
                    Character narration is generated in advance with free Kokoro
                    voices and played from recorded files. No voice service runs
                    during play.
                  </p>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setTutorialStep(0);
                      setTutorialChoice(0);
                      go('tutorial');
                    }}
                  >
                    Replay controller lesson
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => go('welcome', 'welcome')}
                  >
                    Return to main menu
                  </button>
                  <SaveAndComfort progress={p} onProgress={change} />
                  <ParentPanel
                    progress={p}
                    onProgress={change}
                    reviews={reviews}
                    onReviews={setReviews}
                    audio={audio}
                  />
                </>
              )}
              {mode === 'dialogue' && (
                <div className="friend-dialogue">
                  <NeighbourPortrait id={place} />
                  <div className="friend-chat-copy">
                    <p className="game-eyebrow">A LITTLE HELP FOR A FRIEND</p>
                    <h2>{placeFor(place).friend}</h2>
                    <div
                      className="friendship-row"
                      aria-label={
                        friendshipLevel(p.adventure.rounds[place as QuestId]) +
                        ' friendship hearts'
                      }
                    >
                      {[0, 1, 2, 3].map((i) => (
                        <Heart
                          key={i}
                          className={
                            i <
                            friendshipLevel(
                              p.adventure.rounds[place as QuestId],
                            )
                              ? ''
                              : 'empty-heart'
                          }
                          fill={
                            i <
                            friendshipLevel(
                              p.adventure.rounds[place as QuestId],
                            )
                              ? 'currentColor'
                              : 'none'
                          }
                        />
                      ))}
                    </div>
                    <p>
                      {
                        (script as Record<string, { text: string }>)[
                          place === 'rocket' && rocketParts(p) === 3
                            ? 'pip-repaired'
                            : placeFor(place).intro
                        ]?.text
                      }
                    </p>
                    {place === 'rocket' && (
                      <div className="rocket-parts">
                        {['🧩', '💎', '⚡'].map((icon, i) => (
                          <span
                            key={icon}
                            className={i < rocketParts(p) ? 'fixed' : ''}
                          >
                            {icon}
                            {i < rocketParts(p) && <Check />}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="big-actions">
                      <button
                        {...CHOICE}
                        className="adventure-primary"
                        onClick={
                          place === 'rocket' && rocketParts(p) === 3
                            ? () => launch('moon')
                            : beginMission
                        }
                      >
                        <b className="pad-key a-key">A</b>
                        <span>
                          {place === 'rocket' && rocketParts(p) === 3
                            ? '🚀 Let’s fly!'
                            : 'Yes, let’s help!'}
                        </span>
                      </button>
                      <button className="adventure-secondary" onClick={back}>
                        <b className="pad-key b-key">B</b> Not now
                      </button>
                    </div>
                    {canClaimFriendGift(p, place as QuestId) && (
                      <button
                        {...CHOICE}
                        className="friend-gift"
                        onClick={() => {
                          const owned = p.adventure.inventory.includes(
                            FRIEND_GIFTS[place as QuestId],
                          );
                          setP((old) => claimFriendGift(old, place as QuestId));
                          world.current?.celebrate();
                          say(owned ? 'friend-gift-stars' : 'friend-gift');
                        }}
                      >
                        <span>
                          {
                            SHOP_ITEMS.find(
                              (i) => i.id === FRIEND_GIFTS[place as QuestId],
                            )?.icon
                          }
                        </span>{' '}
                        A thank-you present <Heart />
                      </button>
                    )}
                    {p.adventure.friendshipGifts.includes(place as QuestId) && (
                      <output className="friend-gift-received">
                        <Check /> Thank-you present received
                      </output>
                    )}
                    {place === 'moon' && (
                      <button
                        {...CHOICE}
                        className="home-flight-button"
                        onClick={() => launch('island')}
                      >
                        🚀 Fly home
                      </button>
                    )}
                  </div>
                </div>
              )}
              {mode === 'home' && (
                <HomePanel
                  progress={p}
                  onChange={change}
                  audio={audio}
                  onShop={() => {
                    setPlace('shop');
                    go('shop', 'poppy-hello');
                  }}
                />
              )}
              {mode === 'shop' && (
                <ShopPanel progress={p} onChange={change} audio={audio} />
              )}
              {error && <output className="adventure-notice">{error}</output>}
            </div>
          </DialogContent>
        </Dialog>
        {!modal && error && (
          <output className="adventure-toast">
            {error}
            <button aria-label="Dismiss" onClick={() => setError('')}>
              <X />
            </button>
          </output>
        )}
        {mode !== 'parents' &&
          mode !== 'flight' &&
          mode !== 'mission' &&
          mode !== 'scrapbook' && (
            <footer className="controller-legend">
              <span>
                <b className="pad-key a-key">A</b> Yes
              </span>
              <button onClick={back}>
                <b className="pad-key b-key">B</b> No / back
              </button>
              <button onClick={repeat}>
                <b className="pad-key y-key">Y</b>
                <Volume2 size={18} />
              </button>
            </footer>
          )}
      </main>
    </PreferencesContext.Provider>
  );
}
