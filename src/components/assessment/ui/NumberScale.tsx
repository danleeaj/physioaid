"use client";

/**
 * 0–10 tap scale — eleven large targets replacing the old range slider.
 * Every value is always visible with its number (no tiny slider, no
 * colour-only state).
 */
export function NumberScale({
  value,
  onChange,
  min = 0,
  max = 10,
  lowLabel,
  highLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  lowLabel: string;
  highLabel: string;
}) {
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="grid gap-3">
      <div
        aria-label={`${lowLabel}, ${highLabel}`}
        className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-11"
        role="radiogroup"
      >
        {values.map((option) => {
          const selected = option === value;
          return (
            <button
              aria-checked={selected}
              className={`flex min-h-14 items-center justify-center rounded-[var(--radius-control)] border-2 text-[length:var(--text-lead)] font-bold transition-colors ${
                selected
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--primary)]"
              }`}
              key={option}
              onClick={() => onChange(option)}
              role="radio"
              type="button"
            >
              {option}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[length:var(--text-label)] font-semibold text-[var(--muted)]">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
