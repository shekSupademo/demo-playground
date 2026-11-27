import { AppWindow, Copy, Webhook } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Badge, formatDate, relativeTime } from "../../kit";
import { cx } from "../../ui";
import type { DevApp } from "./data";
import {
  ConfirmDialog,
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
const developers = { label: "Developers", to: "/developers" };
const appsCrumb = { label: "Apps", to: "/developers/apps" };

export function DevelopersHub() {
  const { apps } = useStore();
  return (
    <Page
      crumbs={[home, { label: "Developers" }]}
      title="Developers"
      description="Apps and webhooks that connect other systems to Corvid."
    >
      <LinkList
        items={[
          {
            to: "/developers/apps",
            label: "Apps",
            description: "Internal apps, their API keys and usage",
            Icon: AppWindow,
            testId: "hub-apps",
            aside: `${apps.length} apps`,
          },
          {
            to: "/developers/webhooks",
            label: "Webhooks",
            description: "Events Corvid sends to your endpoints",
            Icon: Webhook,
            testId: "hub-webhooks",
            aside: "3 endpoints",
          },
        ]}
      />
    </Page>
  );
}

export function AppsList() {
  const { apps } = useStore();
  return (
    <Page
      crumbs={[home, developers, { label: "Apps" }]}
      title="Apps"
      description="Each app has its own API keys. Rotate keys at least every 6 months."
    >
      <Table
        head={[
          { label: "App" },
          { label: "Owner" },
          { label: "Status" },
          { label: "Requests, 30 days", right: true },
        ]}
      >
        {apps.map((a) => (
          <tr key={a.id} className="hover:bg-slate-50">
            <td className="max-w-80 px-5 py-3">
              <Link
                to={`/developers/apps/${a.id}`}
                data-testid={`app-${a.id}`}
                className={cx(
                  "block font-medium hover:text-[#3046C5]",
                  t.focus,
                )}
              >
                {a.name}
              </Link>
              <span
                className="block truncate text-xs text-slate-500"
                title={a.description}
              >
                {a.description}
              </span>
            </td>
            <td className="px-5 py-3 whitespace-nowrap">{a.owner}</td>
            <td className="px-5 py-3">
              <Badge tone={a.status === "Active" ? "success" : "neutral"}>
                {a.status}
              </Badge>
            </td>
            <td className="px-5 py-3 text-right tabular-nums">
              {a.requests.toLocaleString("en-US")}
            </td>
          </tr>
        ))}
      </Table>
    </Page>
  );
}

const appTabs = ["overview", "credentials", "usage"] as const;

function useApp() {
  const { appId } = useParams();
  const { apps } = useStore();
  return apps.find((a) => a.id === appId);
}

function KeysTable({ app }: { app: DevApp }) {
  return (
    <Table
      head={[
        { label: "Key" },
        { label: "Scopes" },
        { label: "Last used" },
        { label: "Last rotated" },
      ]}
    >
      {app.keys.map((k) => (
        <tr key={k.id} className="hover:bg-slate-50">
          <td className="px-5 py-3">
            <Link
              to={`/developers/apps/${app.id}/keys/${k.id}`}
              data-testid={`key-${k.id}`}
              className={cx("font-medium hover:text-[#3046C5]", t.focus)}
            >
              {k.name}
            </Link>
            <span className="block font-mono text-xs text-slate-500">
              sk_live_••••{k.suffix}
            </span>
          </td>
          <td className="px-5 py-3 text-slate-600">{k.scopes.join(", ")}</td>
          <td className="px-5 py-3 text-slate-600">
            {relativeTime(k.lastUsed)}
          </td>
          <td className="px-5 py-3 text-slate-600">{formatDate(k.rotated)}</td>
        </tr>
      ))}
    </Table>
  );
}

export function AppRecord() {
  const app = useApp();
  const { v } = useStore();
  const [tab, setTab] = useTab(appTabs);
  if (!app) return <Navigate to="/developers/apps" replace />;
  return (
    <Page
      crumbs={[home, developers, appsCrumb, { label: app.name }]}
      title={app.name}
      description={app.description}
      meta={
        <>
          <span>Owner: {app.owner}</span>
          <Badge tone={app.status === "Active" ? "success" : "neutral"}>
            {app.status}
          </Badge>
        </>
      }
    >
      <Tabs
        tabs={appTabs}
        current={tab}
        onChange={setTab}
        labels={{
          overview: "Overview",
          credentials: "Credentials",
          usage: "Usage",
        }}
      />
      {tab === "overview" && (
        <Facts
          items={[
            ["App ID", `app_${app.id.replace(/-/g, "_")}`],
            ["Owner", app.owner],
            ["Keys", String(app.keys.length)],
          ]}
        />
      )}
      {tab === "credentials" &&
        (v ? (
          <div
            className={cx(
              t.panel,
              "flex flex-wrap items-center justify-between gap-4 p-5",
            )}
          >
            <div>
              <h2 className="font-semibold">API keys</h2>
              <p className="text-sm text-slate-500">
                {app.keys.length} active{" "}
                {app.keys.length === 1 ? "key" : "keys"}. Create, rotate and
                revoke keys on their own page.
              </p>
            </div>
            <Link
              to={`/developers/apps/${app.id}/keys`}
              className={t.secondary}
              data-testid="manage-keys"
            >
              Manage keys
            </Link>
          </div>
        ) : (
          <Section
            title="API keys"
            description="Keys act as this app. Keep them out of source control."
          >
            <KeysTable app={app} />
          </Section>
        ))}
      {tab === "usage" && (
        <Facts
          items={[
            ["Requests, 30 days", app.requests.toLocaleString("en-US")],
            ["Error rate", "0.4%"],
            ["Rate limit", "600 per minute"],
          ]}
        />
      )}
    </Page>
  );
}

export function KeysPage() {
  const app = useApp();
  if (!app) return <Navigate to="/developers/apps" replace />;
  return (
    <Page
      crumbs={[
        home,
        developers,
        appsCrumb,
        { label: app.name, to: `/developers/apps/${app.id}?tab=credentials` },
        { label: "API keys" },
      ]}
      title="API keys"
      description={`Keys for ${app.name}. Rotate keys at least every 6 months.`}
    >
      <KeysTable app={app} />
    </Page>
  );
}

export function KeyDetail() {
  const app = useApp();
  const { keyId } = useParams();
  const { v, rotateKey, toast } = useStore();
  const [open, setOpen] = useState(false);
  const key = app?.keys.find((k) => k.id === keyId);
  if (!app || !key) return <Navigate to="/developers/apps" replace />;
  const crumbs = [
    home,
    developers,
    appsCrumb,
    { label: app.name, to: `/developers/apps/${app.id}?tab=credentials` },
    ...(v
      ? [{ label: "API keys", to: `/developers/apps/${app.id}/keys` }]
      : []),
    { label: key.name },
  ];
  return (
    <Page
      crumbs={crumbs}
      title={key.name}
      description={`Used by ${app.name}.`}
      actions={
        <button
          type="button"
          className={t.primary}
          onClick={() => setOpen(true)}
          data-testid="rotate-key"
        >
          Rotate key
        </button>
      }
    >
      <div className={cx(t.panel, "flex flex-wrap items-center gap-3 p-5")}>
        <code
          className="min-w-0 flex-1 truncate font-mono text-sm"
          data-testid="key-suffix"
        >
          sk_live_••••••••••••{key.suffix}
        </code>
        <button
          type="button"
          className={t.secondary}
          onClick={() => toast("Key ID copied")}
        >
          <Copy className="size-4" aria-hidden />
          Copy key ID
        </button>
      </div>
      <Facts
        items={[
          ["Scopes", key.scopes.join(", ")],
          ["Created", formatDate(key.created)],
          ["Last used", relativeTime(key.lastUsed)],
          ["Last rotated", formatDate(key.rotated)],
        ]}
      />
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Rotate ${key.name.toLowerCase()}?`}
        body={`${app.name} stops working until you update it with the new key. The old key stops working right away.`}
        confirm="Rotate key"
        onConfirm={() => rotateKey(app, key.id)}
        testId="confirm-rotate"
        typeToConfirm={v ? key.name : undefined}
      />
    </Page>
  );
}

export function Webhooks() {
  return (
    <Page
      crumbs={[home, developers, { label: "Webhooks" }]}
      title="Webhooks"
      description="Corvid sends a signed POST request for each event."
    >
      <Table
        head={[{ label: "Endpoint" }, { label: "Events" }, { label: "Status" }]}
      >
        {[
          [
            "https://hooks.halden.io/members",
            "member.created, member.removed",
            "Healthy",
          ],
          ["https://ops.halden.io/corvid", "policy.updated", "Healthy"],
          ["https://legacy.halden.io/sync", "member.updated", "Failing"],
        ].map(([url, events, status]) => (
          <tr key={url}>
            <td
              className="max-w-72 truncate px-5 py-3 font-mono text-xs"
              title={url}
            >
              {url}
            </td>
            <td className="px-5 py-3 text-slate-600">{events}</td>
            <td className="px-5 py-3">
              <Badge tone={status === "Healthy" ? "success" : "danger"}>
                {status}
              </Badge>
            </td>
          </tr>
        ))}
      </Table>
    </Page>
  );
}
