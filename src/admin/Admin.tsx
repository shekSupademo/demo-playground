import { ExternalLink, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { loadAllVariants, saveVariants } from "../lib/variants";
import { type AppId, appIds, apps, type Variant } from "../registry";
import { cx, useToasts } from "../ui";

type Status = "loading" | "ready" | "offline";

function VariantSwitch({
  name,
  value,
  disabled,
  onChange,
}: {
  name: string;
  value: Variant;
  disabled: boolean;
  onChange: (next: Variant) => void;
}) {
  return (
    <fieldset
      className="inline-flex rounded-lg bg-zinc-100 p-1"
      disabled={disabled}
    >
      <legend className="sr-only">{name} version</legend>
      {(["baseline", "variant"] as const).map((option) => (
        <label
          key={option}
          className={cx(
            "cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium capitalize has-focus-visible:outline-2 has-focus-visible:outline-indigo-500",
            value === option
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800",
          )}
        >
          <input
            type="radio"
            className="sr-only"
            name={`${name}-version`}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            data-testid={`${name}-${option}`}
          />
          {option}
        </label>
      ))}
    </fieldset>
  );
}

export function Admin() {
  const [variants, setVariants] = useState<Record<AppId, Variant> | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [toasts, toast] = useToasts();

  useEffect(() => {
    loadAllVariants().then((loaded) => {
      setVariants(loaded);
      setStatus(loaded ? "ready" : "offline");
    });
  }, []);

  async function update(ids: AppId[], variant: Variant) {
    if (!variants) return;
    const previous = variants;
    setVariants({
      ...variants,
      ...Object.fromEntries(ids.map((id) => [id, variant])),
    });
    if (await saveVariants(ids, variant)) return;
    setVariants(previous);
    toast("Couldn't save. Check that the Supabase project is running.");
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-6">
          <div>
            <SlidersHorizontal
              className="mb-3 size-6 text-indigo-600"
              aria-hidden
            />
            <h1 className="text-3xl font-semibold tracking-tight">
              Demo playground
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600">
              Ten independent apps, one per change category. Switch an app to
              its variant to apply every change in its category at once.
              Visitors see the change on their next page load.
            </p>
          </div>
          <div className="flex gap-2">
            {(["baseline", "variant"] as const).map((variant) => (
              <button
                key={variant}
                type="button"
                disabled={status !== "ready"}
                onClick={() => update([...appIds], variant)}
                data-testid={`all-${variant}`}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50"
              >
                All to {variant}
              </button>
            ))}
          </div>
        </header>

        {status === "offline" && (
          <p
            role="alert"
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            Can't reach Supabase, so every app shows its baseline. Restore the
            project from the Supabase dashboard, or open a pinned link below.
          </p>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {apps.map((app) => (
            <section
              key={app.id}
              aria-labelledby={`app-${app.id}`}
              data-testid={`app-${app.id}`}
              className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id={`app-${app.id}`} className="text-lg font-semibold">
                    {app.name}{" "}
                    <span className="font-normal text-zinc-500">
                      · {app.product}
                    </span>
                  </h2>
                  <p className="text-sm text-zinc-600">
                    {app.categories.join(" · ")}
                  </p>
                </div>
                <VariantSwitch
                  name={app.id}
                  value={variants?.[app.id] ?? "baseline"}
                  disabled={status !== "ready"}
                  onChange={(next) => update([app.id], next)}
                />
              </div>
              <p className="text-sm text-zinc-700">
                <strong className="font-medium">Flow to record:</strong>{" "}
                {app.flow}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <a
                  href={`./${app.id}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-indigo-700 hover:underline"
                >
                  Open {app.name}{" "}
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
                <a
                  href={`./${app.id}/?variant=baseline`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:underline"
                >
                  Pinned baseline
                </a>
                <a
                  href={`./${app.id}/?variant=variant`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:underline"
                >
                  Pinned variant
                </a>
              </div>
              <details className="group text-sm">
                <summary className="cursor-pointer font-medium text-zinc-700">
                  {app.changes.length} changes in the variant
                </summary>
                <table className="mt-3 w-full text-left">
                  <thead className="text-xs text-zinc-500 uppercase">
                    <tr>
                      <th className="py-1 pr-2">#</th>
                      <th className="py-1 pr-2">Change</th>
                      <th className="py-1 pr-2">Baseline</th>
                      <th className="py-1">Variant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 align-top">
                    {app.changes.map((change) => (
                      <tr key={change.item}>
                        <td className="py-1.5 pr-2 text-zinc-500 tabular-nums">
                          {change.item}
                        </td>
                        <td className="py-1.5 pr-2 font-medium">
                          {change.what}
                        </td>
                        <td className="py-1.5 pr-2 text-zinc-600">
                          {change.baseline}
                        </td>
                        <td className="py-1.5 text-zinc-900">
                          {change.variant}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </section>
          ))}
        </div>
        <p className="text-sm text-zinc-500">
          Pinned links ignore the shared setting, so parallel runs can hold a
          version without affecting anyone else. Every app starts from the same
          sample data on each load.
        </p>
      </main>
      {toasts}
    </div>
  );
}
