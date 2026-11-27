import { ChevronRight, Package, Pencil, Plus, Search } from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  daysFromToday,
  EmptyState,
  formatDate,
  money,
  relativeTime,
  useDocumentTitle,
} from "../../kit";
import { cx, Dialog } from "../../ui";
import { type Category, categories, type Order, type Product } from "./data";
import {
  Field,
  FulfillmentBadge,
  PageHeader,
  Pagination,
  ProductArt,
  type Sort,
  SortHeader,
  StatusBadge,
  SubmitButton,
  sortBy,
  t,
  usePending,
} from "./parts";

const PAGE_SIZE = 20;
type ProductSortKey = "name" | "category" | "price" | "stock";
const sortOptions: { value: string; label: string }[] = [
  { value: "none", label: "Recently added" },
  { value: "name-asc", label: "Name, A to Z" },
  { value: "name-desc", label: "Name, Z to A" },
  { value: "category-asc", label: "Category, A to Z" },
  { value: "category-desc", label: "Category, Z to A" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "stock-asc", label: "Inventory, low to high" },
  { value: "stock-desc", label: "Inventory, high to low" },
];

function Stock({ stock }: { stock: number }) {
  if (stock === 0)
    return <span className="font-medium text-rose-700">Out of stock</span>;
  return (
    <span
      className={cx(
        "tabular-nums",
        stock < 10 ? "font-medium text-amber-700" : "text-slate-600",
      )}
    >
      {stock} in stock
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
        className={cx(
          "group inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium tabular-nums hover:bg-teal-50",
          t.focus,
        )}
        aria-label={`Edit price of ${product.name}`}
        title="Edit price"
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
      className="flex justify-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (!(Number(value) > 0)) return;
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
        aria-invalid={!(Number(value) > 0)}
        className={cx(t.input, "w-24 py-1 text-right tabular-nums")}
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
      <label className="flex items-center gap-2 self-start text-sm font-medium text-slate-700">
        Category
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cx(t.input, "w-auto")}
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
      className="relative inline-flex max-w-full min-w-0 overflow-x-auto rounded-lg bg-slate-200/70 p-1"
      data-testid="category-filter"
    >
      <legend className="sr-only">Category</legend>
      {options.map((o) => (
        <label
          key={o}
          className="cursor-pointer rounded-md px-3 py-1.5 text-sm whitespace-nowrap text-slate-600 hover:text-slate-900 has-checked:bg-white has-checked:font-semibold has-checked:text-teal-800 has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-teal-600"
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

export type NewProduct = Pick<
  Product,
  "name" | "category" | "price" | "stock" | "description"
>;

function AddProductDialog({
  v,
  open,
  onClose,
  onAdd,
}: {
  v: boolean;
  open: boolean;
  onClose: () => void;
  onAdd: (p: NewProduct) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Apparel");
  const [price, setPrice] = useState("25");
  const [stock, setStock] = useState("0");
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState(false);
  const [pending, run] = usePending();
  const nameError =
    touched && !name.trim() ? "Enter a product name." : undefined;
  const priceError =
    touched && !(Number(price) > 0) ? "Enter a price above zero." : undefined;

  function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!name.trim() || !(Number(price) > 0)) return;
    run(() => {
      onAdd({
        name: name.trim(),
        category,
        price: Number(price),
        stock: Math.max(0, Number(stock) || 0),
        description: description.trim(),
      });
      setName("");
      setDescription("");
      setTouched(false);
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add product"
      testId="add-product-dialog"
      placement={v ? "side" : "center"}
      className={v ? t.drawer : t.dialog}
    >
      <p className="mt-1 text-sm text-slate-500">
        New products start as drafts until you publish them.
      </p>
      <form noValidate onSubmit={submit} className="mt-5 flex flex-col gap-4">
        <Field label="Product name" error={nameError}>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!nameError}
            className={t.input}
            data-testid="product-name"
          />
        </Field>
        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className={t.input}
            data-testid="product-category"
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (USD)" error={priceError}>
            <input
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              aria-invalid={!!priceError}
              className={cx(t.input, "tabular-nums")}
              data-testid="product-price"
            />
          </Field>
          <Field label="Starting inventory">
            <input
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className={cx(t.input, "tabular-nums")}
              data-testid="product-stock"
            />
          </Field>
        </div>
        <Field
          label="Description"
          hint="Shown on the product page in your store."
        >
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={t.input}
          />
        </Field>
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className={t.secondary} onClick={onClose}>
            Cancel
          </button>
          <SubmitButton
            pending={pending}
            pendingLabel="Adding"
            testId="save-product"
          >
            Add product
          </SubmitButton>
        </div>
      </form>
    </Dialog>
  );
}

export function ProductsPage({
  v,
  products,
  add,
  setPrice,
  query,
  setQuery,
}: {
  v: boolean;
  products: Product[];
  add: (p: NewProduct) => void;
  setPrice: (id: string, price: number) => void;
  query: string;
  setQuery: (q: string) => void;
}) {
  useDocumentTitle("Products – Shopline");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All statuses");
  const [sort, setSort] = useState<Sort<ProductSortKey>>(null);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = products.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (status === "All statuses" ||
          p.published === (status === "Published")) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)),
    );
    return sortBy(rows, sort, (p, key) => p[key]);
  }, [products, category, status, query, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const sortValue = sort ? `${sort.key}-${sort.dir}` : "none";
  const reset = () => {
    setCategory("All");
    setStatus("All statuses");
    setQuery("");
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Products"
        description={`${products.filter((p) => p.published).length} of ${products.length} products are live in your store.`}
        actions={
          <button
            type="button"
            className={t.primary}
            onClick={() => setOpen(true)}
            data-testid="add-product"
          >
            <Plus className="size-4" aria-hidden /> Add product
          </button>
        }
      />
      <div className="flex flex-col gap-3">
        <CategoryFilter
          v={v}
          value={category}
          onChange={(value) => {
            setCategory(value);
            setPage(1);
          }}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1 sm:max-w-xs">
            <span className="sr-only">Search products</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or SKU"
              className={cx(t.input, "pl-9")}
              data-testid="product-search"
            />
          </label>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <label>
              <span className="sr-only">Status</span>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className={cx(t.input, "w-auto")}
                data-testid="status-filter"
              >
                <option>All statuses</option>
                <option>Published</option>
                <option>Draft</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Sort by</span>
              <select
                value={sortValue}
                onChange={(e) => {
                  const [key, dir] = e.target.value.split("-") as [
                    ProductSortKey,
                    "asc" | "desc",
                  ];
                  setSort(e.target.value === "none" ? null : { key, dir });
                }}
                className={cx(t.input, "w-auto")}
                data-testid="product-sort"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
      {shown.length === 0 ? (
        <div className={t.panel}>
          <EmptyState
            icon={<Package className="size-5" aria-hidden />}
            title="No products match"
            body="Try another category or search, or add a new product to your catalog."
            action={
              <button type="button" className={t.secondary} onClick={reset}>
                Clear filters
              </button>
            }
          />
        </div>
      ) : v ? (
        <ul
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          data-testid="products"
        >
          {shown.map((p) => (
            <li
              key={p.id}
              className="group flex flex-col gap-3"
              data-testid={`product-${p.id}`}
            >
              <Link
                to={`/products/${p.id}`}
                tabIndex={-1}
                aria-hidden
                className="block overflow-hidden rounded-2xl ring-1 ring-slate-200"
              >
                <ProductArt
                  id={p.id}
                  category={p.category}
                  className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
                />
              </Link>
              <div className="flex items-start justify-between gap-3 px-0.5">
                <div className="min-w-0">
                  <Link
                    to={`/products/${p.id}`}
                    title={p.name}
                    className={cx(
                      "block truncate rounded font-semibold hover:text-teal-700",
                      t.focus,
                    )}
                    data-testid={`open-${p.id}`}
                  >
                    {p.name}
                  </Link>
                  <p className="text-sm text-slate-500">{p.category}</p>
                </div>
                <StatusBadge published={p.published} />
              </div>
              <div className="flex items-center justify-between px-0.5 text-sm">
                <span className="font-bold tabular-nums">{money(p.price)}</span>
                <Stock stock={p.stock} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className={cx(t.panel, "overflow-hidden shadow-xs")}>
          <div className="relative overflow-x-auto">
            <table
              className="w-full min-w-[720px] text-left text-sm"
              data-testid="products"
            >
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs text-slate-500">
                <tr>
                  <SortHeader
                    label="Product"
                    sortKey="name"
                    sort={sort}
                    onSort={setSort}
                  />
                  <SortHeader
                    label="Category"
                    sortKey="category"
                    sort={sort}
                    onSort={setSort}
                  />
                  <SortHeader
                    label="Price"
                    sortKey="price"
                    sort={sort}
                    onSort={setSort}
                    align="right"
                  />
                  <SortHeader
                    label="Inventory"
                    sortKey="stock"
                    sort={sort}
                    onSort={setSort}
                  />
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50"
                    data-testid={`product-${p.id}`}
                  >
                    <td className="max-w-80 px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <ProductArt
                          id={p.id}
                          category={p.category}
                          size={40}
                          className="rounded-lg"
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/products/${p.id}`}
                            title={p.name}
                            className={cx(
                              "block truncate rounded font-semibold hover:text-teal-700",
                              t.focus,
                            )}
                            data-testid={`open-${p.id}`}
                          >
                            {p.name}
                          </Link>
                          <p className="font-mono text-xs text-slate-500">
                            {p.sku}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{p.category}</td>
                    <td className="px-4 py-2.5 text-right">
                      <InlinePrice
                        product={p}
                        onSave={(value) => setPrice(p.id, value)}
                      />
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <Stock stock={p.stock} />
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge published={p.published} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Pagination
        page={current}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPage={setPage}
      />
      <AddProductDialog
        v={v}
        open={open}
        onClose={() => setOpen(false)}
        onAdd={(p) => {
          add(p);
          setOpen(false);
        }}
      />
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
  const [pending, run] = usePending();
  const value = Number(price);
  const error = value > 0 ? undefined : "Enter a price above zero.";
  const margin =
    value > 0 ? Math.round(((value - product.cost) / value) * 100) : 0;
  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (error) return;
        run(() => onSave(product.id, value));
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price (USD)" error={error}>
          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            aria-invalid={!!error}
            className={cx(t.input, "tabular-nums")}
            data-testid="price-input"
          />
        </Field>
        <Field
          label="Compare-at price (USD)"
          hint="Shown struck through when higher than the price."
        >
          <input
            type="number"
            value={product.compareAt}
            readOnly
            className={cx(t.input, "bg-slate-50 tabular-nums text-slate-500")}
          />
        </Field>
      </div>
      <dl className="grid grid-cols-3 gap-4 rounded-xl bg-slate-50 p-4 text-sm">
        <div>
          <dt className="text-slate-500">Cost per item</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">
            {money(product.cost)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Profit</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">
            {value > 0
              ? money(Math.round((value - product.cost) * 100) / 100)
              : "None"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Margin</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">{margin}%</dd>
        </div>
      </dl>
      <div>
        <SubmitButton
          pending={pending}
          disabled={!!error || value === product.price}
          pendingLabel="Saving"
          testId="save-price"
        >
          Save price
        </SubmitButton>
      </div>
    </form>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="sm:col-span-2">{children}</dd>
    </div>
  );
}

export function ProductDetail({
  v,
  products,
  orders,
  setPrice,
  setPublished,
}: {
  v: boolean;
  products: Product[];
  orders: Order[];
  setPrice: (id: string, price: number) => void;
  setPublished: (id: string, published: boolean) => void;
}) {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);
  useDocumentTitle(`${product?.name ?? "Product"} – Shopline`);
  const [tab, setTab] = useState("details");
  if (!product) return <Navigate to="/" replace />;

  const recent = orders
    .filter((o) => o.lines.some((l) => l.productId === product.id))
    .slice(0, 5);
  const sections: { key: string; label: string; body: ReactNode }[] = [
    {
      key: "details",
      label: "Details",
      body: (
        <dl className="divide-y divide-slate-100 text-sm">
          <Row label="Category">{product.category}</Row>
          <Row label="Description">
            {product.description || (
              <span className="text-slate-400">No description yet</span>
            )}
          </Row>
          <Row label="Sales channels">
            {product.published
              ? "Online store, Point of sale"
              : "Not available until published"}
          </Row>
        </dl>
      ),
    },
    {
      key: "pricing",
      label: "Pricing",
      body: v ? (
        <PricingForm
          key={`${product.id}-${product.price}`}
          product={product}
          onSave={setPrice}
        />
      ) : (
        <div className="text-sm">
          <dl className="divide-y divide-slate-100">
            <Row label="Price">
              <span
                className="font-semibold tabular-nums"
                data-testid="current-price"
              >
                {money(product.price)}
              </span>
            </Row>
            <Row label="Compare-at price">
              <span className="tabular-nums">{money(product.compareAt)}</span>
            </Row>
            <Row label="Cost per item">
              <span className="tabular-nums">{money(product.cost)}</span>
            </Row>
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            Change prices from the{" "}
            <Link
              to="/"
              className={cx(
                "rounded font-medium text-teal-700 hover:underline",
                t.focus,
              )}
            >
              Products table
            </Link>
            .
          </p>
        </div>
      ),
    },
    {
      key: "inventory",
      label: "Inventory",
      body: (
        <dl className="divide-y divide-slate-100 text-sm">
          <Row label="SKU">
            <span className="font-mono">{product.sku}</span>
          </Row>
          <Row label="Available">
            <Stock stock={product.stock} />
          </Row>
          <Row label="Incoming">
            <span className="tabular-nums">
              {product.incoming
                ? `${product.incoming} units, arriving ${formatDate(daysFromToday(6))}`
                : "None"}
            </span>
          </Row>
          <Row label="Location">Fernwood warehouse, Portland</Row>
        </dl>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-sm text-slate-500"
      >
        <Link to="/" className={cx("rounded hover:text-slate-900", t.focus)}>
          Products
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <span
          aria-current="page"
          className="truncate text-slate-900"
          title={product.name}
        >
          {product.name}
        </span>
      </nav>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <ProductArt
            id={product.id}
            category={product.category}
            size={64}
            className="rounded-2xl"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                className="truncate text-2xl font-bold tracking-tight"
                title={product.name}
              >
                {product.name}
              </h1>
              <StatusBadge published={product.published} />
            </div>
            <p className="mt-0.5 text-sm text-slate-500 tabular-nums">
              {money(product.price)}
              {product.compareAt > product.price && (
                <span className="ml-2 line-through">
                  {money(product.compareAt)}
                </span>
              )}
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium">
          <input
            type="checkbox"
            role={v ? "switch" : undefined}
            checked={product.published}
            onChange={(e) => setPublished(product.id, e.target.checked)}
            className={
              v
                ? "relative h-5 w-9 cursor-pointer appearance-none rounded-full bg-slate-300 transition-colors before:absolute before:top-0.5 before:left-0.5 before:size-4 before:rounded-full before:bg-white before:shadow before:transition-transform checked:bg-teal-700 checked:before:translate-x-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 motion-reduce:transition-none motion-reduce:before:transition-none"
                : "size-4 accent-teal-700"
            }
            data-testid="published"
          />
          Published
        </label>
      </header>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {v ? (
          <div className="flex min-w-0 flex-col gap-3">
            {sections.map((section) => (
              <details
                key={section.key}
                open={section.key === "details"}
                className={cx(t.panel, "group")}
                data-testid={`section-${section.key}`}
              >
                <summary
                  className={cx(
                    "cursor-pointer rounded-2xl px-5 py-4 font-semibold marker:text-teal-700",
                    t.focus,
                  )}
                >
                  {section.label}
                </summary>
                <div className="border-t border-slate-100 px-5 py-4">
                  {section.body}
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className={cx(t.panel, "min-w-0")}>
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
                    t.focus,
                    tab === section.key
                      ? "border-teal-700 font-semibold text-teal-800"
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
              className="px-5 py-3"
            >
              {sections.find((section) => section.key === tab)?.body}
            </div>
          </div>
        )}
        <aside className="flex min-w-0 flex-col gap-8">
          <section>
            <h2 className="font-semibold">Last 30 days</h2>
            <dl className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-slate-500">Units sold</dt>
                <dd className="text-xl font-bold tabular-nums">
                  {product.sold30}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Revenue</dt>
                <dd className="text-xl font-bold tabular-nums">
                  {money(product.sold30 * product.price)}
                </dd>
              </div>
            </dl>
          </section>
          <section>
            <h2 className="font-semibold">Recent orders</h2>
            {recent.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                No orders for this product yet.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100">
                {recent.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <Link
                      to={`/orders/${o.id}`}
                      className={cx(
                        "rounded font-medium text-teal-700 hover:underline",
                        t.focus,
                      )}
                    >
                      #{o.number}
                    </Link>
                    <span className="text-slate-500">
                      {relativeTime(o.date)}
                    </span>
                    <FulfillmentBadge value={o.fulfillment} />
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="font-semibold">History</h2>
            <ol className="mt-3 flex flex-col gap-4 border-l border-slate-200 pl-4">
              {product.history.map((item) => (
                <li
                  key={item.id}
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
        </aside>
      </div>
    </div>
  );
}
