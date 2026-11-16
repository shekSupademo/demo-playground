import { useEffect, useRef, useState } from "react";
import { Button, Field, Input, Modal, PageHeader, Panel, Select, Tabs, Toggle } from "../components/ui";
import type { Settings as S } from "../data/types";
import { money, parseDollars } from "../lib/format";
import { INTEGRATIONS_FRAME } from "../lib/integrations";
import { useDispatch, useStore } from "../state/store";
import { useToast } from "../state/toast";

type Tab = "company" | "notifications" | "integrations";

export function Settings() {
  const [tab, setTab] = useState<Tab>("company");
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" actions={<Tabs value={tab} onChange={setTab} options={[{ value: "company", label: "Company" }, { value: "notifications", label: "Notifications" }, { value: "integrations", label: "Integrations" }]} />} />
      {tab === "company" && <CompanyTab />}
      {tab === "notifications" && <NotificationsTab />}
      {tab === "integrations" && <IntegrationsTab />}
    </div>
  );
}

function CompanyTab() {
  const { settings } = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const [company, setCompany] = useState(settings.companyName);
  const [user, setUser] = useState(settings.userName);
  const [confirmReset, setConfirmReset] = useState(false);
  const dirty = company !== settings.companyName || user !== settings.userName;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Profile">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!company.trim() || !user.trim()) return;
            dispatch({ type: "settings/update", patch: { companyName: company.trim(), userName: user.trim() } });
            toast("Settings saved");
          }}
        >
          <Field label="Company name" error={!company.trim() ? "Required" : undefined}>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} data-testid="company-name" />
          </Field>
          <Field label="Your name" error={!user.trim() ? "Required" : undefined}>
            <Input value={user} onChange={(e) => setUser(e.target.value)} />
          </Field>
          <Field label="Appearance">
            <Select value={settings.theme} onChange={(e) => dispatch({ type: "settings/update", patch: { theme: e.target.value as S["theme"] } })}>
              <option value="system">Match system</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
          </Field>
          <Button type="submit" variant="primary" disabled={!dirty}>
            Save changes
          </Button>
        </form>
      </Panel>
      <Panel title="Demo data">
        <p className="text-sm text-zinc-500">Everything here lives in your browser. Reset to start over with the original sample data.</p>
        <Button className="mt-4" variant="danger" onClick={() => setConfirmReset(true)} data-testid="reset-data">
          Reset demo data
        </Button>
        <Modal
          open={confirmReset}
          onClose={() => setConfirmReset(false)}
          title="Reset demo data?"
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  dispatch({ type: "reset" });
                  setConfirmReset(false);
                  toast("Demo data reset");
                }}
              >
                Reset
              </Button>
            </>
          }
        >
          <p className="text-sm text-zinc-500">Payments, cards, invoices and edits you've made will be replaced with the original sample data.</p>
        </Modal>
      </Panel>
    </div>
  );
}

function NotificationsTab() {
  const { settings } = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const [threshold, setThreshold] = useState(String(settings.largeTransactionThreshold / 100));
  const n = settings.notifications;
  const set = (k: keyof S["notifications"], v: boolean) => dispatch({ type: "settings/update", patch: { notifications: { ...n, [k]: v } } });
  const rows: [keyof S["notifications"], string, string][] = [
    ["largeTransactions", "Large transactions", "Email me when a single transaction exceeds the threshold below."],
    ["weeklySummary", "Weekly summary", "A Monday email with balances, burn and upcoming payments."],
    ["cardDeclines", "Card declines", "Notify the cardholder and admins when a card is declined."],
    ["invoicePaid", "Invoice paid", "Email me when a customer pays an invoice."],
  ];
  const parsed = parseDollars(threshold);
  return (
    <Panel title="Email notifications">
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {rows.map(([k, label, help]) => (
          <li key={k} className="flex items-center justify-between gap-6 py-3.5 first:pt-0">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-zinc-500">{help}</p>
            </div>
            <Toggle checked={n[k]} onChange={(v) => set(k, v)} label={label} testId={`notify-${k}`} />
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <div className="w-48">
          <Field label="Large transaction threshold" error={!parsed ? "Enter an amount" : undefined}>
            <Input inputMode="decimal" value={threshold} disabled={!n.largeTransactions} onChange={(e) => setThreshold(e.target.value)} />
          </Field>
        </div>
        <Button
          disabled={!parsed || parsed === settings.largeTransactionThreshold || !n.largeTransactions}
          onClick={() => {
            if (!parsed) return;
            dispatch({ type: "settings/update", patch: { largeTransactionThreshold: parsed } });
            toast(`Threshold set to ${money(parsed)}`);
          }}
        >
          Save
        </Button>
      </div>
    </Panel>
  );
}

// The integrations list is a separate static page embedded in a same-origin
// iframe. INTEGRATIONS_FRAME sets its src, title, name and load delay.
function IntegrationsTab() {
  const { settings } = useStore();
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(INTEGRATIONS_FRAME.loadDelayMs === 0);
  const [height, setHeight] = useState(200);
  const dark = settings.theme === "dark" || (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => setReady(true), INTEGRATIONS_FRAME.loadDelayMs);
    return () => clearTimeout(t);
  }, [ready]);

  // Same origin, so the frame's document can be measured to fit its content.
  const fit = () => {
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    const measure = () => setHeight(Math.ceil(doc.body.getBoundingClientRect().height));
    measure();
    new ResizeObserver(measure).observe(doc.body);
  };

  return (
    <Panel title="Integrations" padded={false}>
      {ready ? (
        <iframe
          ref={frame}
          key={dark ? "dark" : "light"}
          src={`${INTEGRATIONS_FRAME.src}${dark ? "?theme=dark" : ""}`}
          title={INTEGRATIONS_FRAME.title}
          name={INTEGRATIONS_FRAME.name}
          data-testid="integrations-frame"
          onLoad={fit}
          className="block w-full rounded-b-xl"
          style={{ height, border: 0 }}
        />
      ) : (
        <p className="px-5 py-14 text-center text-sm text-zinc-500" data-testid="integrations-loading">
          Loading integrations…
        </p>
      )}
    </Panel>
  );
}
