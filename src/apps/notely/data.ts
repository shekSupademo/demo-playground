import { daysFromToday, type Notification } from "../../kit";

export type Note = {
  id: string;
  folder: string;
  title: string;
  body: string;
  tags: string[];
  updated: string;
  created: string;
  pinned: boolean;
};

export type Folder = { id: string; name: string };

export const folders: Folder[] = [
  { id: "work", name: "Work" },
  { id: "personal", name: "Personal" },
  { id: "recipes", name: "Recipes" },
  { id: "travel", name: "Travel" },
  { id: "ideas", name: "Ideas" },
];

export const folderName = (id: string) =>
  folders.find((f) => f.id === id)?.name ?? "Notes";

const ago = (minutes: number) =>
  new Date(Date.now() - minutes * 60000).toISOString();

type Row = [string, string, string, string, string[], number, boolean];

const rows: Row[] = [
  [
    "n1",
    "work",
    "Q1 roadmap sync",
    "Agenda:\n- Review onboarding funnel numbers\n- Decide on the pricing page test\n- Owners for the API docs refresh\n\nDecisions\n1. Ship the new onboarding checklist in week 3\n2. **Pause** the annual plan discount until the test reads out",
    ["meetings", "planning"],
    42,
    true,
  ],
  [
    "n2",
    "work",
    "Hiring loop feedback",
    "Strong systems design answer. Wants more ownership of the mobile client. Follow up on notice period.\n\n- Culture interview: positive, asks good questions\n- Take-home: clean, tested, slightly over-engineered state layer",
    ["hiring"],
    60 * 22,
    false,
  ],
  [
    "n3",
    "personal",
    "Books to read this winter",
    "- The Overstory\n- Piranesi\n- A Psalm for the Wild-Built\n- Tomorrow, and Tomorrow, and Tomorrow\n- The Dispossessed",
    ["reading"],
    60 * 24 * 4,
    false,
  ],
  [
    "n4",
    "recipes",
    "Weeknight miso salmon",
    "2 tbsp white miso, 1 tbsp mirin, 1 tsp honey. Brush on salmon, broil 8 minutes.\n\nServe with rice and charred broccolini. _Double the glaze_ if you want leftovers for lunch.",
    ["dinner", "quick"],
    60 * 24 * 7,
    true,
  ],
  [
    "n5",
    "travel",
    "Lisbon trip checklist",
    "- Book the Sintra day trip\n- Reserve Cervejaria Ramiro for Friday\n- Buy a Viva Viagem card at the airport\n- Check the tram 28 schedule",
    ["planning"],
    60 * 24 * 12,
    false,
  ],
  [
    "n6",
    "work",
    "Design review: billing settings",
    'Feedback from Thursday:\n- The plan comparison table needs a sticky header\n- Invoice history should paginate, not infinite scroll\n- Rename "Seats" to "Members" everywhere',
    ["design", "meetings"],
    60 * 3,
    false,
  ],
  [
    "n7",
    "work",
    "1:1 with Priya",
    "She wants to lead the search rewrite. Talk to Marco about moving the reporting project to next quarter.\n\nFollow-ups\n- Share the promotion rubric\n- Book a slot with the design team",
    ["meetings"],
    60 * 26,
    false,
  ],
  [
    "n8",
    "work",
    "Incident review: checkout timeouts on Black Friday weekend and what we change before December",
    "Timeline\n1. 09:12 latency alarms fire\n2. 09:20 payment provider confirms degraded region\n3. 09:41 traffic shifted, error rate back under 0.5%\n\nActions\n- Add a circuit breaker on the tax service\n- Run a game day before the holiday sale",
    ["incident"],
    60 * 24 * 2,
    false,
  ],
  [
    "n9",
    "work",
    "Q4 OKR draft",
    "Objective: make onboarding self-serve\n- KR1: 60% of new teams invite a teammate in week one\n- KR2: Time to first project under 10 minutes\n- KR3: Cut onboarding tickets by a third",
    ["planning"],
    60 * 24 * 18,
    false,
  ],
  ["n10", "work", "Vendor shortlist for analytics", "", [], 60 * 24 * 9, false],
  [
    "n11",
    "personal",
    "Gift ideas",
    "- Mum: the ceramic pour-over set from the market\n- Theo: climbing chalk bag\n- Ines: a framed print from the Porto trip",
    ["holidays"],
    60 * 5,
    false,
  ],
  [
    "n12",
    "personal",
    "Apartment move",
    "Movers booked for the 14th. Still to do:\n- Cancel the old internet contract\n- Update address at the bank\n- Measure the bedroom alcove for the shelf",
    ["home", "planning"],
    60 * 24 * 3,
    true,
  ],
  [
    "n13",
    "personal",
    "Running plan",
    "Week 6 of 12. Long run Sunday: 16 km easy. Tuesday intervals 6 x 800 m. Remember to replace the shoes after the half.",
    ["health"],
    60 * 24 * 6,
    false,
  ],
  [
    "n14",
    "personal",
    "Podcast episodes to share",
    "The one about urban beekeeping. The interview with the bridge engineer. The history of the shipping container.",
    ["reading"],
    60 * 24 * 25,
    false,
  ],
  [
    "n15",
    "recipes",
    "Brown butter banana bread",
    "3 very ripe bananas, 115 g brown butter, 150 g brown sugar, 1 egg, 190 g flour, 1 tsp baking soda, pinch of salt.\n\n175 °C for 55 minutes. Let it cool in the tin for 15.",
    ["baking"],
    60 * 24 * 14,
    false,
  ],
  [
    "n16",
    "recipes",
    "Sunday lentil soup",
    "Soften onion, carrot and celery. Add 250 g red lentils, a tin of tomatoes, 1.2 l stock, cumin and smoked paprika. Simmer 25 minutes, blend half, finish with lemon.",
    ["dinner"],
    60 * 24 * 21,
    false,
  ],
  [
    "n17",
    "recipes",
    "Chili crisp noodles",
    "Noodles, 1 tbsp chili crisp, 1 tsp black vinegar, soy, scallions, a soft egg. Ten minutes start to finish.",
    ["quick"],
    60 * 24 * 30,
    false,
  ],
  [
    "n18",
    "travel",
    "Kyoto in April",
    "Stay near Gion. Philosopher's Path early morning to skip the crowds. Book the Saihō-ji moss temple visit 2 months ahead by postcard.",
    ["planning", "japan"],
    60 * 24 * 40,
    false,
  ],
  [
    "n19",
    "travel",
    "Packing list for the coast",
    "- Rain shell\n- Two warm layers\n- Binoculars\n- Tide table printout\n- Offline maps downloaded",
    [],
    60 * 24 * 11,
    false,
  ],
  [
    "n20",
    "travel",
    "Flights and confirmation numbers",
    "Outbound TP 1351 on the 3rd, seat 14C. Return TP 1356 on the 11th. Hotel confirmation 48213-LX.",
    ["planning"],
    60 * 24 * 13,
    false,
  ],
  [
    "n21",
    "ideas",
    "Side project: plant watering reminder",
    "A tiny app that reads soil sensors and nudges you on your phone. Start with one plant and a cheap moisture sensor.",
    ["projects"],
    60 * 24 * 8,
    false,
  ],
  [
    "n22",
    "ideas",
    "Blog post outline: what we learned rebuilding onboarding",
    "1. Why the old checklist failed\n2. Interviews with 20 new teams\n3. What we cut\n4. The numbers six weeks later",
    ["writing"],
    60 * 24 * 1,
    false,
  ],
  [
    "n23",
    "ideas",
    "Workshop format for the offsite",
    "Morning: silent writing, then pairs. Afternoon: one decision per table, written down before anyone leaves.",
    ["meetings"],
    60 * 24 * 16,
    false,
  ],
  [
    "n24",
    "ideas",
    "Names for the newsletter",
    "",
    ["writing"],
    60 * 24 * 35,
    false,
  ],
];

export const seedNotes: Note[] = rows.map(
  ([id, folder, title, body, tags, minutes, pinned]) => ({
    id,
    folder,
    title,
    body,
    tags,
    updated: ago(minutes),
    created: ago(minutes + 60 * 24 * 3),
    pinned,
  }),
);

export const notifications: Notification[] = [
  {
    id: "a1",
    title: "Jordan Ellis shared Lisbon trip checklist with you",
    time: ago(25),
    unread: true,
  },
  {
    id: "a2",
    title: "Priya Raman commented on Q1 roadmap sync",
    time: ago(95),
    unread: true,
  },
  {
    id: "a3",
    title: "Reminder: Hiring loop feedback is due today",
    time: ago(60 * 4),
    unread: false,
  },
  {
    id: "a4",
    title: "Notely signed in on a new iPhone",
    time: daysFromToday(-1),
    unread: false,
  },
  {
    id: "a5",
    title: "Your weekly backup finished",
    time: daysFromToday(-2),
    unread: false,
  },
];

export type Format = "bold" | "italic" | "heading" | "bullet" | "number";

const listPrefix = /^(- |\d+\. |# )/;

export function applyFormat(
  text: string,
  start: number,
  end: number,
  kind: Format,
) {
  if (kind === "bold" || kind === "italic") {
    const mark = kind === "bold" ? "**" : "_";
    const selected =
      text.slice(start, end) || (kind === "bold" ? "bold text" : "italic text");
    return {
      text: text.slice(0, start) + mark + selected + mark + text.slice(end),
      start: start + mark.length,
      end: start + mark.length + selected.length,
    };
  }
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const found = text.indexOf("\n", end);
  const lineEnd = found === -1 ? text.length : found;
  const formatted = text
    .slice(lineStart, lineEnd)
    .split("\n")
    .map((line, index) => {
      const clean = line.replace(listPrefix, "");
      if (kind === "bullet") return `- ${clean}`;
      if (kind === "number") return `${index + 1}. ${clean}`;
      return `# ${clean}`;
    })
    .join("\n");
  return {
    text: text.slice(0, lineStart) + formatted + text.slice(lineEnd),
    start: lineStart,
    end: lineStart + formatted.length,
  };
}

export const wordCount = (text: string) =>
  text.trim() ? text.trim().split(/\s+/).length : 0;
