import {
  Briefcase,
  Building2,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  Download,
  Gauge,
  Mail,
  MoreHorizontal,
  NotebookPen,
  Phone,
  Plus,
  Search,
  Trash2,
  Upload,
  UserRound,
  Users,
} from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  Badge,
  daysFromToday,
  EmptyState,
  formatDate,
  money,
  relativeTime,
  useDocumentTitle,
} from "../../kit";
import { cx, Dialog, Menu } from "../../ui";
import {
  type Activity,
  type ActivityKind,
  type Company,
  type Contact,
  type DealStage,
  dealStages,
  openValue,
  owners,
  sampleImport,
  stages,
} from "./data";
import {
  compare,
  Field,
  PageHeader,
  Pagination,
  type Sort,
  SortHeader,
  StageBadge,
  SubmitButton,
  t,
  usePending,
} from "./parts";

const PAGE_SIZE = 20;
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const now = () => new Date().toISOString();

export function exportCsv(contacts: Contact[]) {
  const rows = [
    "name,email,company,stage",
    ...contacts.map((c) => [c.name, c.email, c.company, c.stage].join(",")),
  ];
  const url = URL.createObjectURL(
    new Blob([rows.join("\n")], { type: "text/csv" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "contacts.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function ImportForm({ onImport }: { onImport: (csv: string) => void }) {
  const [csv, setCsv] = useState(sampleImport);
  const [pending, run] = usePending();
  const rows = csv.split("\n").slice(1).filter((line) => line.trim()).length;
  return (
    <form
      className="mt-4 flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => onImport(csv));
      }}
    >
      <Field
        label="Paste CSV rows"
        hint={`First row is the header: name, email, company. ${rows} ${rows === 1 ? "row" : "rows"} ready.`}
      >
        <textarea
          rows={5}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          className={cx(t.input, "font-mono text-xs")}
          data-testid="import-csv"
        />
      </Field>
      <div className="flex justify-end">
        <SubmitButton
          pending={pending}
          disabled={rows === 0}
          pendingLabel="Importing"
          testId="import-contacts"
        >
          <Upload className="size-4" aria-hidden /> Import contacts
        </SubmitButton>
      </div>
    </form>
  );
}

type ContactSortKey = "name" | "company" | "stage" | "owner" | "value" | "last";

function AddContactDialog({
  open,
  onClose,
  companies,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  companies: Company[];
  onAdd: (c: Pick<Contact, "name" | "email" | "company" | "title" | "owner">) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState<string>(owners[0]);
  const [touched, setTouched] = useState(false);
  const [pending, run] = usePending();
  const nameError = touched && !name.trim() ? "Enter a name." : undefined;
  const emailError =
    touched && !isEmail(email.trim()) ? "Enter a valid email address." : undefined;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add contact"
      className={t.dialog}
      testId="add-contact-dialog"
    >
      <form
        noValidate
        className="mt-4 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (!name.trim() || !isEmail(email.trim())) return;
          run(() => {
            onAdd({ name: name.trim(), email: email.trim(), company: company.trim(), title: title.trim(), owner });
            setName("");
            setEmail("");
            setCompany("");
            setTitle("");
            setTouched(false);
          });
        }}
      >
        <Field label="Full name" error={nameError}>
          <input value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!nameError} className={t.input} data-testid="new-contact-name" />
        </Field>
        <Field label="Work email" error={emailError}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!emailError} className={t.input} data-testid="new-contact-email" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company">
            <input list="pipeline-companies" value={company} onChange={(e) => setCompany(e.target.value)} className={t.input} />
            <datalist id="pipeline-companies">
              {companies.map((c) => (
                <option key={c.name} value={c.name} />
              ))}
            </datalist>
          </Field>
          <Field label="Job title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={t.input} />
          </Field>
        </div>
        <Field label="Owner">
          <select value={owner} onChange={(e) => setOwner(e.target.value)} className={t.input}>
            {owners.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </Field>
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className={t.secondary} onClick={onClose}>
            Cancel
          </button>
          <SubmitButton pending={pending} pendingLabel="Adding" testId="save-contact">
            Add contact
          </SubmitButton>
        </div>
      </form>
    </Dialog>
  );
}

export function ContactsPage({
  v,
  contacts,
  companies,
  query,
  setQuery,
  onImport,
  onAdd,
  toast,
}: {
  v: boolean;
  contacts: Contact[];
  companies: Company[];
  query: string;
  setQuery: (q: string) => void;
  onImport: (csv: string) => void;
  onAdd: (c: Pick<Contact, "name" | "email" | "company" | "title" | "owner">) => void;
  toast: (m: string) => void;
}) {
  useDocumentTitle("Contacts – Pipeline");
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [stage, setStage] = useState("All stages");
  const [owner, setOwner] = useState("All owners");
  const [sort, setSort] = useState<Sort<ContactSortKey>>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = contacts.filter(
      (c) =>
        (!q || [c.name, c.email, c.company, c.title].some((f) => f.toLowerCase().includes(q))) &&
        (stage === "All stages" || c.stage === stage) &&
        (owner === "All owners" || c.owner === owner),
    );
    if (!sort) return rows;
    const value = (c: Contact) =>
      sort.key === "value"
        ? openValue(c)
        : sort.key === "stage"
          ? stages.indexOf(c.stage)
          : sort.key === "last"
            ? c.lastContacted
            : c[sort.key];
    const sorted = [...rows].sort((a, b) => compare(value(a), value(b)));
    return sort.dir === "asc" ? sorted : sorted.reverse();
  }, [contacts, query, stage, owner, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filtering = query || stage !== "All stages" || owner !== "All owners";
  const resetPage = <T,>(set: (value: T) => void) => (value: T) => {
    set(value);
    setPage(1);
  };

  const exportButton = (
    <button
      type="button"
      className={t.secondary}
      onClick={() => {
        exportCsv(filtered);
        toast(`Exported ${filtered.length} contacts`);
      }}
      data-testid="export-csv"
    >
      <Download className="size-4" aria-hidden /> Export CSV
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Contacts"
        description="Everyone your team is selling to, with their stage and owner."
        actions={
          <>
            {!v && (
              <>
                {exportButton}
                <button
                  type="button"
                  className={t.secondary}
                  onClick={() => setImportOpen(true)}
                  data-testid="open-import"
                >
                  <Upload className="size-4" aria-hidden /> Import contacts
                </button>
              </>
            )}
            <button type="button" className={t.primary} onClick={() => setAddOpen(true)} data-testid="add-contact">
              <Plus className="size-4" aria-hidden /> Add contact
            </button>
          </>
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1 sm:max-w-xs">
          <span className="sr-only">Search contacts</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => resetPage(setQuery)(e.target.value)}
            placeholder="Search by name, email or company"
            className={cx(t.input, "pl-9")}
            data-testid="contact-search"
          />
        </label>
        <div className="flex gap-2">
          <label>
            <span className="sr-only">Stage</span>
            <select value={stage} onChange={(e) => resetPage(setStage)(e.target.value)} className={cx(t.input, "w-auto")} data-testid="stage-filter">
              <option>All stages</option>
              {stages.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Owner</span>
            <select value={owner} onChange={(e) => resetPage(setOwner)(e.target.value)} className={cx(t.input, "w-auto")} data-testid="owner-filter">
              <option>All owners</option>
              {owners.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className={cx(t.panel, "overflow-hidden shadow-xs")}>
        {shown.length === 0 ? (
          <EmptyState
            icon={<Users className="size-5" aria-hidden />}
            title={filtering ? "No contacts match these filters" : "No contacts yet"}
            body={filtering ? "Try a different search, or clear the filters to see everyone." : "Add your first contact to start tracking deals."}
            action={
              filtering ? (
                <button
                  type="button"
                  className={t.secondary}
                  onClick={() => {
                    setQuery("");
                    setStage("All stages");
                    setOwner("All owners");
                  }}
                >
                  Clear filters
                </button>
              ) : (
                <button type="button" className={t.primary} onClick={() => setAddOpen(true)}>
                  <Plus className="size-4" aria-hidden /> Add contact
                </button>
              )
            }
          />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50/70 text-xs text-stone-500">
                <tr>
                  <SortHeader label="Name" sortKey="name" sort={sort} onSort={setSort} />
                  <SortHeader label="Company" sortKey="company" sort={sort} onSort={setSort} />
                  <SortHeader label="Stage" sortKey="stage" sort={sort} onSort={setSort} />
                  <SortHeader label="Owner" sortKey="owner" sort={sort} onSort={setSort} />
                  <SortHeader label="Open deals" sortKey="value" sort={sort} onSort={setSort} align="right" className="text-right" />
                  <SortHeader label="Last contacted" sortKey="last" sort={sort} onSort={setSort} />
                  <th className="px-4 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {shown.map((c) => (
                  <tr key={c.id} className="group hover:bg-orange-50/40" data-testid={`contact-row-${c.id}`}>
                    <td className="max-w-64 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} size={32} />
                        <div className="min-w-0">
                          <Link
                            to={`/contacts/${c.id}`}
                            title={c.name}
                            className={cx("block truncate rounded font-semibold text-stone-900 hover:text-orange-700", t.focus)}
                            data-testid={`contact-${c.id}`}
                          >
                            {c.name}
                          </Link>
                          <p className="truncate text-xs text-stone-500" title={c.email}>
                            {c.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-56 px-4 py-3">
                      <p className="truncate text-stone-700" title={c.company}>
                        {c.company || <span className="text-stone-400">No company</span>}
                      </p>
                      <p className="truncate text-xs text-stone-500" title={c.title}>
                        {c.title || "No title"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StageBadge stage={c.stage} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-stone-700">{c.owner}</td>
                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap tabular-nums">
                      {openValue(c) ? money(openValue(c)) : <span className="text-stone-400">None</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-stone-600">{relativeTime(c.lastContacted)}</td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`mailto:${c.email}`}
                        aria-label={`Email ${c.name}`}
                        title={`Email ${c.name}`}
                        className={cx(
                          "inline-flex rounded-md p-1.5 text-orange-700 hover:bg-orange-100",
                          t.focus,
                          v && "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus:opacity-100",
                        )}
                        data-testid={`email-${c.id}`}
                      >
                        <Mail className="size-4" aria-hidden />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={current} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
      </div>
      {v && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-stone-500">Download the {filtered.length} contacts that match your filters.</p>
          {exportButton}
        </div>
      )}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} title="Import contacts" className={t.dialog} testId="import-dialog">
        <p className="mt-1 text-sm text-stone-500">New contacts start in the Lead stage and are assigned by your lead routing rule.</p>
        <ImportForm
          onImport={(csv) => {
            onImport(csv);
            setImportOpen(false);
          }}
        />
      </Dialog>
      <AddContactDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        companies={companies}
        onAdd={(c) => {
          onAdd(c);
          setAddOpen(false);
        }}
      />
    </div>
  );
}

const activityIcon: Record<ActivityKind, typeof Mail> = {
  email: Mail,
  call: Phone,
  meeting: CalendarClock,
  note: NotebookPen,
  deal: CircleDollarSign,
};

function Timeline({ items }: { items: Activity[] }) {
  return (
    <ol className="relative flex flex-col gap-5 before:absolute before:top-2 before:bottom-2 before:left-4 before:w-px before:bg-stone-200">
      {items.map((item) => {
        const Icon = activityIcon[item.kind];
        return (
          <li key={item.id} className="relative flex gap-4">
            <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full border border-stone-200 bg-white text-stone-600">
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-sm text-stone-800">{item.text}</p>
              <p className="mt-0.5 text-xs text-stone-500">
                <time dateTime={item.at}>{relativeTime(item.at)}</time>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-stone-900">{children}</dd>
    </div>
  );
}

export function ContactDetail({
  v,
  contacts,
  companies,
  update,
  remove,
  toast,
  showCompany,
}: {
  v: boolean;
  contacts: Contact[];
  companies: Company[];
  update: (id: string, change: (c: Contact) => Contact) => void;
  remove: (id: string) => void;
  toast: (m: string) => void;
  showCompany: (name: string) => void;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const contact = contacts.find((c) => c.id === id);
  useDocumentTitle(`${contact?.name ?? "Contact"} – Pipeline`);
  const [callOpen, setCallOpen] = useState(false);
  const [dealOpen, setDealOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState("Connected");
  const [dealName, setDealName] = useState("");
  const [amount, setAmount] = useState("10000");
  const [dealStage, setDealStage] = useState<DealStage>("Discovery");
  const [dealTouched, setDealTouched] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [newTask, setNewTask] = useState("");
  const [callPending, runCall] = usePending();
  const [dealPending, runDeal] = usePending();
  const [emailPending, runEmail] = usePending();
  if (!contact) return <Navigate to="/" replace />;

  const company = companies.find((c) => c.name === contact.company);
  const colleagues = contacts.filter((c) => c.company === contact.company && c.id !== contact.id);
  const log = (kind: ActivityKind, text: string) => (c: Contact): Contact => ({
    ...c,
    lastContacted: daysFromToday(0),
    activity: [{ id: `a-${Date.now()}`, kind, text, at: now() }, ...c.activity],
  });

  const openCall = () => setCallOpen(true);
  const deleteContact = () => {
    remove(contact.id);
    toast(`${contact.name} deleted`);
    navigate("/");
  };
  const logCall = (e: FormEvent) => {
    e.preventDefault();
    runCall(() => {
      update(contact.id, log("call", `Call, ${outcome.toLowerCase()}: ${notes.trim() || "No notes"}`));
      setNotes("");
      setCallOpen(false);
      toast("Call logged");
    });
  };
  const dealNameError = dealTouched && !dealName.trim() ? "Enter a deal name." : undefined;
  const amountError = dealTouched && !(Number(amount) > 0) ? "Enter an amount above zero." : undefined;
  const addDeal = (e: FormEvent) => {
    e.preventDefault();
    setDealTouched(true);
    if (!dealName.trim() || !(Number(amount) > 0)) return;
    runDeal(() => {
      const name = dealName.trim();
      update(contact.id, (c) => ({
        ...log("deal", `Deal created: ${name}`)(c),
        deals: [
          ...c.deals,
          { id: `d-${Date.now()}`, name, amount: Number(amount), stage: dealStage, close: daysFromToday(30) },
        ],
      }));
      setDealName("");
      setDealTouched(false);
      setDealOpen(false);
      toast("Deal added");
    });
  };
  const sendEmail = (e: FormEvent) => {
    e.preventDefault();
    runEmail(() => {
      update(contact.id, log("email", `Email sent: ${subject.trim() || "No subject"}`));
      setSubject("");
      setBody("");
      setEmailOpen(false);
      toast(`Email sent to ${contact.email}`);
    });
  };

  const leadScore = (
    <div data-testid="lead-score">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-stone-600">
          <Gauge className="size-4" aria-hidden /> Lead score
        </span>
        <span className="font-bold tabular-nums">{contact.score}/100</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-stone-100" role="meter" aria-valuenow={contact.score} aria-valuemin={0} aria-valuemax={100} aria-label="Lead score">
        <div className="h-2 rounded-full bg-orange-500" style={{ width: `${contact.score}%` }} />
      </div>
      <p className="mt-2 text-xs text-stone-500">
        {contact.score >= 80 ? "Hot. Engaged recently and fits your ideal customer." : contact.score >= 50 ? "Warm. Some engagement in the last two weeks." : "Cold. Little engagement so far."}
      </p>
    </div>
  );

  const openTasks = contact.tasks.filter((task) => !task.done).length;

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-stone-500">
        <Link to="/" className={cx("rounded hover:text-stone-900", t.focus)}>
          Contacts
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <span aria-current="page" className="truncate text-stone-900" title={contact.name}>
          {contact.name}
        </span>
      </nav>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={contact.name} size={56} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold tracking-tight" title={contact.name}>
                {contact.name}
              </h1>
              <StageBadge stage={contact.stage} />
            </div>
            <p className="mt-0.5 truncate text-sm text-stone-500">
              {contact.title ? `${contact.title} at ${contact.company}` : contact.company}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={v ? t.primary : t.secondary} onClick={() => setEmailOpen(true)} data-testid="send-email">
            <Mail className="size-4" aria-hidden /> Send email
          </button>
          <button type="button" className={v ? t.secondary : t.primary} onClick={() => setDealOpen(true)} data-testid="add-deal">
            <Plus className="size-4" aria-hidden /> Add deal
          </button>
          {v && (
            <button type="button" className={t.secondary} onClick={openCall} data-testid="log-call">
              <Phone className="size-4" aria-hidden /> Log a call
            </button>
          )}
          {!v && (
            <button type="button" className={cx(t.secondary, "text-rose-600 hover:bg-rose-50")} onClick={deleteContact} data-testid="delete-contact">
              <Trash2 className="size-4" aria-hidden /> Delete contact
            </button>
          )}
          <Menu
            label="More actions"
            trigger={<MoreHorizontal className="size-4" aria-hidden />}
            triggerClassName={cx(t.secondary, "px-2.5")}
            testId="contact-menu"
            items={[
              ...(v ? [] : [{ label: "Log a call", onSelect: openCall, testId: "log-call" }]),
              {
                label: "Copy email",
                onSelect: () => {
                  navigator.clipboard?.writeText(contact.email).catch(() => undefined);
                  toast("Email copied");
                },
                testId: "copy-email",
              },
              ...(v ? [{ label: "Delete contact", onSelect: deleteContact, danger: true, testId: "delete-contact" }] : []),
            ]}
          />
        </div>
      </header>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-stone-200 py-4 sm:grid-cols-3 lg:grid-cols-5">
        <Fact label="Email">
          <a href={`mailto:${contact.email}`} title={contact.email} className={cx("rounded hover:text-orange-700", t.focus)}>
            {contact.email}
          </a>
        </Fact>
        <Fact label="Phone">{contact.phone || <span className="font-normal text-stone-400">Not added</span>}</Fact>
        <Fact label="Owner">{contact.owner}</Fact>
        <Fact label="Last contacted">{relativeTime(contact.lastContacted)}</Fact>
        <Fact label="Open pipeline">
          <span className="tabular-nums">{money(openValue(contact))}</span>
        </Fact>
      </dl>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-8">
          <section className={cx(t.panel, "overflow-hidden")} data-testid="deals">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h2 className="font-semibold">Deals</h2>
              <span className="text-sm text-stone-500 tabular-nums">{contact.deals.length}</span>
            </div>
            {contact.deals.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-stone-500">No deals with {contact.name.split(" ")[0]} yet.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {contact.deals.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                    <Briefcase className="size-4 text-stone-400" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium" title={d.name}>
                        {d.name}
                      </span>
                      <span className="block text-xs text-stone-500">Closes {formatDate(d.close)}</span>
                    </span>
                    <StageBadge stage={d.stage} />
                    <span className="w-24 text-right font-semibold tabular-nums">{money(d.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section data-testid="tasks">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Tasks</h2>
              <span className="text-sm text-stone-500">{openTasks} open</span>
            </div>
            <ul className="flex flex-col gap-1">
              {contact.tasks.map((task) => {
                const overdue = !task.done && task.due < daysFromToday(0);
                return (
                  <li key={task.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-stone-100/70">
                    <input
                      type="checkbox"
                      checked={task.done}
                      id={`task-${task.id}`}
                      className="size-4 accent-orange-600"
                      onChange={(e) => {
                        update(contact.id, (c) => ({
                          ...c,
                          tasks: c.tasks.map((x) => (x.id === task.id ? { ...x, done: e.target.checked } : x)),
                        }));
                        toast(e.target.checked ? "Task completed" : "Task reopened");
                      }}
                    />
                    <label htmlFor={`task-${task.id}`} className={cx("flex-1 text-sm", task.done && "text-stone-400 line-through")}>
                      {task.title}
                    </label>
                    {overdue ? <Badge tone="danger">Overdue</Badge> : <span className="text-xs text-stone-500">{relativeTime(task.due)}</span>}
                  </li>
                );
              })}
            </ul>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTask.trim()) return;
                const title = newTask.trim();
                update(contact.id, (c) => ({
                  ...c,
                  tasks: [...c.tasks, { id: `t-${Date.now()}`, title, due: daysFromToday(2), done: false }],
                }));
                setNewTask("");
                toast("Task added");
              }}
            >
              <label className="flex-1">
                <span className="sr-only">New task</span>
                <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a follow-up, due in 2 days" className={t.input} data-testid="new-task" />
              </label>
              <button type="submit" className={t.secondary} disabled={!newTask.trim()}>
                Add task
              </button>
            </form>
          </section>
          <section data-testid="activity">
            <h2 className="mb-4 font-semibold">Activity</h2>
            <Timeline items={contact.activity} />
          </section>
        </div>
        <aside className="flex min-w-0 flex-col gap-6">
          <section className={cx(t.panel, "flex flex-col gap-4 p-5")}>
            <h2 className="font-semibold">About</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Stage</dt>
                <dd>{contact.stage}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Job title</dt>
                <dd className="truncate text-right" title={contact.title}>
                  {contact.title || <span className="text-stone-400">Not added</span>}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Deals won</dt>
                <dd className="tabular-nums">{contact.deals.filter((d) => d.stage === "Closed won").length}</dd>
              </div>
            </dl>
            <div className="border-t border-stone-100 pt-4">
              {v ? (
                <>
                  <label className="flex items-center justify-between text-sm font-medium">
                    Show advanced
                    <input
                      type="checkbox"
                      role="switch"
                      checked={advanced}
                      onChange={(e) => setAdvanced(e.target.checked)}
                      className="size-4 accent-orange-600"
                      data-testid="show-advanced"
                    />
                  </label>
                  {advanced && <div className="mt-4">{leadScore}</div>}
                </>
              ) : (
                leadScore
              )}
            </div>
          </section>
          {company && (
            <section className="flex flex-col gap-3 px-1">
              <h2 className="flex items-center gap-2 font-semibold">
                <Building2 className="size-4 text-stone-400" aria-hidden /> Company
              </h2>
              <p className="truncate font-medium" title={company.name}>
                {company.name}
              </p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-stone-500">Industry</dt>
                  <dd>{company.industry}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-stone-500">Employees</dt>
                  <dd className="tabular-nums">{company.employees}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-stone-500">Location</dt>
                  <dd>{company.location}</dd>
                </div>
              </dl>
              {colleagues.length > 0 && (
                <div className="mt-1">
                  <p className="mb-2 text-xs text-stone-500">Other contacts here</p>
                  <ul className="flex flex-col gap-2">
                    {colleagues.map((c) => (
                      <li key={c.id}>
                        <Link to={`/contacts/${c.id}`} className={cx("flex items-center gap-2 rounded text-sm hover:text-orange-700", t.focus)}>
                          <Avatar name={c.name} size={24} />
                          <span className="truncate">{c.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button type="button" className={cx(t.secondary, "mt-1 self-start")} onClick={() => showCompany(company.name)}>
                <UserRound className="size-4" aria-hidden /> View all contacts
              </button>
            </section>
          )}
        </aside>
      </div>

      <Dialog open={callOpen} onClose={() => setCallOpen(false)} title="Log a call" className={t.dialog} testId="log-call-dialog">
        <form onSubmit={logCall} className="mt-4 flex flex-col gap-4">
          <Field label="Outcome">
            <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className={t.input}>
              <option>Connected</option>
              <option>Left voicemail</option>
              <option>No answer</option>
            </select>
          </Field>
          <Field label="Call notes">
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={t.input} data-testid="call-notes" />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className={t.secondary} onClick={() => setCallOpen(false)}>
              Cancel
            </button>
            <SubmitButton pending={callPending} pendingLabel="Logging" testId="save-call">
              Log call
            </SubmitButton>
          </div>
        </form>
      </Dialog>
      <Dialog open={dealOpen} onClose={() => setDealOpen(false)} title="Add deal" className={t.dialog} testId="add-deal-dialog">
        <form noValidate onSubmit={addDeal} className="mt-4 flex flex-col gap-4">
          <Field label="Deal name" error={dealNameError}>
            <input required value={dealName} onChange={(e) => setDealName(e.target.value)} aria-invalid={!!dealNameError} className={t.input} data-testid="deal-name" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount (USD)" error={amountError}>
              <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={!!amountError} className={cx(t.input, "tabular-nums")} data-testid="deal-amount" />
            </Field>
            <Field label="Stage">
              <select value={dealStage} onChange={(e) => setDealStage(e.target.value as DealStage)} className={t.input}>
                {dealStages.filter((s) => s !== "Closed lost").map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className={t.secondary} onClick={() => setDealOpen(false)}>
              Cancel
            </button>
            <SubmitButton pending={dealPending} pendingLabel="Adding" testId="save-deal">
              Add deal
            </SubmitButton>
          </div>
        </form>
      </Dialog>
      <Dialog open={emailOpen} onClose={() => setEmailOpen(false)} title={`Email ${contact.name}`} className={cx(t.dialog, "max-w-lg")} testId="send-email-dialog">
        <form onSubmit={sendEmail} className="mt-4 flex flex-col gap-4">
          <p className="text-sm text-stone-500">To {contact.email}</p>
          <Field label="Subject">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={t.input} data-testid="email-subject" />
          </Field>
          <Field label="Message">
            <textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} className={t.input} data-testid="email-body" />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className={t.secondary} onClick={() => setEmailOpen(false)}>
              Cancel
            </button>
            <SubmitButton pending={emailPending} pendingLabel="Sending" testId="confirm-send-email">
              Send email
            </SubmitButton>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
