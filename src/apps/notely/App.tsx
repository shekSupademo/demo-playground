import {
  ArrowLeft,
  Bold,
  CircleHelp,
  Cloud,
  FileText,
  Folder as FolderIcon,
  Hash,
  Heading,
  Italic,
  List,
  ListOrdered,
  MoreHorizontal,
  NotebookPen,
  Pin,
  PinOff,
  Plus,
  Search,
  Settings,
  X,
} from "lucide-react";
import {
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useRef,
  useState,
} from "react";
import {
  HashRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  MobileNav,
  NotificationsMenu,
  relativeTime,
  UserMenu,
  useDocumentTitle,
} from "../../kit";
import type { Variant } from "../../registry";
import { cx, Dialog, Menu, useToasts } from "../../ui";
import {
  applyFormat,
  type Format,
  folderName,
  folders,
  type Note,
  notifications,
  seedNotes,
  wordCount,
} from "./data";

type Tone = "amber" | "rose";
type FontSize = "Small" | "Default" | "Large";
type Prefs = {
  name: string;
  fontSize: FontSize;
  spellcheck: boolean;
  defaultFolder: string;
};
type Sort = "updated" | "created" | "title";

type Actions = {
  notes: Note[];
  folder: string;
  setFolder: (f: string) => void;
  update: (id: string, change: Partial<Note>) => void;
  create: () => string;
  remove: (id: string) => void;
  duplicate: (id: string) => string;
  togglePin: (id: string) => void;
  prefs: Prefs;
  openPrefs: () => void;
  toast: (m: string) => void;
};

const sourceSans = {
  fontFamily: "'Source Sans 3', ui-sans-serif, system-ui, sans-serif",
};
const newsreader = {
  fontFamily: "Newsreader, Georgia, 'Times New Roman', serif",
};

const amberFocus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D97706]";
const roseFocus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE123C]";

const tones = {
  amber: {
    focus: amberFocus,
    primary:
      "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#D97706] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#B45309] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D97706] disabled:cursor-not-allowed disabled:opacity-50",
    secondary:
      "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 text-sm font-medium text-stone-700 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D97706]",
    field:
      "h-9 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 focus:border-[#D97706] focus:outline-none focus:ring-3 focus:ring-[#D97706]/15 aria-[invalid=true]:border-rose-500",
    dialog:
      "w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 text-stone-900 shadow-2xl",
  },
  rose: {
    focus: roseFocus,
    primary:
      "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#BE123C] px-5 text-sm font-medium text-white hover:bg-[#9F1239] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE123C] disabled:cursor-not-allowed disabled:opacity-50",
    secondary:
      "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-stone-300 bg-transparent px-5 text-sm font-medium text-stone-700 hover:border-stone-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE123C]",
    field:
      "h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 focus:border-[#BE123C] focus:outline-none focus:ring-3 focus:ring-[#BE123C]/15 aria-[invalid=true]:border-rose-600",
    dialog:
      "w-full max-w-lg rounded-3xl border border-stone-200 bg-[#fffdf9] p-7 text-stone-900 shadow-2xl",
  },
};

const baselineSizes: Record<FontSize, string> = {
  Small: "text-sm leading-6",
  Default: "text-[15px] leading-7",
  Large: "text-lg leading-8",
};
const variantSizes: Record<FontSize, string> = {
  Small: "text-base leading-7",
  Default: "text-lg leading-8",
  Large: "text-xl leading-9",
};

const now = () => new Date().toISOString();

const localDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function edited(iso: string) {
  const value = relativeTime(iso);
  return /\d{4}/.test(value) ? `on ${value}` : value.toLowerCase();
}

const snippet = (body: string) =>
  body
    .split("\n")
    .map((line) =>
      line
        .replace(/^(- |\d+\. |# )/, "")
        .replace(/[*_]/g, "")
        .trim(),
    )
    .filter(Boolean)
    .join(" ");

function sortNotes(list: Note[], sort: Sort) {
  return [...list].sort((a, b) =>
    sort === "title"
      ? a.title.localeCompare(b.title)
      : sort === "created"
        ? b.created.localeCompare(a.created)
        : b.updated.localeCompare(a.updated),
  );
}

function BrandMark({ tone, size = 28 }: { tone: Tone; size?: number }) {
  const fill = tone === "amber" ? "#D97706" : "#BE123C";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" fill={fill} />
      <path d="M9 7h10l5 5v13H9Z" fill="#fff" />
      <path d="M19 7v5h5" fill={tone === "amber" ? "#FDE68A" : "#FECDD3"} />
      <path
        d="M12.5 16h8M12.5 19.5h8M12.5 23h5"
        stroke={fill}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function useFormatter(note: Note, update: Actions["update"]) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const format = (kind: Format) => {
    const el = ref.current;
    if (!el) return;
    const next = applyFormat(
      note.body,
      el.selectionStart,
      el.selectionEnd,
      kind,
    );
    update(note.id, { body: next.text, updated: now() });
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(next.start, next.end);
    }, 0);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(event.metaKey || event.ctrlKey)) return;
    const key = event.key.toLowerCase();
    if (key === "b" || key === "i") {
      event.preventDefault();
      format(key === "b" ? "bold" : "italic");
    }
  };
  return { ref, format, onKeyDown };
}

const formats: { kind: Format; label: string; icon: ReactNode }[] = [
  {
    kind: "bold",
    label: "Bold",
    icon: <Bold className="size-4" aria-hidden />,
  },
  {
    kind: "italic",
    label: "Italic",
    icon: <Italic className="size-4" aria-hidden />,
  },
  {
    kind: "heading",
    label: "Heading",
    icon: <Heading className="size-4" aria-hidden />,
  },
  {
    kind: "bullet",
    label: "Bulleted list",
    icon: <List className="size-4" aria-hidden />,
  },
  {
    kind: "number",
    label: "Numbered list",
    icon: <ListOrdered className="size-4" aria-hidden />,
  },
];

function Toolbar({
  onFormat,
  className,
  buttonClassName,
}: {
  onFormat: (kind: Format) => void;
  className: string;
  buttonClassName: string;
}) {
  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className={className}
      data-testid="format-toolbar"
    >
      {formats.map((f) => (
        <button
          key={f.kind}
          type="button"
          aria-label={f.label}
          title={
            f.kind === "bold"
              ? "Bold (Ctrl+B)"
              : f.kind === "italic"
                ? "Italic (Ctrl+I)"
                : f.label
          }
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onFormat(f.kind)}
          className={buttonClassName}
          data-testid={`format-${f.kind}`}
        >
          {f.icon}
        </button>
      ))}
    </div>
  );
}

function NoteMenu({
  note,
  actions,
  triggerClassName,
}: {
  note: Note;
  actions: Actions;
  triggerClassName: string;
}) {
  const navigate = useNavigate();
  return (
    <Menu
      label="More note actions"
      triggerClassName={triggerClassName}
      trigger={<MoreHorizontal className="size-4" aria-hidden />}
      items={[
        {
          label: "Duplicate note",
          onSelect: () => navigate(`/notes/${actions.duplicate(note.id)}`),
        },
        {
          label: "Delete note",
          danger: true,
          onSelect: () => {
            actions.remove(note.id);
            navigate("/");
          },
        },
      ]}
    />
  );
}

function PreferencesDialog({
  open,
  onClose,
  prefs,
  onSave,
  tone,
}: {
  open: boolean;
  onClose: () => void;
  prefs: Prefs;
  onSave: (p: Prefs) => void;
  tone: Tone;
}) {
  const t = tones[tone];
  const [form, setForm] = useState(prefs);
  const [error, setError] = useState("");
  const dirty = JSON.stringify(form) !== JSON.stringify(prefs);
  const cancel = () => {
    setForm(prefs);
    setError("");
    onClose();
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Enter a display name.");
      return;
    }
    onSave({ ...form, name: form.name.trim() });
  }

  return (
    <Dialog
      open={open}
      onClose={cancel}
      title="Preferences"
      className={t.dialog}
      testId="preferences-dialog"
    >
      <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-3 text-sm font-semibold text-stone-900">
            Account
          </legend>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-stone-800">Display name</span>
            <input
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setError("");
              }}
              aria-invalid={Boolean(error)}
              aria-describedby="pref-name-error"
              className={t.field}
            />
            {error && (
              <span id="pref-name-error" className="text-rose-600">
                {error}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-stone-800">New notes go to</span>
            <select
              value={form.defaultFolder}
              onChange={(e) =>
                setForm({ ...form, defaultFolder: e.target.value })
              }
              className={t.field}
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-stone-500">
              Used when you create a note from All notes.
            </span>
          </label>
        </fieldset>
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-3 text-sm font-semibold text-stone-900">
            Editor
          </legend>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-stone-800">Text size</span>
            <select
              value={form.fontSize}
              onChange={(e) =>
                setForm({ ...form, fontSize: e.target.value as FontSize })
              }
              className={t.field}
            >
              <option>Small</option>
              <option>Default</option>
              <option>Large</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>
              <span className="block font-medium text-stone-800">
                Check spelling
              </span>
              <span className="block text-stone-500">
                Underline misspelled words as you type.
              </span>
            </span>
            <input
              type="checkbox"
              checked={form.spellcheck}
              onChange={(e) =>
                setForm({ ...form, spellcheck: e.target.checked })
              }
              className={cx(
                "size-4",
                tone === "amber" ? "accent-[#D97706]" : "accent-[#BE123C]",
                t.focus,
              )}
            />
          </label>
        </fieldset>
        <div className="flex justify-end gap-2">
          <button type="button" className={t.secondary} onClick={cancel}>
            Cancel
          </button>
          <button
            type="submit"
            className={t.primary}
            disabled={!dirty}
            data-testid="save-preferences"
          >
            Save changes
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function AccountControls({ actions, tone }: { actions: Actions; tone: Tone }) {
  const t = tones[tone];
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Help"
        onClick={() => actions.toast("Help center opened")}
        className={cx(
          "grid size-9 place-items-center rounded-lg text-stone-500 hover:bg-black/5 hover:text-stone-900",
          t.focus,
        )}
      >
        <CircleHelp className="size-5" aria-hidden />
      </button>
      <NotificationsMenu
        items={notifications}
        triggerClassName={cx("text-stone-500 hover:text-stone-900", t.focus)}
      />
      <div className="ml-1.5">
        <UserMenu
          name={actions.prefs.name}
          email="sam.carter@hey.com"
          items={["Preferences", "Keyboard shortcuts"]}
          onSelect={(item) =>
            item === "Preferences"
              ? actions.openPrefs()
              : item === "Keyboard shortcuts"
                ? actions.toast("Press Ctrl+B for bold and Ctrl+I for italic")
                : actions.toast("Signed out of Notely")
          }
        />
      </div>
    </div>
  );
}

function FolderSelect({
  note,
  update,
  className,
}: {
  note: Note;
  update: Actions["update"];
  className: string;
}) {
  return (
    <label className="inline-flex items-center gap-1.5">
      <FolderIcon className="size-3.5" aria-hidden />
      <span className="sr-only">Folder</span>
      <select
        value={note.folder}
        onChange={(e) =>
          update(note.id, { folder: e.target.value, updated: now() })
        }
        className={className}
        data-testid="note-folder"
      >
        {folders.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function Sidebar({
  actions,
  tag,
  setTag,
  mobile,
}: {
  actions: Actions;
  tag: string | null;
  setTag: (t: string | null) => void;
  mobile?: boolean;
}) {
  const { notes, folder, setFolder } = actions;
  const allTags = [...new Set(notes.flatMap((n) => n.tags))].sort();
  const tagCount = (t: string) =>
    notes.filter((n) => n.tags.includes(t)).length;
  const itemClass = (active: boolean) =>
    cx(
      "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm",
      amberFocus,
      active
        ? "bg-amber-100/70 font-semibold text-amber-950"
        : "text-stone-600 hover:bg-stone-200/60 hover:text-stone-900",
    );
  const tagClass = (active: boolean) =>
    cx(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs",
      amberFocus,
      active
        ? "bg-[#D97706] text-white"
        : "bg-stone-200/70 text-stone-700 hover:bg-stone-300/70",
    );
  return (
    <div className="flex h-full flex-col gap-6">
      <div
        className="flex items-center gap-2.5 px-1"
        data-testid={mobile ? undefined : "logo"}
      >
        <BrandMark tone="amber" />
        <span className="text-lg font-bold tracking-tight text-stone-900">
          Notely
        </span>
      </div>
      <nav aria-label="Folders" className="flex flex-col gap-0.5">
        <h2 className="mb-1 px-2.5 text-xs font-semibold text-stone-500">
          Folders
        </h2>
        {[{ id: "all", name: "All notes" }, ...folders].map((f) => {
          const count = notes.filter(
            (n) => f.id === "all" || n.folder === f.id,
          ).length;
          const content = (
            <>
              <span className="flex min-w-0 items-center gap-2">
                {f.id === "all" ? (
                  <FileText className="size-4 shrink-0" aria-hidden />
                ) : (
                  <FolderIcon className="size-4 shrink-0" aria-hidden />
                )}
                <span className="truncate">{f.name}</span>
              </span>
              <span className="text-xs tabular-nums text-stone-400">
                {count}
              </span>
            </>
          );
          return mobile ? (
            <Link
              key={f.id}
              to="/"
              onClick={() => setFolder(f.id)}
              className={itemClass(folder === f.id)}
            >
              {content}
            </Link>
          ) : (
            <button
              key={f.id}
              type="button"
              aria-pressed={folder === f.id}
              onClick={() => setFolder(f.id)}
              className={itemClass(folder === f.id)}
              data-testid={`folder-${f.id}`}
            >
              {content}
            </button>
          );
        })}
      </nav>
      <section
        aria-label="Tags"
        data-testid={mobile ? undefined : "tag-filter"}
      >
        <div className="mb-2 flex items-center justify-between px-2.5">
          <h2 className="text-xs font-semibold text-stone-500">Tags</h2>
          {tag && (
            <button
              type="button"
              onClick={() => setTag(null)}
              className={cx(
                "rounded-sm text-xs font-medium text-amber-700 hover:text-amber-900",
                amberFocus,
              )}
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 px-1.5">
          {allTags.map((t) =>
            mobile ? (
              <Link
                key={t}
                to="/"
                onClick={() => setTag(tag === t ? null : t)}
                className={tagClass(tag === t)}
              >
                #{t}
              </Link>
            ) : (
              <button
                key={t}
                type="button"
                aria-pressed={tag === t}
                onClick={() => setTag(tag === t ? null : t)}
                className={tagClass(tag === t)}
                data-testid={`tag-filter-${t}`}
              >
                #{t}
                <span
                  className={cx(
                    "tabular-nums",
                    tag === t ? "text-amber-100" : "text-stone-400",
                  )}
                >
                  {tagCount(t)}
                </span>
              </button>
            ),
          )}
        </div>
      </section>
      <div className="mt-auto flex flex-col gap-1 border-t border-stone-200 pt-3">
        <button
          type="button"
          onClick={actions.openPrefs}
          className={itemClass(false)}
        >
          <span className="flex items-center gap-2">
            <Settings className="size-4" aria-hidden /> Preferences
          </span>
        </button>
        <p className="flex items-center gap-2 px-2.5 py-1 text-xs text-stone-500">
          <Cloud className="size-3.5" aria-hidden /> All notes synced
        </p>
      </div>
    </div>
  );
}

function BaselineEditor({ note, actions }: { note: Note; actions: Actions }) {
  const { update, togglePin, prefs } = actions;
  const { ref, format, onKeyDown } = useFormatter(note, update);
  const [newTag, setNewTag] = useState("");
  const words = wordCount(note.body);

  function addTag(event: FormEvent) {
    event.preventDefault();
    const value = newTag.trim().toLowerCase().replace(/^#/, "");
    if (!value || note.tags.includes(value)) return setNewTag("");
    update(note.id, { tags: [...note.tags, value], updated: now() });
    setNewTag("");
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-6 md:px-10 md:py-8">
          <input
            value={note.title}
            onChange={(e) =>
              update(note.id, { title: e.target.value, updated: now() })
            }
            aria-label="Note title"
            placeholder="Untitled note"
            className="w-full rounded-md bg-transparent text-3xl font-bold tracking-tight text-stone-900 placeholder:text-stone-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]/30"
            data-testid="note-title"
          />
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-500">
            <FolderSelect
              note={note}
              update={update}
              className={cx(
                "rounded-md bg-transparent py-0.5 pr-1 text-sm text-stone-600 hover:text-stone-900",
                amberFocus,
              )}
            />
            <span data-testid="note-edited">
              Edited {edited(note.updated)}
            </span>
            <span>Created {localDate(note.created)}</span>
            {note.pinned && (
              <span className="inline-flex items-center gap-1 text-amber-700">
                <Pin className="size-3.5" aria-hidden /> Pinned
              </span>
            )}
          </div>
          <div
            className="mt-4 flex flex-wrap items-center gap-1.5"
            data-testid="note-tags"
          >
            {note.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-amber-50 py-0.5 pr-1 pl-2.5 text-xs font-medium text-amber-900 ring-1 ring-amber-600/20 ring-inset"
              >
                #{t}
                <button
                  type="button"
                  aria-label={`Remove tag ${t}`}
                  onClick={() =>
                    update(note.id, {
                      tags: note.tags.filter((x) => x !== t),
                      updated: now(),
                    })
                  }
                  className={cx(
                    "grid size-4 place-items-center rounded-full hover:bg-amber-200/60",
                    amberFocus,
                  )}
                >
                  <X className="size-3" aria-hidden />
                </button>
              </span>
            ))}
            <form onSubmit={addTag} className="flex items-center gap-1">
              <label className="flex items-center gap-1 rounded-full border border-dashed border-stone-300 px-2.5 py-0.5 text-xs text-stone-500 focus-within:border-[#D97706]">
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
                className={cx(
                  "rounded-full px-2 py-0.5 text-xs font-semibold text-amber-700 hover:bg-amber-50",
                  amberFocus,
                )}
                data-testid="add-tag"
              >
                Add
              </button>
            </form>
          </div>
          <Toolbar
            onFormat={format}
            className="sticky top-0 z-10 mt-6 flex w-fit items-center gap-0.5 rounded-lg border border-stone-200 bg-white p-1 shadow-xs"
            buttonClassName={cx(
              "grid size-8 place-items-center rounded-md text-stone-600 hover:bg-stone-100 hover:text-stone-900",
              amberFocus,
            )}
          />
          <textarea
            ref={ref}
            value={note.body}
            onChange={(e) =>
              update(note.id, { body: e.target.value, updated: now() })
            }
            onKeyDown={onKeyDown}
            spellCheck={prefs.spellcheck}
            aria-label="Note body"
            placeholder="Start writing…"
            className={cx(
              "mt-4 min-h-80 flex-1 resize-none bg-transparent text-stone-800 placeholder:text-stone-400 focus:outline-none",
              baselineSizes[prefs.fontSize],
            )}
            data-testid="note-body"
          />
        </div>
      </div>
      <footer className="flex items-center justify-between gap-4 border-t border-stone-200 px-5 py-2 text-xs text-stone-500 tabular-nums md:px-10">
        <span className="flex gap-4">
          <span data-testid="word-count">
            {words} {words === 1 ? "word" : "words"}
          </span>
          <span>{note.body.length} characters</span>
        </span>
        <button
          type="button"
          onClick={() => togglePin(note.id)}
          className={cx("rounded-sm hover:text-stone-900", amberFocus)}
        >
          {note.pinned ? "Unpin note" : "Pin note"}
        </button>
      </footer>
    </>
  );
}

function ThreePane(actions: Actions) {
  const { notes, folder, create, togglePin } = actions;
  const { id } = useParams();
  const navigate = useNavigate();
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("updated");
  const note = notes.find((n) => n.id === id);
  const heading = folder === "all" ? "All notes" : folderName(folder);
  useDocumentTitle(
    note ? `${note.title || "Untitled note"} – Notely` : `${heading} – Notely`,
  );
  const q = query.trim().toLowerCase();
  const shown = sortNotes(
    notes.filter(
      (n) =>
        (folder === "all" || n.folder === folder) &&
        (!tag || n.tags.includes(tag)) &&
        (!q ||
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.tags.some((t) => t.includes(q))),
    ),
    sort,
  );
  const pinned = shown.filter((n) => n.pinned);
  const rest = shown.filter((n) => !n.pinned);
  const iconBtn = cx(
    "grid size-8 place-items-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-900",
    amberFocus,
  );

  const item = (n: Note) => (
    <li key={n.id}>
      <Link
        to={`/notes/${n.id}`}
        aria-current={n.id === id ? "page" : undefined}
        className={cx(
          "block rounded-lg px-3 py-2.5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#D97706]",
          n.id === id
            ? "bg-amber-50 ring-1 ring-amber-600/15 ring-inset"
            : "hover:bg-stone-50",
        )}
        data-testid={`note-${n.id}`}
      >
        <span className="flex items-baseline justify-between gap-3">
          <span
            className="truncate text-sm font-semibold text-stone-900"
            title={n.title}
          >
            {n.title || "Untitled note"}
          </span>
          <span className="shrink-0 text-xs text-stone-400 tabular-nums">
            {relativeTime(n.updated)}
          </span>
        </span>
        <span className="mt-0.5 line-clamp-2 text-sm text-stone-500">
          {snippet(n.body) || "No additional text"}
        </span>
        {n.tags.length > 0 && (
          <span className="mt-1.5 flex flex-wrap gap-1">
            {n.tags.map((t) => (
              <span
                key={t}
                className="rounded bg-stone-100 px-1.5 text-xs text-stone-600"
              >
                #{t}
              </span>
            ))}
          </span>
        )}
      </Link>
    </li>
  );

  return (
    <div
      className="flex h-dvh overflow-hidden bg-white text-stone-900"
      style={sourceSans}
    >
      <aside className="hidden w-60 shrink-0 border-r border-stone-200 bg-stone-50 p-4 md:block">
        <Sidebar actions={actions} tag={tag} setTag={setTag} />
      </aside>

      <section
        aria-label="Notes"
        className={cx(
          "min-w-0 flex-col border-r border-stone-200 md:flex md:w-80 md:shrink-0",
          note ? "hidden" : "flex w-full",
        )}
      >
        <header className="flex flex-col gap-3 border-b border-stone-100 p-3">
          <div className="flex items-center gap-2">
            <MobileNav label="Folders and tags" className="bg-stone-50">
              <Sidebar actions={actions} tag={tag} setTag={setTag} mobile />
            </MobileNav>
            <div className="min-w-0 flex-1 px-1">
              <h1 className="truncate text-lg font-bold tracking-tight">
                {heading}
              </h1>
              <p className="text-xs text-stone-500 tabular-nums">
                {shown.length} {shown.length === 1 ? "note" : "notes"}
                {tag ? ` tagged #${tag}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/notes/${create()}`)}
              className={tones.amber.primary}
              data-testid="new-note"
            >
              <Plus className="size-4" aria-hidden /> New note
            </button>
          </div>
          <div className="flex gap-2">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search notes</span>
              <Search
                className="pointer-events-none absolute top-2 left-2.5 size-4 text-stone-400"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes"
                className="h-8 w-full rounded-md border border-stone-200 bg-stone-50 pr-2 pl-8 text-sm placeholder:text-stone-400 focus:border-[#D97706] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#D97706]/15"
                data-testid="note-search"
              />
            </label>
            <label className="sr-only" htmlFor="note-sort">
              Sort notes
            </label>
            <select
              id="note-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-8 rounded-md border border-stone-200 bg-white px-2 text-sm text-stone-700 focus:border-[#D97706] focus:outline-none focus:ring-3 focus:ring-[#D97706]/15"
            >
              <option value="updated">Last edited</option>
              <option value="created">Date created</option>
              <option value="title">Title</option>
            </select>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-2">
          {shown.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <div className="grid size-12 place-items-center rounded-full bg-amber-50 text-amber-700">
                <Search className="size-5" aria-hidden />
              </div>
              <h2 className="mt-4 font-semibold">No notes found</h2>
              <p className="mt-1 max-w-56 text-sm text-stone-500">
                Nothing in {heading} matches
                {q ? ` "${query.trim()}"` : " this filter"}.
              </p>
              <button
                type="button"
                className={cx(tones.amber.secondary, "mt-5")}
                onClick={() => {
                  setQuery("");
                  setTag(null);
                }}
              >
                Clear search
              </button>
            </div>
          ) : (
            <>
              {pinned.length > 0 && (
                <>
                  <h2 className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-stone-500">
                    <Pin className="size-3" aria-hidden /> Pinned
                  </h2>
                  <ul className="flex flex-col gap-0.5">{pinned.map(item)}</ul>
                  {rest.length > 0 && (
                    <h2 className="px-3 pt-4 pb-1 text-xs font-semibold text-stone-500">
                      Notes
                    </h2>
                  )}
                </>
              )}
              <ul className="flex flex-col gap-0.5">{rest.map(item)}</ul>
            </>
          )}
        </div>
      </section>

      <main
        className={cx(
          "min-w-0 flex-1 flex-col",
          note ? "flex" : "hidden md:flex",
        )}
      >
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-stone-100 px-3 md:px-5">
          {note ? (
            <>
              <Link
                to="/"
                className={cx(iconBtn, "md:hidden")}
                aria-label="Back to notes"
              >
                <ArrowLeft className="size-4" aria-hidden />
              </Link>
              <nav
                aria-label="Breadcrumb"
                className="min-w-0 flex-1 text-sm text-stone-500"
              >
                <ol className="flex min-w-0 items-center gap-1.5">
                  <li className="shrink-0">{folderName(note.folder)}</li>
                  <li aria-hidden>/</li>
                  <li
                    aria-current="page"
                    className="truncate text-stone-800"
                    title={note.title}
                  >
                    {note.title || "Untitled note"}
                  </li>
                </ol>
              </nav>
              <button
                type="button"
                aria-label={note.pinned ? "Unpin note" : "Pin note"}
                aria-pressed={note.pinned}
                onClick={() => togglePin(note.id)}
                className={cx(iconBtn, note.pinned && "text-amber-700")}
                data-testid="pin-note"
              >
                {note.pinned ? (
                  <PinOff className="size-4" aria-hidden />
                ) : (
                  <Pin className="size-4" aria-hidden />
                )}
              </button>
              <NoteMenu
                note={note}
                actions={actions}
                triggerClassName={iconBtn}
              />
              <span className="mx-1 h-5 w-px bg-stone-200" aria-hidden />
            </>
          ) : (
            <span className="flex-1" />
          )}
          <AccountControls actions={actions} tone="amber" />
        </header>
        {note ? (
          <BaselineEditor key={note.id} note={note} actions={actions} />
        ) : (
          <div
            className="m-auto flex flex-col items-center px-6 text-center"
            data-testid="empty-editor"
          >
            <div className="grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-700">
              <FileText className="size-6" aria-hidden />
            </div>
            <h2 className="mt-4 text-lg font-semibold">
              Select a note to start editing.
            </h2>
            <p className="mt-1 max-w-xs text-sm text-stone-500">
              Pick a note from the list, or start a fresh one in{" "}
              {folder === "all"
                ? folderName(actions.prefs.defaultFolder)
                : heading}
              .
            </p>
            <button
              type="button"
              className={cx(tones.amber.secondary, "mt-5")}
              onClick={() => navigate(`/notes/${create()}`)}
            >
              <Plus className="size-4" aria-hidden /> Create a note
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function TopBar({
  actions,
  query,
  setQuery,
  sort,
  setSort,
}: {
  actions: Actions;
  query: string;
  setQuery: (q: string) => void;
  sort: Sort;
  setSort: (s: Sort) => void;
}) {
  const { notes, folder, setFolder, create } = actions;
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-[#faf7f2]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 sm:px-8">
        <div
          className="flex items-center gap-2.5 text-2xl text-stone-900"
          style={newsreader}
          data-testid="logo"
        >
          <BrandMark tone="rose" size={30} />
          Notely
        </div>
        <label className="relative order-last w-full sm:order-none sm:w-auto sm:min-w-60 sm:flex-1">
          <span className="sr-only">Search notes</span>
          <Search
            className="pointer-events-none absolute top-3 left-3.5 size-4 text-stone-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your notes"
            className="h-10 w-full rounded-full border border-stone-300 bg-white pr-4 pl-10 text-sm placeholder:text-stone-400 focus:border-[#BE123C] focus:outline-none focus:ring-3 focus:ring-[#BE123C]/15"
            data-testid="note-search"
          />
        </label>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/notes/${create()}`)}
            className={tones.rose.primary}
            data-testid="new-note"
          >
            <Plus className="size-4" aria-hidden /> New note
          </button>
          <AccountControls actions={actions} tone="rose" />
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pb-4 sm:px-8">
        <nav
          aria-label="Folders"
          className="-mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 py-0.5"
        >
          {[{ id: "all", name: "All notes" }, ...folders].map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={folder === f.id}
              onClick={() => setFolder(f.id)}
              className={cx(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm",
                roseFocus,
                folder === f.id
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 text-stone-600 hover:border-stone-500 hover:text-stone-900",
              )}
              data-testid={`folder-${f.id}`}
            >
              {f.name}
              <span
                className={cx(
                  "text-xs tabular-nums",
                  folder === f.id ? "text-stone-300" : "text-stone-400",
                )}
              >
                {
                  notes.filter((n) => f.id === "all" || n.folder === f.id)
                    .length
                }
              </span>
            </button>
          ))}
        </nav>
        <label className="sr-only" htmlFor="grid-sort">
          Sort notes
        </label>
        <select
          id="grid-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className={cx(
            "hidden h-9 rounded-full border border-stone-300 bg-transparent px-3 text-sm text-stone-700 sm:block",
            roseFocus,
          )}
        >
          <option value="updated">Last edited</option>
          <option value="created">Date created</option>
          <option value="title">Title</option>
        </select>
      </div>
    </header>
  );
}

function NoteCard({ note }: { note: Note }) {
  const words = wordCount(note.body);
  return (
    <li>
      <Link
        to={`/notes/${note.id}`}
        className="animate-fade-up flex h-56 flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_1px_2px_rgba(41,37,36,0.04)] transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_10px_24px_-12px_rgba(41,37,36,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE123C] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        data-testid={`note-${note.id}`}
      >
        <span className="flex items-center justify-between gap-2 text-xs font-medium text-[#BE123C]">
          {folderName(note.folder)}
          {note.pinned && <Pin className="size-3.5" aria-label="Pinned" />}
        </span>
        <span
          className="mt-2 line-clamp-2 text-xl leading-snug text-stone-900"
          style={newsreader}
          title={note.title}
        >
          {note.title || "Untitled note"}
        </span>
        <span className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600">
          {snippet(note.body) || "Empty note"}
        </span>
        <span className="mt-auto flex justify-between pt-3 text-xs text-stone-400 tabular-nums">
          <span>{relativeTime(note.updated)}</span>
          <span>
            {words} {words === 1 ? "word" : "words"}
          </span>
        </span>
      </Link>
    </li>
  );
}

function CardGrid(actions: Actions) {
  const { notes, folder, create } = actions;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("updated");
  const heading = folder === "all" ? "All notes" : folderName(folder);
  useDocumentTitle(`${heading} – Notely`);
  const q = query.trim().toLowerCase();
  const shown = sortNotes(
    notes.filter(
      (n) =>
        (folder === "all" || n.folder === folder) &&
        (!q ||
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q)),
    ),
    sort,
  );
  const pinned = q ? [] : shown.filter((n) => n.pinned);
  const rest = q ? shown : shown.filter((n) => !n.pinned);
  return (
    <div
      className="min-h-screen bg-[#faf7f2] text-stone-900"
      style={sourceSans}
    >
      <TopBar
        actions={actions}
        query={query}
        setQuery={setQuery}
        sort={sort}
        setSort={setSort}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
        <h1 className="sr-only">{heading}</h1>
        {shown.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <NotebookPen className="size-10 text-[#BE123C]/60" aria-hidden />
            <p className="mt-4 text-2xl text-stone-700" style={newsreader}>
              {q ? "No notes match your search." : "No notes here yet."}
            </p>
            <p className="mt-2 max-w-sm text-sm text-stone-500">
              {q
                ? "Try another word, or look in a different folder."
                : `Start your first note in ${heading}.`}
            </p>
            <button
              type="button"
              className={cx(tones.rose.secondary, "mt-6")}
              onClick={() =>
                q ? setQuery("") : navigate(`/notes/${create()}`)
              }
            >
              {q ? "Clear search" : "Write a note"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {pinned.length > 0 && (
              <section aria-labelledby="pinned-title">
                <h2
                  id="pinned-title"
                  className="mb-4 flex items-baseline gap-3 text-2xl text-stone-900"
                  style={newsreader}
                >
                  Pinned
                  <span
                    className="text-sm text-stone-400 tabular-nums"
                    style={sourceSans}
                  >
                    {pinned.length}
                  </span>
                </h2>
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {pinned.map((n) => (
                    <NoteCard key={n.id} note={n} />
                  ))}
                </ul>
              </section>
            )}
            {rest.length > 0 && (
              <section aria-labelledby="notes-title">
                <h2
                  id="notes-title"
                  className="mb-4 flex items-baseline gap-3 text-2xl text-stone-900"
                  style={newsreader}
                >
                  {q ? "Results" : pinned.length ? "Everything else" : heading}
                  <span
                    className="text-sm text-stone-400 tabular-nums"
                    style={sourceSans}
                  >
                    {rest.length}
                  </span>
                </h2>
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((n) => (
                    <NoteCard key={n.id} note={n} />
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function VariantEditor({ note, actions }: { note: Note; actions: Actions }) {
  const { update, togglePin, prefs } = actions;
  const { ref, format, onKeyDown } = useFormatter(note, update);
  const words = wordCount(note.body);
  const iconBtn = cx(
    "grid size-9 place-items-center rounded-full text-stone-500 hover:bg-stone-200/60 hover:text-stone-900",
    roseFocus,
  );
  return (
    <div
      className="flex min-h-screen flex-col bg-[#faf7f2] text-stone-900"
      style={sourceSans}
    >
      <header className="sticky top-0 z-10 bg-[#faf7f2]/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-4 sm:px-8">
          <Link
            to="/"
            className={cx(
              "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-200/60 hover:text-stone-900",
              roseFocus,
            )}
            data-testid="back-to-notes"
          >
            <ArrowLeft className="size-4" aria-hidden /> All notes
          </Link>
          <span
            className="ml-auto hidden text-xs text-stone-500 sm:inline"
            data-testid="note-edited"
          >
            Edited {edited(note.updated)}
          </span>
          <button
            type="button"
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
            aria-pressed={note.pinned}
            onClick={() => togglePin(note.id)}
            className={cx(
              iconBtn,
              "ml-auto sm:ml-2",
              note.pinned && "text-[#BE123C]",
            )}
            data-testid="pin-note"
          >
            {note.pinned ? (
              <PinOff className="size-4" aria-hidden />
            ) : (
              <Pin className="size-4" aria-hidden />
            )}
          </button>
          <NoteMenu note={note} actions={actions} triggerClassName={iconBtn} />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-24 sm:px-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-sm text-[#BE123C]">
          <FolderSelect
            note={note}
            update={update}
            className={cx(
              "rounded-full bg-transparent py-0.5 pr-1 text-sm font-medium text-[#BE123C] hover:text-[#9F1239]",
              roseFocus,
            )}
          />
          <span className="text-stone-400">
            Created {localDate(note.created)}
          </span>
        </div>
        <input
          value={note.title}
          onChange={(e) =>
            update(note.id, { title: e.target.value, updated: now() })
          }
          aria-label="Note title"
          placeholder="Untitled note"
          className="mt-3 w-full rounded-lg bg-transparent text-4xl leading-tight text-stone-900 placeholder:text-stone-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C]/25 sm:text-5xl"
          style={newsreader}
          data-testid="note-title"
        />
        <Toolbar
          onFormat={format}
          className="sticky top-[68px] z-10 mt-6 flex w-fit items-center gap-0.5 rounded-full border border-stone-200 bg-white/95 p-1 shadow-[0_4px_16px_-8px_rgba(41,37,36,0.25)]"
          buttonClassName={cx(
            "grid size-8 place-items-center rounded-full text-stone-600 hover:bg-[#BE123C]/10 hover:text-[#9F1239]",
            roseFocus,
          )}
        />
        <textarea
          ref={ref}
          value={note.body}
          onChange={(e) =>
            update(note.id, { body: e.target.value, updated: now() })
          }
          onKeyDown={onKeyDown}
          spellCheck={prefs.spellcheck}
          aria-label="Note body"
          placeholder="Start writing…"
          rows={18}
          className={cx(
            "mt-6 min-h-96 flex-1 resize-none bg-transparent text-stone-800 placeholder:text-stone-400 focus:outline-none",
            variantSizes[prefs.fontSize],
          )}
          style={newsreader}
          data-testid="note-body"
        />
      </main>
      <footer className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-[#faf7f2]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl justify-between px-4 py-2.5 text-xs text-stone-500 tabular-nums sm:px-8">
          <span data-testid="word-count">
            {words} {words === 1 ? "word" : "words"}
          </span>
          <span>{note.body.length} characters</span>
        </div>
      </footer>
    </div>
  );
}

function FullEditor(actions: Actions) {
  const { id } = useParams();
  const note = actions.notes.find((n) => n.id === id);
  useDocumentTitle(`${note?.title || "Untitled note"} – Notely`);
  if (!note) return <Navigate to="/" replace />;
  return <VariantEditor key={note.id} note={note} actions={actions} />;
}

export default function App({ variant }: { variant: Variant }) {
  const v = variant === "variant";
  const [notes, setNotes] = useState(seedNotes);
  const [folder, setFolder] = useState("all");
  const [prefs, setPrefs] = useState<Prefs>({
    name: "Sam Carter",
    fontSize: "Default",
    spellcheck: true,
    defaultFolder: "personal",
  });
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [toasts, toast] = useToasts(
    v ? "rounded-full bg-stone-900 px-5 text-white" : "bg-stone-900 text-white",
  );

  const update = (id: string, change: Partial<Note>) =>
    setNotes((current) =>
      current.map((n) => (n.id === id ? { ...n, ...change } : n)),
    );
  const create = () => {
    const id = `n-${Date.now()}`;
    const target = folder === "all" ? prefs.defaultFolder : folder;
    setNotes((current) => [
      {
        id,
        folder: target,
        title: "Untitled note",
        body: "",
        tags: [],
        updated: now(),
        created: now(),
        pinned: false,
      },
      ...current,
    ]);
    toast(`Note created in ${folderName(target)}`);
    return id;
  };
  const remove = (id: string) => {
    setNotes((current) => current.filter((n) => n.id !== id));
    toast("Note deleted");
  };
  const duplicate = (id: string) => {
    const copy = `n-${Date.now()}`;
    setNotes((current) => {
      const source = current.find((n) => n.id === id);
      return source
        ? [
            {
              ...source,
              id: copy,
              title: `${source.title} (copy)`,
              pinned: false,
              created: now(),
              updated: now(),
            },
            ...current,
          ]
        : current;
    });
    toast("Note duplicated");
    return copy;
  };
  const togglePin = (id: string) => {
    const pinned = notes.find((n) => n.id === id)?.pinned ?? false;
    update(id, { pinned: !pinned });
    toast(pinned ? "Note unpinned" : "Note pinned");
  };

  const actions: Actions = {
    notes,
    folder,
    setFolder,
    update,
    create,
    remove,
    duplicate,
    togglePin,
    prefs,
    openPrefs: () => setPrefsOpen(true),
    toast,
  };

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
      <div style={sourceSans}>
        <PreferencesDialog
          key={JSON.stringify(prefs)}
          open={prefsOpen}
          onClose={() => setPrefsOpen(false)}
          prefs={prefs}
          tone={v ? "rose" : "amber"}
          onSave={(p) => {
            setPrefs(p);
            setPrefsOpen(false);
            toast("Changes saved");
          }}
        />
        {toasts}
      </div>
    </HashRouter>
  );
}
