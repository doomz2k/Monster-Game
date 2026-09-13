'use client';
import { useEffect, useRef, useState } from 'react';
import { Volume2, Check } from 'lucide-react';
import {
  ROVER_STOPS,
  roverStop,
  type RoverProgress,
  type RoverSurvey as Survey,
} from '@/lib/rover';
import type { AudioDirector } from '@/lib/audio';
import { QuantityDial } from './quantity-dial';
import { RoverPicture } from './rover-picture';

export function RoverSurvey({
  survey,
  progress,
  active,
  audio,
  onComplete,
  onBack,
}: {
  survey: Survey;
  progress: RoverProgress;
  active: boolean;
  audio: AudioDirector;
  onComplete: (answer: number) => boolean;
  onBack: () => void;
}) {
  const [answer, setAnswer] = useState(0),
    [done, setDone] = useState(false),
    [hint, setHint] = useState(false);
  const finished = useRef(false),
    root = useRef<HTMLDivElement>(null);
  const stop = roverStop(survey.stop),
    line = done ? 'rover-success' : 'rover-count-' + survey.stop;
  useEffect(() => {
    if (active) {
      void audio.line(line);
      root.current
        ?.querySelector<HTMLButtonElement>('[data-game-choice]')
        ?.focus({ preventScroll: true });
    }
    return () => audio.stop();
  }, [active, audio, line]);
  const submit = () => {
    if (finished.current) return;
    if (answer !== survey.target) {
      setHint(true);
      void audio.line(
        answer < survey.target ? 'hint-nova-more' : 'hint-nova-fewer',
      );
      return;
    }
    if (!onComplete(answer)) return;
    finished.current = true;
    setDone(true);
    audio.chime();
  };
  return (
    <div className="rover-survey" ref={root}>
      <div className="rover-survey-heading">
        <div>
          <small>NOVA’S MOON EXPEDITION</small>
          <h1>{done ? 'Expedition stamp!' : stop.name}</h1>
        </div>
        <button
          data-repeat-prompt
          className="round-control"
          onClick={() => void audio.line(line)}
          aria-label="Hear the expedition instructions"
        >
          <b className="pad-key y-key">Y</b>
          <Volume2 />
        </button>
      </div>
      {done ? (
        <>
          <div className="rover-stamp-book">
            {ROVER_STOPS.map((s) => (
              <div key={s.id} className={progress[s.id] > 0 ? 'stamped' : ''}>
                <RoverPicture kind={s.id} />
                <strong>{s.name}</strong>
                {progress[s.id] > 0 && <Check />}
              </div>
            ))}
          </div>
          <div className="rover-reward">
            <span>⭐</span>
            <strong>One star for exploring</strong>
          </div>
          <p>
            {ROVER_STOPS.every((s) => progress[s.id] > 0)
              ? 'All three stamps! There is always more to explore.'
              : 'Follow the golden star to another stop.'}
          </p>
          <button
            data-game-choice
            className="adventure-primary"
            onClick={onBack}
          >
            <b className="pad-key a-key">A</b>Keep exploring
          </button>
        </>
      ) : (
        <>
          <h2>How many {stop.item}?</h2>
          <div
            className={'rover-sample-tray ' + (hint ? 'count-with-me' : '')}
            aria-label={`${survey.target} ${stop.item}`}
          >
            {Array.from({ length: survey.target }, (_, i) => (
              <div key={i}>
                <RoverPicture kind={survey.stop} />
                {hint && <b>{i + 1}</b>}
              </div>
            ))}
          </div>
          <output className="rover-count-hint">
            {hint
              ? 'Count each picture once. Take your time.'
              : '✚ Choose a number · A Check'}
          </output>
          <QuantityDial
            value={answer}
            max={5}
            onChange={(n) => {
              setAnswer(n);
              void audio.line('number-' + n);
            }}
            onConfirm={submit}
          />
        </>
      )}
    </div>
  );
}
