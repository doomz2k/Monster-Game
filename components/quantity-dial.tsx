'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** One spatial control: the pad changes the quantity; A submits it. */
export function QuantityDial({
  value,
  max,
  onChange,
  onConfirm,
  disabled = false,
  label = 'Your answer',
  confirmLabel = 'That’s my answer',
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  onConfirm: () => void;
  disabled?: boolean;
  label?: string;
  confirmLabel?: string;
}) {
  return (
    <div
      className="quantity-answer"
      data-quantity-dial={!disabled || undefined}
    >
      <fieldset className="quantity-dial" aria-label={label}>
        <button
          data-quantity-less
          disabled={disabled || value === 0}
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label="One less"
        >
          <ChevronLeft />
        </button>
        <div>
          <small>{label}</small>
          <output aria-live="polite" aria-label={label}>
            {value}
          </output>
        </div>
        <button
          data-quantity-more
          disabled={disabled || value === max}
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label="One more"
        >
          <ChevronRight />
        </button>
      </fieldset>
      <button
        data-game-choice
        data-game-confirm
        className="adventure-primary"
        disabled={disabled}
        onClick={onConfirm}
      >
        <b className="pad-key a-key">A</b>
        {confirmLabel}
      </button>
    </div>
  );
}
