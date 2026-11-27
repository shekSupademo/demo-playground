import {
  Check,
  ChevronsUpDown,
  CircleHelp,
  House,
  Inbox,
  LifeBuoy,
  Package,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  HashRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  daysFromToday,
  MobileNav,
  money,
  NotificationsMenu,
  Popover,
  UserMenu,
} from "../../kit";
import type { Variant } from "../../registry";
import { cx, Menu, useToasts } from "../../ui";
import {
  type Customer,
  notifications,
  type Order,
  type Product,
  seedCustomers,
  seedOrders,
  seedProducts,
} from "./data";
import {
  CustomersPage,
  HomePage,
  OrderDetail,
  OrdersPage,
  SettingsPage,
} from "./pages";
import { Logo, ProductArt, t } from "./parts";
import { type NewProduct, ProductDetail, ProductsPage } from "./products";

const stores = ["Fernwood Supply Co.", "Fernwood Wholesale"];

const navLink = (active: boolean) =>
  cx(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400",
    active
      ? "bg-white/10 text-white"
      : "text-slate-400 hover:bg-white/5 hover:text-white",
  );

function NavItems({
  products,
  orders,
  customers,
  toast,
}: {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  toast: (m: string) => void;
}) {
  const { pathname } = useLocation();
  const toFulfill = orders.filter(
    (o) =>
      (o.fulfillment === "Unfulfilled" ||
        o.fulfillment === "Partially fulfilled") &&
      o.payment !== "Refunded",
  ).length;
  const items = [
    {
      to: "/home",
      label: "Home",
      Icon: House,
      count: undefined,
      active: pathname === "/home",
    },
    {
      to: "/orders",
      label: "Orders",
      Icon: Inbox,
      count: toFulfill,
      active: pathname.startsWith("/orders"),
    },
    {
      to: "/",
      label: "Products",
      Icon: Package,
      count: products.length,
      active: pathname === "/" || pathname.startsWith("/products"),
    },
    {
      to: "/customers",
      label: "Customers",
      Icon: Users,
      count: customers.length,
      active: pathname === "/customers",
    },
  ];
  return (
    <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
      {items.map(({ to, label, Icon, count, active }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={() => navLink(active)}
          aria-current={active ? "page" : undefined}
        >
          <Icon className="size-4" aria-hidden />
          <span className="flex-1">{label}</span>
          {count !== undefined && (
            <span
              className={cx(
                "rounded-full px-2 py-0.5 text-xs tabular-nums",
                label === "Orders"
                  ? "bg-teal-500/20 text-teal-200"
                  : "text-slate-500",
              )}
            >
              {count}
            </span>
          )}
        </NavLink>
      ))}
      <div className="mt-auto flex flex-col gap-1 border-t border-white/10 pt-3">
        <NavLink to="/settings" className={({ isActive }) => navLink(isActive)}>
          <Settings className="size-4" aria-hidden /> Settings
        </NavLink>
        <button
          type="button"
          className={navLink(false)}
          onClick={() => toast("Help center opened")}
        >
          <LifeBuoy className="size-4" aria-hidden /> Help center
        </button>
      </div>
    </nav>
  );
}

function StoreSwitcher({ toast }: { toast: (m: string) => void }) {
  const [current, setCurrent] = useState(stores[0]);
  return (
    <Popover
      label={`Store: ${current}`}
      testId="store-switcher"
      triggerClassName="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-teal-400"
      panelClassName="w-60 p-1"
      trigger={
        <>
          <Logo />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-white">Shopline</span>
            <span className="block truncate text-xs text-slate-400">
              {current}
            </span>
          </span>
          <ChevronsUpDown className="size-4 text-slate-500" aria-hidden />
        </>
      }
    >
      {(close) => (
        <>
          <p className="px-3 pt-2 pb-1 text-xs text-slate-500">Stores</p>
          {stores.map((s) => (
            <button
              key={s}
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-slate-100"
              onClick={() => {
                close();
                if (s !== current) {
                  setCurrent(s);
                  toast(`Switched to ${s}`);
                }
              }}
            >
              <span className="flex-1 truncate">{s}</span>
              {s === current && (
                <Check className="size-4 text-teal-700" aria-hidden />
              )}
            </button>
          ))}
        </>
      )}
    </Popover>
  );
}

function GlobalSearch({
  products,
  orders,
  customers,
  setQuery,
}: {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  setQuery: (q: string) => void;
}) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const q = term.trim().toLowerCase();
  const productHits = q
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
        )
        .slice(0, 4)
    : [];
  const orderHits = q
    ? orders
        .filter((o) => String(o.number).includes(q.replace("#", "")))
        .slice(0, 3)
    : [];
  const customerHits = q
    ? customers.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 3)
    : [];
  const finish = () => {
    setTerm("");
    setOpen(false);
  };
  const go = (to: string) => {
    navigate(to);
    finish();
  };
  const hit =
    "flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-slate-100";
  return (
    <form
      role="search"
      className="relative w-full max-w-md"
      onSubmit={(e) => {
        e.preventDefault();
        setQuery(term.trim());
        go("/");
      }}
    >
      <label>
        <span className="sr-only">Search Shopline</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="Search products, orders and customers"
          className={cx(t.input, "bg-slate-100 pl-9 focus:bg-white")}
          data-testid="global-search"
        />
      </label>
      {open && q && (
        <div
          className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl"
          onMouseDown={(e) => e.preventDefault()}
        >
          {productHits.length + orderHits.length + customerHits.length === 0 ? (
            <p className="px-4 py-3 text-slate-500">
              No matches for “{term.trim()}”
            </p>
          ) : (
            <>
              {productHits.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={hit}
                  onClick={() => go(`/products/${p.id}`)}
                >
                  <ProductArt
                    id={p.id}
                    category={p.category}
                    size={24}
                    className="rounded"
                  />
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {money(p.price)}
                  </span>
                </button>
              ))}
              {orderHits.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={hit}
                  onClick={() => go(`/orders/${o.id}`)}
                >
                  <Inbox className="size-4 text-slate-400" aria-hidden />
                  <span className="flex-1">Order #{o.number}</span>
                  <span className="text-xs text-slate-500">
                    {o.fulfillment}
                  </span>
                </button>
              ))}
              {customerHits.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={hit}
                  onClick={() => go("/customers")}
                >
                  <Users className="size-4 text-slate-400" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  <span className="text-xs text-slate-500">Customer</span>
                </button>
              ))}
            </>
          )}
          <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
            Press Enter to filter products
          </p>
        </div>
      )}
    </form>
  );
}

function Shell({ v }: { v: boolean }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState(seedProducts);
  const [orders, setOrders] = useState(seedOrders);
  const [query, setQuery] = useState("");
  const [toasts, toast] = useToasts("bg-slate-900 text-white");
  const customers = seedCustomers;

  const update = (id: string, change: (p: Product) => Partial<Product>) =>
    setProducts((current) =>
      current.map((p) => (p.id === id ? { ...p, ...change(p) } : p)),
    );
  const event = (text: string) => ({
    id: `h-${Date.now()}`,
    text,
    at: new Date().toISOString(),
  });
  const changePrice = (message: string) => (id: string, price: number) => {
    update(id, (p) => ({
      price,
      history: [
        event(`Price changed from ${money(p.price)} to ${money(price)}`),
        ...p.history,
      ],
    }));
    toast(message);
  };
  const setPublished = (id: string, published: boolean) => {
    update(id, (p) => ({
      published,
      history: [
        event(published ? "Published to the online store" : "Moved to draft"),
        ...p.history,
      ],
    }));
    toast(published ? "Product published" : "Product moved to draft");
  };
  const add = (p: NewProduct) => {
    setProducts((current) => [
      {
        ...p,
        id: `p-${Date.now()}`,
        compareAt: p.price,
        cost: Math.round(p.price * 0.42 * 100) / 100,
        sku: `NEW-${current.length + 1}`,
        incoming: 0,
        published: false,
        sold30: 0,
        history: [
          {
            id: `h-${Date.now()}`,
            text: "Product created",
            at: daysFromToday(0),
          },
        ],
      },
      ...current,
    ]);
    toast("Product added");
  };
  const fulfill = (id: string) =>
    setOrders((current) =>
      current.map((o) =>
        o.id === id ? { ...o, fulfillment: "Fulfilled" } : o,
      ),
    );

  const nav = (
    <NavItems
      products={products}
      orders={orders}
      customers={customers}
      toast={toast}
    />
  );

  return (
    <div
      className={cx("flex min-h-screen", t.page)}
      style={{
        fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 bg-slate-900 px-3 py-4 text-slate-300 md:flex">
        <div data-testid="logo">
          <StoreSwitcher toast={toast} />
        </div>
        {nav}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-8">
          <MobileNav
            label="Shopline navigation"
            className="bg-slate-900 text-slate-200"
          >
            <div className="mb-6 flex items-center gap-2.5 px-2">
              <Logo />
              <span className="font-bold text-white">Shopline</span>
            </div>
            <div className="flex min-h-[70vh] flex-col">{nav}</div>
          </MobileNav>
          <GlobalSearch
            products={products}
            orders={orders}
            customers={customers}
            setQuery={setQuery}
          />
          <div className="ml-auto flex items-center gap-1">
            <Menu
              label="Help"
              trigger={<CircleHelp className="size-5" aria-hidden />}
              triggerClassName={t.ghost}
              testId="help-menu"
              items={[
                {
                  label: "Keyboard shortcuts",
                  onSelect: () => toast("Keyboard shortcuts opened"),
                },
                {
                  label: "Contact support",
                  onSelect: () => toast("Support chat opened"),
                },
                {
                  label: "What's new",
                  onSelect: () => toast("Release notes opened"),
                },
              ]}
            />
            <NotificationsMenu
              items={notifications}
              triggerClassName="text-slate-600"
            />
            <div className="ml-1">
              <UserMenu
                name="Maya Okoro"
                email="maya@fernwoodsupply.co"
                items={["Profile", "Settings"]}
                onSelect={(item) =>
                  item === "Settings"
                    ? navigate("/settings")
                    : toast(
                        item === "Sign out" ? "Signed out" : "Profile opened",
                      )
                }
              />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          <Routes>
            <Route
              index
              element={
                <ProductsPage
                  v={v}
                  products={products}
                  add={add}
                  setPrice={changePrice("Price updated")}
                  query={query}
                  setQuery={setQuery}
                />
              }
            />
            <Route
              path="products/:id"
              element={
                <ProductDetail
                  v={v}
                  products={products}
                  orders={orders}
                  setPrice={changePrice("Price saved")}
                  setPublished={setPublished}
                />
              }
            />
            <Route
              path="home"
              element={
                <HomePage
                  products={products}
                  orders={orders}
                  customers={customers}
                />
              }
            />
            <Route
              path="orders"
              element={
                <OrdersPage
                  orders={orders}
                  products={products}
                  customers={customers}
                />
              }
            />
            <Route
              path="orders/:id"
              element={
                <OrderDetail
                  orders={orders}
                  products={products}
                  customers={customers}
                  fulfill={fulfill}
                  toast={toast}
                />
              }
            />
            <Route
              path="customers"
              element={
                <CustomersPage
                  customers={customers}
                  orders={orders}
                  products={products}
                />
              }
            />
            <Route path="settings" element={<SettingsPage toast={toast} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      {toasts}
    </div>
  );
}

export default function App({ variant }: { variant: Variant }) {
  return (
    <HashRouter>
      <Shell v={variant === "variant"} />
    </HashRouter>
  );
}
