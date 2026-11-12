import { cx } from "../lib/format";

const track = "pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-zinc-200 dark:bg-zinc-700";
const thumb =
  "absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent outline-none [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-indigo-600 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow focus-visible:[&::-webkit-slider-thumb]:ring-4 focus-visible:[&::-webkit-slider-thumb]:ring-indigo-500/30";

/** Single-value slider with tick labels. Values are whatever unit the caller uses. */
export function Slider({ value, min, max, step, onChange, label, format, marks, testId }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; label: string; format: (v: number) => string; marks?: number[]; testId?: string }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="relative h-5">
        <div className={track} />
        <div className="pointer-events-none absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-indigo-600" style={{ width: `${pct}%` }} />
        <input type="range" min={min} max={max} step={step} value={value} aria-label={label} aria-valuetext={format(value)} data-testid={testId} onChange={(e) => onChange(Number(e.target.value))} className={thumb} />
      </div>
      {marks && (
        <div className="flex justify-between text-[11px] text-zinc-400">
          {marks.map((m) => (
            <button key={m} type="button" onClick={() => onChange(m)} className="hover:text-indigo-600">
              {format(m)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Two-handle range slider built from two overlaid range inputs. */
export function RangeSlider({ low, high, min, max, step, onChange, label, format, testId }: { low: number; high: number; min: number; max: number; step: number; onChange: (low: number, high: number) => void; label: string; format: (v: number) => string; testId?: string }) {
  const lp = ((low - min) / (max - min)) * 100;
  const hp = ((high - min) / (max - min)) * 100;
  const pass = "pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto";
  return (
    <div className="w-full" data-testid={testId}>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-zinc-500">{label}</span>
        <span className="tabular font-medium" data-testid={testId ? `${testId}-value` : undefined}>
          {format(low)} – {high >= max ? `${format(max)}+` : format(high)}
        </span>
      </div>
      <div className="relative h-5">
        <div className={track} />
        <div className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-indigo-600" style={{ left: `${lp}%`, width: `${hp - lp}%` }} />
        <input type="range" min={min} max={max} step={step} value={low} aria-label={`${label} minimum`} onChange={(e) => onChange(Math.min(Number(e.target.value), high - step), high)} className={cx(thumb, pass, "z-10")} />
        <input type="range" min={min} max={max} step={step} value={high} aria-label={`${label} maximum`} onChange={(e) => onChange(low, Math.max(Number(e.target.value), low + step))} className={cx(thumb, pass, "z-20")} />
      </div>
    </div>
  );
}
