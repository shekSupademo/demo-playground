import {
  ArrowLeft,
  FileText,
  Folder,
  Hash,
  NotebookPen,
  Plus,
  Search,
  X,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import {
  HashRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import type { Variant } from "../../registry";
import { cx, useToasts } from "../../ui";

type Note = {
  id: string;
  folder: string;
  title: string;
  body: string;
  tags: string[];
  updated: string;
};

const folders = [
  { id: "work", name: "Work" },
  { id: "personal", name: "Personal" },
  { id: "recipes", name: "Recipes" },
  { id: "travel", name: "Travel" },
];

const seed: Note[] = [
  {
    id: "n1",
    folder: "work",
    title: "Q1 roadmap sync",
    body: "Agenda:\n- Review onboarding funnel numbers\n- Decide on the pricing page test\n- Owners for the API docs refresh",
    tags: ["meetings", "planning"],
    updated: "Today, 9:42",
  },
  {
    id: "n2",
    folder: "work",
    title: "Hiring loop feedback",
    body: "Strong systems design answer. Wants more ownership of the mobile client. Follow up on notice period.",
    tags: ["hiring"],
    updated: "Yesterday",
  },
  {
    id: "n3",
    folder: "personal",
    title: "Books to read this winter",
    body: "The Overstory, Piranesi, A Psalm for the Wild-Built, Tomorrow and Tomorrow and Tomorrow",
    tags: ["reading"],
    updated: "Nov 22",
  },
  {
    id: "n4",
    folder: "recipes",
    title: "Weeknight miso salmon",
    body: "2 tbsp white miso, 1 tbsp mirin, 1 tsp honey. Brush on salmon, broil 8 minutes. Serve with rice and charred broccolini.",
    tags: ["dinner", "quick"],
    updated: "Nov 19",
  },
  {
    id: "n5",
    folder: "travel",
    title: "Lisbon trip checklist",
    body: "Book the Sintra day trip, reserve Cervejaria Ramiro, buy Viva Viagem card at the airport.",
    tags: ["planning"],
    updated: "Nov 14",
  },
];

type Actions = {
  notes: Note[];
  folder: string;
  setFolder: (f: string) => void;
  update: (id: string, change: Partial<Note>) => void;
  create: () => string;
};

function folderName(id: string) {
  return folders.find((f) => f.id === id)?.name ?? "Notes";
}

function ThreePane({ notes, folder, setFolder, update, create }: Actions) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tag, setTag] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const allTags = [...new Set(notes.flatMap((n) => n.tags))].sort();
  const shown = notes.filter(
    (n) =>
      (folder === "all" || n.folder === folder) &&
      (!tag || n.tags.includes(tag)),
  );
  const note = notes.find((n) => n.id === id);

  function addTag(event: FormEvent) {
    event.preventDefault();
    const value = newTag.trim().toLowerCase().replace(/^#/, "");
    if (!note || !value || note.tags.includes(value)) return setNewTag("");
    update(note.id, { tags: [...note.tags, value] });
    setNewTag("");
  }

  return (
    <div className="flex h-screen bg-white text-gray-900">
      <aside className="flex w-56 shrink-0 flex-col gap-6 border-r border-gray-200 bg-gray-50 p-4">
        <div
          className="flex items-center gap-2 font-semibold"
          data-testid="logo"
        >
          <span className="grid size-7 place-items-center rounded-md bg-amber-400 text-gray-900">
            <FileText className="size-4" aria-hidden />
          </span>
          Notely
        </div>
        <nav aria-label="Folders" className="flex flex-col gap-0.5">
          <h2 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Folders
          </h2>
          {[{ id: "all", name: "All notes" }, ...folders].map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={folder === f.id}
              onClick={() => setFolder(f.id)}
              className={cx(
                "flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm",
                folder === f.id
                  ? "bg-amber-100 font-medium text-amber-900"
                  : "text-gray-600 hover:bg-gray-100",
              )}
              data-testid={`folder-${f.id}`}
            >
              <span className="flex items-center gap-2">
                <Folder className="size-4" aria-hidden /> {f.name}
              </span>
              <span className="text-xs text-gray-400">
                {
                  notes.filter((n) => f.id === "all" || n.folder === f.id)
                    .length
                }
              </span>
            </button>
          ))}
        </nav>
        <section aria-label="Tags" data-testid="tag-filter">
          <h2 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Tags
          </h2>
          <div className="flex flex-wrap gap-1 px-1">
            {allTags.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tag === t}
                onClick={() => setTag(tag === t ? null : t)}
                className={cx(
                  "rounded-full px-2 py-0.5 text-xs",
                  tag === t
                    ? "bg-amber-400 text-gray-900"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300",
                )}
                data-testid={`tag-filter-${t}`}
              >
                #{t}
              </button>
            ))}
          </div>
        </section>
      </aside>

      <section
        aria-label="Notes"
        className="flex w-72 shrink-0 flex-col border-r border-gray-200"
      >
        <header className="flex items-center justify-between border-b border-gray-200 p-3">
          <h1 className="font-semibold">
            {folder === "all" ? "All notes" : folderName(folder)}
          </h1>
          <button
            type="button"
            onClick={() => navigate(`/notes/${create()}`)}
            className="inline-flex items-center gap-1 rounded-md bg-amber-400 px-2.5 py-1.5 text-sm font-medium text-gray-900 hover:bg-amber-300"
            data-testid="new-note"
          >
            <Plus className="size-4" aria-hidden /> New note
          </button>
        </header>
        <ul className="flex-1 overflow-y-auto">
          {shown.map((n) => (
            <li key={n.id}>
              <Link
                to={`/notes/${n.id}`}
                aria-current={n.id === id ? "page" : undefined}
                className={cx(
                  "block border-b border-gray-100 px-3 py-3",
                  n.id === id ? "bg-amber-50" : "hover:bg-gray-50",
                )}
                data-testid={`note-${n.id}`}
              >
                <p className="truncate text-sm font-medium">{n.title}</p>
                <p className="truncate text-xs text-gray-500">
                  {n.updated} · {n.body.split("\n")[0] || "No content"}
                </p>
                {n.tags.length > 0 && (
                  <p className="mt-1 flex flex-wrap gap-1">
                    {n.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-gray-100 px-1.5 text-xs text-gray-600"
                      >
                        #{t}
                      </span>
                    ))}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <main className="flex flex-1 flex-col overflow-y-auto p-6">
        {note ? (
          <>
            <p className="text-xs text-gray-500">
              {folderName(note.folder)} · Edited {note.updated}
            </p>
            <input
              value={note.title}
              onChange={(e) =>
                update(note.id, { title: e.target.value, updated: "Just now" })
              }
              aria-label="Note title"
              className="mt-1 text-2xl font-semibold focus:outline-none"
              data-testid="note-title"
            />
            <div
              className="mt-3 flex flex-wrap items-center gap-1.5"
              data-testid="note-tags"
            >
              {note.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900"
                >
                  #{t}
                  <button
                    type="button"
                    aria-label={`Remove tag ${t}`}
                    onClick={() =>
                      update(note.id, {
                        tags: note.tags.filter((x) => x !== t),
                      })
                    }
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </span>
              ))}
              <form onSubmit={addTag} className="flex items-center gap-1">
                <label className="flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-500">
                  <Hash className="size-3" aria-hidden />
                  <span className="sr-only">Add tag</span>
                  <input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag"
                    className="w-20 bg-transparent focus:outline-none"
                    data-testid="tag-input"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-full px-2 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
                  data-testid="add-tag"
                >
                  Add
                </button>
              </form>
            </div>
            <textarea
              value={note.body}
              onChange={(e) =>
                update(note.id, { body: e.target.value, updated: "Just now" })
              }
              aria-label="Note body"
              placeholder="Start writing…"
              className="mt-4 flex-1 resize-none text-sm leading-6 focus:outline-none"
              data-testid="note-body"
            />
          </>
        ) : (
          <div
            className="m-auto text-center text-sm text-gray-500"
            data-testid="empty-editor"
          >
            <FileText
              className="mx-auto mb-2 size-8 text-gray-300"
              aria-hidden
            />
            Select a note to start editing.
          </div>
        )}
      </main>
    </div>
  );
}

function TopBar({
  folder,
  setFolder,
  create,
  query,
  setQuery,
}: Pick<Actions, "folder" | "setFolder" | "create"> & {
  query: string;
  setQuery: (q: string) => void;
}) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-[#faf7f2]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-8 py-4">
        <div
          className="flex items-center gap-2 font-serif text-2xl text-stone-900"
          data-testid="logo"
        >
          <NotebookPen className="size-6 text-rose-700" aria-hidden />
          Notely
        </div>
        <label className="relative min-w-60 flex-1">
          <span className="sr-only">Search notes</span>
          <Search
            className="absolute top-2.5 left-3 size-4 text-stone-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your notes"
            className="w-full rounded-full border border-stone-300 bg-white py-2 pr-4 pl-9 text-sm focus:border-rose-600 focus:outline-none"
            data-testid="note-search"
          />
        </label>
        <button
          type="button"
          onClick={() => navigate(`/notes/${create()}`)}
          className="inline-flex items-center gap-2 rounded-full bg-rose-700 px-5 py-2 text-sm font-medium text-white hover:bg-rose-800"
          data-testid="new-note"
        >
          <Plus className="size-4" aria-hidden /> New note
        </button>
      </div>
      <nav
        aria-label="Folders"
        className="mx-auto flex max-w-6xl flex-wrap gap-2 px-8 pb-4"
      >
        {[{ id: "all", name: "All notes" }, ...folders].map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={folder === f.id}
            onClick={() => setFolder(f.id)}
            className={cx(
              "rounded-full border px-4 py-1.5 text-sm",
              folder === f.id
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-300 text-stone-600 hover:border-stone-500",
            )}
            data-testid={`folder-${f.id}`}
          >
            {f.name}
          </button>
        ))}
      </nav>
    </header>
  );
}

function CardGrid({ notes, folder, setFolder, create }: Actions) {
  const [query, setQuery] = useState("");
  const q = query.toLowerCase();
  const shown = notes.filter(
    (n) =>
      (folder === "all" || n.folder === folder) &&
      (n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)),
  );
  return (
    <div className="min-h-screen bg-[#faf7f2] text-stone-900">
      <TopBar
        folder={folder}
        setFolder={setFolder}
        create={create}
        query={query}
        setQuery={setQuery}
      />
      <main className="mx-auto max-w-6xl px-8 py-8">
        <h1 className="sr-only">
          {folder === "all" ? "All notes" : folderName(folder)}
        </h1>
        {shown.length === 0 ? (
          <p className="py-16 text-center font-serif text-lg text-stone-500">
            No notes here yet.
          </p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((n) => (
              <li key={n.id}>
                <Link
                  to={`/notes/${n.id}`}
                  className="animate-fade-up flex h-52 flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  data-testid={`note-${n.id}`}
                >
                  <span className="text-xs font-medium uppercase tracking-widest text-rose-700">
                    {folderName(n.folder)}
                  </span>
                  <span className="mt-2 font-serif text-xl leading-snug">
                    {n.title}
                  </span>
                  <span className="mt-2 line-clamp-3 text-sm text-stone-600">
                    {n.body || "Empty note"}
                  </span>
                  <span className="mt-auto pt-3 text-xs text-stone-400">
                    {n.updated}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function FullEditor({ notes, update }: Actions) {
  const { id } = useParams();
  const note = notes.find((n) => n.id === id);
  if (!note) return <Navigate to="/" replace />;
  return (
    <div className="min-h-screen bg-[#faf7f2] text-stone-900">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-8 py-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-200/60"
          data-testid="back-to-notes"
        >
          <ArrowLeft className="size-4" aria-hidden /> All notes
        </Link>
        <span className="text-xs uppercase tracking-widest text-rose-700">
          {folderName(note.folder)} · {note.updated}
        </span>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col px-8 pb-16">
        <input
          value={note.title}
          onChange={(e) =>
            update(note.id, { title: e.target.value, updated: "Just now" })
          }
          aria-label="Note title"
          className="bg-transparent font-serif text-4xl leading-tight focus:outline-none"
          data-testid="note-title"
        />
        <textarea
          value={note.body}
          onChange={(e) =>
            update(note.id, { body: e.target.value, updated: "Just now" })
          }
          aria-label="Note body"
          placeholder="Start writing…"
          rows={18}
          className="mt-6 resize-none bg-transparent font-serif text-lg leading-8 text-stone-800 focus:outline-none"
          data-testid="note-body"
        />
      </main>
    </div>
  );
}

export default function App({ variant }: { variant: Variant }) {
  const v = variant === "variant";
  const [notes, setNotes] = useState(seed);
  const [folder, setFolder] = useState("all");
  const [toasts, toast] = useToasts(
    v ? "rounded-full bg-stone-900 text-white" : "bg-gray-900 text-white",
  );

  const update = (id: string, change: Partial<Note>) =>
    setNotes((current) =>
      current.map((n) => (n.id === id ? { ...n, ...change } : n)),
    );
  const create = () => {
    const id = `n-${Date.now()}`;
    const target = folder === "all" ? "personal" : folder;
    setNotes((current) => [
      {
        id,
        folder: target,
        title: "Untitled note",
        body: "",
        tags: [],
        updated: "Just now",
      },
      ...current,
    ]);
    toast(`Note created in ${folderName(target)}`);
    return id;
  };

  const actions: Actions = { notes, folder, setFolder, update, create };

  return (
    <HashRouter>
      <Routes>
        {v ? (
          <>
            <Route index element={<CardGrid {...actions} />} />
            <Route path="notes/:id" element={<FullEditor {...actions} />} />
          </>
        ) : (
          <>
            <Route index element={<ThreePane {...actions} />} />
            <Route path="notes/:id" element={<ThreePane {...actions} />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {toasts}
    </HashRouter>
  );
}
