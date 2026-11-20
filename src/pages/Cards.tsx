import { ArrowLeft, CreditCard, Plus, Smartphone, Snowflake } from "lucide-react";
import { useState } from "react";
import { Dropdown } from "../components/Dropdown";
import { Slider } from "../components/Slider";
import { Badge, Button, Drawer, Field, Input, Modal, PageHeader } from "../components/ui";
import type { Card } from "../data/types";
import { cardSpendThisMonth } from "../lib/analytics";
import { cx, money, moneyCompact, parseDollars, uid } from "../lib/format";
import { useDispatch, useStore } from "../state/store";
import { useToast } from "../state/toast";

const LIMIT_MAX = 10_000_000; // $100,000
const LIMIT_STEP = 50_000; // $500
const LIMIT_MARKS = [0, 2_500_000, 5_000_000, 7_500_000, 10_000_000];

function LimitControl({ cents, onChange, spent }: { cents: number; onChange: (c: number) => void; spent?: number }) {
  const [text, setText] = useState(String(cents / 100));
  const [lastCents, setLastCents] = useState(cents);
  if (cents !== lastCents) {
    setLastCents(cents);
    setText(String(cents / 100));
  }
  const over = spent !== undefined && cents < spent;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Monthly limit</span>
        <Input
          aria-label="Monthly limit amount"
          data-testid="limit-input"
          className="w-32 text-right"
          inputMode="decimal"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const p = parseDollars(e.target.value);
            if (p !== null) onChange(Math.min(p, LIMIT_MAX));
          }}
        />
      </div>
      <Slider label="Monthly limit" min={0} max={LIMIT_MAX} step={LIMIT_STEP} value={Math.min(cents, LIMIT_MAX)} onChange={onChange} format={moneyCompact} marks={LIMIT_MARKS} testId="limit-slider" />
      {over && <p className="text-xs text-amber-600">This is below the {money(spent)} already spent this month. New charges will be declined.</p>}
    </div>
  );
}

const COLORS = ["from-indigo-500 to-violet-600", "from-sky-500 to-cyan-600", "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600", "from-rose-500 to-pink-600", "from-zinc-600 to-zinc-800"];

export function Cards() {
  const { cards, transactions, members } = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const [managingId, setManagingId] = useState<string | null>(null);
  const editing = cards.find((c) => c.id === managingId) ?? null;
  const [limit, setLimit] = useState(0);
  const [nameText, setNameText] = useState("");
  const [creating, setCreating] = useState(false);
  const [createStep, setCreateStep] = useState<"type" | "details">("type");
  const [draft, setDraft] = useState({ name: "", holder: members[0]?.name ?? "", limit: 500_000, kind: "virtual" as Card["kind"] });

  const startEdit = (c: Card) => {
    setManagingId(c.id);
    setLimit(c.monthlyLimit);
    setNameText(c.name);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cards"
        subtitle="Issue cards, set monthly limits and freeze them instantly."
        actions={
          <Button variant="primary" onClick={() => { setCreateStep("type"); setCreating(true); }} data-testid="new-card">
            <Plus className="size-4" /> New card
          </Button>
        }
      />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" data-testid="card-grid">
        {cards.map((c) => {
          const spent = cardSpendThisMonth(transactions, c.id);
          const pct = Math.min(100, (spent / c.monthlyLimit) * 100);
          return (
            <button type="button" key={c.id} onClick={() => startEdit(c)} aria-label={`Manage ${c.name} card`} className="rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-zinc-800 dark:bg-zinc-900" data-testid="card-item">
              <div className={cx("relative flex aspect-[1.6] flex-col justify-between rounded-lg bg-gradient-to-br p-4 text-white", c.color, c.frozen && "opacity-50 grayscale")}>
                <div className="flex items-start justify-between text-sm font-medium">
                  <span>{c.name}</span>
                  <span className="text-xs uppercase opacity-80">{c.kind}</span>
                </div>
                {c.frozen && <Snowflake className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2" />}
                <div>
                  <p className="tabular tracking-widest">•••• •••• •••• {c.last4}</p>
                  <p className="mt-1 text-xs opacity-80">{c.holder}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Spent this month</span>
                  <span className="tabular font-medium">
                    {money(spent)} <span className="text-zinc-400">/ {money(c.monthlyLimit)}</span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800" role="progressbar" aria-valuenow={Math.round(pct)} aria-label="Limit used">
                  <div className={cx("h-full rounded-full", pct > 90 ? "bg-rose-500" : pct > 70 ? "bg-amber-500" : "bg-indigo-500")} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between pt-2">
                  {c.frozen ? <Badge tone="blue">Frozen</Badge> : <Badge tone="green">Active</Badge>}
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Manage →</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Drawer open={!!editing} onClose={() => setManagingId(null)} title="Manage card" testId="card-drawer">
        {editing && (
          <div className="space-y-6">
            <div className={cx("flex aspect-[1.6] flex-col justify-between rounded-lg bg-gradient-to-br p-4 text-white", editing.color, editing.frozen && "opacity-50 grayscale")}>
              <div className="flex justify-between text-sm font-medium">
                <span>{editing.name}</span>
                <span className="text-xs uppercase opacity-80">{editing.kind}</span>
              </div>
              <div>
                <p className="tabular tracking-widest">•••• •••• •••• {editing.last4}</p>
                <p className="mt-1 text-xs opacity-80">{editing.holder}</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-800">
              <span>
                <span className="block font-medium">{editing.frozen ? "This card is frozen" : "This card is active"}</span>
                <span className="text-xs text-zinc-500">{editing.frozen ? "Charges are declined until you unfreeze it." : "Freeze it to decline all new charges."}</span>
              </span>
              <Button
                variant={editing.frozen ? "primary" : "secondary"}
                className="shrink-0 whitespace-nowrap"
                onClick={() => {
                  dispatch({ type: "card/toggleFreeze", id: editing.id });
                  toast(`${editing.name} ${editing.frozen ? "unfrozen" : "frozen"}`);
                }}
                data-testid="freeze-toggle"
              >
                <Snowflake className="size-3.5" /> {editing.frozen ? "Unfreeze card" : "Freeze card"}
              </Button>
            </div>
            <Field label="Card name">
              <Input value={nameText} onChange={(e) => setNameText(e.target.value)} />
            </Field>
            <LimitControl cents={limit} onChange={setLimit} spent={cardSpendThisMonth(transactions, editing.id)} />
            <div className="flex justify-end">
              <Button
                variant="primary"
                disabled={limit <= 0 || !nameText.trim() || (limit === editing.monthlyLimit && nameText.trim() === editing.name)}
                onClick={() => {
                  dispatch({ type: "card/update", id: editing.id, patch: { monthlyLimit: limit, name: nameText.trim() } });
                  toast("Card updated");
                }}
              >
                Save changes
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title={createStep === "type" ? "What kind of card?" : `New ${draft.kind} card`}
        testId="new-card-modal"
        footer={
          createStep === "type" ? (
            <>
              <Button variant="ghost" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setCreateStep("details")} data-testid="card-type-continue">
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setCreateStep("type")}>
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button
                variant="primary"
                disabled={!draft.name.trim() || draft.limit <= 0}
                onClick={() => {
                  dispatch({
                    type: "card/create",
                    card: { id: uid("card"), name: draft.name.trim(), holder: draft.holder, kind: draft.kind, monthlyLimit: draft.limit, frozen: false, accountId: "acc_ops", last4: String(Math.floor(1000 + Math.random() * 9000)), color: COLORS[cards.length % COLORS.length] },
                  });
                  toast(`${draft.kind === "virtual" ? "Virtual" : "Physical"} card created`);
                  setCreating(false);
                  setDraft({ name: "", holder: members[0]?.name ?? "", limit: 500_000, kind: "virtual" });
                }}
              >
                Create card
              </Button>
            </>
          )
        }
      >
        {createStep === "type" ? (
          <div role="radiogroup" aria-label="Card type" className="grid grid-cols-2 gap-3" data-testid="card-type">
            {([
              { kind: "virtual", label: "Virtual", body: "Ready instantly for online spend.", icon: Smartphone },
              { kind: "physical", label: "Physical", body: "Ships to the cardholder in 5 days.", icon: CreditCard },
            ] as const).map(({ kind, label, body, icon: Icon }) => (
              <button
                key={kind}
                type="button"
                role="radio"
                aria-checked={draft.kind === kind}
                onClick={() => setDraft({ ...draft, kind })}
                className={cx("flex flex-col gap-2 rounded-xl border p-4 text-left text-sm", draft.kind === kind ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20 dark:bg-indigo-950/40" : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700")}
              >
                <Icon className="size-5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-medium">{label}</span>
                <span className="text-xs text-zinc-500">{body}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <Field label="Card name">
              <Input autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Conference travel" />
            </Field>
            <div>
              <p className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">Cardholder</p>
              <Dropdown
                label="Cardholder"
                value={draft.holder}
                testId="cardholder"
                options={members.filter((m) => m.status === "active").map((m) => ({ value: m.name, label: m.name, hint: m.role }))}
                onChange={(v) => setDraft({ ...draft, holder: v })}
              />
            </div>
            <LimitControl cents={draft.limit} onChange={(c) => setDraft({ ...draft, limit: c })} />
          </>
        )}
      </Modal>
    </div>
  );
}
