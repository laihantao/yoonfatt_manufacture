'use client';

// Single source of truth for quantity input:
// − / + buttons only, no native number spinners, no scroll-to-change.
// (type="text" + inputMode="numeric" deliberately avoids the browser's
// spin buttons and wheel behaviour that a type="number" input has.)
export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  size = 'md',
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  size?: 'sm' | 'md';
}) {
  const clamp = (n: number) => Math.max(min, Number.isFinite(n) ? Math.round(n) : min);
  const btn =
    size === 'sm'
      ? 'px-2 py-1 text-base leading-none'
      : 'px-3 py-2 text-lg leading-none';
  const field = size === 'sm' ? 'w-10 py-1 text-sm' : 'w-14 py-2 text-sm';

  return (
    <div className="inline-flex items-center rounded-md border border-neutral-300 bg-white">
      <button
        type="button"
        aria-label="Decrease quantity"
        className={`${btn} text-neutral-600 hover:bg-neutral-50 disabled:opacity-40`}
        disabled={value <= min}
        onClick={() => onChange(clamp(value - 1))}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, '');
          onChange(clamp(Number(digits || min)));
        }}
        className={`${field} border-x border-neutral-300 text-center focus:outline-none`}
        aria-label="Quantity"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        className={`${btn} text-neutral-600 hover:bg-neutral-50`}
        onClick={() => onChange(clamp(value + 1))}
      >
        +
      </button>
    </div>
  );
}
