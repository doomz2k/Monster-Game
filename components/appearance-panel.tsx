'use client';
import { LOOK_OPTIONS, PALETTE, type Appearance } from '@/lib/appearance';
const labels: Record<keyof typeof LOOK_OPTIONS, string> = {
  shape: '🟡 Body shape',
  eyes: '👀 How many eyes?',
  eyeSize: '👁 Eye size',
  horns: '🦄 Horns',
  ears: '🐰 Ears',
  tail: '🦎 Tail',
  pattern: '🎨 Pattern',
  texture: '🧸 Feel',
  face: '😊 Cheeks',
};
export function AppearancePanel({
  value,
  onChange,
}: {
  value: Appearance;
  onChange: (look: Appearance) => void;
}) {
  return (
    <div className="appearance-panel">
      <p>Every monster is different. Make yours!</p>
      {(['colour', 'accent', 'iris'] as const).map((key) => (
        <fieldset key={key}>
          <legend>
            {key === 'colour'
              ? '🌈 Body colour'
              : key === 'accent'
                ? '🎨 Tummy & pattern'
                : '👁 Eye colour'}
          </legend>
          <div className="colour-choices">
            {PALETTE.map((colour, i) => (
              <button
                data-game-choice
                key={colour}
                type="button"
                style={{ backgroundColor: colour }}
                aria-label={`${key} colour ${i + 1}`}
                aria-pressed={value[key] === colour}
                onClick={() => onChange({ ...value, [key]: colour })}
              >
                {value[key] === colour ? '✓' : ''}
              </button>
            ))}
            <label className="custom-colour">
              🎨
              <input
                type="color"
                aria-label={'Pick any ' + key + ' colour'}
                value={value[key]}
                onChange={(e) => onChange({ ...value, [key]: e.target.value })}
              />
            </label>
          </div>
        </fieldset>
      ))}
      {(Object.keys(LOOK_OPTIONS) as (keyof typeof LOOK_OPTIONS)[]).map(
        (key) => (
          <fieldset key={key}>
            <legend>{labels[key]}</legend>
            <div className="look-choices">
              {LOOK_OPTIONS[key].map((option) => (
                <button
                  data-game-choice
                  key={option}
                  type="button"
                  aria-pressed={value[key] === option}
                  onClick={() => onChange({ ...value, [key]: option })}
                >
                  {option === 'one'
                    ? '👁'
                    : option === 'two'
                      ? '👀'
                      : option === 'three'
                        ? '👀👁'
                        : option === 'none'
                          ? '✕'
                          : option === 'spots'
                            ? '● ●'
                            : option === 'stripes'
                              ? '☰'
                              : option === 'diamonds'
                                ? '◆ ◆'
                                : '✦'}
                  <span>{option}</span>
                </button>
              ))}
            </div>
          </fieldset>
        ),
      )}
    </div>
  );
}
