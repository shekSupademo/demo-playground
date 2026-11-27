import { Package, Pencil, Plus, ShoppingBag } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import {
  HashRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import type { Variant } from "../../registry";
import { cx, Dialog, useToasts } from "../../ui";

const categories = ["Apparel", "Home", "Beauty", "Accessories"] as const;
type Category = (typeof categories)[number];

type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  compareAt: number;
  sku: string;
  stock: number;
  description: string;
  published: boolean;
};

const seed: Product[] = [
  {
    id: "linen-shirt",
    name: "Linen camp shirt",
    category: "Apparel",
    price: 68,
    compareAt: 85,
    sku: "AP-LCS-01",
    stock: 42,
    description: "Breathable washed linen with a relaxed camp collar.",
    published: true,
  },
  {
    id: "merino-beanie",
    name: "Merino rib beanie",
    category: "Accessories",
    price: 34,
    compareAt: 40,
    sku: "AC-MRB-02",
    stock: 118,
    description: "Soft extra-fine merino in a classic rib knit.",
    published: true,
  },
  {
    id: "stoneware-mug",
    name: "Stoneware mug",
    category: "Home",
    price: 24,
    compareAt: 28,
    sku: "HM-STM-03",
    stock: 7,
    description: "Hand-glazed 12 oz mug, dishwasher safe.",
    published: false,
  },
  {
    id: "cedar-candle",
    name: "Cedar & smoke candle",
    category: "Home",
    price: 38,
    compareAt: 38,
    sku: "HM-CSC-04",
    stock: 56,
    description: "Coconut wax candle with a 50-hour burn time.",
    published: true,
  },
  {
    id: "rose-serum",
    name: "Rosehip face serum",
    category: "Beauty",
    price: 46,
    compareAt: 52,
    sku: "BT-RFS-05",
    stock: 0,
    description: "Cold-pressed rosehip oil with vitamin E.",
    published: false,
  },
  {
    id: "canvas-tote",
    name: "Waxed canvas tote",
    category: "Accessories",
    price: 72,
    compareAt: 90,
    sku: "AC-WCT-06",
    stock: 23,
    description: "Water-resistant waxed canvas with leather handles.",
    published: true,
  },
  {
    id: "chore-jacket",
    name: "Organic chore jacket",
    category: "Apparel",
    price: 148,
    compareAt: 175,
    sku: "AP-OCJ-07",
    stock: 15,
    description: "Heavyweight organic cotton twill, four patch pockets.",
    published: false,
  },
  {
    id: "clay-mask",
    name: "Kaolin clay mask",
    category: "Beauty",
    price: 29,
    compareAt: 32,
    sku: "BT-KCM-08",
    stock: 64,
    description: "Gentle detox mask for all skin types.",
    published: true,
  },
  {
    id: "throw-blanket",
    name: "Wool throw blanket",
    category: "Home",
    price: 120,
    compareAt: 140,
    sku: "HM-WTB-09",
    stock: 11,
    description: "Woven lambswool throw, 130 × 170 cm.",
    published: true,
  },
];

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const primary =
  "inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600";
const secondary =
  "inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100";
const input =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-teal-600";
const card = "rounded-lg border border-slate-200 bg-white";

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={cx(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        published ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-600",
      )}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

function InlinePrice({
  product,
  onSave,
}: {
  product: Product;
  onSave: (price: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(product.price));
  if (!editing)
    return (
      <button
        type="button"
        onClick={() => {
          setValue(String(product.price));
          setEditing(true);
        }}
        className="group inline-flex items-center gap-1 rounded px-1 hover:bg-teal-50"
        aria-label={`Edit price of ${product.name}`}
        data-testid={`price-${product.id}`}
      >
        {money(product.price)}
        <Pencil
          className="size-3 text-slate-400 group-hover:text-teal-700"
          aria-hidden
        />
      </button>
    );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(Number(value));
        setEditing(false);
      }}
    >
      <input
        type="number"
        min={0}
        step="0.01"
        autoFocus
        onFocus={(e) => e.target.select()}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
        onBlur={() => setEditing(false)}
        aria-label={`Price of ${product.name}`}
        className={cx(input, "w-24 py-1")}
        data-testid="price-input"
      />
    </form>
  );
}

function CategoryFilter({
  v,
  value,
  onChange,
}: {
  v: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  const options = ["All", ...categories];
  if (!v)
    return (
      <label className="flex items-center gap-2 text-sm font-medium">
        Category
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={input}
          data-testid="category-filter"
        >
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </label>
    );
  return (
    <fieldset
      className="inline-flex rounded-lg bg-slate-200/70 p-1"
      data-testid="category-filter"
    >
      <legend className="sr-only">Category</legend>
      {options.map((o) => (
        <label
          key={o}
          className="cursor-pointer rounded-md px-3 py-1.5 text-sm text-slate-600 has-checked:bg-white has-checked:font-medium has-checked:text-teal-800 has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-teal-600"
        >
          <input
            type="radio"
            name="category"
            value={o}
            checked={value === o}
            onChange={() => onChange(o)}
            className="sr-only"
            data-testid={`category-${o.toLowerCase()}`}
          />
          {o}
        </label>
      ))}
    </fieldset>
  );
}

function ProductsPage({
  v,
  products,
  add,
  setPrice,
}: {
  v: boolean;
  products: Product[];
  add: (p: Pick<Product, "name" | "category" | "price">) => void;
  setPrice: (id: string, price: number) => void;
}) {
  const [category, setCategory] = useState("All");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("Apparel");
  const [price, setPriceValue] = useState("25");
  const shown = products.filter(
    (p) => category === "All" || p.category === category,
  );

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    add({ name: name.trim(), category: newCategory, price: Number(price) });
    setName("");
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-slate-500">
            {products.filter((p) => p.published).length} of {products.length}{" "}
            live in your store
          </p>
        </div>
        <button
          type="button"
          className={primary}
          onClick={() => setOpen(true)}
          data-testid="add-product"
        >
          <Plus className="size-4" aria-hidden /> Add product
        </button>
      </header>
      <CategoryFilter v={v} value={category} onChange={setCategory} />
      {v ? (
        <ul
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          data-testid="products"
        >
          {shown.map((p) => (
            <li
              key={p.id}
              className={cx(card, "flex flex-col gap-3 p-4")}
              data-testid={`product-${p.id}`}
            >
              <div className="grid aspect-[4/3] place-items-center rounded-md bg-teal-50">
                <Package className="size-10 text-teal-700/60" aria-hidden />
              </div>
              <div className="flex items-start justify-between gap-2">
                <Link
                  to={`/products/${p.id}`}
                  className="font-medium hover:text-teal-700"
                  data-testid={`open-${p.id}`}
                >
                  {p.name}
                </Link>
                <StatusBadge published={p.published} />
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>{p.category}</span>
                <span className="font-semibold text-slate-900">
                  {money(p.price)}
                </span>
              </div>
              <p className="text-xs text-slate-500">{p.stock} in stock</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className={cx(card, "overflow-hidden")}>
          <table className="w-full text-left text-sm" data-testid="products">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((p) => (
                <tr key={p.id} data-testid={`product-${p.id}`}>
                  <td className="px-4 py-3">
                    <Link
                      to={`/products/${p.id}`}
                      className="font-medium hover:text-teal-700"
                      data-testid={`open-${p.id}`}
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.category}</td>
                  <td className="px-4 py-3">
                    <InlinePrice
                      product={p}
                      onSave={(value) => setPrice(p.id, value)}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.stock}</td>
                  <td className="px-4 py-3">
                    <StatusBadge published={p.published} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add product"
        testId="add-product-dialog"
        placement={v ? "side" : "center"}
        className={
          v
            ? "w-full max-w-md bg-white p-6 text-slate-900 shadow-xl animate-drawer-in"
            : "w-full max-w-md rounded-lg bg-white p-6 text-slate-900"
        }
      >
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Product name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={input}
              data-testid="product-name"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Category
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as Category)}
              className={input}
              data-testid="product-category"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Price (USD)
            <input
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPriceValue(e.target.value)}
              className={input}
              data-testid="product-price"
            />
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              className={secondary}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={primary}
              data-testid="save-product"
            >
              Save product
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

function PricingForm({
  product,
  onSave,
}: {
  product: Product;
  onSave: (id: string, price: number) => void;
}) {
  const [price, setPrice] = useState(String(product.price));
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(product.id, Number(price));
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-medium">
        Price (USD)
        <input
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className={cx(input, "max-w-40")}
          data-testid="price-input"
        />
      </label>
      <p className="text-sm text-slate-500">
        Compare-at price {money(product.compareAt)}
      </p>
      <button
        type="submit"
        className={cx(primary, "self-start")}
        data-testid="save-price"
      >
        Save price
      </button>
    </form>
  );
}

function ProductDetail({
  v,
  products,
  setPrice,
  setPublished,
}: {
  v: boolean;
  products: Product[];
  setPrice: (id: string, price: number) => void;
  setPublished: (id: string, published: boolean) => void;
}) {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);
  const [tab, setTab] = useState("details");
  if (!product) return <Navigate to="/" replace />;

  const sections: { key: string; label: string; body: ReactNode }[] = [
    {
      key: "details",
      label: "Details",
      body: (
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-slate-500">Category</dt>
            <dd>{product.category}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Description</dt>
            <dd>{product.description}</dd>
          </div>
        </dl>
      ),
    },
    {
      key: "pricing",
      label: "Pricing",
      body: v ? (
        <PricingForm key={product.id} product={product} onSave={setPrice} />
      ) : (
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-slate-500">Price</dt>
            <dd className="font-semibold" data-testid="current-price">
              {money(product.price)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Compare-at price</dt>
            <dd>{money(product.compareAt)}</dd>
          </div>
          <p className="text-xs text-slate-500">
            Change prices from the Products table.
          </p>
        </dl>
      ),
    },
    {
      key: "inventory",
      label: "Inventory",
      body: (
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-slate-500">SKU</dt>
            <dd className="font-mono">{product.sku}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Available</dt>
            <dd className={cx(product.stock < 10 && "text-amber-700")}>
              {product.stock} units
            </dd>
          </div>
        </dl>
      ),
    },
  ];

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <Link to="/" className="text-sm text-slate-500 hover:underline">
        ← Products
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="text-sm text-slate-500">{money(product.price)}</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            role={v ? "switch" : undefined}
            checked={product.published}
            onChange={(e) => setPublished(product.id, e.target.checked)}
            className={
              v
                ? "relative h-5 w-9 cursor-pointer appearance-none rounded-full bg-slate-300 transition-colors before:absolute before:top-0.5 before:left-0.5 before:size-4 before:rounded-full before:bg-white before:shadow before:transition-transform checked:bg-teal-700 checked:before:translate-x-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                : "size-4 accent-teal-700"
            }
            data-testid="published"
          />
          Published
        </label>
      </header>
      {v ? (
        <div className="flex flex-col gap-3">
          {sections.map((section) => (
            <details
              key={section.key}
              open={section.key === "details"}
              className={cx(card, "group")}
              data-testid={`section-${section.key}`}
            >
              <summary className="cursor-pointer px-5 py-4 font-medium marker:text-teal-700">
                {section.label}
              </summary>
              <div className="border-t border-slate-100 px-5 py-4">
                {section.body}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className={card}>
          <div
            role="tablist"
            className="flex gap-1 border-b border-slate-200 px-3"
          >
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                role="tab"
                id={`tab-${section.key}`}
                aria-selected={tab === section.key}
                aria-controls="product-panel"
                onClick={() => setTab(section.key)}
                className={cx(
                  "-mb-px border-b-2 px-3 py-3 text-sm",
                  tab === section.key
                    ? "border-teal-700 font-medium text-teal-800"
                    : "border-transparent text-slate-500 hover:text-slate-900",
                )}
                data-testid={`section-${section.key}`}
              >
                {section.label}
              </button>
            ))}
          </div>
          <div
            id="product-panel"
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            className="p-5"
          >
            {sections.find((section) => section.key === tab)?.body}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App({ variant }: { variant: Variant }) {
  const v = variant === "variant";
  const [products, setProducts] = useState(seed);
  const [toasts, toast] = useToasts("bg-teal-900 text-white");

  const update = (id: string, change: Partial<Product>) =>
    setProducts((current) =>
      current.map((p) => (p.id === id ? { ...p, ...change } : p)),
    );
  const setPrice = (id: string, price: number) => {
    update(id, { price });
    toast("Price updated");
  };
  const setPublished = (id: string, published: boolean) => {
    update(id, { published });
    toast(published ? "Product published" : "Product moved to draft");
  };
  const add = (p: Pick<Product, "name" | "category" | "price">) => {
    setProducts((current) => [
      {
        ...p,
        id: `p-${Date.now()}`,
        compareAt: p.price,
        sku: `NEW-${current.length + 1}`,
        stock: 0,
        description: "",
        published: false,
      },
      ...current,
    ]);
    toast("Product added");
  };

  return (
    <HashRouter>
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <aside className="w-56 shrink-0 bg-slate-900 p-4 text-slate-300">
          <div
            className="mb-6 flex items-center gap-2 font-semibold text-white"
            data-testid="logo"
          >
            <span className="grid size-8 place-items-center rounded-md bg-teal-500 text-slate-900">
              <ShoppingBag className="size-4" aria-hidden />
            </span>
            Shopline
          </div>
          <nav aria-label="Main" className="flex flex-col gap-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                cx(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  isActive ? "bg-white/10 text-white" : "hover:text-white",
                )
              }
            >
              <Package className="size-4" aria-hidden /> Products
            </NavLink>
          </nav>
        </aside>
        <main className="flex-1 p-6">
          <Routes>
            <Route
              index
              element={
                <ProductsPage
                  v={v}
                  products={products}
                  add={add}
                  setPrice={setPrice}
                />
              }
            />
            <Route
              path="products/:id"
              element={
                <ProductDetail
                  v={v}
                  products={products}
                  setPrice={setPrice}
                  setPublished={setPublished}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      {toasts}
    </HashRouter>
  );
}
