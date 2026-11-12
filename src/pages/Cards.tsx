import { Plus, Snowflake } from "lucide-react";
import { useState } from "react";
import { Dropdown } from "../components/Dropdown";
import { Slider } from "../components/Slider";
import { Badge, Button, Field, Input, Modal, PageHeader } from "../components/ui";
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
  const [editing, setEditing] = useState<Card | null>(null);
  const [limit, setLimit] = useState(0);
  const [nameText, setNameText] = useState("");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", holder: members[0]?.name ?? "", limit: 500_000, kind: "virtual" as Card["kind"] });

  const startEdit = (c: Card) => {
    setEditing(c);
    setLimit(c.monthlyLimit);
    setNameText(c.name);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cards"
        subtitle="Issue cards, set monthly limits and freeze them instantly."
        actions={
          <Button variant="primary" onClick={() => setCreating(true)} data-testid="new-card">
            <Plus className="size-4" /> New card
          </Button>
        }
      />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" data-testid="card-grid">
        {cards.map((c) => {
          const spent = cardSpendThisMonth(transactions, c.id);
          const pct = Math.min(100, (spent / c.monthlyLimit) * 100);
          return (
            <article key={c.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900" data-testid="card-item">
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
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(c)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        dispatch({ type: "card/toggleFreeze", id: c.id });
                        toast(`${c.name} ${c.frozen ? "unfrozen" : "frozen"}`);
                      }}
                      data-testid="freeze-toggle"
                    >
                      <Snowflake className="size-3.5" /> {c.frozen ? "Unfreeze" : "Freeze"}
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Edit ${editing?.name ?? "card"}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={limit <= 0 || !nameText.trim()}
              onClick={() => {
                if (!editing) return;
                dispatch({ type: "card/update", id: editing.id, patch: { monthlyLimit: limit, name: nameText.trim() } });
                toast("Card updated");
                setEditing(null);
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <Field label="Card name">
          <Input value={nameText} onChange={(e) => setNameText(e.target.value)} />
        </Field>
        <LimitControl cents={limit} onChange={setLimit} spent={editing ? cardSpendThisMonth(transactions, editing.id) : undefined} />
      </Modal>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Issue a new card"
        testId="new-card-modal"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
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
        }
      >
        <Field label="Card name">
          <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Conference travel" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
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
          <div>
            <p className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">Type</p>
            <Dropdown
              label="Card type"
              searchable={false}
              value={draft.kind}
              testId="card-type"
              options={[
                { value: "virtual", label: "Virtual", hint: "Instant" },
                { value: "physical", label: "Physical", hint: "Ships in 5 days" },
              ]}
              onChange={(v) => setDraft({ ...draft, kind: v })}
            />
          </div>
        </div>
        <LimitControl cents={draft.limit} onChange={(c) => setDraft({ ...draft, limit: c })} />
      </Modal>
    </div>
  );
}
