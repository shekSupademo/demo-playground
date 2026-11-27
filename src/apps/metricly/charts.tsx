import { type KeyboardEvent, type MouseEvent, useState } from "react";
import { cx } from "../../ui";
import { formatValue, type Point, type Unit } from "./data";

const W = 640;
const H = 240;
const P = { l: 56, r: 12, t: 14, b: 30 };
const accent = "#7C3AED";
const previousColor = "#A1A1AA";

function niceScale(min: number, max: number, zero: boolean) {
  const start = zero ? 0 : min;
  const span = max - start || Math.abs(max) || 1;
  const raw = span / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const lo = Math.floor(start / step) * step;
  const hi = Math.max(lo + step, Math.ceil(max / step) * step);
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(v);
  return { lo, hi, ticks };
}

export function Chart({
  kind,
  points,
  unit,
  label,
  testId,
  compare = true,
}: {
  kind: "line" | "bar";
  points: Point[];
  unit: Unit;
  label: string;
  testId: string;
  compare?: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const n = points.length;
  const values = points.flatMap((p) =>
    compare && p.previous !== undefined ? [p.value, p.previous] : [p.value],
  );
  const scale = niceScale(
    Math.min(...values),
    Math.max(...values),
    kind === "bar",
  );
  const innerW = W - P.l - P.r;
  const band = innerW / n;
  const x = (i: number) =>
    kind === "bar"
      ? P.l + band * (i + 0.5)
      : P.l + (n === 1 ? innerW / 2 : (i * innerW) / (n - 1));
  const y = (v: number) =>
    P.t + (1 - (v - scale.lo) / (scale.hi - scale.lo)) * (H - P.t - P.b);
  const path = (get: (p: Point) => number) =>
    points
      .map(
        (p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(get(p)).toFixed(1)}`,
      )
      .join("");
  const every = Math.ceil(n / 7);

  const onMove = (e: MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i =
      kind === "bar"
        ? Math.floor((px - P.l) / band)
        : Math.round(((px - P.l) / innerW) * (n - 1));
    setActive(Math.max(0, Math.min(n - 1, i)));
  };
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const delta = e.key === "ArrowRight" ? 1 : -1;
      setActive((a) => Math.max(0, Math.min(n - 1, (a ?? n - 1) + delta)));
    }
    if (e.key === "Home") setActive(0);
    if (e.key === "End") setActive(n - 1);
    if (e.key === "Escape") setActive(null);
  };
  const point = active === null ? null : points[active];
  const showPrevious =
    kind === "line" && compare && points.some((p) => p.previous !== undefined);
  const flip = active !== null && x(active) > W / 2;

  return (
    <figure className="m-0 flex flex-col gap-3" data-testid={testId}>
      {showPrevious && (
        <div className="flex gap-4 text-xs text-zinc-500" aria-hidden>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3 rounded bg-violet-600" /> This period
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0 w-3 border-t-2 border-dashed border-zinc-400" />{" "}
            Previous period
          </span>
        </div>
      )}
      <div className="-mx-1 overflow-x-auto p-1">
        <div
          role="group"
          tabIndex={0}
          aria-label={`${label}. Use the arrow keys to read each value.`}
          onKeyDown={onKey}
          onFocus={() => setActive((a) => a ?? n - 1)}
          onBlur={() => setActive(null)}
          className="relative min-w-[20rem] rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block h-auto w-full"
            onMouseMove={onMove}
            onMouseLeave={() => setActive(null)}
            aria-hidden
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {scale.ticks.map((t) => (
              <g key={t}>
                <line
                  x1={P.l}
                  x2={W - P.r}
                  y1={y(t)}
                  y2={y(t)}
                  stroke="#E4E4E7"
                  strokeDasharray={t === scale.lo ? undefined : "3 4"}
                />
                <text
                  x={P.l - 10}
                  y={y(t)}
                  dy="0.32em"
                  textAnchor="end"
                  fontSize="11"
                  fill="#71717A"
                >
                  {formatValue(t, unit, true)}
                </text>
              </g>
            ))}
            {points.map((p, i) =>
              i % every === 0 || i === n - 1 ? (
                <text
                  key={p.label + i}
                  x={x(i)}
                  y={H - 8}
                  textAnchor={
                    kind === "line" && i === 0
                      ? "start"
                      : kind === "line" && i === n - 1
                        ? "end"
                        : "middle"
                  }
                  fontSize="11"
                  fill="#71717A"
                >
                  {p.label}
                </text>
              ) : null,
            )}
            {kind === "line" ? (
              <>
                {showPrevious && (
                  <path
                    d={path((p) => p.previous ?? p.value)}
                    fill="none"
                    stroke={previousColor}
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                )}
                <path
                  d={`${path((p) => p.value)}L${x(n - 1)},${H - P.b}L${x(0)},${H - P.b}Z`}
                  fill={accent}
                  fillOpacity="0.07"
                />
                <path
                  d={path((p) => p.value)}
                  fill="none"
                  stroke={accent}
                  strokeWidth="2.25"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {point && active !== null && (
                  <>
                    <line
                      x1={x(active)}
                      x2={x(active)}
                      y1={P.t}
                      y2={H - P.b}
                      stroke="#A1A1AA"
                      strokeWidth="1"
                    />
                    <circle
                      cx={x(active)}
                      cy={y(point.value)}
                      r="4.5"
                      fill="#fff"
                      stroke={accent}
                      strokeWidth="2.5"
                    />
                  </>
                )}
              </>
            ) : (
              points.map((p, i) => {
                const barW = Math.min(44, band * 0.62);
                const top = y(p.value);
                return (
                  <rect
                    key={p.label + i}
                    x={x(i) - barW / 2}
                    y={top}
                    width={barW}
                    height={Math.max(0, H - P.b - top)}
                    rx={Math.min(4, barW / 4)}
                    fill={accent}
                    fillOpacity={active === null || active === i ? 1 : 0.35}
                  />
                );
              })
            )}
          </svg>
          {point && active !== null && (
            <div
              className={cx(
                "pointer-events-none absolute top-1 z-10 min-w-32 rounded-lg bg-zinc-900 px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg",
                flip ? "-translate-x-[calc(100%+10px)]" : "translate-x-2.5",
              )}
              style={{
                left: `${(x(active) / W) * 100}%`,
              }}
              data-testid={`${testId}-tooltip`}
            >
              <p className="text-zinc-400">{point.label}</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums">
                {formatValue(point.value, unit)}
              </p>
              {showPrevious && point.previous !== undefined && (
                <p className="mt-0.5 tabular-nums text-zinc-400">
                  Previous {formatValue(point.previous, unit)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {point ? `${point.label}: ${formatValue(point.value, unit)}` : ""}
      </p>
    </figure>
  );
}

export function Funnel({
  steps,
  testId,
}: {
  steps: { label: string; value: number }[];
  testId: string;
}) {
  const top = steps[0]?.value || 1;
  const last = steps[steps.length - 1]?.value ?? 0;
  return (
    <div className="flex flex-col gap-4" data-testid={testId}>
      <p className="text-sm text-zinc-500">
        <span className="font-semibold tabular-nums text-zinc-900">
          {((last / top) * 100).toFixed(1)}%
        </span>{" "}
        of visitors made it through every step.
      </p>
      <ol className="flex flex-col gap-3">
        {steps.map((s, i) => {
          const prev = steps[i - 1]?.value;
          return (
            <li
              key={s.label}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[12rem_1fr_6rem]"
            >
              <span className="truncate text-sm font-medium" title={s.label}>
                <span className="mr-2 tabular-nums text-zinc-400">{i + 1}</span>
                {s.label}
              </span>
              <span className="order-3 col-span-2 h-7 overflow-hidden rounded-md bg-zinc-100 sm:order-none sm:col-span-1">
                <span
                  className="flex h-full items-center rounded-md bg-violet-600 px-2 text-xs font-medium text-white"
                  style={{ width: `${Math.max(4, (s.value / top) * 100)}%` }}
                >
                  {(s.value / top) * 100 >= 12 &&
                    `${((s.value / top) * 100).toFixed(0)}%`}
                </span>
              </span>
              <span className="text-right text-sm tabular-nums">
                <span className="block font-semibold">
                  {s.value.toLocaleString("en-US")}
                </span>
                {prev !== undefined && (
                  <span className="block text-xs text-zinc-500">
                    {((s.value / prev) * 100).toFixed(1)}% of previous
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function Retention({
  rows,
}: {
  rows: { label: string; size: number; retention: number[] }[];
}) {
  const months = Math.max(...rows.map((r) => r.retention.length));
  return (
    <div className="relative overflow-x-auto">
      <table
        className="w-full min-w-[34rem] border-separate border-spacing-1 text-sm"
        data-testid="retention-table"
      >
        <caption className="sr-only">Account retention by signup month</caption>
        <thead>
          <tr className="text-xs text-zinc-500">
            <th scope="col" className="px-2 py-1 text-left font-medium">
              Cohort
            </th>
            <th scope="col" className="px-2 py-1 text-right font-medium">
              Accounts
            </th>
            {Array.from({ length: months }, (_, m) => (
              <th
                key={m}
                scope="col"
                className="px-2 py-1 text-center font-medium"
              >
                Month {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <th
                scope="row"
                className="px-2 py-1.5 text-left font-medium whitespace-nowrap"
              >
                {r.label}
              </th>
              <td className="px-2 py-1.5 text-right tabular-nums text-zinc-600">
                {r.size.toLocaleString("en-US")}
              </td>
              {Array.from({ length: months }, (_, m) => {
                const v = r.retention[m];
                return (
                  <td
                    key={m}
                    className={cx(
                      "rounded px-2 py-1.5 text-center tabular-nums",
                      v === undefined
                        ? "bg-zinc-50"
                        : v > 55
                          ? "text-white"
                          : "text-violet-950",
                    )}
                    style={
                      v === undefined
                        ? undefined
                        : {
                            background: `rgba(124, 58, 237, ${(0.12 + (v / 100) * 0.8).toFixed(2)})`,
                          }
                    }
                  >
                    {v === undefined ? "" : `${v.toFixed(0)}%`}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
