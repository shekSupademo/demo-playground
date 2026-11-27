import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleAlert,
  CircleHelp,
  Copy,
  House,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Plane,
  Plus,
  Search,
  Settings,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import {
  HashRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Avatar,
  Badge,
  daysFromToday,
  EmptyState,
  formatDate,
  MobileNav,
  NotificationsMenu,
  UserMenu,
  useDocumentTitle,
} from "../../kit";
import type { Variant } from "../../registry";
import { cx, Dialog, Menu, useToasts } from "../../ui";
import {
  blank,
  dayCount,
  departmentColors,
  departments,
  type Employee,
  fullName,
  notifications,
  onboardingTasks,
  type Person,
  pronounOptions,
  type Status,
  seed,
  seedTimeOff,
  statusOf,
  type TimeOff,
} from "./data";

type FieldKey = Exclude<keyof Employee, "id">;

type Field = {
  key: FieldKey;
  label: string;
  type: "text" | "email" | "tel" | "date" | "select";
  required: boolean;
  options?: string[];
  autoComplete?: string;
  hint?: string;
};

const font = {
  fontFamily: '"Nunito Sans", ui-sans-serif, system-ui, sans-serif',
};
const focus =
  "outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2";
const input =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-xs outline-none transition placeholder:text-stone-400 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/15";
const primary = cx(
  "inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60",
  focus,
);
const secondary = cx(
  "inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-xs transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50",
  focus,
);
const iconButton = cx(
  "grid size-9 place-items-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-900",
  focus,
);
const panel = "rounded-2xl border border-stone-200/80 bg-white shadow-xs";
const muted = "text-stone-500";
const footer =
  "flex flex-wrap items-center justify-end gap-3 rounded-b-2xl border-t border-stone-100 bg-stone-50/70 px-6 py-3";

const today = () => new Date().toLocaleDateString("en-CA");

const statusTone: Record<Status, "success" | "warning" | "info" | "neutral"> = {
  Active: "success",
  Onboarding: "warning",
  "Starting soon": "info",
  "On leave": "neutral",
};

const requestTone = {
  Pending: "warning",
  Approved: "success",
  Declined: "danger",
} as const;

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#E11D48" />
      <circle cx="12.5" cy="12" r="4" fill="#fff" />
      <circle cx="21.5" cy="13" r="3.2" fill="#fff" fillOpacity=".7" />
      <path d="M5.5 25.5c0-4.1 3-6.8 7-6.8s7 2.7 7 6.8z" fill="#fff" />
      <path
        d="M17.6 19.6a6 6 0 0 1 3.9-1.4c3 0 5 2.3 5 5.6v1.7h-5.3c0-2.6-1.3-4.6-3.6-5.9z"
        fill="#fff"
        fillOpacity=".7"
      />
    </svg>
  );
}

function fieldsFor(v: boolean, managers: string[]): Field[] {
  const name: Field[] = [
    {
      key: "firstName",
      label: "First name",
      type: "text",
      required: true,
      autoComplete: "given-name",
    },
    {
      key: "lastName",
      label: "Last name",
      type: "text",
      required: true,
      autoComplete: "family-name",
    },
  ];
  const contact: Field[] = [
    {
      key: "email",
      label: "Work email",
      type: "email",
      required: true,
      autoComplete: "email",
      hint: v ? "Must be an @acme.com address" : undefined,
    },
    {
      key: "phone",
      label: "Phone",
      type: "tel",
      required: v,
      autoComplete: "tel",
    },
  ];
  const jobTitle: Field = {
    key: "jobTitle",
    label: "Job title",
    type: "text",
    required: true,
    autoComplete: "organization-title",
  };
  const department: Field = {
    key: "department",
    label: "Department",
    type: "select",
    required: true,
    options: departments,
  };
  const rest: Field[] = [
    {
      key: "manager",
      label: "Manager",
      type: "select",
      required: !v,
      options: managers,
    },
    {
      key: "employeeId",
      label: "Employee ID",
      type: "text",
      required: true,
      hint: v ? "Format: EMP-1234" : undefined,
    },
    { key: "startDate", label: "Start date", type: "date", required: true },
  ];
  return v
    ? [
        ...name,
        {
          key: "pronouns",
          label: "Pronouns",
          type: "select",
          required: false,
          options: pronounOptions,
        },
        ...contact,
        department,
        jobTitle,
        ...rest,
      ]
    : [
        ...name,
        ...contact,
        { key: "fax", label: "Fax", type: "tel", required: false },
        jobTitle,
        department,
        ...rest,
      ];
}

function validate(v: boolean, fields: Field[], values: Omit<Employee, "id">) {
  const errors: Partial<Record<FieldKey, string>> = {};
  for (const field of fields) {
    const value = values[field.key].trim();
    if (!value) {
      if (field.required) errors[field.key] = `${field.label} is required`;
      continue;
    }
    if (field.key === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        errors.email = "Enter a valid email address";
      else if (v && !value.toLowerCase().endsWith("@acme.com"))
        errors.email = "Use an @acme.com work email";
    }
    if (v && field.key === "employeeId" && !/^EMP-\d{4}$/.test(value))
      errors.employeeId = "Employee ID must look like EMP-1234";
    if (v && field.key === "startDate" && value < today())
      errors.startDate = "Start date can't be in the past";
  }
  return errors;
}

const sections: { title: string; body: string; keys: FieldKey[] }[] = [
  {
    title: "Personal",
    body: "How this person shows up in the directory and how to reach them.",
    keys: ["firstName", "lastName", "pronouns", "email", "phone", "fax"],
  },
  {
    title: "Role",
    body: "Where they sit in the org chart.",
    keys: ["jobTitle", "department", "manager", "employeeId"],
  },
  {
    title: "Start",
    body: "The onboarding checklist opens a week before this date.",
    keys: ["startDate"],
  },
];

function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          {title}
        </h1>
        {description && (
          <p className={cx("mt-1 text-sm", muted)}>{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function AddEmployee({
  v,
  people,
  onAdd,
}: {
  v: boolean;
  people: Person[];
  onAdd: (employee: Omit<Employee, "id">) => string;
}) {
  useDocumentTitle("Add employee – Peoplehub");
  const navigate = useNavigate();
  const fields = fieldsFor(v, people.map(fullName));
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [saving, setSaving] = useState(false);
  const errorFields = fields.filter((f) => errors[f.key]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = validate(v, fields, values);
    setErrors(next);
    const first = fields.find((f) => next[f.key]);
    if (first) {
      document.getElementById(`field-${first.key}`)?.focus();
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const id = onAdd(values);
      navigate("/directory", { state: { highlight: id } });
    }, 450);
  };

  const update = (key: FieldKey, value: string) => {
    setValues({ ...values, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  };

  const renderField = (field: Field) => {
    const id = `field-${field.key}`;
    const error = errors[field.key];
    const describedBy =
      [field.hint && `${id}-hint`, error && `${id}-error`]
        .filter(Boolean)
        .join(" ") || undefined;
    const common = {
      id,
      name: field.key,
      value: values[field.key],
      required: field.required,
      "aria-required": field.required,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": describedBy,
      "data-testid": id,
      className: input,
    };
    const wide = field.key === "email";
    return (
      <div
        key={field.key}
        className={cx("flex flex-col gap-1.5", wide && "sm:col-span-2")}
      >
        <label htmlFor={id} className="text-sm font-semibold text-stone-800">
          {field.label}
          {field.required ? (
            <span className="ml-0.5 text-rose-600" aria-hidden>
              *
            </span>
          ) : (
            <span className="ml-1.5 font-normal text-stone-400">Optional</span>
          )}
        </label>
        {field.type === "select" ? (
          <select
            {...common}
            onChange={(e) => update(field.key, e.target.value)}
          >
            <option value="">Select…</option>
            {field.options?.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input
            {...common}
            type={field.type}
            autoComplete={field.autoComplete}
            min={v && field.type === "date" ? today() : undefined}
            onChange={(e) => update(field.key, e.target.value)}
          />
        )}
        {field.hint && (
          <p id={`${id}-hint`} className="text-xs text-stone-500">
            {field.hint}
          </p>
        )}
        {error && (
          <p
            id={`${id}-error`}
            className="flex items-center gap-1 text-xs font-semibold text-red-600"
            data-testid={`error-${field.key}`}
          >
            <CircleAlert className="size-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl">
      <Link
        to="/directory"
        className={cx(
          "mb-4 inline-flex items-center gap-1 rounded text-sm font-semibold text-stone-500 hover:text-stone-900",
          focus,
        )}
      >
        <ChevronLeft className="size-4" aria-hidden /> Directory
      </Link>
      <PageHeader
        title="Add employee"
        description={
          <>
            Fields marked with <span className="text-rose-600">*</span> are
            required. We email them an invite once you add them.
          </>
        }
      />
      <form
        noValidate
        onSubmit={submit}
        className={cx(panel, "mt-6")}
        data-testid="employee-form"
      >
        {errorFields.length > 0 && (
          <div
            role="alert"
            className="m-6 mb-0 flex gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">
                Fix {errorFields.length}{" "}
                {errorFields.length === 1 ? "field" : "fields"} to add this
                employee
              </p>
              <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                {errorFields.map((f) => (
                  <li key={f.key}>
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById(`field-${f.key}`)?.focus()
                      }
                      className={cx(
                        "rounded underline underline-offset-2 hover:text-red-950",
                        focus,
                      )}
                    >
                      {f.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {sections.map((section) => {
          const group = fields.filter((f) => section.keys.includes(f.key));
          const headingId = `section-${section.title.toLowerCase()}`;
          return (
            <section
              key={section.title}
              role="group"
              aria-labelledby={headingId}
              className="grid gap-6 border-b border-stone-100 p-6 last-of-type:border-b-0 md:grid-cols-[13rem_1fr]"
              data-testid={headingId}
            >
              <div>
                <h2 id={headingId} className="font-bold text-stone-900">
                  {section.title}
                </h2>
                <p className={cx("mt-1 text-sm", muted)}>{section.body}</p>
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                {group.map(renderField)}
              </div>
            </section>
          );
        })}
        <div className={footer}>
          <Link
            to="/directory"
            className={secondary}
            data-testid="cancel-employee"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className={primary}
            disabled={saving}
            data-testid="submit-employee"
          >
            {saving && (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            )}
            {saving ? "Adding employee…" : "Add employee"}
          </button>
        </div>
      </form>
    </div>
  );
}

type SortKey = "name" | "jobTitle" | "department" | "startDate";

const pageSize = 20;

function Directory({ v, people }: { v: boolean; people: Person[] }) {
  useDocumentTitle("Directory – Peoplehub");
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const highlight = (location.state as { highlight?: string } | null)
    ?.highlight;
  const query = params.get("q") ?? "";
  const [department, setDepartment] = useState("All");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(1);
  const now = today();

  const q = query.trim().toLowerCase();
  const filtered = people.filter(
    (e) =>
      (department === "All" || e.department === department) &&
      (status === "All" || statusOf(e, now) === status) &&
      [e.firstName, e.lastName, e.email, e.jobTitle, e.department, e.employeeId]
        .join(" ")
        .toLowerCase()
        .includes(q),
  );
  const sorted = sort
    ? [...filtered].sort((a, b) => {
        const value = (e: Person) =>
          sort.key === "name" ? fullName(e) : e[sort.key];
        return value(a).localeCompare(value(b)) * sort.dir;
      })
    : filtered;
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pages);
  const shown = sorted.slice((current - 1) * pageSize, current * pageSize);

  const counts = departments.map((d) => ({
    name: d,
    count: people.filter((e) => e.department === d).length,
  }));
  const newHires = people.filter(
    (e) => e.startDate >= daysFromToday(-30) && e.startDate <= now,
  ).length;
  const summary: [string, number][] = [
    ["Headcount", people.length],
    ["Joined in the last 30 days", newHires],
    [
      "Onboarding",
      people.filter((e) => statusOf(e, now) === "Onboarding").length,
    ],
    ["On leave", people.filter((e) => statusOf(e, now) === "On leave").length],
  ];

  const setQuery = (value: string) => {
    setParams(value ? { q: value } : {}, { replace: true });
    setPage(1);
  };
  const toggleSort = (key: SortKey) => {
    setSort((s) =>
      s?.key === key
        ? s.dir === 1
          ? { key, dir: -1 }
          : null
        : { key, dir: 1 },
    );
    setPage(1);
  };
  const clear = () => {
    setQuery("");
    setDepartment("All");
    setStatus("All");
  };

  const jobTitle = {
    label: "Job title",
    sortKey: "jobTitle" as SortKey,
    value: (e: Person) => e.jobTitle,
  };
  const departmentColumn = {
    label: "Department",
    sortKey: "department" as SortKey,
    value: (e: Person) => e.department,
  };
  const columns: {
    label: string;
    sortKey?: SortKey;
    value: (e: Person) => string;
  }[] = [
    { label: "Name", sortKey: "name", value: (e) => fullName(e) },
    ...(v
      ? [
          { label: "Pronouns", value: (e: Person) => e.pronouns },
          departmentColumn,
          jobTitle,
        ]
      : [jobTitle, departmentColumn]),
    { label: "Manager", value: (e) => e.manager },
    { label: "Employee ID", value: (e) => e.employeeId },
    {
      label: "Start date",
      sortKey: "startDate",
      value: (e) => formatDate(e.startDate),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Directory"
        description={`${people.length} people at Acme Robotics across ${departments.length} departments`}
        action={
          <Link to="/add" className={primary} data-testid="add-employee">
            <UserPlus className="size-4" aria-hidden /> Add employee
          </Link>
        }
      />

      <section
        aria-label="Organization size"
        className="flex flex-col gap-4"
        data-testid="org-summary"
      >
        <dl className="flex flex-wrap gap-x-10 gap-y-3">
          {summary.map(([label, value]) => (
            <div key={label}>
              <dt className={cx("text-sm", muted)}>{label}</dt>
              <dd className="text-2xl font-bold tabular-nums text-stone-900">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <div
          className="flex h-2.5 gap-0.5 overflow-hidden rounded-full"
          role="img"
          aria-label={`Headcount by department: ${counts.map((c) => `${c.name} ${c.count}`).join(", ")}`}
        >
          {counts.map((c) => (
            <span
              key={c.name}
              style={{
                width: `${(c.count / people.length) * 100}%`,
                background: departmentColors[c.name],
              }}
            />
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter by department"
        >
          {[{ name: "All", count: people.length }, ...counts].map((c) => (
            <button
              key={c.name}
              type="button"
              aria-pressed={department === c.name}
              onClick={() => {
                setDepartment(c.name);
                setPage(1);
              }}
              className={cx(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                focus,
                department === c.name
                  ? "border-rose-600 bg-rose-50 text-rose-700"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900",
              )}
              data-testid={`department-${c.name.toLowerCase().replace(/\s/g, "-")}`}
            >
              {c.name !== "All" && (
                <span
                  className="size-2 rounded-full"
                  style={{ background: departmentColors[c.name] }}
                  aria-hidden
                />
              )}
              {c.name === "All" ? "Everyone" : c.name}
              <span className="tabular-nums text-stone-400">{c.count}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block w-full max-w-sm">
            <span className="sr-only">Search people</span>
            <Search
              className="pointer-events-none absolute top-2.5 left-3 size-4 text-stone-400"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, team, or ID"
              className={cx(input, "pl-9")}
              data-testid="directory-search"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-600">
            Status
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className={cx(input, "w-auto py-1.5")}
              data-testid="status-filter"
            >
              {["All", "Active", "Onboarding", "Starting soon", "On leave"].map(
                (s) => (
                  <option key={s} value={s}>
                    {s === "All" ? "All statuses" : s}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
      </div>

      <div className={cx(panel, "overflow-hidden")}>
        <div className="relative overflow-x-auto">
          <table
            className="w-full min-w-[60rem] text-left text-sm"
            data-testid="directory-table"
          >
            <thead className="border-b border-stone-200 bg-stone-50/80 text-xs text-stone-500">
              <tr>
                {columns.map((c) => {
                  const active = sort?.key === c.sortKey;
                  return (
                    <th
                      key={c.label}
                      scope="col"
                      aria-sort={
                        active
                          ? sort?.dir === 1
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                      className="px-4 py-2.5 font-semibold"
                    >
                      {c.sortKey ? (
                        <button
                          type="button"
                          onClick={() => c.sortKey && toggleSort(c.sortKey)}
                          className={cx(
                            "-mx-1 inline-flex items-center gap-1 rounded px-1 hover:text-stone-900",
                            focus,
                            active && "text-stone-900",
                          )}
                        >
                          {c.label}
                          {active ? (
                            sort?.dir === 1 ? (
                              <ArrowUp className="size-3.5" aria-hidden />
                            ) : (
                              <ArrowDown className="size-3.5" aria-hidden />
                            )
                          ) : (
                            <ChevronsUpDown
                              className="size-3.5 text-stone-300"
                              aria-hidden
                            />
                          )}
                        </button>
                      ) : (
                        c.label
                      )}
                    </th>
                  );
                })}
                <th scope="col" className="px-4 py-2.5 font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {shown.map((e) => {
                const s = statusOf(e, now);
                return (
                  <tr
                    key={e.id}
                    data-testid={`employee-${e.id}`}
                    className={cx(
                      "transition-colors hover:bg-stone-50",
                      highlight === e.id && "bg-rose-50/70 hover:bg-rose-50",
                    )}
                  >
                    {columns.map((c, i) =>
                      i === 0 ? (
                        <th
                          key={c.label}
                          scope="row"
                          className="max-w-72 px-4 py-3 font-normal"
                        >
                          <Link
                            to={`/people/${e.id}`}
                            className={cx(
                              "group flex items-center gap-3 rounded",
                              focus,
                            )}
                          >
                            <Avatar name={fullName(e)} size={34} />
                            <span className="min-w-0">
                              <span
                                className="block truncate font-semibold text-stone-900 group-hover:text-rose-700"
                                title={fullName(e)}
                              >
                                {c.value(e)}
                              </span>
                              <span
                                className="block truncate text-xs text-stone-500"
                                title={e.email}
                              >
                                {e.email}
                              </span>
                            </span>
                          </Link>
                        </th>
                      ) : (
                        <td
                          key={c.label}
                          className="max-w-52 truncate px-4 py-3 text-stone-600"
                          title={c.value(e) || undefined}
                        >
                          {c.value(e) || (
                            <span className="text-stone-300">—</span>
                          )}
                        </td>
                      ),
                    )}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge tone={statusTone[s]}>{s}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {shown.length === 0 ? (
          <EmptyState
            icon={<Users className="size-5" aria-hidden />}
            title="No one matches these filters"
            body={
              query
                ? `Nobody matches “${query}”. Check the spelling or clear the filters.`
                : "Try another department or status."
            }
            action={
              <button type="button" className={secondary} onClick={clear}>
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 px-4 py-3 text-sm text-stone-500">
            <p data-testid="result-count" className="tabular-nums">
              Showing {(current - 1) * pageSize + 1}–
              {(current - 1) * pageSize + shown.length} of {sorted.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={cx(secondary, "px-2.5 py-1.5")}
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <span className="tabular-nums">
                Page {current} of {pages}
              </span>
              <button
                type="button"
                className={cx(secondary, "px-2.5 py-1.5")}
                disabled={current === pages}
                onClick={() => setPage(current + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Progress({ value, total }: { value: number; total: number }) {
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
      aria-label={`${value} of ${total} tasks done`}
    >
      <div
        className="h-full rounded-full bg-rose-500"
        style={{ width: `${(value / total) * 100}%` }}
      />
    </div>
  );
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function daysAfter(date: string, n: number) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("en-CA");
}

function Home({
  people,
  requests,
  onDecide,
}: {
  people: Person[];
  requests: TimeOff[];
  onDecide: (id: string, status: TimeOff["status"]) => void;
}) {
  useDocumentTitle("Home – Peoplehub");
  const now = today();
  const onboarding = people.filter(
    (p) => p.checklist?.some((d) => !d) ?? false,
  );
  const pending = requests.filter((r) => r.status === "Pending");
  const out = requests.filter(
    (r) =>
      r.status === "Approved" && r.start <= daysFromToday(7) && r.end >= now,
  );
  const byId = (id: string) => people.find((p) => p.id === id);
  const tasksLeft = onboarding.reduce(
    (sum, p) => sum + (p.checklist?.filter((d) => !d).length ?? 0),
    0,
  );
  const stats: [string, number, string][] = [
    ["People", people.length, "/directory"],
    ["Onboarding now", onboarding.length, "/directory"],
    ["Open onboarding tasks", tasksLeft, "/directory"],
    ["Requests to review", pending.length, "/time-off"],
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`${greeting()}, Priya`}
        description="Here's what needs you at Acme Robotics this week."
        action={
          <Link to="/add" className={primary}>
            <UserPlus className="size-4" aria-hidden /> Add employee
          </Link>
        }
      />
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-200/80 shadow-xs lg:grid-cols-4">
        {stats.map(([label, value, to]) => (
          <div key={label} className="bg-white p-5">
            <dt className={cx("text-sm", muted)}>{label}</dt>
            <dd className="mt-1 text-3xl font-bold tabular-nums text-stone-900">
              <Link
                to={to}
                className={cx("rounded hover:text-rose-700", focus)}
              >
                {value}
              </Link>
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="home-onboarding" className="min-w-0">
          <div className="flex items-baseline justify-between">
            <h2 id="home-onboarding" className="text-lg font-bold">
              New hire onboarding
            </h2>
            <span className={cx("text-sm", muted)}>
              {onboardingTasks.length} tasks each
            </span>
          </div>
          {onboarding.length === 0 ? (
            <EmptyState
              icon={<UserPlus className="size-5" aria-hidden />}
              title="No one is onboarding"
              body="Add an employee to send them their first-day checklist."
              action={
                <Link to="/add" className={primary}>
                  Add employee
                </Link>
              }
            />
          ) : (
            <ul
              className={cx(panel, "mt-3 divide-y divide-stone-100")}
              data-testid="onboarding-list"
            >
              {onboarding.map((p) => {
                const done = p.checklist?.filter(Boolean).length ?? 0;
                const next =
                  onboardingTasks[p.checklist?.findIndex((d) => !d) ?? 0];
                return (
                  <li key={p.id}>
                    <Link
                      to={`/people/${p.id}`}
                      className={cx(
                        "flex items-center gap-4 px-5 py-4 transition first:rounded-t-2xl last:rounded-b-2xl hover:bg-stone-50",
                        focus,
                      )}
                    >
                      <Avatar name={fullName(p)} size={38} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p
                            className="truncate font-semibold"
                            title={fullName(p)}
                          >
                            {fullName(p)}
                          </p>
                          <p className="shrink-0 text-xs tabular-nums text-stone-500">
                            {done} of {onboardingTasks.length}
                          </p>
                        </div>
                        <p className="truncate text-sm text-stone-500">
                          {p.jobTitle},{" "}
                          {p.startDate > now ? "starts" : "started"}{" "}
                          {formatDate(p.startDate)}
                        </p>
                        <div className="mt-2">
                          <Progress
                            value={done}
                            total={onboardingTasks.length}
                          />
                        </div>
                        <p className="mt-1.5 truncate text-xs text-stone-500">
                          Next: {next}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-8">
          <section aria-labelledby="home-requests">
            <div className="flex items-baseline justify-between">
              <h2 id="home-requests" className="text-lg font-bold">
                Time off to review
              </h2>
              <Link
                to="/time-off"
                className={cx(
                  "rounded text-sm font-semibold text-rose-700 hover:underline",
                  focus,
                )}
              >
                View all requests
              </Link>
            </div>
            {pending.length === 0 ? (
              <p className={cx("mt-3 text-sm", muted)}>You're all caught up.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {pending.slice(0, 4).map((r) => {
                  const p = byId(r.personId);
                  if (!p) return null;
                  const days = dayCount(r.start, r.end);
                  return (
                    <li key={r.id} className="flex items-center gap-3">
                      <Avatar name={fullName(p)} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {fullName(p)}
                        </p>
                        <p className="truncate text-xs text-stone-500">
                          {r.type} from {formatDate(r.start)}, {days}{" "}
                          {days === 1 ? "day" : "days"}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={iconButton}
                        aria-label={`Approve ${fullName(p)}'s request`}
                        onClick={() => onDecide(r.id, "Approved")}
                      >
                        <Check className="size-4" aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          <section aria-labelledby="home-out">
            <h2 id="home-out" className="text-lg font-bold">
              Out this week
            </h2>
            {out.length === 0 ? (
              <p className={cx("mt-3 text-sm", muted)}>Everyone is in.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {out.map((r) => {
                  const p = byId(r.personId);
                  if (!p) return null;
                  return (
                    <li key={r.id} className="flex items-center gap-3 text-sm">
                      <Plane className="size-4 text-stone-400" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-semibold">{fullName(p)}</span>{" "}
                        <span className="text-stone-500">
                          {r.type.toLowerCase()}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-stone-500">
                        Back {formatDate(daysAfter(r.end, 1))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="truncate text-sm font-semibold text-stone-900">
        {children || (
          <span className="font-normal text-stone-300">Not set</span>
        )}
      </dd>
    </div>
  );
}

function Profile({
  v,
  people,
  requests,
  onToggleTask,
  toast,
}: {
  v: boolean;
  people: Person[];
  requests: TimeOff[];
  onToggleTask: (id: string, index: number) => void;
  toast: (m: string) => void;
}) {
  const { id } = useParams();
  const person = people.find((p) => p.id === id);
  useDocumentTitle(
    `${person ? fullName(person) : "Person not found"} – Peoplehub`,
  );
  if (!person)
    return (
      <EmptyState
        icon={<Users className="size-5" aria-hidden />}
        title="Person not found"
        body="They may have been removed from the directory."
        action={
          <Link to="/directory" className={primary}>
            Go to directory
          </Link>
        }
      />
    );
  const now = today();
  const status = statusOf(person, now);
  const manager = people.find((p) => fullName(p) === person.manager);
  const reports = people.filter((p) => p.manager === fullName(person));
  const theirs = requests.filter((r) => r.personId === person.id);
  const done = person.checklist?.filter(Boolean).length ?? 0;
  const tenureDays = dayCount(person.startDate, now) - 1;
  const tenure =
    tenureDays < 0
      ? "Not started"
      : tenureDays < 60
        ? `${tenureDays} days`
        : tenureDays < 730
          ? `${Math.floor(tenureDays / 30)} months`
          : `${Math.floor(tenureDays / 365)} years`;
  const history = [
    ...theirs.map((r) => ({
      id: r.id,
      date: r.start,
      text: `${r.type} request ${r.status.toLowerCase()}, ${dayCount(r.start, r.end)} ${dayCount(r.start, r.end) === 1 ? "day" : "days"}`,
    })),
    ...(person.checklist
      ? [
          {
            id: "onboarding",
            date: now,
            text: `${done} of ${onboardingTasks.length} onboarding tasks done`,
          },
        ]
      : []),
    {
      id: "start",
      date: person.startDate,
      text:
        person.startDate > now
          ? `Starts as ${person.jobTitle}`
          : `Joined ${person.department} as ${person.jobTitle}`,
    },
    ...(person.addedByYou
      ? [{ id: "added", date: now, text: "Added to Peoplehub by Priya Desai" }]
      : []),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-8" data-testid="employee-profile">
      <nav aria-label="Breadcrumb" className="text-sm text-stone-500">
        <ol className="flex min-w-0 items-center gap-1.5">
          <li>
            <Link
              to="/directory"
              className={cx(
                "rounded font-semibold hover:text-stone-900",
                focus,
              )}
            >
              Directory
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3.5" />
          </li>
          <li aria-current="page" className="truncate text-stone-900">
            {fullName(person)}
          </li>
        </ol>
      </nav>
      <header className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <Avatar name={fullName(person)} size={72} />
        <div className="w-full min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1
              className="truncate text-2xl font-bold tracking-tight"
              title={fullName(person)}
            >
              {fullName(person)}
            </h1>
            <Badge tone={statusTone[status]}>{status}</Badge>
          </div>
          <p className="mt-1 text-stone-600">
            {person.jobTitle} in {person.department}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-500">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Mail className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{person.email}</span>
            </span>
            {person.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="size-4" aria-hidden /> {person.phone}
              </span>
            )}
            {person.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden /> {person.location}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          className={secondary}
          onClick={() => {
            navigator.clipboard?.writeText(person.email).catch(() => {});
            toast("Email copied");
          }}
        >
          <Copy className="size-4" aria-hidden /> Copy email
        </button>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-10">
          <section aria-labelledby="profile-facts">
            <h2 id="profile-facts" className="text-lg font-bold">
              Details
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              <Fact label="Employee ID">{person.employeeId}</Fact>
              <Fact label="Department">{person.department}</Fact>
              <Fact label="Job title">{person.jobTitle}</Fact>
              <Fact label="Manager">
                {manager ? (
                  <Link
                    to={`/people/${manager.id}`}
                    className={cx(
                      "rounded text-rose-700 hover:underline",
                      focus,
                    )}
                  >
                    {person.manager}
                  </Link>
                ) : (
                  person.manager
                )}
              </Fact>
              <Fact label="Start date">{formatDate(person.startDate)}</Fact>
              <Fact label="Tenure">{tenure}</Fact>
              <Fact label="Phone">{person.phone}</Fact>
              {v ? (
                <Fact label="Pronouns">{person.pronouns}</Fact>
              ) : (
                <Fact label="Fax">{person.fax}</Fact>
              )}
              <Fact label="Location">{person.location}</Fact>
            </dl>
          </section>

          {person.checklist && (
            <section aria-labelledby="profile-onboarding">
              <div className="flex items-baseline justify-between">
                <h2 id="profile-onboarding" className="text-lg font-bold">
                  Onboarding checklist
                </h2>
                <span className="text-sm tabular-nums text-stone-500">
                  {done} of {onboardingTasks.length} done
                </span>
              </div>
              <div className="mt-3">
                <Progress value={done} total={onboardingTasks.length} />
              </div>
              <ul className={cx(panel, "mt-4 divide-y divide-stone-100")}>
                {onboardingTasks.map((task, i) => (
                  <li key={task}>
                    <label className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm hover:bg-stone-50">
                      <input
                        type="checkbox"
                        checked={person.checklist?.[i] ?? false}
                        onChange={() => onToggleTask(person.id, i)}
                        className="size-4 accent-rose-600"
                        data-testid={`task-${i}`}
                      />
                      <span
                        className={cx(
                          person.checklist?.[i] &&
                            "text-stone-400 line-through",
                        )}
                      >
                        {task}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="profile-history">
            <h2 id="profile-history" className="text-lg font-bold">
              History
            </h2>
            <ol className="mt-4 flex flex-col">
              {history.map((h, i) => (
                <li key={h.id} className="relative flex gap-4 pb-5 last:pb-0">
                  {i < history.length - 1 && (
                    <span
                      className="absolute top-4 left-[5px] h-full w-px bg-stone-200"
                      aria-hidden
                    />
                  )}
                  <span
                    className="relative mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-rose-500 bg-white"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-stone-800">{h.text}</p>
                    <p className="text-xs text-stone-500">
                      {formatDate(h.date)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="flex flex-col gap-8">
          <section aria-labelledby="profile-reports">
            <h2 id="profile-reports" className="font-bold">
              Direct reports
            </h2>
            {reports.length === 0 ? (
              <p className={cx("mt-2 text-sm", muted)}>No direct reports.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-1">
                {reports.map((r) => (
                  <li key={r.id}>
                    <Link
                      to={`/people/${r.id}`}
                      className={cx(
                        "-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-stone-100",
                        focus,
                      )}
                    >
                      <Avatar name={fullName(r)} size={28} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {fullName(r)}
                        </span>
                        <span className="block truncate text-xs text-stone-500">
                          {r.jobTitle}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-labelledby="profile-timeoff">
            <h2 id="profile-timeoff" className="font-bold">
              Time off
            </h2>
            {theirs.length === 0 ? (
              <p className={cx("mt-2 text-sm", muted)}>
                No requests this year.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {theirs.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <span>
                      <span className="block font-semibold">{r.type}</span>
                      <span className="block text-xs text-stone-500">
                        {formatDate(r.start)}
                        {r.end !== r.start && ` to ${formatDate(r.end)}`}
                      </span>
                    </span>
                    <Badge tone={requestTone[r.status]}>{r.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

const emptyRequest = {
  personId: "",
  type: "Vacation" as TimeOff["type"],
  start: "",
  end: "",
  note: "",
};

function TimeOffPage({
  people,
  requests,
  onDecide,
  onRequest,
}: {
  people: Person[];
  requests: TimeOff[];
  onDecide: (id: string, status: TimeOff["status"]) => void;
  onRequest: (r: Omit<TimeOff, "id" | "status">) => void;
}) {
  useDocumentTitle("Time off – Peoplehub");
  const [filter, setFilter] = useState<"All" | TimeOff["status"]>("Pending");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyRequest);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const byId = new Map(people.map((p) => [p.id, p]));
  const shown = requests
    .filter((r) => filter === "All" || r.status === filter)
    .sort((a, b) => a.start.localeCompare(b.start));
  const count = (s: TimeOff["status"]) =>
    requests.filter((r) => r.status === s).length;
  const openDialog = () => {
    setErrors({});
    setOpen(true);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!draft.personId) next.personId = "Choose who is taking time off";
    if (!draft.start) next.start = "First day is required";
    if (!draft.end) next.end = "Last day is required";
    if (draft.start && draft.end && draft.end < draft.start)
      next.end = "Last day can't be before the first day";
    setErrors(next);
    if (Object.keys(next).length) return;
    onRequest(draft);
    setOpen(false);
    setFilter("Pending");
    setDraft(emptyRequest);
  };

  const error = (key: string) =>
    errors[key] && (
      <p
        className="text-xs font-semibold text-red-600"
        id={`timeoff-${key}-error`}
      >
        {errors[key]}
      </p>
    );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Time off"
        description="Review requests and see who's out before you plan the week."
        action={
          <button
            type="button"
            className={primary}
            onClick={openDialog}
            data-testid="new-request"
          >
            <Plus className="size-4" aria-hidden /> Request time off
          </button>
        }
      />
      <div
        role="group"
        aria-label="Filter requests"
        className="inline-flex w-fit max-w-full overflow-x-auto rounded-lg bg-stone-100 p-1"
      >
        {(["Pending", "Approved", "Declined", "All"] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={filter === s}
            onClick={() => setFilter(s)}
            className={cx(
              "shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold transition",
              focus,
              filter === s
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-500 hover:text-stone-900",
            )}
          >
            {s}
            {s !== "All" && (
              <span className="ml-1.5 tabular-nums text-stone-400">
                {count(s)}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className={cx(panel, "overflow-hidden")}>
        {shown.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="size-5" aria-hidden />}
            title={`No ${filter === "All" ? "" : `${filter.toLowerCase()} `}requests`}
            body="New requests show up here as soon as someone submits one."
            action={
              <button type="button" className={secondary} onClick={openDialog}>
                Request time off
              </button>
            }
          />
        ) : (
          <div className="relative overflow-x-auto">
            <table
              className="w-full min-w-[46rem] text-left text-sm"
              data-testid="timeoff-table"
            >
              <thead className="border-b border-stone-200 bg-stone-50/80 text-xs text-stone-500">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Employee
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Dates
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-right font-semibold"
                  >
                    Days
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {shown.map((r) => {
                  const p = byId.get(r.personId);
                  if (!p) return null;
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-stone-50"
                      data-testid={`request-${r.id}`}
                    >
                      <th scope="row" className="px-4 py-3 font-normal">
                        <Link
                          to={`/people/${p.id}`}
                          className={cx(
                            "flex items-center gap-3 rounded",
                            focus,
                          )}
                        >
                          <Avatar name={fullName(p)} size={30} />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">
                              {fullName(p)}
                            </span>
                            <span
                              className="block max-w-56 truncate text-xs text-stone-500"
                              title={r.note || undefined}
                            >
                              {r.note || p.department}
                            </span>
                          </span>
                        </Link>
                      </th>
                      <td className="px-4 py-3 text-stone-600">{r.type}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-stone-600">
                        {formatDate(r.start)}
                        {r.end !== r.start && ` to ${formatDate(r.end)}`}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-stone-600">
                        {dayCount(r.start, r.end)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={requestTone[r.status]}>{r.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {r.status === "Pending" && (
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              className={cx(secondary, "px-3 py-1.5")}
                              onClick={() => onDecide(r.id, "Declined")}
                            >
                              Decline
                            </button>
                            <button
                              type="button"
                              className={cx(primary, "px-3 py-1.5")}
                              onClick={() => onDecide(r.id, "Approved")}
                            >
                              Approve
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Request time off"
        testId="timeoff-dialog"
        className="w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-6 text-stone-900 shadow-xl"
      >
        <form
          noValidate
          onSubmit={submit}
          className="mt-5 flex flex-col gap-4"
          style={font}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="timeoff-person" className="text-sm font-semibold">
              Employee
            </label>
            <select
              id="timeoff-person"
              value={draft.personId}
              onChange={(e) => setDraft({ ...draft, personId: e.target.value })}
              aria-invalid={errors.personId ? true : undefined}
              aria-describedby={
                errors.personId ? "timeoff-personId-error" : undefined
              }
              className={input}
            >
              <option value="">Select…</option>
              {[...people]
                .sort((a, b) => fullName(a).localeCompare(fullName(b)))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {fullName(p)}
                  </option>
                ))}
            </select>
            {error("personId")}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="timeoff-type" className="text-sm font-semibold">
              Type
            </label>
            <select
              id="timeoff-type"
              value={draft.type}
              onChange={(e) =>
                setDraft({ ...draft, type: e.target.value as TimeOff["type"] })
              }
              className={input}
            >
              {["Vacation", "Sick leave", "Parental leave", "Personal"].map(
                (t) => (
                  <option key={t}>{t}</option>
                ),
              )}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(["start", "end"] as const).map((key) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label
                  htmlFor={`timeoff-${key}`}
                  className="text-sm font-semibold"
                >
                  {key === "start" ? "First day" : "Last day"}
                </label>
                <input
                  id={`timeoff-${key}`}
                  type="date"
                  value={draft[key]}
                  onChange={(e) =>
                    setDraft({ ...draft, [key]: e.target.value })
                  }
                  aria-invalid={errors[key] ? true : undefined}
                  aria-describedby={
                    errors[key] ? `timeoff-${key}-error` : undefined
                  }
                  className={input}
                />
                {error(key)}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="timeoff-note" className="text-sm font-semibold">
              Note <span className="font-normal text-stone-400">Optional</span>
            </label>
            <textarea
              id="timeoff-note"
              rows={2}
              value={draft.note}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              className={input}
            />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              className={secondary}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className={primary}>
              Submit request
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

function SettingsSection({
  title,
  body,
  submit,
  onSubmit,
  children,
}: {
  title: string;
  body: string;
  submit: string;
  onSubmit: () => void;
  children: ReactNode;
}) {
  return (
    <form
      noValidate
      className={panel}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-6 p-6 md:grid-cols-[13rem_1fr]">
        <div>
          <h2 className="font-bold">{title}</h2>
          <p className={cx("mt-1 text-sm", muted)}>{body}</p>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
      <div className={footer}>
        <button type="submit" className={primary}>
          {submit}
        </button>
      </div>
    </form>
  );
}

function SettingsPage({ toast }: { toast: (m: string) => void }) {
  useDocumentTitle("Settings – Peoplehub");
  const [company, setCompany] = useState({
    name: "Acme Robotics",
    timezone: "America/Los_Angeles",
    weekStart: "Monday",
  });
  const [companyError, setCompanyError] = useState("");
  const [tasks, setTasks] = useState(onboardingTasks);
  const [newTask, setNewTask] = useState("");
  const [alerts, setAlerts] = useState({
    requests: true,
    milestones: true,
    digest: false,
  });
  const canAdd = newTask.trim() !== "" && !tasks.includes(newTask.trim());

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Company details and the defaults every new hire starts with."
      />
      <SettingsSection
        title="Company"
        body="Shown on invites and at the top of the directory."
        submit="Save changes"
        onSubmit={() => {
          if (!company.name.trim()) {
            setCompanyError("Company name is required");
            document.getElementById("company-name")?.focus();
            return;
          }
          setCompanyError("");
          toast("Changes saved");
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="company-name" className="text-sm font-semibold">
              Company name
            </label>
            <input
              id="company-name"
              value={company.name}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
              aria-invalid={companyError ? true : undefined}
              aria-describedby={companyError ? "company-name-error" : undefined}
              className={input}
            />
            {companyError && (
              <p
                id="company-name-error"
                className="text-xs font-semibold text-red-600"
              >
                {companyError}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="company-tz" className="text-sm font-semibold">
              Time zone
            </label>
            <select
              id="company-tz"
              value={company.timezone}
              onChange={(e) =>
                setCompany({ ...company, timezone: e.target.value })
              }
              className={input}
            >
              {[
                "America/Los_Angeles",
                "America/New_York",
                "Europe/London",
                "Europe/Berlin",
              ].map((tz) => (
                <option key={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="company-week" className="text-sm font-semibold">
              Week starts on
            </label>
            <select
              id="company-week"
              value={company.weekStart}
              onChange={(e) =>
                setCompany({ ...company, weekStart: e.target.value })
              }
              className={input}
            >
              <option>Monday</option>
              <option>Sunday</option>
            </select>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Onboarding checklist"
        body="Every new hire gets these tasks a week before their first day."
        submit="Save checklist"
        onSubmit={() => toast("Checklist saved")}
      >
        {tasks.length === 0 ? (
          <p className={cx("rounded-xl bg-stone-50 p-4 text-sm", muted)}>
            No tasks yet. New hires won't get a checklist until you add one.
          </p>
        ) : (
          <ol className="flex flex-col divide-y divide-stone-100 rounded-xl border border-stone-200">
            {tasks.map((task, i) => (
              <li
                key={task}
                className="flex items-center gap-3 py-1.5 pr-1.5 pl-3 text-sm"
              >
                <span className="w-5 text-right tabular-nums text-stone-400">
                  {i + 1}
                </span>
                <span className="flex-1 truncate" title={task}>
                  {task}
                </span>
                <button
                  type="button"
                  className={cx(iconButton, "size-8")}
                  aria-label={`Remove ${task}`}
                  onClick={() => setTasks(tasks.filter((t) => t !== task))}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-3 flex gap-2">
          <label htmlFor="new-task" className="sr-only">
            New task
          </label>
          <input
            id="new-task"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Order business cards"
            className={input}
          />
          <button
            type="button"
            className={cx(secondary, "shrink-0")}
            disabled={!canAdd}
            onClick={() => {
              setTasks([...tasks, newTask.trim()]);
              setNewTask("");
            }}
          >
            Add task
          </button>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Notifications"
        body="What we email you about."
        submit="Save notification settings"
        onSubmit={() => toast("Notification settings saved")}
      >
        <div className="flex flex-col gap-4">
          {(
            [
              [
                "requests",
                "Time off requests",
                "When someone on your team asks for time off.",
              ],
              [
                "milestones",
                "Onboarding milestones",
                "When a new hire finishes their checklist.",
              ],
              [
                "digest",
                "Weekly digest",
                "A Monday summary of starts, leavers and anniversaries.",
              ],
            ] as const
          ).map(([key, label, body]) => (
            <label key={key} className="flex cursor-pointer gap-3">
              <input
                type="checkbox"
                checked={alerts[key]}
                onChange={() => setAlerts({ ...alerts, [key]: !alerts[key] })}
                className="mt-0.5 size-4 accent-rose-600"
              />
              <span>
                <span className="block text-sm font-semibold">{label}</span>
                <span className={cx("block text-sm", muted)}>{body}</span>
              </span>
            </label>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}

const navLink = ({ isActive }: { isActive: boolean }) =>
  cx(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition",
    focus,
    isActive
      ? "bg-rose-50 text-rose-700"
      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
  );

function SideNav({
  people,
  pending,
  toast,
}: {
  people: number;
  pending: number;
  toast: (m: string) => void;
}) {
  const navigate = useNavigate();
  const nav = [
    { to: "/home", label: "Home", Icon: House, count: 0 },
    { to: "/directory", label: "Directory", Icon: Users, count: people },
    { to: "/time-off", label: "Time off", Icon: CalendarDays, count: pending },
    { to: "/add", label: "Add employee", Icon: UserPlus, count: 0 },
  ];
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-2.5 px-1" data-testid="logo">
        <Logo />
        <span className="text-lg font-extrabold tracking-tight">Peoplehub</span>
      </div>
      <Menu
        label="Workspace menu for Acme Robotics"
        triggerClassName={cx(
          "flex w-full items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2 text-left shadow-xs hover:bg-stone-50",
          focus,
        )}
        trigger={
          <>
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-stone-900 text-xs font-bold text-white">
              AR
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">
                Acme Robotics
              </span>
              <span className="block truncate text-xs text-stone-500">
                Growth plan
              </span>
            </span>
            <ChevronDown className="size-4 text-stone-400" aria-hidden />
          </>
        }
        items={[
          {
            label: "Workspace settings",
            onSelect: () => navigate("/settings"),
          },
          {
            label: "Copy invite link",
            onSelect: () => toast("Invite link copied"),
          },
        ]}
      />
      <nav aria-label="Main" className="flex flex-col gap-0.5">
        {nav.map(({ to, label, Icon, count }) => (
          <NavLink key={to} to={to} className={navLink}>
            <Icon className="size-4" aria-hidden />
            <span className="flex-1">{label}</span>
            {count > 0 && (
              <span className="text-xs tabular-nums text-stone-400">
                {count}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <nav
        aria-label="Secondary"
        className="mt-auto flex flex-col gap-0.5 border-t border-stone-200 pt-4"
      >
        <NavLink to="/settings" className={navLink}>
          <Settings className="size-4" aria-hidden /> Settings
        </NavLink>
        <button
          type="button"
          className={navLink({ isActive: false })}
          onClick={() => toast("Help center opened")}
        >
          <CircleHelp className="size-4" aria-hidden /> Help
        </button>
      </nav>
    </div>
  );
}

function Shell({
  v,
  people,
  setPeople,
  requests,
  setRequests,
  toast,
}: {
  v: boolean;
  people: Person[];
  setPeople: (fn: (p: Person[]) => Person[]) => void;
  requests: TimeOff[];
  setRequests: (fn: (r: TimeOff[]) => TimeOff[]) => void;
  toast: (m: string) => void;
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const pending = requests.filter((r) => r.status === "Pending").length;

  const add = (employee: Omit<Employee, "id">) => {
    const id = `n${Date.now()}`;
    setPeople((current) => [
      {
        ...employee,
        id,
        location: "",
        onLeave: false,
        checklist: onboardingTasks.map(() => false),
        addedByYou: true,
      },
      ...current,
    ]);
    toast(`${employee.firstName} ${employee.lastName} added to the directory`);
    return id;
  };
  const decide = (id: string, status: TimeOff["status"]) => {
    setRequests((current) =>
      current.map((r) => (r.id === id ? { ...r, status } : r)),
    );
    toast(status === "Approved" ? "Request approved" : "Request declined");
  };
  const request = (r: Omit<TimeOff, "id" | "status">) => {
    setRequests((current) => [
      ...current,
      { ...r, id: `t${Date.now()}`, status: "Pending" },
    ]);
    toast("Request submitted");
  };
  const toggleTask = (id: string, index: number) =>
    setPeople((current) =>
      current.map((p) =>
        p.id === id && p.checklist
          ? {
              ...p,
              checklist: p.checklist.map((d, i) => (i === index ? !d : d)),
            }
          : p,
      ),
    );

  const sideNav = (
    <SideNav people={people.length} pending={pending} toast={toast} />
  );

  return (
    <div className="flex min-h-screen bg-stone-50 text-stone-900">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-stone-200 bg-white/70 p-4 md:block">
        {sideNav}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-stone-200 bg-white/90 px-4 py-2.5 backdrop-blur sm:px-6">
          <MobileNav label="Navigation" className="bg-white text-stone-900">
            <div className="mt-2 h-[calc(100dvh-4rem)]" style={font}>
              {sideNav}
            </div>
          </MobileNav>
          <form
            role="search"
            className="relative min-w-0 flex-1 sm:max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              const q = search.trim();
              navigate(
                q ? `/directory?q=${encodeURIComponent(q)}` : "/directory",
              );
            }}
          >
            <label htmlFor="global-search" className="sr-only">
              Search people
            </label>
            <Search
              className="pointer-events-none absolute top-2.5 left-3 size-4 text-stone-400"
              aria-hidden
            />
            <input
              id="global-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people"
              className={cx(
                input,
                "border-stone-200 bg-stone-100/70 pl-9 shadow-none",
              )}
              data-testid="global-search"
            />
          </form>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              type="button"
              className={iconButton}
              aria-label="Help"
              onClick={() => toast("Help center opened")}
            >
              <CircleHelp className="size-5" aria-hidden />
            </button>
            <NotificationsMenu
              items={notifications}
              triggerClassName={cx("text-stone-500", focus)}
            />
            <div className="ml-1 flex">
              <UserMenu
                name="Priya Desai"
                email="priya.desai@acme.com"
                items={["Your profile", "Settings"]}
                onSelect={(item) =>
                  item === "Your profile"
                    ? navigate("/people/1066")
                    : item === "Settings"
                      ? navigate("/settings")
                      : toast("Signed out")
                }
              />
            </div>
          </div>
        </header>
        <main className="w-full max-w-7xl flex-1 px-4 py-8 sm:px-8">
          <Routes>
            <Route
              path="home"
              element={
                <Home people={people} requests={requests} onDecide={decide} />
              }
            />
            <Route
              path="directory"
              element={<Directory v={v} people={people} />}
            />
            <Route
              path="people/:id"
              element={
                <Profile
                  v={v}
                  people={people}
                  requests={requests}
                  onToggleTask={toggleTask}
                  toast={toast}
                />
              }
            />
            <Route
              path="time-off"
              element={
                <TimeOffPage
                  people={people}
                  requests={requests}
                  onDecide={decide}
                  onRequest={request}
                />
              }
            />
            <Route path="settings" element={<SettingsPage toast={toast} />} />
            <Route
              path="add"
              element={<AddEmployee v={v} people={people} onAdd={add} />}
            />
            <Route path="*" element={<Navigate to="/directory" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App({ variant }: { variant: Variant }) {
  const v = variant === "variant";
  const [people, setPeople] = useState(seed);
  const [requests, setRequests] = useState(seedTimeOff);
  const [toasts, toast] = useToasts("bg-stone-900 text-white");

  return (
    <HashRouter>
      <div style={font}>
        <Shell
          v={v}
          people={people}
          setPeople={setPeople}
          requests={requests}
          setRequests={setRequests}
          toast={toast}
        />
        {toasts}
      </div>
    </HashRouter>
  );
}
