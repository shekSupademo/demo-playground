import { Search, UserPlus, Users } from "lucide-react";
import { type FormEvent, useState } from "react";
import {
  HashRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import type { Variant } from "../../registry";
import { cx, useToasts } from "../../ui";

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  fax: string;
  pronouns: string;
  jobTitle: string;
  department: string;
  manager: string;
  employeeId: string;
  startDate: string;
};

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

const departments = [
  "Engineering",
  "Design",
  "Marketing",
  "Sales",
  "People",
  "Finance",
  "Customer Success",
];

const pronounOptions = ["She/her", "He/him", "They/them", "Prefer not to say"];

const blank: Omit<Employee, "id"> = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  fax: "",
  pronouns: "",
  jobTitle: "",
  department: "",
  manager: "",
  employeeId: "",
  startDate: "",
};

const person = (
  id: string,
  firstName: string,
  lastName: string,
  jobTitle: string,
  department: string,
  manager: string,
  startDate: string,
  pronouns: string,
): Employee => ({
  ...blank,
  id,
  firstName,
  lastName,
  email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@acme.com`,
  phone: `+1 415 555 0${id.slice(1)}`,
  jobTitle,
  department,
  manager,
  employeeId: `EMP-${id}`,
  startDate,
  pronouns,
});

const seed: Employee[] = [
  person(
    "1001",
    "Grace",
    "Okafor",
    "Chief People Officer",
    "People",
    "",
    "2019-03-04",
    "She/her",
  ),
  person(
    "1014",
    "Daniel",
    "Hughes",
    "VP of Engineering",
    "Engineering",
    "Grace Okafor",
    "2020-01-13",
    "He/him",
  ),
  person(
    "1027",
    "Mei",
    "Tanaka",
    "Design Lead",
    "Design",
    "Grace Okafor",
    "2020-08-17",
    "She/her",
  ),
  person(
    "1042",
    "Luis",
    "Romero",
    "Senior Engineer",
    "Engineering",
    "Daniel Hughes",
    "2021-05-03",
    "He/him",
  ),
  person(
    "1058",
    "Aisha",
    "Rahman",
    "Product Designer",
    "Design",
    "Mei Tanaka",
    "2022-02-07",
    "She/her",
  ),
  person(
    "1063",
    "Tom",
    "Becker",
    "Account Executive",
    "Sales",
    "Grace Okafor",
    "2022-06-20",
    "He/him",
  ),
  person(
    "1071",
    "Riley",
    "Nguyen",
    "Marketing Manager",
    "Marketing",
    "Grace Okafor",
    "2023-01-09",
    "They/them",
  ),
  person(
    "1085",
    "Sofia",
    "Marino",
    "Financial Analyst",
    "Finance",
    "Grace Okafor",
    "2023-09-11",
    "She/her",
  ),
  person(
    "1092",
    "Kwame",
    "Asante",
    "Support Specialist",
    "Customer Success",
    "Tom Becker",
    "2024-04-15",
    "He/him",
  ),
  person(
    "1104",
    "Hannah",
    "Schmidt",
    "Frontend Engineer",
    "Engineering",
    "Daniel Hughes",
    "2025-02-03",
    "She/her",
  ),
];

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

const today = () => new Date().toLocaleDateString("en-CA");

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

const input =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 aria-invalid:border-red-600";

function AddEmployee({
  v,
  employees,
  onAdd,
}: {
  v: boolean;
  employees: Employee[];
  onAdd: (employee: Omit<Employee, "id">) => void;
}) {
  const navigate = useNavigate();
  const managers = employees.map((e) => `${e.firstName} ${e.lastName}`);
  const fields = fieldsFor(v, managers);
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = validate(v, fields, values);
    setErrors(next);
    const first = fields.find((f) => next[f.key]);
    if (first) {
      document.getElementById(`field-${first.key}`)?.focus();
      return;
    }
    onAdd(values);
    navigate("/directory");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-stone-900">Add employee</h1>
      <p className="mt-1 text-sm text-stone-500">
        Fields marked with <span className="text-rose-600">*</span> are
        required.
      </p>
      <form
        noValidate
        onSubmit={submit}
        className="mt-6 grid grid-cols-1 gap-x-4 gap-y-5 rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:grid-cols-2"
        data-testid="employee-form"
      >
        {fields.map((field) => {
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
          return (
            <div key={field.key} className="flex flex-col gap-1">
              <label
                htmlFor={id}
                className="text-sm font-medium text-stone-700"
              >
                {field.label}
                {field.required && (
                  <span className="ml-0.5 text-rose-600" aria-hidden>
                    *
                  </span>
                )}
              </label>
              {field.type === "select" ? (
                <select
                  {...common}
                  onChange={(e) =>
                    setValues({ ...values, [field.key]: e.target.value })
                  }
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
                  onChange={(e) =>
                    setValues({ ...values, [field.key]: e.target.value })
                  }
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
                  className="text-xs font-medium text-red-600"
                  data-testid={`error-${field.key}`}
                >
                  {error}
                </p>
              )}
            </div>
          );
        })}
        <div className="flex gap-3 sm:col-span-2">
          <button
            type="submit"
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500"
            data-testid="submit-employee"
          >
            Add employee
          </button>
          <Link
            to="/directory"
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
            data-testid="cancel-employee"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Directory({ v, employees }: { v: boolean; employees: Employee[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = employees.filter((e) =>
    [e.firstName, e.lastName, e.email, e.jobTitle, e.department, e.employeeId]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
  const jobTitle = { label: "Job title", value: (e: Employee) => e.jobTitle };
  const department = {
    label: "Department",
    value: (e: Employee) => e.department,
  };
  const columns: { label: string; value: (e: Employee) => string }[] = [
    { label: "Name", value: (e) => `${e.firstName} ${e.lastName}` },
    ...(v
      ? [
          { label: "Pronouns", value: (e: Employee) => e.pronouns },
          department,
          jobTitle,
        ]
      : [jobTitle, department]),
    { label: "Manager", value: (e) => e.manager },
    { label: "Employee ID", value: (e) => e.employeeId },
    {
      label: "Start date",
      value: (e) =>
        new Date(`${e.startDate}T00:00:00`).toLocaleDateString("en-US", {
          dateStyle: "medium",
        }),
    },
  ];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Directory</h1>
          <p className="mt-1 text-sm text-stone-500">
            {employees.length} people at Acme
          </p>
        </div>
        <Link
          to="/add"
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500"
          data-testid="add-employee"
        >
          <UserPlus className="size-4" aria-hidden /> Add employee
        </Link>
      </div>
      <label className="relative mt-6 block max-w-sm">
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
      <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table
          className="w-full text-left text-sm"
          data-testid="directory-table"
        >
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              {columns.map((c) => (
                <th key={c.label} scope="col" className="px-4 py-3 font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {shown.map((e) => (
              <tr key={e.id} data-testid={`employee-${e.id}`}>
                {columns.map((c, i) =>
                  i === 0 ? (
                    <th
                      key={c.label}
                      scope="row"
                      className="px-4 py-3 font-medium text-stone-900"
                    >
                      {c.value(e)}
                      <div className="text-xs font-normal text-stone-500">
                        {e.email}
                      </div>
                    </th>
                  ) : (
                    <td key={c.label} className="px-4 py-3 text-stone-600">
                      {c.value(e) || "—"}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && (
          <p className="p-6 text-center text-sm text-stone-500">
            No one matches “{query}”.
          </p>
        )}
      </div>
    </div>
  );
}

export default function App({ variant }: { variant: Variant }) {
  const v = variant === "variant";
  const [employees, setEmployees] = useState(seed);
  const [toasts, toast] = useToasts("bg-stone-900 text-white");

  const add = (employee: Omit<Employee, "id">) => {
    setEmployees((current) => [
      { ...employee, id: `n${Date.now()}` },
      ...current,
    ]);
    toast(
      `${employee.firstName} ${employee.lastName} was added to the directory`,
    );
  };

  const nav = [
    { to: "/directory", label: "Directory", Icon: Users },
    { to: "/add", label: "Add employee", Icon: UserPlus },
  ];

  return (
    <HashRouter>
      <div className="flex min-h-screen bg-stone-50 text-stone-900">
        <aside className="w-56 shrink-0 border-r border-stone-200 bg-white p-4">
          <div
            className="mb-6 flex items-center gap-2 font-semibold"
            data-testid="logo"
          >
            <span className="grid size-8 place-items-center rounded-full bg-rose-600 text-sm font-bold text-white">
              ph
            </span>
            Peoplehub
          </div>
          <nav aria-label="Main" className="flex flex-col gap-1">
            {nav.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cx(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                    isActive
                      ? "bg-rose-50 font-medium text-rose-700"
                      : "text-stone-500 hover:text-stone-900",
                  )
                }
              >
                <Icon className="size-4" aria-hidden /> {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-8">
          <Routes>
            <Route
              path="directory"
              element={<Directory v={v} employees={employees} />}
            />
            <Route
              path="add"
              element={<AddEmployee v={v} employees={employees} onAdd={add} />}
            />
            <Route path="*" element={<Navigate to="/directory" replace />} />
          </Routes>
        </main>
      </div>
      {toasts}
    </HashRouter>
  );
}
