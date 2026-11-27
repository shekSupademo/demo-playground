import {
  CreditCard,
  Download,
  History,
  MoreHorizontal,
  Receipt,
} from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Badge, formatDate, money } from "../../kit";
import { cx, Menu } from "../../ui";
import { type Invoice, invoices, subscriptions } from "./data";
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
const billing = { label: "Billing", to: "/billing" };
const subsCrumb = { label: "Subscriptions", to: "/billing/subscriptions" };

const statusBadge = (s: Invoice["status"]) => (
  <Badge tone={s === "Paid" ? "success" : "warning"}>{s}</Badge>
);

export function BillingHub() {
  const { v } = useStore();
  return (
    <Page
      crumbs={[home, { label: "Billing" }]}
      title="Billing"
      description="Plans, payment details and invoices for Halden Robotics."
    >
      <LinkList
        items={[
          {
            to: "/billing/subscriptions",
            label: "Subscriptions",
            description: "Your plan, add-ons and renewal dates",
            Icon: Receipt,
            testId: "hub-subscriptions",
            aside: `${subscriptions.length} active`,
          },
          {
            to: "/billing/payment",
            label: "Payment method",
            description: "Card on file and billing contact",
            Icon: CreditCard,
            testId: "hub-payment",
          },
          ...(v
            ? [
                {
                  to: "/billing/history",
                  label: "History",
                  description: "Every invoice, ready to download",
                  Icon: History,
                  testId: "hub-history",
                  aside: `${invoices.length} invoices`,
                },
              ]
            : []),
        ]}
      />
    </Page>
  );
}

export function SubscriptionsList() {
  return (
    <Page
      crumbs={[home, billing, { label: "Subscriptions" }]}
      title="Subscriptions"
      description="Prices are per month, billed on the 1st."
    >
      <Table
        head={[
          { label: "Subscription" },
          { label: "Quantity", right: true },
          { label: "Monthly", right: true },
          { label: "Renews" },
        ]}
      >
        {subscriptions.map((s) => (
          <tr key={s.id} className="hover:bg-slate-50">
            <td className="px-5 py-3">
              <Link
                to={`/billing/subscriptions/${s.id}`}
                data-testid={`subscription-${s.id}`}
                className={cx("font-medium hover:text-[#3046C5]", t.focus)}
              >
                {s.name}
              </Link>
              {s.status === "Trial" && (
                <span className="ml-2">
                  <Badge tone="info">Trial</Badge>
                </span>
              )}
            </td>
            <td className="px-5 py-3 text-right tabular-nums">{s.seats}</td>
            <td className="px-5 py-3 text-right tabular-nums">
              {money(s.seats * s.price)}
            </td>
            <td className="px-5 py-3 text-slate-600">{formatDate(s.renews)}</td>
          </tr>
        ))}
      </Table>
    </Page>
  );
}

const subTabs = ["overview", "invoices"] as const;

export function SubscriptionRecord() {
  const { subscriptionId } = useParams();
  const { v } = useStore();
  const tabs = v ? (["overview"] as const) : subTabs;
  const [tab, setTab] = useTab<(typeof subTabs)[number]>(tabs);
  const s = subscriptions.find((x) => x.id === subscriptionId);
  if (!s) return <Navigate to="/billing/subscriptions" replace />;
  const own = invoices.filter((i) => i.subscriptionId === s.id);
  return (
    <Page
      crumbs={[home, billing, subsCrumb, { label: s.name }]}
      title={s.name}
      meta={
        <>
          <span>Renews {formatDate(s.renews)}</span>
          <Badge tone={s.status === "Active" ? "success" : "info"}>
            {s.status}
          </Badge>
        </>
      }
    >
      <Tabs
        tabs={tabs}
        current={tab}
        onChange={setTab}
        labels={{ overview: "Overview", invoices: "Invoices" }}
      />
      {tab === "overview" && (
        <Facts
          items={[
            ["Quantity", String(s.seats)],
            ["Price", `${money(s.price)} per unit`],
            ["Monthly total", money(s.seats * s.price)],
          ]}
        />
      )}
      {tab === "invoices" && (
        <Table
          head={[
            { label: "Invoice" },
            { label: "Period" },
            { label: "Amount", right: true },
            { label: "Status" },
          ]}
        >
          {own.map((i) => (
            <tr key={i.id} className="hover:bg-slate-50">
              <td className="px-5 py-3">
                <Link
                  to={`/billing/subscriptions/${s.id}/invoices/${i.id}`}
                  data-testid={`invoice-${i.id}`}
                  className={cx("font-medium hover:text-[#3046C5]", t.focus)}
                >
                  {i.number}
                </Link>
              </td>
              <td className="px-5 py-3">{i.period}</td>
              <td className="px-5 py-3 text-right tabular-nums">
                {money(i.amount)}
              </td>
              <td className="px-5 py-3">{statusBadge(i.status)}</td>
            </tr>
          ))}
        </Table>
      )}
    </Page>
  );
}

export function InvoiceDetail() {
  const { subscriptionId, invoiceId } = useParams();
  const { toast } = useStore();
  const s = subscriptions.find((x) => x.id === subscriptionId);
  const i = invoices.find((x) => x.id === invoiceId);
  if (!s || !i) return <Navigate to="/billing/subscriptions" replace />;
  return (
    <Page
      crumbs={[
        home,
        billing,
        subsCrumb,
        { label: s.name, to: `/billing/subscriptions/${s.id}?tab=invoices` },
        { label: i.number },
      ]}
      title={i.number}
      description={`${i.period}, issued ${formatDate(i.issued)}`}
      meta={statusBadge(i.status)}
      actions={
        <button
          type="button"
          className={t.primary}
          onClick={() => toast(`Invoice ${i.number} downloaded`)}
          data-testid="download-invoice"
        >
          <Download className="size-4" aria-hidden />
          Download PDF
        </button>
      }
    >
      <Section title="Line items">
        <Table
          head={[
            { label: "Item" },
            { label: "Quantity", right: true },
            { label: "Unit price", right: true },
            { label: "Amount", right: true },
          ]}
        >
          {i.lines.map((l) => (
            <tr key={l.label}>
              <td className="px-5 py-3">{l.label}</td>
              <td className="px-5 py-3 text-right tabular-nums">
                {l.quantity}
              </td>
              <td className="px-5 py-3 text-right tabular-nums">
                {money(l.unit)}
              </td>
              <td className="px-5 py-3 text-right tabular-nums">
                {money(l.quantity * l.unit)}
              </td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="px-5 py-3" colSpan={3}>
              Total
            </td>
            <td className="px-5 py-3 text-right tabular-nums">
              {money(i.amount)}
            </td>
          </tr>
        </Table>
      </Section>
    </Page>
  );
}

export function BillingHistory() {
  const { toast } = useStore();
  return (
    <Page
      crumbs={[home, billing, { label: "History" }]}
      title="History"
      description="Invoices for every subscription, newest first."
    >
      <Table
        head={[
          { label: "Invoice" },
          { label: "Period" },
          { label: "Amount", right: true },
          { label: "Status" },
          { label: "" },
        ]}
      >
        {invoices.map((i) => (
          <tr key={i.id} className="hover:bg-slate-50">
            <td className="px-5 py-3 font-medium">{i.number}</td>
            <td className="px-5 py-3">{i.period}</td>
            <td className="px-5 py-3 text-right tabular-nums">
              {money(i.amount)}
            </td>
            <td className="px-5 py-3">{statusBadge(i.status)}</td>
            <td className="px-3 py-1.5 text-right">
              <Menu
                label={`Actions for ${i.number}`}
                trigger={<MoreHorizontal className="size-4" aria-hidden />}
                triggerClassName={t.ghost}
                testId={`invoice-menu-${i.id}`}
                items={[
                  {
                    label: "Download PDF",
                    onSelect: () => toast(`Invoice ${i.number} downloaded`),
                    testId: `download-invoice-${i.id}`,
                  },
                  {
                    label: "Email to billing contact",
                    onSelect: () => toast(`Invoice ${i.number} emailed`),
                  },
                ]}
              />
            </td>
          </tr>
        ))}
      </Table>
    </Page>
  );
}

export function PaymentMethod() {
  const { toast } = useStore();
  return (
    <Page
      crumbs={[home, billing, { label: "Payment method" }]}
      title="Payment method"
      description="We charge this card on the 1st of each month."
    >
      <div
        className={cx(
          t.panel,
          "flex max-w-xl flex-wrap items-center gap-4 p-5",
        )}
      >
        <CreditCard className="size-6 text-slate-500" aria-hidden />
        <div className="flex-1">
          <p className="font-medium">Visa ending 4242</p>
          <p className="text-sm text-slate-500">
            Expires 08/2028, billing contact Hana Sato
          </p>
        </div>
        <button
          type="button"
          className={t.secondary}
          onClick={() => toast("Card form opened")}
        >
          Replace card
        </button>
      </div>
    </Page>
  );
}
