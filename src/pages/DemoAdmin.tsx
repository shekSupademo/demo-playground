import { ArrowUpRight, ClipboardList, CreditCard, Leaf, RotateCcw, Send, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, Button, Select } from "../components/ui";
import { baselineVariants, demoFeatureIds, demoFeatures, variantUrl } from "../lib/demoVariants";
import { useDemoVariants } from "../state/demoVariants";

const icons = { cards: CreditCard, payments: Send, bills: ClipboardList, insights: Leaf };

export function DemoAdmin() {
  const { variants, saveVariants } = useDemoVariants();
  const active = demoFeatureIds.filter((id) => variants[id] === "variant").length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div>
          <SlidersHorizontal className="mb-3 size-6 text-indigo-600 dark:text-indigo-400" aria-hidden />
          <h1 className="text-3xl font-semibold tracking-tight">Demo variants</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Select a version for each feature, then open it to record the workflow.
          </p>
        </div>
        <Button disabled={active === 0} onClick={() => saveVariants(baselineVariants)}>
          <RotateCcw className="size-4" aria-hidden /> Reset to baseline
        </Button>
      </header>
      <p role="status" className="text-sm text-zinc-500">{active} of {demoFeatureIds.length} variants active</p>
      <div className="grid gap-4 md:grid-cols-2">
        {demoFeatureIds.map((id) => {
          const feature = demoFeatures[id];
          const Icon = icons[id];
          return (
            <section key={id} aria-labelledby={`demo-${id}`} className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-indigo-50 p-2 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"><Icon className="size-5" aria-hidden /></span>
                <h2 id={`demo-${id}`} className="text-lg font-semibold">{feature.name}</h2>
                <div className="ml-auto"><Badge tone={variants[id] === "variant" ? "blue" : "gray"}>{feature.category}</Badge></div>
              </div>
              <Select aria-label={`${feature.name} version`} value={variants[id]} onChange={(event) => {
                const selected = event.target.value === "variant" ? "variant" : "baseline";
                saveVariants({ ...variants, [id]: selected });
              }}>
                <option value="baseline">Baseline</option>
                <option value="variant">{feature.variant}</option>
              </Select>
              <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <p><strong className="font-medium text-zinc-900 dark:text-zinc-100">Baseline.</strong> {feature.baseline}</p>
                <ul className="list-disc space-y-1 pl-5">
                  {feature.changes.map((change) => <li key={change}>{change}</li>)}
                </ul>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
                <Link to={`/${id}`} className="font-medium text-indigo-700 hover:underline dark:text-indigo-300">Open {id === "insights" ? "Insights" : feature.name}</Link>
                <a href={variantUrl(variants, `/${id}`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-zinc-600 hover:underline dark:text-zinc-400">
                  Shareable preview <ArrowUpRight className="size-3.5" aria-hidden />
                </a>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
