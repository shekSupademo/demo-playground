import {
  ArrowLeft,
  Check,
  Cloud,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderInput,
  GripVertical,
  HardDrive,
  Search,
  Trash2,
} from "lucide-react";
import { type DragEvent, useEffect, useRef, useState } from "react";
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
import type { Variant } from "../../registry";
import { cx, Dialog, useToasts } from "../../ui";

type Kind = "doc" | "image" | "sheet";
type FolderItem = { id: string; name: string };
type FileItem = {
  id: string;
  name: string;
  folder: string;
  kind: Kind;
  size: string;
  modified: string;
  description: string;
};

const folders: FolderItem[] = [
  { id: "documents", name: "Documents" },
  { id: "photos", name: "Photos" },
  { id: "invoices", name: "Invoices" },
  { id: "projects", name: "Projects" },
  { id: "archive", name: "Archive" },
];

const seed: FileItem[] = [
  {
    id: "lease",
    name: "Apartment lease 2026.pdf",
    folder: "documents",
    kind: "doc",
    size: "1.2 MB",
    modified: "Nov 18, 2026",
    description: "Signed lease for the Elm Street apartment.",
  },
  {
    id: "resume",
    name: "Resume - Dana Whitfield.docx",
    folder: "documents",
    kind: "doc",
    size: "84 KB",
    modified: "Nov 02, 2026",
    description: "",
  },
  {
    id: "taxes",
    name: "Tax return 2025.pdf",
    folder: "documents",
    kind: "doc",
    size: "2.4 MB",
    modified: "Apr 11, 2026",
    description: "Federal and state return, filed April 11.",
  },
  {
    id: "budget",
    name: "Household budget.xlsx",
    folder: "documents",
    kind: "sheet",
    size: "56 KB",
    modified: "Nov 21, 2026",
    description: "",
  },
  {
    id: "beach",
    name: "Lisbon beach sunset.jpg",
    folder: "photos",
    kind: "image",
    size: "4.8 MB",
    modified: "Sep 14, 2026",
    description: "Praia da Rainha, last evening of the trip.",
  },
  {
    id: "team",
    name: "Team photo offsite.png",
    folder: "photos",
    kind: "image",
    size: "6.1 MB",
    modified: "Oct 03, 2026",
    description: "",
  },
  {
    id: "inv-1042",
    name: "Invoice 1042 - Northwind.pdf",
    folder: "invoices",
    kind: "doc",
    size: "212 KB",
    modified: "Nov 20, 2026",
    description: "Due December 20.",
  },
  {
    id: "inv-1043",
    name: "Invoice 1043 - Contoso.pdf",
    folder: "invoices",
    kind: "doc",
    size: "198 KB",
    modified: "Nov 22, 2026",
    description: "",
  },
  {
    id: "roadmap",
    name: "Product roadmap Q1.xlsx",
    folder: "projects",
    kind: "sheet",
    size: "130 KB",
    modified: "Nov 24, 2026",
    description: "Draft for the January planning session.",
  },
  {
    id: "brief",
    name: "Brand refresh brief.docx",
    folder: "projects",
    kind: "doc",
    size: "340 KB",
    modified: "Nov 10, 2026",
    description: "",
  },
];

const DRAG_TYPE = "application/x-filebox-files";
const kindIcon = { doc: FileText, image: FileImage, sheet: FileSpreadsheet };
const folderName = (id: string) => folders.find((f) => f.id === id)?.name ?? id;
const plural = (n: number) => `${n} ${n === 1 ? "file" : "files"}`;
const primary =
  "rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50";
const secondary =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-100";

type Actions = {
  move: (ids: string[], folder: string) => void;
  remove: (ids: string[]) => void;
  describe: (id: string, text: string) => void;
};
type PageProps = {
  v: boolean;
  files: FileItem[];
  actions: Actions;
  toast: (m: string) => void;
};

function FolderPicker({
  open,
  onClose,
  current,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  current: string;
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
        className="mt-4 flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!choice) return;
          onPick(choice);
          setChoice("");
        }}
      >
        <fieldset className="flex flex-col gap-1">
          <legend className="sr-only">Destination folder</legend>
          {folders
            .filter((f) => f.id !== current)
            .map((f) => (
              <label
                key={f.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100"
              >
                <input
                  type="radio"
                  name="destination"
                  value={f.id}
                  checked={choice === f.id}
                  onChange={() => setChoice(f.id)}
                  data-testid={`move-target-${f.id}`}
                />
                <Folder className="size-4 text-sky-600" aria-hidden />
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
            Move
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function Home({ v, files }: { v: boolean; files: FileItem[] }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("");
  const recent = [...files]
    .sort((a, b) => Date.parse(b.modified) - Date.parse(a.modified))
    .slice(0, 4);
  const tile =
    "flex w-full flex-col items-start gap-1 rounded-xl border p-4 text-left";
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">My files</h1>
        <p className="text-sm text-slate-500">
          {v
            ? "Click a folder to select it. Double-click to open it."
            : "Pick a folder to see what's inside."}
        </p>
      </header>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {folders.map((f) => {
          const body = (
            <>
              <Folder
                className="size-10 fill-sky-100 text-sky-600"
                aria-hidden
              />
              <span className="font-medium">{f.name}</span>
              <span className="text-xs text-slate-500">
                {plural(files.filter((file) => file.folder === f.id).length)}
              </span>
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
                      ? "border-sky-500 bg-sky-50 ring-2 ring-sky-200"
                      : "border-slate-200 bg-white hover:bg-slate-50",
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
                  className={cx(
                    tile,
                    "border-slate-200 bg-white hover:bg-slate-50",
                  )}
                  data-testid={`folder-${f.id}`}
                >
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">Recent</h2>
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {recent.map((file) => {
            const Icon = kindIcon[file.kind];
            return (
              <li key={file.id}>
                <Link
                  to={`/files/${file.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50"
                >
                  <Icon className="size-4 text-slate-400" aria-hidden />
                  <span className="flex-1">{file.name}</span>
                  <span className="text-slate-500">
                    {folderName(file.folder)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function FolderPage({ v, files, actions, toast }: PageProps) {
  const { id = "" } = useParams();
  const [selected, setSelected] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);
  const folder = folders.find((f) => f.id === id);
  if (!folder) return <Navigate to="/" replace />;
  const shown = files.filter((f) => f.folder === id);
  const chosen = selected.filter((s) => shown.some((f) => f.id === s));
  const allSelected = shown.length > 0 && chosen.length === shown.length;

  const toggle = (fileId: string) =>
    setSelected((cur) =>
      cur.includes(fileId) ? cur.filter((s) => s !== fileId) : [...cur, fileId],
    );
  const removeOne = (file: FileItem) => {
    actions.remove([file.id]);
    toast(`Deleted ${file.name}`);
  };
  const removeSelected = () => {
    actions.remove(chosen);
    toast(`Deleted ${plural(chosen.length)}`);
    setSelected([]);
  };
  const dragStart = (e: DragEvent, fileId: string) => {
    const ids = chosen.includes(fileId) ? chosen : [fileId];
    e.dataTransfer.setData(DRAG_TYPE, ids.join(","));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex flex-col gap-4">
      <header>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> My files
        </Link>
        <h1 className="text-2xl font-semibold">{folder.name}</h1>
        {v && (
          <p className="text-sm text-slate-500">
            Drag files onto a folder in the sidebar to move them.
          </p>
        )}
      </header>
      {v && chosen.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm text-white animate-fade-up"
          data-testid="bulk-bar"
        >
          <span className="flex-1 font-medium">{chosen.length} selected</span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 hover:bg-white/25"
            onClick={() => setPicking(true)}
            data-testid="move-selected"
          >
            <FolderInput className="size-4" aria-hidden /> Move selected
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-rose-600 hover:bg-rose-50"
            onClick={removeSelected}
            data-testid="delete-selected"
          >
            <Trash2 className="size-4" aria-hidden /> Delete selected
          </button>
        </div>
      )}
      {shown.length === 0 ? (
        <p
          className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500"
          data-testid="empty-folder"
        >
          This folder is empty.
        </p>
      ) : (
        <table className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              {v && (
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label="Select all files"
                    checked={allSelected}
                    onChange={() =>
                      setSelected(allSelected ? [] : shown.map((f) => f.id))
                    }
                    data-testid="select-all"
                  />
                </th>
              )}
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Size</th>
              <th className="px-3 py-2 font-medium">Modified</th>
              <th className="w-12 px-3 py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((file) => {
              const Icon = kindIcon[file.kind];
              const isSelected = chosen.includes(file.id);
              return (
                <tr
                  key={file.id}
                  draggable={v}
                  onDragStart={v ? (e) => dragStart(e, file.id) : undefined}
                  className={cx(
                    isSelected ? "bg-sky-50" : "hover:bg-slate-50",
                    v && "cursor-grab",
                  )}
                  data-testid={`row-${file.id}`}
                >
                  {v && (
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label={`Select ${file.name}`}
                        checked={isSelected}
                        onChange={() => toggle(file.id)}
                        data-testid={`select-${file.id}`}
                      />
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      {v && (
                        <GripVertical
                          className="size-4 text-slate-300"
                          aria-hidden
                        />
                      )}
                      <Icon className="size-4 text-sky-600" aria-hidden />
                      <Link
                        to={`/files/${file.id}`}
                        className="hover:underline"
                        draggable={false}
                        data-testid={`file-${file.id}`}
                      >
                        {file.name}
                      </Link>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{file.size}</td>
                  <td className="px-3 py-2 text-slate-500">{file.modified}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      aria-label={`Delete ${file.name}`}
                      title="Delete"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => removeOne(file)}
                      data-testid={`delete-${file.id}`}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <FolderPicker
        open={picking}
        onClose={() => setPicking(false)}
        current={id}
        onPick={(target) => {
          actions.move(chosen, target);
          toast(`Moved ${plural(chosen.length)} to ${folderName(target)}`);
          setSelected([]);
          setPicking(false);
        }}
      />
    </div>
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
    <section className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <label htmlFor="file-description" className="text-sm font-semibold">
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
        placeholder="Add a note about this file"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
        data-testid="description"
      />
      {!v && (
        <button
          type="button"
          className={cx(primary, "self-end")}
          disabled={draft === file.description}
          onClick={() => {
            actions.describe(file.id, draft);
            toast("Description saved");
          }}
          data-testid="save-description"
        >
          Save
        </button>
      )}
    </section>
  );
}

function FilePage({ v, files, actions, toast }: PageProps) {
  const { id } = useParams();
  const [picking, setPicking] = useState(false);
  const file = files.find((f) => f.id === id);
  if (!file) return <Navigate to="/" replace />;
  const Icon = kindIcon[file.kind];

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Link
        to={`/folders/${file.folder}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:underline"
        data-testid="back-to-folder"
      >
        <ArrowLeft className="size-3.5" aria-hidden /> {folderName(file.folder)}
      </Link>
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
          "flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4",
          v && "cursor-grab",
        )}
        data-testid="file-card"
      >
        {v && <GripVertical className="size-4 text-slate-300" aria-hidden />}
        <Icon className="size-8 text-sky-600" aria-hidden />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{file.name}</h1>
          <p className="text-sm text-slate-500">
            {file.size} · Modified {file.modified} · in{" "}
            {folderName(file.folder)}
          </p>
        </div>
        {!v && (
          <button
            type="button"
            className={cx(secondary, "inline-flex items-center gap-1.5")}
            onClick={() => setPicking(true)}
            data-testid="move-file"
          >
            <FolderInput className="size-4" aria-hidden /> Move to…
          </button>
        )}
      </header>
      {v && (
        <p className="text-sm text-slate-500">
          Drag this file onto a folder in the sidebar to move it.
        </p>
      )}
      <Description
        key={file.id}
        v={v}
        file={file}
        actions={actions}
        toast={toast}
      />
      <FolderPicker
        open={picking}
        onClose={() => setPicking(false)}
        current={file.folder}
        onPick={(target) => {
          actions.move([file.id], target);
          toast(`Moved to ${folderName(target)}`);
          setPicking(false);
        }}
      />
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
          className="absolute top-2.5 left-3 size-4 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files"
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm focus:border-sky-500 focus:outline-none"
          data-testid="search"
        />
      </label>
      {q && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white p-1 text-sm shadow-lg">
          {results.length === 0 && (
            <li className="px-3 py-2 text-slate-500">No matching files</li>
          )}
          {results.map((f) => (
            <li key={f.id}>
              <Link
                to={`/files/${f.id}`}
                onClick={() => setQuery("")}
                className="flex justify-between gap-2 rounded-md px-3 py-2 hover:bg-slate-100"
                data-testid={`search-result-${f.id}`}
              >
                <span>{f.name}</span>
                <span className="text-slate-400">{folderName(f.folder)}</span>
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
        Icon: Folder,
      })),
    ...files
      .filter((f) => f.name.toLowerCase().includes(q))
      .map((f) => ({
        id: f.id,
        label: f.name,
        hint: folderName(f.folder),
        to: `/files/${f.id}`,
        Icon: kindIcon[f.kind],
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
        <label className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
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
        </label>
      </form>
      <ul className="max-h-80 overflow-auto p-1 text-sm">
        {results.length === 0 && (
          <li className="px-3 py-2 text-slate-500">No results</li>
        )}
        {results.map((r) => (
          <li key={`${r.to}`}>
            <button
              type="button"
              onClick={() => go(r.to)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-sky-50 focus-visible:bg-sky-50"
              data-testid={`search-result-${r.id}`}
            >
              <r.Icon className="size-4 text-sky-600" aria-hidden />
              <span className="flex-1">{r.label}</span>
              <span className="text-xs text-slate-400">{r.hint}</span>
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}

function Shell({ v, files, actions, toast }: PageProps) {
  const [palette, setPalette] = useState(false);
  const [dropTarget, setDropTarget] = useState("");

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

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-white p-4">
        <div
          className="mb-6 flex items-center gap-2 font-semibold"
          data-testid="logo"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-sky-600 text-white">
            <Cloud className="size-4" aria-hidden />
          </span>
          Filebox
        </div>
        <nav aria-label="Folders" className="flex flex-col gap-0.5 text-sm">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cx(
                "flex items-center gap-2 rounded-md px-3 py-2",
                isActive
                  ? "bg-sky-50 font-medium text-sky-700"
                  : "text-slate-600 hover:bg-slate-100",
              )
            }
          >
            <HardDrive className="size-4" aria-hidden /> My files
          </NavLink>
          {folders.map((f) => (
            <NavLink
              key={f.id}
              to={`/folders/${f.id}`}
              onDragOver={
                v
                  ? (e) => {
                      if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDropTarget(f.id);
                    }
                  : undefined
              }
              onDragLeave={v ? () => setDropTarget("") : undefined}
              onDrop={v ? (e) => drop(e, f) : undefined}
              className={({ isActive }) =>
                cx(
                  "flex items-center gap-2 rounded-md px-3 py-2",
                  dropTarget === f.id
                    ? "bg-sky-100 text-sky-800 ring-2 ring-sky-400"
                    : isActive
                      ? "bg-sky-50 font-medium text-sky-700"
                      : "text-slate-600 hover:bg-slate-100",
                )
              }
              data-testid={`nav-folder-${f.id}`}
            >
              <Folder className="size-4" aria-hidden />
              <span className="flex-1">{f.name}</span>
              <span className="text-xs text-slate-400">
                {files.filter((file) => file.folder === f.id).length}
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3">
          {v ? (
            <button
              type="button"
              onClick={() => setPalette(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50"
              data-testid="open-search"
            >
              <Search className="size-4" aria-hidden /> Search
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 font-sans text-xs">
                ⌘K
              </kbd>
            </button>
          ) : (
            <SearchBox files={files} />
          )}
          <span className="text-xs text-slate-500">
            {plural(files.length)} · 18.4 GB of 50 GB used
          </span>
        </div>
        <main className="flex-1 p-6">
          <Routes>
            <Route index element={<Home v={v} files={files} />} />
            <Route
              path="folders/:id"
              element={
                <FolderPage
                  v={v}
                  files={files}
                  actions={actions}
                  toast={toast}
                />
              }
            />
            <Route
              path="files/:id"
              element={
                <FilePage v={v} files={files} actions={actions} toast={toast} />
              }
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
  };

  return (
    <HashRouter>
      <Shell v={v} files={files} actions={actions} toast={toast} />
      {toasts}
    </HashRouter>
  );
}
