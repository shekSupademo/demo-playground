import {
  Download,
  Gauge,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Settings,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import {
  HashRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import type { Variant } from "../../registry";
import { cx, Dialog, Menu, useToasts } from "../../ui";

type Deal = { id: string; name: string; amount: number };
type Contact = {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  stage: string;
  score: number;
  deals: Deal[];
  activity: string[];
};

const seed: Contact[] = [
  {
    id: "ava",
    name: "Ava Thompson",
    title: "VP Operations",
    company: "Northwind Logistics",
    email: "ava@northwind.io",
    phone: "+1 415 555 0142",
    stage: "Qualified",
    score: 82,
    deals: [{ id: "d1", name: "Fleet tracking rollout", amount: 48000 }],
    activity: ["Email opened: Q4 pricing", "Demo booked for Dec 3"],
  },
  {
    id: "liam",
    name: "Liam Okafor",
    title: "Head of IT",
    company: "Brightline Health",
    email: "liam.okafor@brightline.health",
    phone: "+1 312 555 0187",
    stage: "Proposal",
    score: 74,
    deals: [{ id: "d2", name: "Clinic seat expansion", amount: 26500 }],
    activity: ["Proposal sent", "Call: security review questions"],
  },
  {
    id: "sofia",
    name: "Sofia Marquez",
    title: "Founder",
    company: "Tidepool Studio",
    email: "sofia@tidepool.studio",
    phone: "+1 646 555 0110",
    stage: "Lead",
    score: 41,
    deals: [],
    activity: ["Signed up from webinar"],
  },
  {
    id: "noah",
    name: "Noah Becker",
    title: "Procurement Manager",
    company: "Alpine Foods",
    email: "n.becker@alpinefoods.com",
    phone: "+1 503 555 0133",
    stage: "Negotiation",
    score: 91,
    deals: [{ id: "d3", name: "Annual license renewal", amount: 72000 }],
    activity: ["Redlines received", "Call: discount approval"],
  },
  {
    id: "mia",
    name: "Mia Chen",
    title: "Marketing Director",
    company: "Lumen Retail",
    email: "mia.chen@lumenretail.com",
    phone: "+1 206 555 0199",
    stage: "Qualified",
    score: 67,
    deals: [],
    activity: ["Downloaded ROI guide"],
  },
  {
    id: "ethan",
    name: "Ethan Price",
    title: "CTO",
    company: "Copperleaf Energy",
    email: "ethan@copperleaf.energy",
    phone: "+1 720 555 0165",
    stage: "Lead",
    score: 38,
    deals: [],
    activity: ["Visited pricing page twice"],
  },
  {
    id: "grace",
    name: "Grace Kim",
    title: "COO",
    company: "Harbor Analytics",
    email: "grace.kim@harboranalytics.co",
    phone: "+1 617 555 0121",
    stage: "Closed won",
    score: 95,
    deals: [{ id: "d4", name: "Enterprise plan", amount: 120000 }],
    activity: ["Contract signed", "Kickoff scheduled"],
  },
  {
    id: "omar",
    name: "Omar Haddad",
    title: "Sales Lead",
    company: "Verde Mobility",
    email: "omar@verdemobility.com",
    phone: "+1 305 555 0176",
    stage: "Proposal",
    score: 58,
    deals: [{ id: "d5", name: "Pilot for 40 reps", amount: 18000 }],
    activity: ["Call: pilot scope"],
  },
];

const sampleImport = `name,email,company
Hannah Weber,hannah@quillworks.de,Quillworks
Daniel Osei,daniel@ridgeway.io,Ridgeway`;

const money = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const primary =
  "inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-500";
const secondary =
  "inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100";
const input =
  "rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-orange-500";
const card = "rounded-xl border border-stone-200 bg-white p-5";
const dialog = "w-full max-w-md rounded-xl bg-white p-6 text-stone-900";

function exportCsv(contacts: Contact[]) {
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

function ImportForm({ onImport }: { onImport: (csv: string) => void }) {
  const [csv, setCsv] = useState(sampleImport);
  return (
    <form
      className="mt-3 flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onImport(csv);
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-medium">
        Paste CSV rows
        <textarea
          rows={5}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          className={cx(input, "font-mono text-xs")}
          data-testid="import-csv"
        />
      </label>
      <button
        type="submit"
        className={cx(primary, "self-end")}
        data-testid="import-contacts"
      >
        <Upload className="size-4" aria-hidden /> Import contacts
      </button>
    </form>
  );
}

function ContactsPage({
  v,
  contacts,
  onImport,
  toast,
}: {
  v: boolean;
  contacts: Contact[];
  onImport: (csv: string) => void;
  toast: (m: string) => void;
}) {
  const [importOpen, setImportOpen] = useState(false);
  const exportButton = (
    <button
      type="button"
      className={secondary}
      onClick={() => {
        exportCsv(contacts);
        toast(`Exported ${contacts.length} contacts`);
      }}
      data-testid="export-csv"
    >
      <Download className="size-4" aria-hidden /> Export CSV
    </button>
  );

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <p className="text-sm text-stone-500">
            {contacts.length} people across your accounts
          </p>
        </div>
        {!v && (
          <div className="flex gap-2">
            {exportButton}
            <button
              type="button"
              className={secondary}
              onClick={() => setImportOpen(true)}
              data-testid="open-import"
            >
              <Upload className="size-4" aria-hidden /> Import contacts
            </button>
          </div>
        )}
      </header>
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {contacts.map((c) => (
              <tr
                key={c.id}
                className="group hover:bg-orange-50/50"
                data-testid={`contact-row-${c.id}`}
              >
                <td className="px-4 py-3">
                  <Link
                    to={`/contacts/${c.id}`}
                    className="font-medium text-stone-900 hover:text-orange-700"
                    data-testid={`contact-${c.id}`}
                  >
                    {c.name}
                  </Link>
                  <div className="text-xs text-stone-500">{c.title}</div>
                </td>
                <td className="px-4 py-3 text-stone-600">{c.company}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700">
                    {c.stage}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={`mailto:${c.email}`}
                    aria-label={`Email ${c.name}`}
                    className={cx(
                      "inline-flex rounded-md p-1.5 text-orange-700 hover:bg-orange-100",
                      v &&
                        "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus:opacity-100",
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
      {v && <div className="flex justify-end">{exportButton}</div>}
      <Dialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import contacts"
        className={dialog}
        testId="import-dialog"
      >
        <ImportForm
          onImport={(csv) => {
            onImport(csv);
            setImportOpen(false);
          }}
        />
      </Dialog>
    </div>
  );
}

function ContactDetail({
  v,
  contacts,
  update,
  remove,
  toast,
}: {
  v: boolean;
  contacts: Contact[];
  update: (id: string, change: (c: Contact) => Contact) => void;
  remove: (id: string) => void;
  toast: (m: string) => void;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const contact = contacts.find((c) => c.id === id);
  const [callOpen, setCallOpen] = useState(false);
  const [dealOpen, setDealOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [notes, setNotes] = useState("");
  const [dealName, setDealName] = useState("");
  const [amount, setAmount] = useState("10000");
  if (!contact) return <Navigate to="/" replace />;

  const openCall = () => setCallOpen(true);
  const deleteContact = () => {
    remove(contact.id);
    toast(`${contact.name} deleted`);
    navigate("/");
  };
  const logCall = (e: FormEvent) => {
    e.preventDefault();
    update(contact.id, (c) => ({
      ...c,
      activity: [`Call: ${notes.trim() || "No notes"}`, ...c.activity],
    }));
    setNotes("");
    setCallOpen(false);
    toast("Call logged");
  };
  const addDeal = (e: FormEvent) => {
    e.preventDefault();
    if (!dealName.trim()) return;
    update(contact.id, (c) => ({
      ...c,
      deals: [
        ...c.deals,
        {
          id: `d-${Date.now()}`,
          name: dealName.trim(),
          amount: Number(amount),
        },
      ],
    }));
    setDealName("");
    setDealOpen(false);
    toast("Deal added");
  };

  const leadScore = (
    <div data-testid="lead-score">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1 text-stone-500">
          <Gauge className="size-4" aria-hidden /> Lead score
        </span>
        <span className="font-semibold">{contact.score}/100</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-stone-100">
        <div
          className="h-2 rounded-full bg-orange-500"
          style={{ width: `${contact.score}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <Link to="/" className="text-sm text-stone-500 hover:underline">
        ← Contacts
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-orange-100 text-lg font-semibold text-orange-700">
            {contact.name
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </span>
          <div>
            <h1 className="text-2xl font-semibold">{contact.name}</h1>
            <p className="text-sm text-stone-500">
              {contact.title} · {contact.company}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={v ? primary : secondary}
            onClick={() => toast(`Email draft to ${contact.email} opened`)}
            data-testid="send-email"
          >
            <Mail className="size-4" aria-hidden /> Send email
          </button>
          <button
            type="button"
            className={v ? secondary : primary}
            onClick={() => setDealOpen(true)}
            data-testid="add-deal"
          >
            <Plus className="size-4" aria-hidden /> Add deal
          </button>
          {v && (
            <button
              type="button"
              className={secondary}
              onClick={openCall}
              data-testid="log-call"
            >
              <Phone className="size-4" aria-hidden /> Log a call
            </button>
          )}
          {!v && (
            <button
              type="button"
              className={cx(secondary, "text-rose-600")}
              onClick={deleteContact}
              data-testid="delete-contact"
            >
              <Trash2 className="size-4" aria-hidden /> Delete contact
            </button>
          )}
          <Menu
            label="More actions"
            trigger={<MoreHorizontal className="size-4" aria-hidden />}
            triggerClassName={cx(secondary, "px-2")}
            testId="contact-menu"
            items={[
              ...(v
                ? []
                : [
                    {
                      label: "Log a call",
                      onSelect: openCall,
                      testId: "log-call",
                    },
                  ]),
              {
                label: "Copy email",
                onSelect: () => toast("Email copied"),
                testId: "copy-email",
              },
              ...(v
                ? [
                    {
                      label: "Delete contact",
                      onSelect: deleteContact,
                      danger: true,
                      testId: "delete-contact",
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </header>
      <div className="grid gap-5 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-5">
          <section className={card} data-testid="deals">
            <h2 className="mb-3 font-semibold">Deals</h2>
            {contact.deals.length === 0 ? (
              <p className="text-sm text-stone-500">No open deals yet.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {contact.deals.map((d) => (
                  <li key={d.id} className="flex justify-between py-2 text-sm">
                    <span>{d.name}</span>
                    <span className="font-medium">{money(d.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className={card} data-testid="activity">
            <h2 className="mb-3 font-semibold">Activity</h2>
            <ul className="space-y-2 text-sm text-stone-600">
              {contact.activity.map((item, i) => (
                <li key={`${i}-${item}`}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
        <section className={cx(card, "flex flex-col gap-4")}>
          <h2 className="font-semibold">Details</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-stone-500">Email</dt>
              <dd>{contact.email}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Phone</dt>
              <dd>{contact.phone}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Stage</dt>
              <dd>{contact.stage}</dd>
            </div>
          </dl>
          {v ? (
            <>
              <label className="flex items-center justify-between text-sm font-medium">
                Show advanced
                <input
                  type="checkbox"
                  role="switch"
                  checked={advanced}
                  onChange={(e) => setAdvanced(e.target.checked)}
                  className="accent-orange-600"
                  data-testid="show-advanced"
                />
              </label>
              {advanced && leadScore}
            </>
          ) : (
            leadScore
          )}
        </section>
      </div>
      <Dialog
        open={callOpen}
        onClose={() => setCallOpen(false)}
        title="Log a call"
        className={dialog}
        testId="log-call-dialog"
      >
        <form onSubmit={logCall} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Call notes
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={input}
              data-testid="call-notes"
            />
          </label>
          <button
            type="submit"
            className={cx(primary, "self-end")}
            data-testid="save-call"
          >
            Save call
          </button>
        </form>
      </Dialog>
      <Dialog
        open={dealOpen}
        onClose={() => setDealOpen(false)}
        title="Add deal"
        className={dialog}
        testId="add-deal-dialog"
      >
        <form onSubmit={addDeal} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Deal name
            <input
              required
              value={dealName}
              onChange={(e) => setDealName(e.target.value)}
              className={input}
              data-testid="deal-name"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Amount (USD)
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={input}
              data-testid="deal-amount"
            />
          </label>
          <button
            type="submit"
            className={cx(primary, "self-end")}
            data-testid="save-deal"
          >
            Save deal
          </button>
        </form>
      </Dialog>
    </div>
  );
}

function SettingsPage({
  v,
  onImport,
  toast,
}: {
  v: boolean;
  onImport: (csv: string) => void;
  toast: (m: string) => void;
}) {
  const [owner, setOwner] = useState("Round robin");
  return (
    <div className="flex max-w-xl flex-col gap-5">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <form
        className={cx(card, "flex flex-col gap-3")}
        onSubmit={(e) => {
          e.preventDefault();
          toast("Settings saved");
        }}
      >
        <label className="flex flex-col gap-1 text-sm font-medium">
          New lead assignment
          <select
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className={input}
            data-testid="lead-assignment"
          >
            <option>Round robin</option>
            <option>Account owner</option>
            <option>Unassigned</option>
          </select>
        </label>
        <button
          type="submit"
          className={cx(primary, "self-start")}
          data-testid="save-settings"
        >
          Save
        </button>
      </form>
      {v && (
        <section className={card} data-testid="import-section">
          <h2 className="font-semibold">Import contacts</h2>
          <p className="text-sm text-stone-500">
            Add people in bulk from a CSV with name, email and company.
          </p>
          <ImportForm onImport={onImport} />
        </section>
      )}
    </div>
  );
}

export default function App({ variant }: { variant: Variant }) {
  const v = variant === "variant";
  const [contacts, setContacts] = useState(seed);
  const [toasts, toast] = useToasts("bg-stone-900 text-white");

  const update = (id: string, change: (c: Contact) => Contact) =>
    setContacts((current) => current.map((c) => (c.id === id ? change(c) : c)));
  const remove = (id: string) =>
    setContacts((current) => current.filter((c) => c.id !== id));
  const onImport = (csv: string) => {
    const added = csv
      .split("\n")
      .slice(1)
      .map((line) => line.split(",").map((cell) => cell.trim()))
      .filter(([name, email]) => name && email)
      .map(([name, email, company = ""], i) => ({
        id: `import-${Date.now()}-${i}`,
        name,
        email,
        company,
        title: "",
        phone: "",
        stage: "Lead",
        score: 20,
        deals: [],
        activity: ["Imported from CSV"],
      }));
    setContacts((current) => [...current, ...added]);
    toast(`Imported ${added.length} contacts`);
  };

  const nav = [
    { to: "/", label: "Contacts", Icon: Users, end: true },
    { to: "/settings", label: "Settings", Icon: Settings, end: false },
  ];

  return (
    <HashRouter>
      <div className="flex min-h-screen bg-stone-50 text-stone-900">
        <aside className="w-56 shrink-0 border-r border-stone-200 bg-white p-4">
          <div
            className="mb-6 flex items-center gap-2 font-semibold"
            data-testid="logo"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-orange-600 text-white">
              <Gauge className="size-4" aria-hidden />
            </span>
            Pipeline
          </div>
          <nav aria-label="Main" className="flex flex-col gap-1">
            {nav.map(({ to, label, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cx(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                    isActive
                      ? "bg-orange-50 text-orange-700"
                      : "text-stone-500 hover:text-stone-900",
                  )
                }
              >
                <Icon className="size-4" aria-hidden /> {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6">
          <Routes>
            <Route
              index
              element={
                <ContactsPage
                  v={v}
                  contacts={contacts}
                  onImport={onImport}
                  toast={toast}
                />
              }
            />
            <Route
              path="contacts/:id"
              element={
                <ContactDetail
                  v={v}
                  contacts={contacts}
                  update={update}
                  remove={remove}
                  toast={toast}
                />
              }
            />
            <Route
              path="settings"
              element={<SettingsPage v={v} onImport={onImport} toast={toast} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      {toasts}
    </HashRouter>
  );
}
