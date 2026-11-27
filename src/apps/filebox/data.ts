import { daysFromToday } from "../../kit";

export type Kind =
  | "pdf"
  | "doc"
  | "sheet"
  | "slides"
  | "image"
  | "video"
  | "archive";
export type FolderItem = { id: string; name: string };
export type FileItem = {
  id: string;
  name: string;
  folder: string;
  kind: Kind;
  bytes: number;
  created: string;
  modified: string;
  owner: string;
  editor: string;
  shared: string[];
  description: string;
};

export const me = "Dana Whitfield";
export const myEmail = "dana@harborstudio.co";

export const folders: FolderItem[] = [
  { id: "documents", name: "Documents" },
  { id: "photos", name: "Photos" },
  { id: "invoices", name: "Invoices" },
  { id: "projects", name: "Projects" },
  { id: "archive", name: "Archive" },
];

const KB = 1024;
const MB = 1024 * KB;

type Seed = Omit<FileItem, "created" | "modified" | "editor"> & {
  created: number;
  modified: number;
  editor?: string;
};

const rows: Seed[] = [
  {
    id: "lease",
    name: "Apartment lease 2026.pdf",
    folder: "documents",
    kind: "pdf",
    bytes: 1.2 * MB,
    created: -40,
    modified: -8,
    owner: me,
    shared: ["Marcus Chen"],
    description: "Signed lease for the Elm Street apartment.",
  },
  {
    id: "resume",
    name: "Resume - Dana Whitfield.docx",
    folder: "documents",
    kind: "doc",
    bytes: 84 * KB,
    created: -60,
    modified: -24,
    owner: me,
    shared: [],
    description: "",
  },
  {
    id: "taxes",
    name: "Tax return 2025.pdf",
    folder: "documents",
    kind: "pdf",
    bytes: 2.4 * MB,
    created: -229,
    modified: -229,
    owner: me,
    shared: ["Elena Sokolova"],
    description: "Federal and state return, filed April 11.",
  },
  {
    id: "budget",
    name: "Household budget.xlsx",
    folder: "documents",
    kind: "sheet",
    bytes: 56 * KB,
    created: -120,
    modified: -5,
    owner: me,
    shared: ["Marcus Chen"],
    description: "",
  },
  {
    id: "handbook",
    name: "Employee handbook 2026, revised edition with remote work and travel policy.pdf",
    folder: "documents",
    kind: "pdf",
    bytes: 3.8 * MB,
    created: -90,
    modified: -12,
    owner: "Priya Raman",
    editor: "Priya Raman",
    shared: [me, "Marcus Chen", "Tom Becker", "Aisha Bello"],
    description: "Approved by the leadership team in October.",
  },
  {
    id: "board",
    name: "Q4 board update.pptx",
    folder: "documents",
    kind: "slides",
    bytes: 14.6 * MB,
    created: -14,
    modified: -1,
    owner: "Priya Raman",
    editor: me,
    shared: [me, "Elena Sokolova"],
    description: "",
  },
  {
    id: "notes",
    name: "Studio meeting notes.docx",
    folder: "documents",
    kind: "doc",
    bytes: 38 * KB,
    created: -3,
    modified: 0,
    owner: "Tom Becker",
    shared: [me, "Priya Raman", "Aisha Bello"],
    description: "Weekly sync, decisions and owners.",
  },
  {
    id: "insurance",
    name: "Health insurance card.pdf",
    folder: "documents",
    kind: "pdf",
    bytes: 412 * KB,
    created: -300,
    modified: -300,
    owner: me,
    shared: [],
    description: "",
  },
  {
    id: "beach",
    name: "Lisbon beach sunset.jpg",
    folder: "photos",
    kind: "image",
    bytes: 4.8 * MB,
    created: -73,
    modified: -73,
    owner: me,
    shared: [],
    description: "Praia da Rainha, last evening of the trip.",
  },
  {
    id: "team",
    name: "Team photo offsite.png",
    folder: "photos",
    kind: "image",
    bytes: 6.1 * MB,
    created: -54,
    modified: -54,
    owner: "Aisha Bello",
    shared: [me, "Priya Raman", "Marcus Chen", "Tom Becker", "Elena Sokolova"],
    description: "",
  },
  {
    id: "opening",
    name: "Studio opening night 01.jpg",
    folder: "photos",
    kind: "image",
    bytes: 5.3 * MB,
    created: -18,
    modified: -18,
    owner: "Marcus Chen",
    shared: [me],
    description: "",
  },
  {
    id: "walkthrough",
    name: "Office walkthrough.mp4",
    folder: "photos",
    kind: "video",
    bytes: 412 * MB,
    created: -20,
    modified: -20,
    owner: me,
    shared: ["Aisha Bello"],
    description: "Unedited footage for the careers page.",
  },
  {
    id: "ceramics",
    name: "Product shoot ceramics, selects.zip",
    folder: "photos",
    kind: "archive",
    bytes: 238 * MB,
    created: -9,
    modified: -9,
    owner: "Aisha Bello",
    shared: [me],
    description: "",
  },
  {
    id: "inv-1042",
    name: "Invoice 1042 - Northwind.pdf",
    folder: "invoices",
    kind: "pdf",
    bytes: 212 * KB,
    created: -6,
    modified: -6,
    owner: me,
    shared: ["Elena Sokolova"],
    description: "Due December 20.",
  },
  {
    id: "inv-1043",
    name: "Invoice 1043 - Contoso.pdf",
    folder: "invoices",
    kind: "pdf",
    bytes: 198 * KB,
    created: -4,
    modified: -4,
    owner: me,
    shared: [],
    description: "",
  },
  {
    id: "inv-1038",
    name: "Invoice 1038 - Halden Interiors.pdf",
    folder: "invoices",
    kind: "pdf",
    bytes: 204 * KB,
    created: -46,
    modified: -46,
    owner: "Elena Sokolova",
    shared: [me],
    description: "Overdue. Reminder sent twice.",
  },
  {
    id: "inv-1044",
    name: "Invoice 1044 - Brightwater Dental.pdf",
    folder: "invoices",
    kind: "pdf",
    bytes: 187 * KB,
    created: -2,
    modified: -2,
    owner: "Elena Sokolova",
    shared: [me],
    description: "",
  },
  {
    id: "vendors",
    name: "Vendor payments 2026.xlsx",
    folder: "invoices",
    kind: "sheet",
    bytes: 342 * KB,
    created: -200,
    modified: -3,
    owner: "Elena Sokolova",
    editor: "Elena Sokolova",
    shared: [me, "Priya Raman"],
    description: "Paid, scheduled and disputed payments by month.",
  },
  {
    id: "receipts",
    name: "Receipts October.zip",
    folder: "invoices",
    kind: "archive",
    bytes: 18.4 * MB,
    created: -27,
    modified: -27,
    owner: me,
    shared: [],
    description: "",
  },
  {
    id: "roadmap",
    name: "Product roadmap Q1.xlsx",
    folder: "projects",
    kind: "sheet",
    bytes: 130 * KB,
    created: -30,
    modified: -2,
    owner: me,
    editor: "Marcus Chen",
    shared: ["Marcus Chen", "Priya Raman", "Tom Becker"],
    description: "Draft for the January planning session.",
  },
  {
    id: "brief",
    name: "Brand refresh brief.docx",
    folder: "projects",
    kind: "doc",
    bytes: 340 * KB,
    created: -25,
    modified: -16,
    owner: me,
    shared: ["Aisha Bello"],
    description: "",
  },
  {
    id: "kickoff",
    name: "Client kickoff deck, Lumen Coffee.pptx",
    folder: "projects",
    kind: "slides",
    bytes: 22.3 * MB,
    created: -11,
    modified: -7,
    owner: "Marcus Chen",
    shared: [me, "Aisha Bello", "Tom Becker"],
    description: "Shared with the client after the kickoff call.",
  },
  {
    id: "moodboard",
    name: "Moodboard spring campaign.png",
    folder: "projects",
    kind: "image",
    bytes: 8.7 * MB,
    created: -13,
    modified: -13,
    owner: "Aisha Bello",
    shared: [me, "Marcus Chen"],
    description: "",
  },
  {
    id: "usability",
    name: "Usability session 3.mp4",
    folder: "projects",
    kind: "video",
    bytes: 1.1 * 1024 * MB,
    created: -10,
    modified: -10,
    owner: "Tom Becker",
    shared: [me],
    description: "Participant P7, checkout flow.",
  },
  {
    id: "wireframes",
    name: "Website wireframes v3.pdf",
    folder: "projects",
    kind: "pdf",
    bytes: 6.4 * MB,
    created: -35,
    modified: -21,
    owner: "Tom Becker",
    shared: [me, "Marcus Chen"],
    description: "",
  },
  {
    id: "estimates",
    name: "Lumen Coffee estimate.xlsx",
    folder: "projects",
    kind: "sheet",
    bytes: 74 * KB,
    created: -15,
    modified: -15,
    owner: me,
    shared: ["Marcus Chen"],
    description: "",
  },
];

export const seed: FileItem[] = rows.map((r) => ({
  ...r,
  bytes: Math.round(r.bytes),
  created: daysFromToday(r.created),
  modified: daysFromToday(r.modified),
  editor: r.editor ?? r.owner,
}));

export const QUOTA = 50 * 1024 * MB;
export const OTHER_USAGE = 16.2 * 1024 * MB;

export function formatBytes(n: number) {
  if (n >= 1024 * MB) return `${(n / (1024 * MB)).toFixed(1)} GB`;
  if (n >= MB) return `${(n / MB).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / KB))} KB`;
}

export function kindFromName(name: string): Kind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["xls", "xlsx", "csv", "numbers"].includes(ext)) return "sheet";
  if (["ppt", "pptx", "key"].includes(ext)) return "slides";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "heic"].includes(ext))
    return "image";
  if (["mp4", "mov", "webm", "avi"].includes(ext)) return "video";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
  return "doc";
}
