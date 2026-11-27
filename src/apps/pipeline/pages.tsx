import { Building2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Avatar,
  avatarColor,
  Badge,
  daysFromToday,
  EmptyState,
  formatDate,
  initials,
  money,
  useDocumentTitle,
} from "../../kit";
import { cx } from "../../ui";
import { ImportForm } from "./contacts";
import {
  type Company,
  type Contact,
  dealStages,
  openValue,
  owners,
  stages,
} from "./data";
import {
  compare,
  Field,
  PageHeader,
  Pagination,
  type Sort,
  SortHeader,
  SubmitButton,
  t,
  usePending,
} from "./parts";

const columnTone: Record<string, string> = {
  Discovery: "bg-sky-500",
  Proposal: "bg-amber-500",
  Negotiation: "bg-orange-500",
  "Closed won": "bg-emerald-500",
  "Closed lost": "bg-stone-400",
};

export function DealsPage({ contacts }: { contacts: Contact[] }) {
  useDocumentTitle("Deals – Pipeline");
  const [owner, setOwner] = useState("All owners");
  const deals = contacts
    .filter((c) => owner === "All owners" || c.owner === owner)
    .flatMap((c) => c.deals.map((d) => ({ ...d, contact: c })));
  const open = deals.filter(
    (d) => d.stage !== "Closed won" && d.stage !== "Closed lost",
  );
  const won = deals.filter((d) => d.stage === "Closed won");
  const stats = [
    {
      label: "Open pipeline",
      value: money(open.reduce((s, d) => s + d.amount, 0)),
      note: `${open.length} open deals`,
    },
    {
      label: "Won",
      value: money(won.reduce((s, d) => s + d.amount, 0)),
      note: `${won.length} deals closed`,
    },
    {
      label: "Average open deal",
      value: money(
        open.length
          ? Math.round(open.reduce((s, d) => s + d.amount, 0) / open.length)
          : 0,
      ),
      note: "Across all stages",
    },
  ];
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Deals"
        description="Every deal on the board, grouped by stage. Add deals from a contact."
        actions={
          <label>
            <span className="sr-only">Owner</span>
            <select
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className={cx(t.input, "w-auto")}
              data-testid="deals-owner-filter"
            >
              <option>All owners</option>
              {owners.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
        }
      />
      <dl className="grid gap-6 border-y border-stone-200 py-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-sm text-stone-500">{s.label}</dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
              {s.value}
            </dd>
            <dd className="text-xs text-stone-500">{s.note}</dd>
          </div>
        ))}
      </dl>
      <div
        className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0"
        data-testid="deal-board"
      >
        <div className="grid min-w-[1200px] grid-cols-5 gap-4">
          {dealStages.map((stage) => {
            const items = deals.filter((d) => d.stage === stage);
            return (
              <section
                key={stage}
                aria-label={stage}
                className="flex flex-col gap-3 rounded-2xl bg-stone-100/80 p-3"
              >
                <header className="flex items-center justify-between gap-2 px-1">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <span
                      className={cx("size-2 rounded-full", columnTone[stage])}
                      aria-hidden
                    />
                    {stage}
                    <span className="font-normal text-stone-500 tabular-nums">
                      {items.length}
                    </span>
                  </h2>
                  <span className="text-xs text-stone-500 tabular-nums">
                    {money(items.reduce((s, d) => s + d.amount, 0))}
                  </span>
                </header>
                {items.length === 0 && (
                  <p className="px-1 py-6 text-center text-xs text-stone-500">
                    No deals in this stage
                  </p>
                )}
                {items.map((d) => {
                  const late =
                    d.stage !== "Closed won" &&
                    d.stage !== "Closed lost" &&
                    d.close < daysFromToday(0);
                  return (
                    <article
                      key={d.id}
                      className="rounded-xl border border-stone-200 bg-white p-3 shadow-xs"
                    >
                      <p
                        className="truncate text-sm font-semibold"
                        title={d.name}
                      >
                        {d.name}
                      </p>
                      <Link
                        to={`/contacts/${d.contact.id}`}
                        className={cx(
                          "mt-1 flex items-center gap-1.5 rounded text-xs text-stone-600 hover:text-orange-700",
                          t.focus,
                        )}
                      >
                        <Avatar name={d.contact.name} size={18} />
                        <span
                          className="truncate"
                          title={`${d.contact.name}, ${d.contact.company}`}
                        >
                          {d.contact.company}
                        </span>
                      </Link>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-bold tabular-nums">
                          {money(d.amount)}
                        </span>
                        {late ? (
                          <Badge tone="danger">Past close date</Badge>
                        ) : (
                          <span className="text-xs text-stone-500">
                            {formatDate(d.close)}
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type CompanySortKey = "name" | "industry" | "contacts" | "value" | "location";

export function CompaniesPage({
  companies,
  contacts,
  showCompany,
}: {
  companies: Company[];
  contacts: Contact[];
  showCompany: (name: string) => void;
}) {
  useDocumentTitle("Companies – Pipeline");
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("All industries");
  const [sort, setSort] = useState<Sort<CompanySortKey>>(null);
  const industries = [...new Set(companies.map((c) => c.industry))].sort();
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = companies
      .map((c) => {
        const people = contacts.filter((p) => p.company === c.name);
        return {
          ...c,
          contacts: people.length,
          value: people.reduce((s, p) => s + openValue(p), 0),
        };
      })
      .filter(
        (c) =>
          (!q || c.name.toLowerCase().includes(q) || c.domain.includes(q)) &&
          (industry === "All industries" || c.industry === industry),
      );
    if (!sort) return list;
    const sorted = [...list].sort((a, b) => compare(a[sort.key], b[sort.key]));
    return sort.dir === "asc" ? sorted : sorted.reverse();
  }, [companies, contacts, query, industry, sort]);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Companies"
        description="Accounts your contacts work at, with their open pipeline."
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1 sm:max-w-xs">
          <span className="sr-only">Search companies</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or domain"
            className={cx(t.input, "pl-9")}
          />
        </label>
        <label>
          <span className="sr-only">Industry</span>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className={cx(t.input, "w-auto")}
          >
            <option>All industries</option>
            {industries.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </label>
      </div>
      <div className={cx(t.panel, "overflow-hidden shadow-xs")}>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Building2 className="size-5" aria-hidden />}
            title="No companies match"
            body="Try another name or industry."
            action={
              <button
                type="button"
                className={t.secondary}
                onClick={() => {
                  setQuery("");
                  setIndustry("All industries");
                }}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50/70 text-xs text-stone-500">
                <tr>
                  <SortHeader
                    label="Company"
                    sortKey="name"
                    sort={sort}
                    onSort={setSort}
                  />
                  <SortHeader
                    label="Industry"
                    sortKey="industry"
                    sort={sort}
                    onSort={setSort}
                  />
                  <SortHeader
                    label="Contacts"
                    sortKey="contacts"
                    sort={sort}
                    onSort={setSort}
                    align="right"
                    className="text-right"
                  />
                  <SortHeader
                    label="Open pipeline"
                    sortKey="value"
                    sort={sort}
                    onSort={setSort}
                    align="right"
                    className="text-right"
                  />
                  <SortHeader
                    label="Location"
                    sortKey="location"
                    sort={sort}
                    onSort={setSort}
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((c) => (
                  <tr key={c.name} className="hover:bg-orange-50/40">
                    <td className="max-w-72 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold text-white"
                          style={{ background: avatarColor(c.name) }}
                          aria-hidden
                        >
                          {initials(c.name)}
                        </span>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => showCompany(c.name)}
                            title={c.name}
                            className={cx(
                              "block max-w-full truncate rounded text-left font-semibold hover:text-orange-700",
                              t.focus,
                            )}
                          >
                            {c.name}
                          </button>
                          <p className="truncate text-xs text-stone-500">
                            {c.domain}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-700">{c.industry}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {c.contacts}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {c.value ? (
                        money(c.value)
                      ) : (
                        <span className="text-stone-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-stone-600">
                      {c.location}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={1}
          pageSize={50}
          total={rows.length}
          onPage={() => undefined}
        />
      </div>
    </div>
  );
}

export function SettingsPage({
  v,
  onImport,
  toast,
}: {
  v: boolean;
  onImport: (csv: string) => void;
  toast: (m: string) => void;
}) {
  useDocumentTitle("Settings – Pipeline");
  const [owner, setOwner] = useState("Round robin");
  const [stale, setStale] = useState("14 days");
  const [workspace, setWorkspace] = useState("Halcyon Software");
  const [currency, setCurrency] = useState("USD");
  const [fiscal, setFiscal] = useState("January");
  const [routingPending, runRouting] = usePending();
  const [workspacePending, runWorkspace] = usePending();
  const workspaceError = workspace.trim()
    ? undefined
    : "Enter a workspace name.";
  const section =
    "grid gap-6 border-t border-stone-200 py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]";
  return (
    <div className="flex max-w-4xl flex-col">
      <PageHeader
        title="Settings"
        description="Workspace defaults and how new leads reach your team."
      />
      <div className="mt-6">
        <section className={section}>
          <div>
            <h2 className="font-semibold">Workspace</h2>
            <p className="mt-1 text-sm text-stone-500">
              Shown on exports and used for reporting periods.
            </p>
          </div>
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (workspaceError) return;
              runWorkspace(() => toast("Changes saved"));
            }}
          >
            <Field label="Workspace name" error={workspaceError}>
              <input
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
                aria-invalid={!!workspaceError}
                className={t.input}
                data-testid="workspace-name"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Currency">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={t.input}
                >
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                  <option>CAD</option>
                </select>
              </Field>
              <Field label="Fiscal year starts in">
                <select
                  value={fiscal}
                  onChange={(e) => setFiscal(e.target.value)}
                  className={t.input}
                >
                  {["January", "April", "July", "October"].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div>
              <SubmitButton
                pending={workspacePending}
                disabled={!!workspaceError}
                pendingLabel="Saving"
                testId="save-workspace"
              >
                Save changes
              </SubmitButton>
            </div>
          </form>
        </section>
        <section className={section}>
          <div>
            <h2 className="font-semibold">Lead routing</h2>
            <p className="mt-1 text-sm text-stone-500">
              Decide who owns a new lead and when untouched leads move on.
            </p>
          </div>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              runRouting(() => toast("Changes saved"));
            }}
          >
            <Field label="New lead assignment">
              <select
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className={t.input}
                data-testid="lead-assignment"
              >
                <option>Round robin</option>
                <option>Account owner</option>
                <option>Unassigned</option>
              </select>
            </Field>
            <Field
              label="Reassign leads with no activity after"
              hint="The lead goes back into the routing queue."
            >
              <select
                value={stale}
                onChange={(e) => setStale(e.target.value)}
                className={t.input}
              >
                <option>7 days</option>
                <option>14 days</option>
                <option>30 days</option>
                <option>Never</option>
              </select>
            </Field>
            <div>
              <SubmitButton
                pending={routingPending}
                pendingLabel="Saving"
                testId="save-settings"
              >
                Save changes
              </SubmitButton>
            </div>
          </form>
        </section>
        <section className={section}>
          <div>
            <h2 className="font-semibold">Contact stages</h2>
            <p className="mt-1 text-sm text-stone-500">
              The stages every contact moves through, in order.
            </p>
          </div>
          <ol className="flex flex-col divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
            {stages.map((s, i) => (
              <li key={s} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="grid size-6 place-items-center rounded-full bg-stone-100 text-xs font-semibold tabular-nums text-stone-600">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </section>
        {v && (
          <section className={section} data-testid="import-section">
            <div>
              <h2 className="font-semibold">Import contacts</h2>
              <p className="mt-1 text-sm text-stone-500">
                Add people in bulk from a CSV with name, email and company.
              </p>
            </div>
            <ImportForm onImport={onImport} />
          </section>
        )}
      </div>
    </div>
  );
}
