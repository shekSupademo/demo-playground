import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Clock,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  FolderInput,
  GripVertical,
  HardDrive,
  LayoutGrid,
  Link2,
  List,
  type LucideIcon,
  Pencil,
  Presentation,
  Search,
  Settings,
  Share2,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
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
import {
  Avatar,
  daysFromToday,
  EmptyState,
  formatDate,
  MobileNav,
  type Notification,
  NotificationsMenu,
  relativeTime,
  UserMenu,
  useDocumentTitle,
} from "../../kit";
import type { Variant } from "../../registry";
import { cx, Dialog, Menu, useToasts } from "../../ui";
import {
  type FileItem,
  type FolderItem,
  folders,
  formatBytes,
  type Kind,
  kindFromName,
  me,
  myEmail,
  OTHER_USAGE,
  QUOTA,
  seed,
} from "./data";

const font = {
  fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
};
const accentText = "text-[#0284C7]";
const line = "border-slate-200";
const muted = "text-slate-500";
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284C7]";
const primary = cx(
  "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#0284C7] px-3.5 text-sm font-medium text-white shadow-sm hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-50",
  focusRing,
);
const secondary = cx(
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
  line,
  focusRing,
);
const iconButton = cx(
  "grid size-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900",
  focusRing,
);
const inputClass = cx(
  "h-9 rounded-md border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0284C7] focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20",
  line,
);
const checkbox = "size-4 rounded accent-[#0284C7]";

const kindStyle: Record<
  Kind,
  { Icon: LucideIcon; label: string; tile: string; bar: string }
> = {
  pdf: {
    Icon: FileText,
    label: "PDF document",
    tile: "bg-rose-50 text-rose-600",
    bar: "bg-rose-500",
  },
  doc: {
    Icon: FileText,
    label: "Word document",
    tile: "bg-blue-50 text-blue-600",
    bar: "bg-blue-500",
  },
  sheet: {
    Icon: FileSpreadsheet,
    label: "Spreadsheet",
    tile: "bg-emerald-50 text-emerald-600",
    bar: "bg-emerald-500",
  },
  slides: {
    Icon: Presentation,
    label: "Presentation",
    tile: "bg-amber-50 text-amber-600",
    bar: "bg-amber-500",
  },
  image: {
    Icon: FileImage,
    label: "Image",
    tile: "bg-violet-50 text-violet-600",
    bar: "bg-violet-500",
  },
  video: {
    Icon: FileVideo,
    label: "Video",
    tile: "bg-pink-50 text-pink-600",
    bar: "bg-pink-500",
  },
  archive: {
    Icon: FileArchive,
    label: "Archive",
    tile: "bg-slate-100 text-slate-600",
    bar: "bg-slate-500",
  },
};

const groups: { id: string; label: string; kinds: Kind[] }[] = [
  { id: "docs", label: "Documents", kinds: ["pdf", "doc"] },
  { id: "sheets", label: "Spreadsheets", kinds: ["sheet"] },
  { id: "slides", label: "Presentations", kinds: ["slides"] },
  { id: "images", label: "Images", kinds: ["image"] },
  { id: "media", label: "Videos", kinds: ["video"] },
  { id: "archives", label: "Archives", kinds: ["archive"] },
];

const notifications: Notification[] = [
  {
    id: "n1",
    title: "Tom Becker shared Studio meeting notes with you",
    time: new Date(Date.now() - 25 * 60000).toISOString(),
    unread: true,
  },
  {
    id: "n2",
    title: "Priya Raman commented on Q4 board update",
    time: new Date(Date.now() - 3 * 3600000).toISOString(),
    unread: true,
  },
  {
    id: "n3",
    title: "Elena Sokolova edited Vendor payments 2026",
    time: daysFromToday(-1),
    unread: true,
  },
  {
    id: "n4",
    title: "Your storage is 70% full",
    time: daysFromToday(-3),
    unread: false,
  },
  {
    id: "n5",
    title: "Aisha Bello uploaded 48 photos to Product shoot ceramics",
    time: daysFromToday(-9),
    unread: false,
  },
];

const DRAG_TYPE = "application/x-filebox-files";
const folderName = (id: string) => folders.find((f) => f.id === id)?.name ?? id;
const plural = (n: number) => `${n} ${n === 1 ? "file" : "files"}`;
const firstName = (name: string) => name.split(" ")[0];
const relLower = (iso: string) => {
  const r = relativeTime(iso);
  return r.includes(",") ? `on ${r}` : r.toLowerCase();
};
const PAGE = 15;

type View = "list" | "grid";
type Actions = {
  move: (ids: string[], folder: string) => void;
  remove: (ids: string[]) => void;
  describe: (id: string, text: string) => void;
  add: (items: FileItem[]) => void;
};
type PageProps = {
  v: boolean;
  files: FileItem[];
  actions: Actions;
  toast: (m: string) => void;
};
type ListProps = PageProps & { view: View; setView: (v: View) => void };

function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#0284C7" />
      <path d="M7 12.5 16 8l9 4.5-9 4.5z" fill="#BAE6FD" />
      <path d="M7 12.5v8.5l9 4.5V17z" fill="#fff" />
      <path d="M25 12.5v8.5l-9 4.5V17z" fill="#E0F2FE" />
    </svg>
  );
}

function FileIcon({
  kind,
  size = "md",
}: {
  kind: Kind;
  size?: "sm" | "md" | "lg";
}) {
  const s = kindStyle[kind];
  return (
    <span
      className={cx(
        "grid shrink-0 place-items-center",
        s.tile,
        size === "sm" && "size-7 rounded-md",
        size === "md" && "size-9 rounded-lg",
        size === "lg" && "size-14 rounded-xl",
      )}
    >
      <s.Icon
        className={cx(
          size === "sm" && "size-4",
          size === "md" && "size-[18px]",
          size === "lg" && "size-7",
        )}
        aria-hidden
      />
    </span>
  );
}

function AvatarStack({ names, max = 3 }: { names: string[]; max?: number }) {
  if (names.length === 0)
    return <span className={cx("text-sm", muted)}>Only you</span>;
  const extra = names.length - max;
  return (
    <span className="flex items-center" title={names.join(", ")}>
      <span className="sr-only">Shared with {names.join(", ")}</span>
      {names.slice(0, max).map((n) => (
        <Avatar
          key={n}
          name={n}
          size={24}
          className="-ml-1.5 ring-2 ring-white first:ml-0"
        />
      ))}
      {extra > 0 && (
        <span
          aria-hidden
          className="-ml-1.5 grid size-6 place-items-center rounded-full bg-slate-100 text-[11px] font-medium text-slate-600 ring-2 ring-white"
        >
          +{extra}
        </span>
      )}
    </span>
  );
}

function PageHeader({
  title,
  description,
  children,
  crumbs,
}: {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  crumbs?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-1">
      {crumbs}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          {description && (
            <p className={cx("mt-1 text-sm", muted)}>{description}</p>
          )}
        </div>
        {children && <div className="flex flex-wrap gap-2">{children}</div>}
      </div>
    </header>
  );
}

function UploadButton({
  folder,
  actions,
  toast,
}: {
  folder: string;
  actions: Actions;
  toast: (m: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (list.length === 0) return;
    const today = daysFromToday(0);
    actions.add(
      list.map((f, i) => ({
        id: `upload-${Date.now()}-${i}`,
        name: f.name,
        folder,
        kind: kindFromName(f.name),
        bytes: f.size,
        created: today,
        modified: today,
        owner: me,
        editor: me,
        shared: [],
        description: "",
      })),
    );
    toast(`Uploaded ${plural(list.length)} to ${folderName(folder)}`);
  };
  return (
    <>
      <input ref={ref} type="file" multiple hidden onChange={pick} />
      <button
        type="button"
        className={primary}
        onClick={() => ref.current?.click()}
      >
        <Upload className="size-4" aria-hidden /> Upload files
      </button>
    </>
  );
}

function FolderPicker({
  open,
  onClose,
  current,
  count,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  current: string;
  count: number;
  onPick: (folder: string) => void;
}) {
  const [choice, setChoice] = useState("");
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Move to…"
      className="w-full max-w-sm rounded-xl bg-white p-5 text-slate-900 shadow-xl"
      testId="move-dialog"
    >
      <form
        className="mt-1 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!choice) return;
          onPick(choice);
          setChoice("");
        }}
      >
        <p className={cx("text-sm", muted)}>
          Choose a folder for {count === 1 ? "this file" : plural(count)}.
        </p>
        <fieldset className="flex flex-col gap-0.5">
          <legend className="sr-only">Destination folder</legend>
          {folders
            .filter((f) => f.id !== current)
            .map((f) => (
              <label
                key={f.id}
                className={cx(
                  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#0284C7]/40",
                  choice === f.id
                    ? "bg-sky-50 text-sky-900"
                    : "hover:bg-slate-50",
                )}
              >
                <input
                  type="radio"
                  name="destination"
                  value={f.id}
                  checked={choice === f.id}
                  onChange={() => setChoice(f.id)}
                  className="accent-[#0284C7]"
                  data-testid={`move-target-${f.id}`}
                />
                <Folder
                  className="size-4 fill-sky-100 text-[#0284C7]"
                  aria-hidden
                />
                {f.name}
              </label>
            ))}
        </fieldset>
        <div className="flex justify-end gap-2">
          <button type="button" className={secondary} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={primary}
            disabled={!choice}
            data-testid="confirm-move"
          >
            {count === 1 ? "Move file" : "Move files"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

type SortKey = "name" | "owner" | "folder" | "modified" | "size";
type Sort = { key: SortKey; dir: 1 | -1 };

function SortHeader({
  label,
  k,
  sort,
  onSort,
  align = "left",
  className,
}: {
  label: string;
  k: SortKey;
  sort: Sort;
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = sort.key === k;
  const Icon = !active ? ChevronsUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={
        active ? (sort.dir === 1 ? "ascending" : "descending") : "none"
      }
      className={cx(
        "px-3 py-2.5 font-medium",
        align === "right" && "text-right",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cx(
          "inline-flex items-center gap-1 rounded-sm hover:text-slate-900",
          active && "text-slate-900",
          focusRing,
        )}
      >
        {label}
        <Icon className="size-3.5" aria-hidden />
      </button>
    </th>
  );
}

function FileList({
  v,
  files,
  actions,
  toast,
  view,
  setView,
  current = "",
  showFolder = false,
  defaultSort = { key: "name", dir: 1 },
  empty,
}: ListProps & {
  current?: string;
  showFolder?: boolean;
  defaultSort?: Sort;
  empty: ReactNode;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);
  const [group, setGroup] = useState("all");
  const [sort, setSort] = useState<Sort>(defaultSort);
  const [limit, setLimit] = useState(PAGE);

  const kinds = groups.find((g) => g.id === group)?.kinds;
  const available = groups.filter((g) =>
    files.some((f) => g.kinds.includes(f.kind)),
  );
  const filtered = files.filter((f) => !kinds || kinds.includes(f.kind));
  const value = (f: FileItem): string | number =>
    sort.key === "name"
      ? f.name.toLowerCase()
      : sort.key === "owner"
        ? f.owner
        : sort.key === "folder"
          ? folderName(f.folder)
          : sort.key === "modified"
            ? f.modified
            : f.bytes;
  const sorted = [...filtered].sort((a, b) => {
    const x = value(a);
    const y = value(b);
    return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
  });
  const shown = sorted.slice(0, limit);
  const chosen = selected.filter((s) => files.some((f) => f.id === s));
  const allSelected =
    shown.length > 0 && shown.every((f) => chosen.includes(f.id));

  const onSort = (k: SortKey) =>
    setSort((cur) =>
      cur.key === k
        ? { key: k, dir: cur.dir === 1 ? -1 : 1 }
        : { key: k, dir: k === "modified" || k === "size" ? -1 : 1 },
    );
  const toggle = (id: string) =>
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id],
    );
  const toggleAll = () =>
    setSelected(allSelected ? [] : shown.map((f) => f.id));
  const pickGroup = (id: string) => {
    setGroup(id);
    setSelected([]);
  };
  const removeOne = (file: FileItem) => {
    actions.remove([file.id]);
    toast(`Deleted ${file.name}`);
  };
  const removeSelected = () => {
    actions.remove(chosen);
    toast(`Deleted ${plural(chosen.length)}`);
    setSelected([]);
  };
  const drag = (id: string) =>
    v
      ? {
          draggable: true,
          onDragStart: (e: DragEvent) => {
            const ids = chosen.includes(id) ? chosen : [id];
            e.dataTransfer.setData(DRAG_TYPE, ids.join(","));
            e.dataTransfer.effectAllowed = "move";
          },
        }
      : {};

  if (files.length === 0) return <>{empty}</>;

  const chip = (active: boolean) =>
    cx(
      "inline-flex h-8 items-center rounded-full border px-3 text-sm",
      active
        ? "border-[#0284C7] bg-sky-50 font-medium text-sky-800"
        : cx(line, "bg-white text-slate-600 hover:bg-slate-50"),
      focusRing,
    );

  const deleteButton = (file: FileItem) => (
    <button
      type="button"
      aria-label={`Delete ${file.name}`}
      title="Delete"
      className={cx(iconButton, "hover:bg-rose-50 hover:text-rose-600")}
      onClick={() => removeOne(file)}
      data-testid={`delete-${file.id}`}
    >
      <Trash2 className="size-4" aria-hidden />
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filter by type"
        >
          <button
            type="button"
            aria-pressed={group === "all"}
            className={chip(group === "all")}
            onClick={() => pickGroup("all")}
          >
            All
          </button>
          {available.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={group === g.id}
              className={chip(group === g.id)}
              onClick={() => pickGroup(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <span className={cx("max-sm:sr-only", muted)}>Sort by</span>
            <select
              value={`${sort.key}:${sort.dir}`}
              onChange={(e) => {
                const [key, dir] = e.target.value.split(":");
                setSort({ key: key as SortKey, dir: dir === "1" ? 1 : -1 });
              }}
              className={cx(inputClass, "h-8 pr-7")}
            >
              <option value="name:1">Name</option>
              <option value="name:-1">Name, Z to A</option>
              <option value="modified:-1">Last modified</option>
              <option value="size:-1">Largest first</option>
              <option value="owner:1">Owner</option>
              {showFolder && <option value="folder:1">Location</option>}
            </select>
          </label>
          <div
            className={cx("flex rounded-md border bg-white p-0.5", line)}
            role="group"
            aria-label="View"
          >
            {(
              [
                ["list", List, "List view"],
                ["grid", LayoutGrid, "Grid view"],
              ] as const
            ).map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                aria-label={label}
                aria-pressed={view === id}
                title={label}
                onClick={() => setView(id)}
                className={cx(
                  "grid size-7 place-items-center rounded",
                  view === id
                    ? "bg-sky-50 text-[#0284C7]"
                    : "text-slate-500 hover:text-slate-900",
                  focusRing,
                )}
                data-testid={`view-${id}`}
              >
                <Icon className="size-4" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </div>

      {v && chosen.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white shadow-md animate-fade-up"
          data-testid="bulk-bar"
        >
          <button
            type="button"
            aria-label="Clear selection"
            className="grid size-7 place-items-center rounded hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
            onClick={() => setSelected([])}
          >
            <X className="size-4" aria-hidden />
          </button>
          <span className="flex-1 font-medium tabular-nums">
            {chosen.length} selected
          </span>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
            onClick={() => setPicking(true)}
            data-testid="move-selected"
          >
            <FolderInput className="size-4" aria-hidden /> Move selected
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-rose-600 px-3 font-medium hover:bg-rose-500 focus-visible:outline-2 focus-visible:outline-white"
            onClick={removeSelected}
            data-testid="delete-selected"
          >
            <Trash2 className="size-4" aria-hidden /> Delete selected
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className={cx("rounded-xl border border-dashed", line)}>
          <EmptyState
            icon={<Search className="size-5" aria-hidden />}
            title="No files of this type"
            body="Try another type, or show every file in this view."
            action={
              <button
                type="button"
                className={secondary}
                onClick={() => pickGroup("all")}
              >
                Show all files
              </button>
            }
          />
        </div>
      ) : view === "list" ? (
        <div className={cx("relative overflow-x-auto rounded-xl border bg-white", line)}>
          <table className="w-full min-w-[760px] text-sm">
            <thead
              className={cx("border-b text-left text-xs text-slate-500", line)}
            >
              <tr>
                {v && (
                  <th scope="col" className="w-10 py-2.5 pl-4">
                    <input
                      type="checkbox"
                      aria-label="Select all files"
                      checked={allSelected}
                      onChange={toggleAll}
                      className={checkbox}
                      data-testid="select-all"
                    />
                  </th>
                )}
                <SortHeader
                  label="Name"
                  k="name"
                  sort={sort}
                  onSort={onSort}
                  className={v ? "" : "pl-4"}
                />
                {showFolder && (
                  <SortHeader
                    label="Location"
                    k="folder"
                    sort={sort}
                    onSort={onSort}
                  />
                )}
                <SortHeader
                  label="Owner"
                  k="owner"
                  sort={sort}
                  onSort={onSort}
                />
                <th
                  scope="col"
                  className="px-3 py-2.5 font-medium whitespace-nowrap"
                >
                  Shared with
                </th>
                <SortHeader
                  label="Modified"
                  k="modified"
                  sort={sort}
                  onSort={onSort}
                />
                <SortHeader
                  label="Size"
                  k="size"
                  sort={sort}
                  onSort={onSort}
                  align="right"
                />
                <th scope="col" className="w-12 py-2.5 pr-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((file) => {
                const isSelected = chosen.includes(file.id);
                return (
                  <tr
                    key={file.id}
                    {...drag(file.id)}
                    className={cx(
                      "group",
                      isSelected ? "bg-sky-50/70" : "hover:bg-slate-50",
                      v && "cursor-grab active:cursor-grabbing",
                    )}
                    data-testid={`row-${file.id}`}
                  >
                    {v && (
                      <td className="py-2 pl-4">
                        <input
                          type="checkbox"
                          aria-label={`Select ${file.name}`}
                          checked={isSelected}
                          onChange={() => toggle(file.id)}
                          className={checkbox}
                          data-testid={`select-${file.id}`}
                        />
                      </td>
                    )}
                    <td
                      className={cx("w-[40%] max-w-0 px-3 py-2", !v && "pl-4")}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        {v && (
                          <GripVertical
                            className="size-4 shrink-0 text-slate-300 opacity-0 group-hover:opacity-100"
                            aria-hidden
                          />
                        )}
                        <FileIcon kind={file.kind} size="sm" />
                        <Link
                          to={`/files/${file.id}`}
                          className={cx(
                            "truncate rounded-sm font-medium text-slate-900 hover:text-[#0284C7] hover:underline",
                            focusRing,
                          )}
                          title={file.name}
                          draggable={false}
                          data-testid={`file-${file.id}`}
                        >
                          {file.name}
                        </Link>
                      </span>
                    </td>
                    {showFolder && (
                      <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Folder
                            className="size-3.5 text-slate-400"
                            aria-hidden
                          />
                          {folderName(file.folder)}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <Avatar name={file.owner} size={22} />
                        {file.owner === me ? "You" : file.owner}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <AvatarStack
                        names={file.shared.filter((n) => n !== me)}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                      <span title={formatDate(file.modified)}>
                        {relativeTime(file.modified)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap text-slate-600 tabular-nums">
                      {formatBytes(file.bytes)}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      {deleteButton(file)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {v && (
            <label className="flex w-fit items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className={checkbox}
                data-testid="select-all"
              />
              Select all files
            </label>
          )}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {shown.map((file) => {
              const isSelected = chosen.includes(file.id);
              const s = kindStyle[file.kind];
              return (
                <li
                  key={file.id}
                  {...drag(file.id)}
                  className={cx(
                    "group relative flex flex-col overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-md",
                    isSelected
                      ? "border-[#0284C7] ring-2 ring-[#0284C7]/30"
                      : line,
                    v && "cursor-grab active:cursor-grabbing",
                  )}
                  data-testid={`row-${file.id}`}
                >
                  <div className={cx("grid h-28 place-items-center", s.tile)}>
                    <s.Icon className="size-10 opacity-80" aria-hidden />
                  </div>
                  {v && (
                    <input
                      type="checkbox"
                      aria-label={`Select ${file.name}`}
                      checked={isSelected}
                      onChange={() => toggle(file.id)}
                      className={cx(
                        checkbox,
                        "absolute top-2.5 left-2.5 bg-white",
                      )}
                      data-testid={`select-${file.id}`}
                    />
                  )}
                  <div className="absolute top-1.5 right-1.5 rounded-md bg-white/90 shadow-sm sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                    {deleteButton(file)}
                  </div>
                  <div className="flex min-w-0 flex-col gap-1 p-3">
                    <Link
                      to={`/files/${file.id}`}
                      className={cx(
                        "truncate rounded-sm text-sm font-medium text-slate-900 hover:text-[#0284C7] hover:underline",
                        focusRing,
                      )}
                      title={file.name}
                      draggable={false}
                      data-testid={`file-${file.id}`}
                    >
                      {file.name}
                    </Link>
                    <span className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="truncate">
                        {showFolder
                          ? folderName(file.folder)
                          : relativeTime(file.modified)}
                      </span>
                      <span className="tabular-nums">
                        {formatBytes(file.bytes)}
                      </span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <p className="tabular-nums">
            {shown.length === filtered.length
              ? `Showing ${plural(filtered.length)}`
              : `Showing 1–${shown.length} of ${filtered.length} files`}
          </p>
          {shown.length < filtered.length && (
            <button
              type="button"
              className={secondary}
              onClick={() => setLimit((n) => n + PAGE)}
            >
              Load more files
            </button>
          )}
        </div>
      )}

      <FolderPicker
        open={picking}
        onClose={() => setPicking(false)}
        current={current}
        count={chosen.length}
        onPick={(target) => {
          const moving = chosen.filter(
            (id) => files.find((f) => f.id === id)?.folder !== target,
          );
          if (moving.length > 0) {
            actions.move(moving, target);
            toast(`Moved ${plural(moving.length)} to ${folderName(target)}`);
          }
          setSelected([]);
          setPicking(false);
        }}
      />
    </div>
  );
}

function Home({ v, files, actions, toast }: PageProps) {
  useDocumentTitle("My files – Filebox");
  const navigate = useNavigate();
  const [selected, setSelected] = useState("");
  const recent = [...files]
    .sort((a, b) => b.modified.localeCompare(a.modified))
    .slice(0, 6);
  const tile = cx(
    "flex w-full flex-col items-start gap-3 rounded-xl border bg-white p-4 text-left transition-shadow",
    focusRing,
  );
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="My files"
        description={
          v
            ? "Click a folder to select it. Double-click to open it."
            : "Pick a folder to see what's inside."
        }
      >
        <UploadButton folder="documents" actions={actions} toast={toast} />
      </PageHeader>
      <section aria-labelledby="folders-heading">
        <h2
          id="folders-heading"
          className="mb-3 text-sm font-semibold text-slate-900"
        >
          Folders
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {folders.map((f) => {
            const inside = files.filter((file) => file.folder === f.id);
            const people = [
              ...new Set(
                inside.flatMap((file) => [file.owner, ...file.shared]),
              ),
            ].filter((n) => n !== me);
            const size = inside.reduce((s, x) => s + x.bytes, 0);
            const body = (
              <>
                <Folder
                  className="size-9 fill-sky-100 text-[#0284C7]"
                  aria-hidden
                />
                <span className="flex w-full min-w-0 flex-col">
                  <span className="truncate font-medium text-slate-900">
                    {f.name}
                  </span>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {plural(inside.length)}
                    {inside.length > 0 && `, ${formatBytes(size)}`}
                  </span>
                </span>
                {people.length > 0 ? (
                  <AvatarStack names={people} max={3} />
                ) : (
                  <span className="h-6 text-xs leading-6 text-slate-400">
                    Private
                  </span>
                )}
              </>
            );
            return (
              <li key={f.id}>
                {v ? (
                  <button
                    type="button"
                    aria-pressed={selected === f.id}
                    className={cx(
                      tile,
                      "select-none",
                      selected === f.id
                        ? "border-[#0284C7] bg-sky-50 ring-2 ring-[#0284C7]/25"
                        : cx(line, "hover:shadow-md"),
                    )}
                    onClick={() => setSelected(f.id)}
                    onDoubleClick={() => navigate(`/folders/${f.id}`)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      navigate(`/folders/${f.id}`);
                    }}
                    data-testid={`folder-${f.id}`}
                  >
                    {body}
                  </button>
                ) : (
                  <Link
                    to={`/folders/${f.id}`}
                    className={cx(tile, line, "hover:shadow-md")}
                    data-testid={`folder-${f.id}`}
                  >
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>
      <section aria-labelledby="recent-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2
            id="recent-heading"
            className="text-sm font-semibold text-slate-900"
          >
            Recently modified
          </h2>
          <Link
            to="/recent"
            className={cx(
              "rounded-sm text-sm font-medium hover:underline",
              accentText,
              focusRing,
            )}
          >
            View all recent files
          </Link>
        </div>
        <ul
          className={cx(
            "divide-y divide-slate-100 rounded-xl border bg-white",
            line,
          )}
        >
          {recent.map((file) => (
            <li key={file.id}>
              <Link
                to={`/files/${file.id}`}
                className={cx(
                  "flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50",
                  focusRing,
                )}
              >
                <FileIcon kind={file.kind} size="sm" />
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate font-medium text-slate-900"
                    title={file.name}
                  >
                    {file.name}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {file.editor === me ? "You" : file.editor} edited{" "}
                    {relLower(file.modified)}
                  </span>
                </span>
                <span className="hidden text-slate-500 sm:inline">
                  {folderName(file.folder)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Crumbs({ children }: { children: ReactNode }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
      <ol className="flex min-w-0 items-center gap-1">
        <li className="shrink-0">
          <Link
            to="/"
            className={cx(
              "rounded-sm hover:text-slate-900 hover:underline",
              focusRing,
            )}
          >
            My files
          </Link>
        </li>
        {children}
      </ol>
    </nav>
  );
}

const crumbSep = <ChevronRight className="size-3.5 shrink-0" aria-hidden />;

function FolderPage(props: ListProps) {
  const { v, files, actions, toast } = props;
  const { id = "" } = useParams();
  const folder = folders.find((f) => f.id === id);
  useDocumentTitle(`${folder?.name ?? "Folder"} – Filebox`);
  if (!folder) return <Navigate to="/" replace />;
  const shown = files.filter((f) => f.folder === id);
  const total = shown.reduce((s, f) => s + f.bytes, 0);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={
          <Crumbs>
            {crumbSep}
            <li aria-current="page" className="text-slate-700">
              {folder.name}
            </li>
          </Crumbs>
        }
        title={folder.name}
        description={
          v
            ? "Drag files onto a folder in the sidebar to move them."
            : `${plural(shown.length)}${shown.length ? `, ${formatBytes(total)}` : ""}`
        }
      >
        <UploadButton folder={folder.id} actions={actions} toast={toast} />
      </PageHeader>
      <FileList
        key={folder.id}
        {...props}
        files={shown}
        current={folder.id}
        empty={
          <div
            className={cx("rounded-xl border border-dashed bg-white", line)}
            data-testid="empty-folder"
          >
            <EmptyState
              icon={<Folder className="size-5" aria-hidden />}
              title="This folder is empty"
              body={`Upload files to ${folder.name}, or move files here from another folder.`}
            />
          </div>
        }
      />
    </div>
  );
}

function SharedPage(props: ListProps) {
  useDocumentTitle("Shared with me – Filebox");
  const shown = props.files.filter((f) => f.owner !== me);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Shared with me"
        description="Files your teammates own and have shared with you."
      />
      <FileList
        {...props}
        files={shown}
        showFolder
        defaultSort={{ key: "modified", dir: -1 }}
        empty={
          <div className={cx("rounded-xl border border-dashed bg-white", line)}>
            <EmptyState
              icon={<Users className="size-5" aria-hidden />}
              title="Nothing shared with you yet"
              body="When a teammate shares a file with you, it shows up here."
            />
          </div>
        }
      />
    </div>
  );
}

function RecentPage(props: ListProps) {
  useDocumentTitle("Recent – Filebox");
  const cutoff = daysFromToday(-30);
  const shown = props.files.filter((f) => f.modified >= cutoff);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Recent"
        description="Files you or your team changed in the last 30 days."
      />
      <FileList
        {...props}
        files={shown}
        showFolder
        defaultSort={{ key: "modified", dir: -1 }}
        empty={
          <div className={cx("rounded-xl border border-dashed bg-white", line)}>
            <EmptyState
              icon={<Clock className="size-5" aria-hidden />}
              title="No recent changes"
              body="Files edited in the last 30 days appear here."
            />
          </div>
        }
      />
    </div>
  );
}

const lineWidths = [
  "w-[92%]",
  "w-full",
  "w-[84%]",
  "w-[96%]",
  "w-[70%]",
  "w-[88%]",
  "w-[60%]",
];

function Preview({ file }: { file: FileItem }) {
  const s = kindStyle[file.kind];
  const lines = (n: number) =>
    Array.from({ length: n }, (_, i) => (
      <span
        key={i}
        className={cx(
          "block h-1.5 rounded-full bg-slate-200",
          lineWidths[i % lineWidths.length],
        )}
      />
    ));
  let body: ReactNode;
  if (file.kind === "pdf" || file.kind === "doc") {
    body = (
      <div className="mx-auto flex aspect-[3/4] w-56 flex-col gap-2.5 rounded-md bg-white p-6 shadow-md">
        <span className={cx("mb-2 block h-2.5 w-2/3 rounded-full", s.bar)} />
        {lines(7)}
        <span className="mt-2 block h-12 rounded bg-slate-100" />
        {lines(4)}
      </div>
    );
  } else if (file.kind === "sheet") {
    const head = ["Item", "Sep", "Oct", "Nov", "Total"];
    body = (
      <div className="mx-auto grid w-full max-w-md grid-cols-5 overflow-hidden rounded-md border border-emerald-200 bg-white text-[11px] shadow-md">
        {Array.from({ length: 35 }, (_, i) => (
          <span
            key={i}
            className={cx(
              "h-6 truncate border-r border-b border-emerald-100 px-1.5 leading-6",
              i < 5
                ? "bg-emerald-50 font-medium text-emerald-800"
                : i % 5 === 0
                  ? "text-slate-600"
                  : "text-right text-slate-500 tabular-nums",
            )}
          >
            {i < 5
              ? head[i]
              : i % 5 === 0
                ? `Line ${i / 5}`
                : ((i * 137) % 900) + 100}
          </span>
        ))}
      </div>
    );
  } else if (file.kind === "slides") {
    body = (
      <div className="mx-auto flex aspect-video w-full max-w-md flex-col justify-end gap-2 rounded-md bg-white p-6 shadow-md">
        <span className="block h-3 w-1/2 rounded-full bg-amber-400" />
        <span className="block h-2 w-1/3 rounded-full bg-slate-200" />
      </div>
    );
  } else if (file.kind === "image") {
    body = (
      <svg
        viewBox="0 0 320 200"
        className="mx-auto w-full max-w-md rounded-md shadow-md"
        aria-hidden
      >
        <rect width="320" height="200" fill="#DDD6FE" />
        <circle cx="240" cy="60" r="22" fill="#FDE68A" />
        <path
          d="M0 160 L90 80 L150 140 L210 100 L320 170 V200 H0 Z"
          fill="#8B5CF6"
        />
        <path d="M0 180 L120 120 L200 170 L320 140 V200 H0 Z" fill="#6D28D9" />
      </svg>
    );
  } else if (file.kind === "video") {
    body = (
      <div className="mx-auto grid aspect-video w-full max-w-md place-items-center rounded-md bg-slate-900 shadow-md">
        <span className="grid size-14 place-items-center rounded-full bg-white/15 text-white">
          <svg viewBox="0 0 24 24" className="ml-1 size-6" aria-hidden>
            <path d="M7 4v16l13-8z" fill="currentColor" />
          </svg>
        </span>
      </div>
    );
  } else {
    body = (
      <ul className="mx-auto flex w-full max-w-sm flex-col gap-1.5 rounded-md bg-white p-4 text-sm shadow-md">
        {["contents", "selects", "raw", "notes.txt"].map((n) => (
          <li key={n} className="flex items-center gap-2 text-slate-600">
            <Folder className="size-4 text-slate-400" aria-hidden /> {n}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <section
      aria-label="Preview"
      className="rounded-xl bg-slate-100 px-6 py-10"
      data-testid="file-preview"
    >
      {body}
    </section>
  );
}

function Description({
  v,
  file,
  actions,
  toast,
}: Omit<PageProps, "files"> & { file: FileItem }) {
  const [draft, setDraft] = useState(file.description);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const change = (text: string) => {
    setDraft(text);
    if (!v) return;
    setStatus("saving");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      actions.describe(file.id, text);
      setStatus("saved");
    }, 600);
  };

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor="file-description"
          className="text-sm font-semibold text-slate-900"
        >
          Description
        </label>
        {v && (
          <span
            className="inline-flex items-center gap-1 text-xs text-slate-500"
            aria-live="polite"
            data-testid="save-status"
          >
            {status === "saving" && "Saving…"}
            {status === "saved" && (
              <>
                <Check className="size-3.5 text-emerald-600" aria-hidden />
                Saved
              </>
            )}
            {status === "idle" && "Changes save automatically"}
          </span>
        )}
      </div>
      <textarea
        id="file-description"
        value={draft}
        onChange={(e) => change(e.target.value)}
        rows={4}
        maxLength={500}
        placeholder="Add a note about this file"
        className={cx(inputClass, "h-auto py-2 leading-relaxed")}
        data-testid="description"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-400 tabular-nums">
          {draft.length}/500
        </span>
        {!v && (
          <button
            type="button"
            className={primary}
            disabled={draft === file.description}
            onClick={() => {
              actions.describe(file.id, draft);
              toast("Description saved");
            }}
            data-testid="save-description"
          >
            Save description
          </button>
        )}
      </div>
    </section>
  );
}

function FilePage({ v, files, actions, toast }: PageProps) {
  const { id } = useParams();
  const [picking, setPicking] = useState(false);
  const file = files.find((f) => f.id === id);
  useDocumentTitle(`${file?.name ?? "File"} – Filebox`);
  if (!file) return <Navigate to="/" replace />;
  const s = kindStyle[file.kind];
  const people = [file.owner, ...file.shared.filter((n) => n !== file.owner)];
  const sharedWith =
    file.shared.length === 1
      ? file.shared[0] === me
        ? "you"
        : file.shared[0]
      : `${file.shared.length} people`;
  const activity = [
    ...(file.modified !== file.created
      ? [
          {
            who: file.editor,
            what: "edited this file",
            when: file.modified,
            Icon: Pencil,
          },
        ]
      : []),
    ...(file.shared.length
      ? [
          {
            who: file.owner,
            what: `shared it with ${sharedWith}`,
            when: file.created,
            Icon: Share2,
          },
        ]
      : []),
    {
      who: file.owner,
      what: "uploaded this file",
      when: file.created,
      Icon: Upload,
    },
  ];
  const facts: [string, string][] = [
    ["Type", s.label],
    ["Size", formatBytes(file.bytes)],
    ["Location", folderName(file.folder)],
    ["Owner", file.owner === me ? "You" : file.owner],
    ["Created", formatDate(file.created)],
    ["Modified", formatDate(file.modified)],
  ];

  return (
    <div className="flex flex-col gap-6">
      <Crumbs>
        {crumbSep}
        <li className="shrink-0">
          <Link
            to={`/folders/${file.folder}`}
            className={cx(
              "rounded-sm hover:text-slate-900 hover:underline",
              focusRing,
            )}
            data-testid="back-to-folder"
          >
            {folderName(file.folder)}
          </Link>
        </li>
        {crumbSep}
        <li
          aria-current="page"
          className="truncate text-slate-700"
          title={file.name}
        >
          {file.name}
        </li>
      </Crumbs>
      <header
        draggable={v}
        onDragStart={
          v
            ? (e) => {
                e.dataTransfer.setData(DRAG_TYPE, file.id);
                e.dataTransfer.effectAllowed = "move";
              }
            : undefined
        }
        className={cx(
          "flex flex-wrap items-center gap-4",
          v && "cursor-grab active:cursor-grabbing",
        )}
        data-testid="file-card"
      >
        {v && <GripVertical className="size-4 text-slate-300" aria-hidden />}
        <FileIcon kind={file.kind} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight break-words text-slate-900">
            {file.name}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {s.label}, {formatBytes(file.bytes)}. Modified{" "}
            {relLower(file.modified)} by{" "}
            {file.editor === me ? "you" : file.editor}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={secondary}
            onClick={() => {
              navigator.clipboard
                ?.writeText(`https://filebox.app/f/${file.id}`)
                .catch(() => undefined);
              toast("Link copied");
            }}
          >
            <Link2 className="size-4" aria-hidden /> Copy link
          </button>
          {!v && (
            <button
              type="button"
              className={secondary}
              onClick={() => setPicking(true)}
              data-testid="move-file"
            >
              <FolderInput className="size-4" aria-hidden /> Move to…
            </button>
          )}
        </div>
      </header>
      {v && (
        <p className="-mt-3 text-sm text-slate-500">
          Drag this file onto a folder in the sidebar to move it.
        </p>
      )}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Preview file={file} />
          <Description
            key={file.id}
            v={v}
            file={file}
            actions={actions}
            toast={toast}
          />
        </div>
        <aside className="flex flex-col gap-6">
          <section>
            <h2 className="text-sm font-semibold text-slate-900">Details</h2>
            <dl className="mt-3 grid grid-cols-[96px_1fr] gap-x-3 gap-y-2 text-sm">
              {facts.map(([k, val]) => (
                <div key={k} className="contents">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-slate-900 tabular-nums">{val}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className={cx("border-t pt-6", line)}>
            <h2 className="text-sm font-semibold text-slate-900">
              People with access
            </h2>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm">
              {people.map((n) => (
                <li key={n} className="flex items-center gap-2.5">
                  <Avatar name={n} size={28} />
                  <span className="min-w-0 flex-1 truncate text-slate-900">
                    {n}
                    {n === me && <span className="text-slate-500"> (you)</span>}
                  </span>
                  <span className="text-xs text-slate-500">
                    {n === file.owner ? "Owner" : "Can edit"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className={cx("border-t pt-6", line)}>
            <h2 className="text-sm font-semibold text-slate-900">Activity</h2>
            <ol className="mt-3 flex flex-col gap-4">
              {activity.map((a) => (
                <li key={a.what} className="flex gap-3 text-sm">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500">
                    <a.Icon className="size-3.5" aria-hidden />
                  </span>
                  <span>
                    <span className="text-slate-900">
                      <span className="font-medium">
                        {a.who === me ? "You" : firstName(a.who)}
                      </span>{" "}
                      {a.what}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {relativeTime(a.when)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
      <FolderPicker
        open={picking}
        onClose={() => setPicking(false)}
        current={file.folder}
        count={1}
        onPick={(target) => {
          actions.move([file.id], target);
          toast(`Moved to ${folderName(target)}`);
          setPicking(false);
        }}
      />
    </div>
  );
}

function StorageMeter({ used }: { used: number }) {
  const pct = Math.min(100, (used / QUOTA) * 100);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium text-slate-700">Storage</span>
        <span className="text-slate-500 tabular-nums">
          {formatBytes(used)} of {formatBytes(QUOTA)}
        </span>
      </div>
      <div
        role="meter"
        aria-label="Storage used"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        className="h-1.5 overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className={cx(
            "h-full rounded-full",
            pct > 85 ? "bg-rose-500" : "bg-[#0284C7]",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SettingsPage({
  toast,
  used,
}: {
  toast: (m: string) => void;
  used: number;
}) {
  useDocumentTitle("Settings – Filebox");
  const [name, setName] = useState("Harbor Studio");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [linkAccess, setLinkAccess] = useState("team");
  const [prefs, setPrefs] = useState({
    shares: true,
    comments: true,
    digest: false,
  });
  const label = "flex flex-col gap-1.5 text-sm font-medium text-slate-900";
  const section = cx(
    "grid gap-6 border-t py-8 md:grid-cols-[240px_minmax(0,1fr)]",
    line,
  );
  return (
    <div className="flex max-w-4xl flex-col">
      <PageHeader
        title="Settings"
        description="Manage your workspace, sharing defaults and notifications."
      />
      <form
        className={cx(section, "mt-6")}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) {
            setError("Enter a workspace name");
            return;
          }
          setError("");
          setSaving(true);
          window.setTimeout(() => {
            setSaving(false);
            toast("Changes saved");
          }, 600);
        }}
      >
        <div>
          <h2 className="font-semibold text-slate-900">Workspace</h2>
          <p className={cx("mt-1 text-sm", muted)}>
            Shown to everyone you share files with.
          </p>
        </div>
        <div className="flex flex-col gap-5">
          <label className={label}>
            Workspace name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "workspace-error" : undefined}
              className={cx(inputClass, "max-w-sm", error && "border-rose-500")}
            />
            {error && (
              <span
                id="workspace-error"
                className="text-xs font-normal text-rose-600"
              >
                {error}
              </span>
            )}
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-sm font-medium text-slate-900">
              New share links
            </legend>
            {[
              ["team", "Anyone in Harbor Studio with the link can view"],
              ["invited", "Only people you invite"],
              ["public", "Anyone with the link can view"],
            ].map(([id, text]) => (
              <label
                key={id}
                className="flex items-center gap-2.5 text-sm text-slate-700"
              >
                <input
                  type="radio"
                  name="link-access"
                  checked={linkAccess === id}
                  onChange={() => setLinkAccess(id)}
                  className="accent-[#0284C7]"
                />
                {text}
              </label>
            ))}
          </fieldset>
          <div>
            <button type="submit" className={primary} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </form>
      <section className={section}>
        <div>
          <h2 className="font-semibold text-slate-900">Notifications</h2>
          <p className={cx("mt-1 text-sm", muted)}>Email {myEmail} when:</p>
        </div>
        <div className="flex flex-col gap-3">
          {(
            [
              ["shares", "Someone shares a file or folder with me"],
              ["comments", "Someone comments on a file I own"],
              ["digest", "Send me a weekly summary of team activity"],
            ] as const
          ).map(([key, text]) => (
            <label
              key={key}
              className="flex items-center gap-2.5 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={() => {
                  setPrefs((p) => ({ ...p, [key]: !p[key] }));
                  toast(
                    prefs[key]
                      ? "Notification turned off"
                      : "Notification turned on",
                  );
                }}
                className={checkbox}
              />
              {text}
            </label>
          ))}
        </div>
      </section>
      <section className={section}>
        <div>
          <h2 className="font-semibold text-slate-900">Plan and storage</h2>
          <p className={cx("mt-1 text-sm", muted)}>Team plan, 6 members.</p>
        </div>
        <div className="flex max-w-md flex-col gap-3">
          <StorageMeter used={used} />
          <div>
            <button
              type="button"
              className={secondary}
              onClick={() => toast("Plan comparison opened")}
            >
              Compare plans
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SearchBox({ files }: { files: FileItem[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = q
    ? files.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 6)
    : [];
  return (
    <div className="relative w-full max-w-md">
      <label className="relative block">
        <span className="sr-only">Search files</span>
        <Search
          className="pointer-events-none absolute top-2.5 left-3 size-4 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setQuery("")}
          placeholder="Search files"
          className={cx(inputClass, "w-full bg-slate-50 pl-9 focus:bg-white")}
          data-testid="search"
        />
      </label>
      {q && (
        <ul
          className={cx(
            "absolute z-20 mt-1 w-full rounded-lg border bg-white p-1 text-sm shadow-lg",
            line,
          )}
        >
          {results.length === 0 && (
            <li className="px-3 py-2 text-slate-500">
              No files match “{query.trim()}”
            </li>
          )}
          {results.map((f) => (
            <li key={f.id}>
              <Link
                to={`/files/${f.id}`}
                onClick={() => setQuery("")}
                className={cx(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-slate-100",
                  focusRing,
                )}
                data-testid={`search-result-${f.id}`}
              >
                <FileIcon kind={f.kind} size="sm" />
                <span className="min-w-0 flex-1 truncate" title={f.name}>
                  {f.name}
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {folderName(f.folder)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Palette({
  open,
  onClose,
  files,
}: {
  open: boolean;
  onClose: () => void;
  files: FileItem[];
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = [
    ...folders
      .filter((f) => f.name.toLowerCase().includes(q))
      .map((f) => ({
        id: f.id,
        label: f.name,
        hint: "Folder",
        to: `/folders/${f.id}`,
        icon: (
          <Folder className="size-4 fill-sky-100 text-[#0284C7]" aria-hidden />
        ),
      })),
    ...files
      .filter((f) => f.name.toLowerCase().includes(q))
      .map((f) => ({
        id: f.id,
        label: f.name,
        hint: folderName(f.folder),
        to: `/files/${f.id}`,
        icon: <FileIcon kind={f.kind} size="sm" />,
      })),
  ].slice(0, 8);
  const close = () => {
    setQuery("");
    onClose();
  };
  const go = (to: string) => {
    navigate(to);
    close();
  };
  return (
    <Dialog
      open={open}
      onClose={close}
      title={<span className="sr-only">Search files and folders</span>}
      className="mt-24 w-full max-w-lg rounded-xl bg-white p-2 text-slate-900 shadow-2xl animate-slide-in"
      testId="command-palette"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (results[0]) go(results[0].to);
        }}
      >
        <label
          className={cx("flex items-center gap-2 border-b px-3 py-2", line)}
        >
          <Search className="size-4 text-slate-400" aria-hidden />
          <span className="sr-only">Search files and folders</span>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files and folders…"
            className="flex-1 bg-transparent py-1 text-sm focus:outline-none"
            data-testid="search"
          />
          <kbd
            className={cx(
              "rounded border bg-slate-50 px-1.5 text-xs text-slate-500",
              line,
            )}
          >
            Esc
          </kbd>
        </label>
      </form>
      <ul className="max-h-80 overflow-auto p-1 text-sm">
        {results.length === 0 && (
          <li className="px-3 py-2 text-slate-500">No results</li>
        )}
        {results.map((r) => (
          <li key={r.to}>
            <button
              type="button"
              onClick={() => go(r.to)}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left hover:bg-sky-50 focus-visible:bg-sky-50 focus-visible:outline-2 focus-visible:outline-[#0284C7]"
              data-testid={`search-result-${r.id}`}
            >
              {r.icon}
              <span className="min-w-0 flex-1 truncate">{r.label}</span>
              <span className="text-xs text-slate-400">{r.hint}</span>
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}

function SidebarNav({
  v,
  files,
  desktop,
  dropTarget,
  setDropTarget,
  onDrop,
}: {
  v: boolean;
  files: FileItem[];
  desktop: boolean;
  dropTarget: string;
  setDropTarget: (id: string) => void;
  onDrop: (e: DragEvent, folder: FolderItem) => void;
}) {
  const sharedCount = files.filter((f) => f.owner !== me).length;
  const item = (active: boolean) =>
    cx(
      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm",
      active
        ? "bg-sky-50 font-medium text-sky-800"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      focusRing,
    );
  const dnd = v && desktop;
  return (
    <nav aria-label="Files" className="flex flex-col gap-6">
      <div className="flex flex-col gap-0.5">
        <NavLink to="/" end className={({ isActive }) => item(isActive)}>
          <HardDrive className="size-4" aria-hidden /> My files
        </NavLink>
        <NavLink to="/recent" className={({ isActive }) => item(isActive)}>
          <Clock className="size-4" aria-hidden /> Recent
        </NavLink>
        <NavLink to="/shared" className={({ isActive }) => item(isActive)}>
          <Users className="size-4" aria-hidden />
          <span className="flex-1">Shared with me</span>
          <span className="text-xs text-slate-400 tabular-nums">
            {sharedCount}
          </span>
        </NavLink>
      </div>
      <div className="flex flex-col gap-0.5">
        <h2 className="px-2.5 pb-1 text-xs font-medium text-slate-400">
          Folders
        </h2>
        {folders.map((f) => (
          <NavLink
            key={f.id}
            to={`/folders/${f.id}`}
            onDragOver={
              dnd
                ? (e) => {
                    if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setDropTarget(f.id);
                  }
                : undefined
            }
            onDragLeave={dnd ? () => setDropTarget("") : undefined}
            onDrop={dnd ? (e) => onDrop(e, f) : undefined}
            className={({ isActive }) =>
              cx(
                item(isActive),
                dnd &&
                  dropTarget === f.id &&
                  "bg-sky-100 text-sky-900 ring-2 ring-[#0284C7]",
              )
            }
            data-testid={desktop ? `nav-folder-${f.id}` : undefined}
          >
            <Folder className="size-4" aria-hidden />
            <span className="flex-1 truncate">{f.name}</span>
            <span className="text-xs text-slate-400 tabular-nums">
              {files.filter((file) => file.folder === f.id).length}
            </span>
          </NavLink>
        ))}
      </div>
      <div className={cx("flex flex-col gap-0.5 border-t pt-4", line)}>
        <NavLink to="/settings" className={({ isActive }) => item(isActive)}>
          <Settings className="size-4" aria-hidden /> Settings
        </NavLink>
      </div>
    </nav>
  );
}

function WorkspaceSwitcher({ toast }: { toast: (m: string) => void }) {
  return (
    <Menu
      label="Switch workspace"
      triggerClassName={cx(
        "flex w-full items-center gap-2.5 rounded-lg border bg-white px-2.5 py-2 text-left hover:bg-slate-50",
        line,
        focusRing,
      )}
      trigger={
        <>
          <span className="grid size-7 place-items-center rounded-md bg-slate-900 text-xs font-semibold text-white">
            HS
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-slate-900">
              Harbor Studio
            </span>
            <span className="block text-xs text-slate-500">Team plan</span>
          </span>
          <ChevronsUpDown className="size-4 text-slate-400" aria-hidden />
        </>
      }
      items={[
        {
          label: "Harbor Studio",
          onSelect: () => toast("You're already in Harbor Studio"),
        },
        {
          label: "Dana's personal files",
          onSelect: () => toast("Switched to Dana's personal files"),
        },
        {
          label: "Create workspace",
          onSelect: () => toast("Workspace setup opened"),
        },
      ]}
    />
  );
}

function Shell({ v, files, actions, toast }: PageProps) {
  const navigate = useNavigate();
  const [palette, setPalette] = useState(false);
  const [dropTarget, setDropTarget] = useState("");
  const [view, setView] = useState<View>("list");
  const used = OTHER_USAGE + files.reduce((s, f) => s + f.bytes, 0);

  useEffect(() => {
    if (!v) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [v]);

  const drop = (e: DragEvent, folder: FolderItem) => {
    e.preventDefault();
    setDropTarget("");
    const ids = e.dataTransfer.getData(DRAG_TYPE).split(",").filter(Boolean);
    const moving = ids.filter(
      (fileId) => files.find((f) => f.id === fileId)?.folder !== folder.id,
    );
    if (moving.length === 0) return;
    actions.move(moving, folder.id);
    toast(`Moved ${plural(moving.length)} to ${folder.name}`);
  };
  const navProps = { v, files, dropTarget, setDropTarget, onDrop: drop };
  const listProps = { v, files, actions, toast, view, setView };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900">
      <aside
        className={cx(
          "sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-5 overflow-y-auto border-r bg-white p-4 md:flex",
          line,
        )}
      >
        <div
          className="flex items-center gap-2 px-1 text-[17px] font-semibold tracking-tight"
          data-testid="logo"
        >
          <BrandMark className="size-7" />
          Filebox
        </div>
        <WorkspaceSwitcher toast={toast} />
        <SidebarNav {...navProps} desktop />
        <div className="mt-auto">
          <StorageMeter used={used} />
          <button
            type="button"
            className={cx(
              "mt-2 rounded-sm text-xs font-medium hover:underline",
              accentText,
              focusRing,
            )}
            onClick={() => navigate("/settings")}
          >
            Manage storage
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          className={cx(
            "sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-white px-4 sm:px-6",
            line,
          )}
        >
          <MobileNav label="Navigation" className="bg-white">
            <div className="flex flex-col gap-5 text-slate-900">
              <span className="flex items-center gap-2 font-semibold">
                <BrandMark className="size-7" /> Filebox
              </span>
              <SidebarNav {...navProps} desktop={false} />
              <StorageMeter used={used} />
            </div>
          </MobileNav>
          <span className="flex shrink-0 items-center gap-2 font-semibold md:hidden">
            <BrandMark className="size-6" />
            <span className="sr-only">Filebox</span>
          </span>
          {v ? (
            <button
              type="button"
              onClick={() => setPalette(true)}
              className={cx(
                "inline-flex h-9 w-full max-w-xs items-center gap-2 rounded-md border bg-slate-50 px-3 text-sm text-slate-500 hover:bg-white",
                line,
                focusRing,
              )}
              data-testid="open-search"
            >
              <Search className="size-4" aria-hidden />
              <span className="flex-1 text-left">Search</span>
              <kbd
                className={cx(
                  "rounded border bg-white px-1.5 font-sans text-xs",
                  line,
                )}
              >
                ⌘K
              </kbd>
            </button>
          ) : (
            <SearchBox files={files} />
          )}
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label="Help"
              className={cx(
                "hidden size-9 place-items-center rounded-lg text-slate-600 hover:bg-black/5 sm:grid",
                focusRing,
              )}
              onClick={() => toast("Help center opened")}
            >
              <CircleHelp className="size-5" aria-hidden />
            </button>
            <NotificationsMenu
              items={notifications}
              triggerClassName={cx("text-slate-600", focusRing)}
            />
            <span className="ml-1 flex">
              <UserMenu
                name={me}
                email={myEmail}
                items={["Profile", "Settings"]}
                onSelect={(item) =>
                  item === "Settings"
                    ? navigate("/settings")
                    : toast(
                        item === "Sign out" ? "Signed out" : "Profile opened",
                      )
                }
              />
            </span>
          </div>
        </div>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Routes>
            <Route
              index
              element={
                <Home v={v} files={files} actions={actions} toast={toast} />
              }
            />
            <Route path="recent" element={<RecentPage {...listProps} />} />
            <Route path="shared" element={<SharedPage {...listProps} />} />
            <Route path="folders/:id" element={<FolderPage {...listProps} />} />
            <Route
              path="files/:id"
              element={
                <FilePage v={v} files={files} actions={actions} toast={toast} />
              }
            />
            <Route
              path="settings"
              element={<SettingsPage toast={toast} used={used} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      {v && (
        <Palette
          open={palette}
          onClose={() => setPalette(false)}
          files={files}
        />
      )}
    </div>
  );
}

export default function App({ variant }: { variant: Variant }) {
  const v = variant === "variant";
  const [files, setFiles] = useState(seed);
  const [toasts, toast] = useToasts("bg-slate-900 text-white");

  const actions: Actions = {
    move: (ids, folder) =>
      setFiles((cur) =>
        cur.map((f) => (ids.includes(f.id) ? { ...f, folder } : f)),
      ),
    remove: (ids) => setFiles((cur) => cur.filter((f) => !ids.includes(f.id))),
    describe: (id, description) =>
      setFiles((cur) =>
        cur.map((f) => (f.id === id ? { ...f, description } : f)),
      ),
    add: (items) => setFiles((cur) => [...items, ...cur]),
  };

  return (
    <div style={font}>
      <HashRouter>
        <Shell v={v} files={files} actions={actions} toast={toast} />
      </HashRouter>
      {toasts}
    </div>
  );
}
