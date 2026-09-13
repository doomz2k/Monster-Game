import { Check } from 'lucide-react';
import { ROCKET_CHAPTERS, repairStage } from '@/lib/rocket-story';
import { GamePicture } from './game-picture';
export function RocketProgress({ rounds }: { rounds: number }) {
  const stage = repairStage(rounds);
  return (
    <div
      className="rocket-repair-story"
      aria-label={stage + ' of 3 rocket systems repaired'}
    >
      {ROCKET_CHAPTERS.slice(0, 3).map((chapter, i) => (
        <div
          key={chapter.line}
          className={i < stage ? 'repaired' : i === stage ? 'next-repair' : ''}
          aria-label={
            chapter.title +
            (i < stage ? ', repaired' : i === stage ? ', next' : ', later')
          }
        >
          <GamePicture symbol={chapter.picture} />
          {i < stage ? <Check /> : <b>{i + 1}</b>}
          <span>{['Control panel', 'Fuel tank', 'Star battery'][i]}</span>
        </div>
      ))}
    </div>
  );
}
