import { quantityHint } from '@/lib/learning-hints';
import { GamePicture } from './game-picture';
export function QuantityHint({
  chosen,
  target,
  symbol,
}: {
  chosen: number;
  target: number;
  symbol: string;
}) {
  const hint = quantityHint(chosen, target);
  if (hint.direction === 'correct') return null;
  return (
    <div className="quantity-hint" aria-live="polite">
      <div
        className="hint-pictures"
        aria-label={
          hint.difference +
          (hint.direction === 'more' ? ' more needed' : ' extra')
        }
      >
        {hint.slots.map((state, i) => (
          <span key={i} className={'hint-slot ' + state}>
            <GamePicture symbol={symbol} />
            {state !== 'matched' && <b>{state === 'extra' ? '−' : '+'}</b>}
          </span>
        ))}
      </div>
      <p>
        {hint.direction === 'more'
          ? 'Fill the empty spaces'
          : 'Take the extras away'}{' '}
        <b className="hint-direction">
          {hint.direction === 'more' ? '→' : '←'}
        </b>
      </p>
    </div>
  );
}
