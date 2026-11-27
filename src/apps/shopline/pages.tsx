import {
  AlertTriangle,
  ChevronRight,
  Inbox,
  PackageCheck,
  Printer,
  Search,
  Users,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
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
import { cx } from "../../ui";
import {
  type Customer,
  fulfillments,
  type Order,
  orderSubtotal,
  orderTotal,
  type Product,
  payments,
  priceOf,
} from "./data";
import {
  Field,
  FulfillmentBadge,
  PageHeader,
  Pagination,
  PaymentBadge,
  ProductArt,
  type Sort,
  SortHeader,
  SubmitButton,
  sortBy,
  t,
  usePending,
} from "./parts";

const PAGE_SIZE = 20;
const needsFulfillment = (o: Order) =>
  (o.fulfillment === "Unfulfilled" ||
    o.fulfillment === "Partially fulfilled") &&
  o.payment !== "Refunded";
const itemCount = (o: Order) => o.lines.reduce((s, l) => s + l.qty, 0);
const chartBase = [
  1180, 940, 1320, 1610, 870, 1040, 1490, 1720, 1260, 980, 1390, 1550, 1110, 0,
];

function SearchInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative flex-1 sm:max-w-xs">
      <span className="sr-only">{label}</span>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(t.input, "pl-9")}
      />
    </label>
  );
}

export function HomePage({
  products,
  orders,
  customers,
}: {
  products: Product[];
  orders: Order[];
  customers: Customer[];
}) {
  useDocumentTitle("Home – Shopline");
  const today = daysFromToday(0);
  const todays = orders.filter(
    (o) => o.date === today && o.payment !== "Refunded",
  );
  const salesToday = todays.reduce((s, o) => s + orderTotal(o, products), 0);
  const toFulfill = orders.filter(needsFulfillment);
  const lowStock = products
    .filter((p) => p.stock < 10)
    .sort((a, b) => a.stock - b.stock);
  const days = chartBase.map((base, i) => {
    const date = daysFromToday(i - 13);
    const sales = orders
      .filter((o) => o.date === date && o.payment !== "Refunded")
      .reduce((s, o) => s + orderTotal(o, products), 0);
    return { date, total: Math.round(base + sales) };
  });
  const max = Math.max(...days.map((d) => d.total));
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const customerName = (id: string) =>
    customers.find((c) => c.id === id)?.name ?? "Guest";
  const stats = [
    {
      label: "Sales today",
      value: money(Math.round(salesToday * 100) / 100),
      note: `${todays.length} orders so far`,
    },
    {
      label: "Orders to fulfill",
      value: String(toFulfill.length),
      note: `${toFulfill.filter((o) => o.payment === "Paid").length} paid and ready to ship`,
    },
    {
      label: "Low stock",
      value: String(lowStock.length),
      note: `${lowStock.filter((p) => p.stock === 0).length} out of stock`,
    },
    {
      label: "Store sessions today",
      value: "1,284",
      note: "Up 8% from last week",
    },
  ];
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`${greeting}, Maya`}
        description="Here is how Fernwood Supply Co. is doing today."
      />
      <dl className="grid grid-cols-2 gap-6 border-y border-slate-200 py-5 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-sm text-slate-500">{s.label}</dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
              {s.value}
            </dd>
            <dd className="text-xs text-slate-500">{s.note}</dd>
          </div>
        ))}
      </dl>
      <section aria-labelledby="sales-heading">
        <div className="flex items-baseline justify-between">
          <h2 id="sales-heading" className="font-semibold">
            Sales, last 14 days
          </h2>
          <span className="text-sm text-slate-500 tabular-nums">
            {money(days.reduce((s, d) => s + d.total, 0))} total
          </span>
        </div>
        <svg
          viewBox="0 0 700 180"
          className="mt-4 h-44 w-full"
          role="img"
          aria-label={`Daily sales for the last 14 days, highest ${money(max)}`}
          preserveAspectRatio="none"
        >
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1="0"
              x2="700"
              y1={150 - f * 140}
              y2={150 - f * 140}
              stroke="#E2E8F0"
              strokeDasharray="3 4"
            />
          ))}
          {days.map((d, i) => {
            const height = Math.max(2, (d.total / max) * 140);
            return (
              <g key={d.date}>
                <rect
                  x={i * 50 + 10}
                  y={150 - height}
                  width="30"
                  height={height}
                  rx="4"
                  fill={i === 13 ? "#0F766E" : "#99F6E4"}
                >
                  <title>{`${formatDate(d.date)}: ${money(d.total)}`}</title>
                </rect>
                {i % 2 === 1 && (
                  <text
                    x={i * 50 + 25}
                    y="172"
                    textAnchor="middle"
                    fontSize="11"
                    fill="#64748B"
                  >
                    {formatDate(d.date).replace(/, \d{4}$/, "")}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </section>
      <div className="grid gap-8 lg:grid-cols-2">
        <section className={cx(t.panel, "overflow-hidden")}>
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h2 className="font-semibold">Orders to fulfill</h2>
            <Link
              to="/orders"
              className={cx(
                "rounded text-sm font-medium text-teal-700 hover:underline",
                t.focus,
              )}
            >
              View all orders
            </Link>
          </div>
          {toFulfill.length === 0 ? (
            <EmptyState
              icon={<PackageCheck className="size-5" aria-hidden />}
              title="All caught up"
              body="Every paid order has shipped."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {toFulfill.slice(0, 5).map((o) => (
                <li
                  key={o.id}
                  className="flex items-center gap-3 px-5 py-3 text-sm"
                >
                  <Link
                    to={`/orders/${o.id}`}
                    className={cx(
                      "w-14 rounded font-semibold text-teal-700 hover:underline",
                      t.focus,
                    )}
                  >
                    #{o.number}
                  </Link>
                  <span className="min-w-0 flex-1 truncate">
                    {customerName(o.customerId)}
                  </span>
                  <PaymentBadge value={o.payment} />
                  <span className="w-20 text-right font-medium tabular-nums">
                    {money(orderTotal(o, products))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className={cx(t.panel, "overflow-hidden")}>
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h2 className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="size-4 text-amber-600" aria-hidden />{" "}
              Low stock
            </h2>
            <span className="text-sm text-slate-500">Under 10 units</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {lowStock.slice(0, 5).map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 px-5 py-2.5 text-sm"
              >
                <ProductArt
                  id={p.id}
                  category={p.category}
                  size={32}
                  className="rounded-md"
                />
                <Link
                  to={`/products/${p.id}`}
                  title={p.name}
                  className={cx(
                    "min-w-0 flex-1 truncate rounded font-medium hover:text-teal-700",
                    t.focus,
                  )}
                >
                  {p.name}
                </Link>
                {p.stock === 0 ? (
                  <Badge tone="danger">Out of stock</Badge>
                ) : (
                  <Badge tone="warning">{p.stock} left</Badge>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

type OrderSortKey = "number" | "date" | "customer" | "total";

export function OrdersPage({
  orders,
  products,
  customers,
}: {
  orders: Order[];
  products: Product[];
  customers: Customer[];
}) {
  useDocumentTitle("Orders – Shopline");
  const [query, setQuery] = useState("");
  const [fulfillment, setFulfillment] = useState("All fulfillment");
  const [payment, setPayment] = useState("All payments");
  const [sort, setSort] = useState<Sort<OrderSortKey>>(null);
  const [page, setPage] = useState(1);
  const name = (id: string) =>
    customers.find((c) => c.id === id)?.name ?? "Guest";
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace("#", "");
    const rows = orders.filter(
      (o) =>
        (!q ||
          String(o.number).includes(q) ||
          name(o.customerId).toLowerCase().includes(q)) &&
        (fulfillment === "All fulfillment" || o.fulfillment === fulfillment) &&
        (payment === "All payments" || o.payment === payment),
    );
    return sortBy(rows, sort, (o, key) =>
      key === "customer"
        ? name(o.customerId)
        : key === "total"
          ? orderTotal(o, products)
          : key === "date"
            ? o.date
            : o.number,
    );
  }, [orders, query, fulfillment, payment, sort, products, customers]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const change = (set: (value: string) => void) => (value: string) => {
    set(value);
    setPage(1);
  };
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orders"
        description={`${orders.filter(needsFulfillment).length} orders are waiting to be fulfilled.`}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          label="Search orders"
          value={query}
          onChange={change(setQuery)}
          placeholder="Search by order number or customer"
        />
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <label>
            <span className="sr-only">Fulfillment status</span>
            <select
              value={fulfillment}
              onChange={(e) => change(setFulfillment)(e.target.value)}
              className={cx(t.input, "w-auto")}
              data-testid="fulfillment-filter"
            >
              <option>All fulfillment</option>
              {fulfillments.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Payment status</span>
            <select
              value={payment}
              onChange={(e) => change(setPayment)(e.target.value)}
              className={cx(t.input, "w-auto")}
            >
              <option>All payments</option>
              {payments.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className={cx(t.panel, "overflow-hidden shadow-xs")}>
        {shown.length === 0 ? (
          <EmptyState
            icon={<Inbox className="size-5" aria-hidden />}
            title="No orders match"
            body="Try another order number, customer or status."
            action={
              <button
                type="button"
                className={t.secondary}
                onClick={() => {
                  setQuery("");
                  setFulfillment("All fulfillment");
                  setPayment("All payments");
                }}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="relative overflow-x-auto">
            <table
              className="w-full min-w-[820px] text-left text-sm"
              data-testid="orders"
            >
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs text-slate-500">
                <tr>
                  <SortHeader
                    label="Order"
                    sortKey="number"
                    sort={sort}
                    onSort={setSort}
                  />
                  <SortHeader
                    label="Date"
                    sortKey="date"
                    sort={sort}
                    onSort={setSort}
                  />
                  <SortHeader
                    label="Customer"
                    sortKey="customer"
                    sort={sort}
                    onSort={setSort}
                  />
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Channel
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Payment
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Fulfillment
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-right font-medium"
                  >
                    Items
                  </th>
                  <SortHeader
                    label="Total"
                    sortKey="total"
                    sort={sort}
                    onSort={setSort}
                    align="right"
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-slate-50"
                    data-testid={`order-${o.id}`}
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/orders/${o.id}`}
                        className={cx(
                          "rounded font-semibold text-teal-700 hover:underline",
                          t.focus,
                        )}
                      >
                        #{o.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {relativeTime(o.date)}
                    </td>
                    <td
                      className="max-w-52 truncate px-4 py-3"
                      title={name(o.customerId)}
                    >
                      {name(o.customerId)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {o.channel}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentBadge value={o.payment} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <FulfillmentBadge value={o.fulfillment} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {itemCount(o)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {money(orderTotal(o, products))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination
        page={current}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPage={setPage}
      />
    </div>
  );
}

function SummaryRow({
  label,
  children,
  strong,
}: {
  label: string;
  children: ReactNode;
  strong?: boolean;
}) {
  return (
    <div
      className={cx(
        "flex justify-between py-1.5",
        strong && "border-t border-slate-200 pt-3 font-bold",
      )}
    >
      <dt className={strong ? undefined : "text-slate-500"}>{label}</dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  );
}

export function OrderDetail({
  orders,
  products,
  customers,
  fulfill,
  toast,
}: {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  fulfill: (id: string) => void;
  toast: (m: string) => void;
}) {
  const { id } = useParams();
  const order = orders.find((o) => o.id === id);
  useDocumentTitle(`Order ${order ? `#${order.number}` : ""} – Shopline`);
  const [pending, run] = usePending();
  if (!order) return <Navigate to="/orders" replace />;
  const customer = customers.find((c) => c.id === order.customerId);
  const subtotal = orderSubtotal(order, products);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const history = orders.filter((o) => o.customerId === order.customerId).length;
  const timeline = [
    ...(order.fulfillment === "Returned"
      ? [{ text: "Items returned and refunded", at: order.date }]
      : []),
    ...(order.fulfillment === "Fulfilled"
      ? [
          {
            text: "Order fulfilled and shipped with USPS Ground",
            at: order.date,
          },
        ]
      : []),
    ...(order.fulfillment === "Partially fulfilled"
      ? [{ text: "First shipment sent", at: order.date }]
      : []),
    {
      text:
        order.payment === "Pending" ? "Payment pending" : "Payment captured",
      at: order.date,
    },
    { text: `Order placed on ${order.channel.toLowerCase()}`, at: order.date },
  ];
  return (
    <div className="flex flex-col gap-6">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-sm text-slate-500"
      >
        <Link
          to="/orders"
          className={cx("rounded hover:text-slate-900", t.focus)}
        >
          Orders
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <span aria-current="page" className="text-slate-900">
          #{order.number}
        </span>
      </nav>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Order #{order.number}
            </h1>
            <PaymentBadge value={order.payment} />
            <FulfillmentBadge value={order.fulfillment} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Placed {formatDate(order.date)} on {order.channel.toLowerCase()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={t.secondary}
            onClick={() => toast("Packing slip printed")}
          >
            <Printer className="size-4" aria-hidden /> Print packing slip
          </button>
          {needsFulfillment(order) && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(() => {
                  fulfill(order.id);
                  toast("Order marked as fulfilled");
                });
              }}
            >
              <SubmitButton
                pending={pending}
                pendingLabel="Fulfilling"
                testId="fulfill-order"
              >
                <PackageCheck className="size-4" aria-hidden /> Mark as
                fulfilled
              </SubmitButton>
            </form>
          )}
        </div>
      </header>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-8">
          <section className={cx(t.panel, "overflow-hidden")}>
            <h2 className="px-5 pt-4 pb-2 font-semibold">Items</h2>
            <ul className="divide-y divide-slate-100">
              {order.lines.map((line) => {
                const product = products.find((p) => p.id === line.productId);
                if (!product) return null;
                return (
                  <li
                    key={line.productId}
                    className="flex items-center gap-4 px-5 py-3 text-sm"
                  >
                    <ProductArt
                      id={product.id}
                      category={product.category}
                      size={44}
                      className="rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/products/${product.id}`}
                        title={product.name}
                        className={cx(
                          "block truncate rounded font-medium hover:text-teal-700",
                          t.focus,
                        )}
                      >
                        {product.name}
                      </Link>
                      <p className="font-mono text-xs text-slate-500">
                        {product.sku}
                      </p>
                    </div>
                    <span className="text-slate-500 tabular-nums">
                      {money(priceOf(products, line.productId))} × {line.qty}
                    </span>
                    <span className="w-20 text-right font-semibold tabular-nums">
                      {money(priceOf(products, line.productId) * line.qty)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <dl className="ml-auto max-w-xs px-5 py-4 text-sm">
              <SummaryRow label="Subtotal">{money(subtotal)}</SummaryRow>
              <SummaryRow label="Shipping">
                {order.shipping ? money(order.shipping) : "Free"}
              </SummaryRow>
              <SummaryRow label="Tax">{money(tax)}</SummaryRow>
              <SummaryRow label="Total" strong>
                {money(orderTotal(order, products))}
              </SummaryRow>
            </dl>
          </section>
          <section>
            <h2 className="font-semibold">Timeline</h2>
            <ol className="mt-3 flex flex-col gap-4 border-l border-slate-200 pl-4">
              {timeline.map((item) => (
                <li
                  key={item.text}
                  className="relative text-sm before:absolute before:top-1.5 before:-left-[21px] before:size-2 before:rounded-full before:bg-teal-600 before:ring-4 before:ring-slate-50"
                >
                  <p>{item.text}</p>
                  <p className="text-xs text-slate-500">
                    {relativeTime(item.at)}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <aside className="flex min-w-0 flex-col gap-6">
          <section className={cx(t.panel, "p-5")}>
            <h2 className="font-semibold">Customer</h2>
            {customer ? (
              <div className="mt-3 flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <Avatar name={customer.name} size={36} />
                  <div className="min-w-0">
                    <p className="truncate font-medium" title={customer.name}>
                      {customer.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {history} {history === 1 ? "order" : "orders"}
                    </p>
                  </div>
                </div>
                <a
                  href={`mailto:${customer.email}`}
                  className={cx(
                    "truncate rounded text-teal-700 hover:underline",
                    t.focus,
                  )}
                  title={customer.email}
                >
                  {customer.email}
                </a>
                <div>
                  <p className="text-xs text-slate-500">Shipping address</p>
                  <p className="mt-0.5">{customer.location}</p>
                </div>
                {customer.note && (
                  <div>
                    <p className="text-xs text-slate-500">Note</p>
                    <p className="mt-0.5">{customer.note}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Guest checkout</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

type CustomerSortKey = "name" | "location" | "orders" | "spent" | "last";

export function CustomersPage({
  customers,
  orders,
  products,
}: {
  customers: Customer[];
  orders: Order[];
  products: Product[];
}) {
  useDocumentTitle("Customers – Shopline");
  const [query, setQuery] = useState("");
  const [marketing, setMarketing] = useState("All customers");
  const [sort, setSort] = useState<Sort<CustomerSortKey>>(null);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = customers
      .map((c) => {
        const mine = orders.filter((o) => o.customerId === c.id);
        return {
          ...c,
          orders: mine.length,
          spent: mine
            .filter((o) => o.payment !== "Refunded")
            .reduce((s, o) => s + orderTotal(o, products), 0),
          last:
            mine
              .map((o) => o.date)
              .sort()
              .at(-1) ?? "",
        };
      })
      .filter(
        (c) =>
          (!q ||
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q)) &&
          (marketing === "All customers" ||
            c.subscribed === (marketing === "Subscribed")),
      );
    return sortBy(list, sort, (c, key) => c[key]);
  }, [customers, orders, products, query, marketing, sort]);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Customers"
        description="People who bought from you, with what they spent."
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          label="Search customers"
          value={query}
          onChange={setQuery}
          placeholder="Search by name or email"
        />
        <label className="sm:ml-auto">
          <span className="sr-only">Email marketing</span>
          <select
            value={marketing}
            onChange={(e) => setMarketing(e.target.value)}
            className={cx(t.input, "w-auto")}
          >
            <option>All customers</option>
            <option>Subscribed</option>
            <option>Not subscribed</option>
          </select>
        </label>
      </div>
      <div className={cx(t.panel, "overflow-hidden shadow-xs")}>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Users className="size-5" aria-hidden />}
            title="No customers match"
            body="Try another name or email."
            action={
              <button
                type="button"
                className={t.secondary}
                onClick={() => {
                  setQuery("");
                  setMarketing("All customers");
                }}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs text-slate-500">
                <tr>
                  <SortHeader
                    label="Customer"
                    sortKey="name"
                    sort={sort}
                    onSort={setSort}
                  />
                  <SortHeader
                    label="Location"
                    sortKey="location"
                    sort={sort}
                    onSort={setSort}
                  />
                  <SortHeader
                    label="Orders"
                    sortKey="orders"
                    sort={sort}
                    onSort={setSort}
                    align="right"
                  />
                  <SortHeader
                    label="Amount spent"
                    sortKey="spent"
                    sort={sort}
                    onSort={setSort}
                    align="right"
                  />
                  <SortHeader
                    label="Last order"
                    sortKey="last"
                    sort={sort}
                    onSort={setSort}
                  />
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Email marketing
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="max-w-72 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} size={32} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold" title={c.name}>
                            {c.name}
                          </p>
                          <p
                            className="truncate text-xs text-slate-500"
                            title={c.email}
                          >
                            {c.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {c.location}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {c.orders}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {money(Math.round(c.spent * 100) / 100)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {c.last ? (
                        relativeTime(c.last)
                      ) : (
                        <span className="text-slate-400">No orders</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={c.subscribed ? "success" : "neutral"}>
                        {c.subscribed ? "Subscribed" : "Not subscribed"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination
        page={1}
        pageSize={50}
        total={rows.length}
        onPage={() => undefined}
      />
    </div>
  );
}

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function SettingsPage({ toast }: { toast: (m: string) => void }) {
  useDocumentTitle("Settings – Shopline");
  const [store, setStore] = useState("Fernwood Supply Co.");
  const [email, setEmail] = useState("hello@fernwoodsupply.co");
  const [currency, setCurrency] = useState("USD");
  const [rate, setRate] = useState("8");
  const [threshold, setThreshold] = useState("150");
  const [processing, setProcessing] = useState("1 to 2 business days");
  const [storePending, runStore] = usePending();
  const [shipPending, runShip] = usePending();
  const storeError = store.trim() ? undefined : "Enter a store name.";
  const emailError = isEmail(email.trim())
    ? undefined
    : "Enter a valid email address.";
  const rateError =
    Number(rate) >= 0 && rate !== "" ? undefined : "Enter a rate of 0 or more.";
  const section =
    "grid gap-6 border-t border-slate-200 py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]";
  const staff = [
    { name: "Maya Okoro", role: "Owner" },
    { name: "Felix Andersson", role: "Fulfillment" },
    { name: "Rosa Delgado", role: "Customer support" },
  ];
  return (
    <div className="flex max-w-4xl flex-col">
      <PageHeader
        title="Settings"
        description="Store details, shipping rates and who can access the admin."
      />
      <div className="mt-6">
        <section className={section}>
          <div>
            <h2 className="font-semibold">Store details</h2>
            <p className="mt-1 text-sm text-slate-500">
              Shown on receipts and in order emails.
            </p>
          </div>
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (storeError || emailError) return;
              runStore(() => toast("Changes saved"));
            }}
          >
            <Field label="Store name" error={storeError}>
              <input
                value={store}
                onChange={(e) => setStore(e.target.value)}
                aria-invalid={!!storeError}
                className={t.input}
                data-testid="store-name"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact email" error={emailError}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!emailError}
                  className={t.input}
                />
              </Field>
              <Field label="Store currency">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={t.input}
                >
                  <option>USD</option>
                  <option>CAD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                </select>
              </Field>
            </div>
            <div>
              <SubmitButton
                pending={storePending}
                disabled={!!storeError || !!emailError}
                pendingLabel="Saving"
                testId="save-store"
              >
                Save changes
              </SubmitButton>
            </div>
          </form>
        </section>
        <section className={section}>
          <div>
            <h2 className="font-semibold">Shipping</h2>
            <p className="mt-1 text-sm text-slate-500">
              One flat domestic rate, with free shipping above a threshold.
            </p>
          </div>
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (rateError) return;
              runShip(() => toast("Changes saved"));
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Flat rate (USD)" error={rateError}>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  aria-invalid={!!rateError}
                  className={cx(t.input, "tabular-nums")}
                />
              </Field>
              <Field
                label="Free shipping over (USD)"
                hint="Leave empty to always charge shipping."
              >
                <input
                  type="number"
                  min={0}
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className={cx(t.input, "tabular-nums")}
                />
              </Field>
            </div>
            <Field label="Processing time">
              <select
                value={processing}
                onChange={(e) => setProcessing(e.target.value)}
                className={t.input}
              >
                <option>Same business day</option>
                <option>1 to 2 business days</option>
                <option>3 to 5 business days</option>
              </select>
            </Field>
            <div>
              <SubmitButton
                pending={shipPending}
                disabled={!!rateError}
                pendingLabel="Saving"
                testId="save-shipping"
              >
                Save changes
              </SubmitButton>
            </div>
          </form>
        </section>
        <section className={section}>
          <div>
            <h2 className="font-semibold">Staff</h2>
            <p className="mt-1 text-sm text-slate-500">
              People who can sign in to this admin.
            </p>
          </div>
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {staff.map((s) => (
              <li
                key={s.name}
                className="flex items-center gap-3 px-4 py-3 text-sm"
              >
                <Avatar name={s.name} size={32} />
                <span className="flex-1 font-medium">{s.name}</span>
                <span className="text-slate-500">{s.role}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
