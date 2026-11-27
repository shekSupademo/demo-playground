import {
  Fingerprint,
  Globe,
  KeyRound,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Badge, formatDate, relativeTime } from "../../kit";
import { cx, Dialog } from "../../ui";
import { auditLog, policies } from "./data";
import {
  Facts,
  LinkList,
  Page,
  Section,
  Table,
  Tabs,
  t,
  useTab,
} from "./parts";
import { useStore } from "./store";

const home = { label: "Home", to: "/" };
const security = { label: "Security", to: "/security" };
const policiesCrumb = { label: "Policies", to: "/security/policies" };

export function SecurityHub() {
  return (
    <Page
      crumbs={[home, { label: "Security" }]}
      title="Security"
      description="Rules for how people sign in, and a record of who changed what."
    >
      <LinkList
        items={[
          {
            to: "/security/policies",
            label: "Policies",
            description: "Sign-in, password, session and device rules",
            Icon: ShieldCheck,
            testId: "hub-policies",
            aside: `${policies.length} policies`,
          },
          {
            to: "/security/audit",
            label: "Audit log",
            description: "Every admin change in the last 90 days",
            Icon: ScrollText,
            testId: "hub-audit",
          },
        ]}
      />
    </Page>
  );
}

export function PoliciesList() {
  const { v } = useStore();
  const list = v
    ? [
        {
          ...policies[0],
          id: "authentication",
          name: "Authentication",
          summary: "Sign-in methods and allowed email domains",
        },
        ...policies.slice(1),
      ]
    : policies;
  return (
    <Page
      crumbs={[home, security, { label: "Policies" }]}
      title="Policies"
      description="Each policy applies to everyone in Halden Robotics unless a team overrides it."
    >
      <LinkList
        items={list.map((p) => ({
          to: `/security/policies/${p.id}`,
          label: p.name,
          description: p.summary,
          testId: `policy-${p.id}`,
          aside: `Updated ${relativeTime(p.updated)}`,
        }))}
      />
    </Page>
  );
}

function DomainList({ addLabel = "Add domain" }: { addLabel?: string }) {
  const { domains, addDomain } = useStore();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const clean = value.trim().toLowerCase();
  const error = !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(clean)
    ? "Enter a domain like example.com"
    : domains.some((d) => d.name === clean)
      ? `${clean} is already allowed`
      : "";
  const close = () => {
    setOpen(false);
    setValue("");
    setTouched(false);
  };
  return (
    <Section
      title="Allowed domains"
      description="People with an email address on these domains can sign in with single sign-on."
      action={
        <button
          type="button"
          className={t.primary}
          onClick={() => setOpen(true)}
          data-testid="add-domain"
        >
          {addLabel}
        </button>
      }
    >
      <Table
        head={[{ label: "Domain" }, { label: "Status" }, { label: "Added" }]}
      >
        {domains.map((d) => (
          <tr key={d.name}>
            <td className="px-5 py-3 font-medium">{d.name}</td>
            <td className="px-5 py-3">
              {d.verified ? (
                <Badge tone="success">Verified</Badge>
              ) : (
                <Badge tone="warning">Waiting for DNS</Badge>
              )}
            </td>
            <td className="px-5 py-3 text-slate-600">{formatDate(d.added)}</td>
          </tr>
        ))}
      </Table>
      <p className="sr-only" data-testid="domain-list">
        {domains.map((d) => d.name).join(", ")}
      </p>
      <Dialog
        open={open}
        onClose={close}
        title="Add an allowed domain"
        className={t.dialog}
      >
        <form
          className="mt-4 flex flex-col gap-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            setTouched(true);
            if (error) return;
            addDomain(clean);
            close();
          }}
        >
          <label className="text-sm">
            <span className="font-medium">Domain</span>
            <input
              className={cx(t.input, "mt-1.5")}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="example.com"
              aria-invalid={touched && !!error}
              data-testid="domain-input"
            />
          </label>
          {touched && error && <p className="text-sm text-rose-600">{error}</p>}
          <p className="text-sm text-slate-500">
            You'll get a DNS record to add. Sign-in works once it's verified.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" className={t.secondary} onClick={close}>
              Cancel
            </button>
            <button
              type="submit"
              className={t.primary}
              data-testid="save-domain"
            >
              Add domain
            </button>
          </div>
        </form>
      </Dialog>
    </Section>
  );
}

const signInTabs = ["overview", "domains", "methods"] as const;

export function SignInPolicy() {
  const [tab, setTab] = useTab(signInTabs);
  const p = policies[0];
  return (
    <Page
      crumbs={[home, security, policiesCrumb, { label: p.name }]}
      title={p.name}
      description={p.summary}
      meta={
        <span>
          Last changed {relativeTime(p.updated)} by {p.updatedBy}
        </span>
      }
    >
      <Tabs
        tabs={signInTabs}
        current={tab}
        onChange={setTab}
        labels={{
          overview: "Overview",
          domains: "Allowed domains",
          methods: "Methods",
        }}
      />
      {tab === "overview" && (
        <Facts
          items={[
            ["Single sign-on", "Okta"],
            ["2-step verification", "Required for admins"],
            ["Guests", "Allowed, invite only"],
          ]}
        />
      )}
      {tab === "domains" && <DomainList />}
      {tab === "methods" && <Methods />}
    </Page>
  );
}

function Methods() {
  const { toast } = useStore();
  const [methods, setMethods] = useState({
    sso: true,
    password: true,
    passkey: false,
  });
  return (
    <fieldset className={cx(t.panel, "flex max-w-xl flex-col gap-3 p-5")}>
      <legend className="sr-only">Sign-in methods</legend>
      {(
        [
          ["sso", "Single sign-on with Okta"],
          ["password", "Email and password"],
          ["passkey", "Passkeys"],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-[#3046C5]"
            checked={methods[key]}
            onChange={(e) =>
              setMethods({ ...methods, [key]: e.target.checked })
            }
          />
          {label}
        </label>
      ))}
      <div className="pt-2">
        <button
          type="button"
          className={t.primary}
          onClick={() => toast("Sign-in methods saved")}
        >
          Save methods
        </button>
      </div>
    </fieldset>
  );
}

export function AuthenticationPolicy() {
  return (
    <Page
      crumbs={[home, security, policiesCrumb, { label: "Authentication" }]}
      title="Authentication"
      description="How people prove who they are, and which email domains can sign in."
    >
      <LinkList
        items={[
          {
            to: "/security/policies/authentication/methods",
            label: "Sign-in methods",
            description: "Single sign-on, passwords and passkeys",
            Icon: Fingerprint,
            testId: "section-methods",
          },
          {
            to: "/security/policies/authentication/domains",
            label: "Domains",
            description: "Email domains allowed to sign in with single sign-on",
            Icon: Globe,
            testId: "section-domains",
          },
          {
            to: "/security/policies/authentication/two-step",
            label: "2-step verification",
            description: "Who must use a second factor",
            Icon: KeyRound,
            testId: "section-two-step",
          },
        ]}
      />
    </Page>
  );
}

const authCrumb = {
  label: "Authentication",
  to: "/security/policies/authentication",
};

export function AuthenticationDomains() {
  return (
    <Page
      crumbs={[home, security, policiesCrumb, authCrumb, { label: "Domains" }]}
      title="Domains"
      description="Add a domain, then verify it with a DNS record."
    >
      <DomainList />
    </Page>
  );
}

export function AuthenticationMethods() {
  return (
    <Page
      crumbs={[
        home,
        security,
        policiesCrumb,
        authCrumb,
        { label: "Sign-in methods" },
      ]}
      title="Sign-in methods"
    >
      <Methods />
    </Page>
  );
}

export function AuthenticationTwoStep() {
  return (
    <Page
      crumbs={[
        home,
        security,
        policiesCrumb,
        authCrumb,
        { label: "2-step verification" },
      ]}
      title="2-step verification"
    >
      <Facts
        items={[
          ["Admins and owners", "Required"],
          ["Members", "Recommended"],
          ["Grace period", "7 days"],
        ]}
      />
    </Page>
  );
}

export function OtherPolicy({ id }: { id: string }) {
  const p = policies.find((x) => x.id === id) ?? policies[1];
  const facts: Record<string, [string, string][]> = {
    password: [
      ["Minimum length", "12 characters"],
      ["Reuse", "Last 5 passwords blocked"],
      ["Expiry", "Never"],
    ],
    session: [
      ["Idle timeout", "30 minutes"],
      ["Maximum session", "12 hours"],
      ["Remember device", "30 days"],
    ],
    devices: [
      ["Managed devices", "Required for admins"],
      ["Screen lock", "5 minutes"],
      ["Disk encryption", "Required"],
    ],
  };
  return (
    <Page
      crumbs={[home, security, policiesCrumb, { label: p.name }]}
      title={p.name}
      description={p.summary}
      meta={
        <span>
          Last changed {relativeTime(p.updated)} by {p.updatedBy}
        </span>
      }
    >
      <Facts items={facts[p.id] ?? []} />
    </Page>
  );
}

export function AuditLog() {
  return (
    <Page
      crumbs={[home, security, { label: "Audit log" }]}
      title="Audit log"
      description="Changes made by admins in the last 90 days."
    >
      <Table head={[{ label: "Who" }, { label: "What" }, { label: "When" }]}>
        {auditLog.map((a) => (
          <tr key={a.id}>
            <td className="px-5 py-3 font-medium whitespace-nowrap">
              {a.actor}
            </td>
            <td className="px-5 py-3">{a.action}</td>
            <td className="px-5 py-3 whitespace-nowrap text-slate-600">
              {relativeTime(a.at)}
            </td>
          </tr>
        ))}
      </Table>
    </Page>
  );
}
