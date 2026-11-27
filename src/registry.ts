export type Variant = "baseline" | "variant";

export type Change = {
  item: number;
  what: string;
  baseline: string;
  variant: string;
};

export type DemoApp = {
  id: AppId;
  name: string;
  product: string;
  categories: string[];
  flow: string;
  changes: Change[];
};

export const appIds = [
  "plano",
  "pipeline",
  "shopline",
  "filebox",
  "tripway",
  "peoplehub",
  "metricly",
  "mailbird",
  "notely",
  "corvid",
] as const;

export type AppId = (typeof appIds)[number];

export function isAppId(value: string): value is AppId {
  return (appIds as readonly string[]).includes(value);
}

export const apps: DemoApp[] = [
  {
    id: "plano",
    name: "Plano",
    product: "Project tracker",
    categories: [
      "1. Content and copy",
      "2. Visual style",
      "3. Sections added or removed",
    ],
    flow: "Open Home and hover the due-soon help icon, search projects, open the Archived tab, open a project, add a task and mark it complete, then create a new project, submitting it empty first to see the error.",
    changes: [
      {
        item: 1,
        what: "Button label",
        baseline: "Add task",
        variant: "Create task",
      },
      {
        item: 2,
        what: "Heading",
        baseline: "Home heading reads Overview",
        variant: "Home heading reads Your week",
      },
      {
        item: 3,
        what: "Body text",
        baseline: "Track every project in one place.",
        variant: "Plan, track, and ship work with your team.",
      },
      {
        item: 4,
        what: "Tooltip",
        baseline: "Due-soon help icon: Projects due this week",
        variant: "Due in the next 7 days",
      },
      {
        item: 5,
        what: "Placeholder",
        baseline: "Search projects",
        variant: "Find a workspace, task, or person",
      },
      {
        item: 6,
        what: "Empty state",
        baseline: "Archived tab: No archived projects, box icon",
        variant: "Nothing archived yet, with a longer hint and a sparkles icon",
      },
      {
        item: 7,
        what: "Messages",
        baseline: "Toast Project created; error Name is required",
        variant: "Toast Workspace ready; error Give your workspace a name",
      },
      {
        item: 8,
        what: "Feature rename",
        baseline: "Projects everywhere",
        variant: "Workspaces everywhere: nav, headings, buttons, toasts",
      },
      {
        item: 9,
        what: "Localization",
        baseline: "Project details panel in English",
        variant: "Project details panel in German, with longer labels",
      },
      { item: 10, what: "Brand color", baseline: "Indigo", variant: "Emerald" },
      {
        item: 11,
        what: "Typography",
        baseline: "Sans-serif headings",
        variant: "Serif headings at a larger size",
      },
      {
        item: 12,
        what: "Spacing and radius",
        baseline: "Compact cards, small corners",
        variant: "Roomy cards, large corners",
      },
      {
        item: 13,
        what: "Icon swap",
        baseline: "Folder icon for projects, gear for settings",
        variant: "Briefcase icon, sliders for settings",
      },
      {
        item: 14,
        what: "Icon-only button",
        baseline: "Share button with a label",
        variant: "Icon-only Share button",
      },
      {
        item: 15,
        what: "Logo",
        baseline: "Square P logo",
        variant: "Round leaf logo",
      },
      { item: 16, what: "Default theme", baseline: "Light", variant: "Dark" },
      {
        item: 17,
        what: "Animation",
        baseline: "Cards and dialogs appear instantly",
        variant: "Cards fade up, dialogs slide in",
      },
      {
        item: 18,
        what: "Section added",
        baseline: "No announcement",
        variant: "Team announcement card on Home",
      },
      {
        item: 19,
        what: "Section removed",
        baseline: "Recent activity panel on Home",
        variant: "Recent activity removed",
      },
      {
        item: 20,
        what: "Section reordered",
        baseline: "Projects, then My tasks",
        variant: "My tasks, then Projects",
      },
      {
        item: 21,
        what: "Collapsed by default",
        baseline: "Completed tasks expanded",
        variant: "Completed tasks collapsed",
      },
    ],
  },
  {
    id: "pipeline",
    name: "Pipeline",
    product: "Sales CRM",
    categories: ["4. Element position and visibility"],
    flow: "Email a contact from the list, open a contact, log a call, add a deal, check the lead score, delete a contact, then export and import contacts.",
    changes: [
      {
        item: 22,
        what: "Moved on the same page",
        baseline: "Export CSV in the Contacts header",
        variant: "Export CSV below the contacts table",
      },
      {
        item: 23,
        what: "Moved to another page",
        baseline: "Import contacts on the Contacts page",
        variant: "Import contacts on the Settings page",
      },
      {
        item: 24,
        what: "Hidden in an overflow menu",
        baseline: "Delete contact button in the contact header",
        variant: "Delete contact inside the … menu",
      },
      {
        item: 25,
        what: "Shows only on hover",
        baseline: "Email action always visible on each row",
        variant: "Email action appears on row hover or focus",
      },
      {
        item: 26,
        what: "Behind a toggle",
        baseline: "Lead score always shown on the contact",
        variant: "Lead score under Show advanced",
      },
      {
        item: 27,
        what: "Promoted to visible",
        baseline: "Log a call inside the … menu",
        variant: "Log a call as a visible button",
      },
      {
        item: 28,
        what: "Emphasis swap",
        baseline: "Add deal primary, Send email secondary",
        variant: "Send email primary, Add deal secondary",
      },
    ],
  },
  {
    id: "shopline",
    name: "Shopline",
    product: "Store admin",
    categories: ["5. Component type swaps"],
    flow: "Filter products by category, add a product, open a product's pricing and inventory, change a price, then publish it.",
    changes: [
      {
        item: 29,
        what: "Dropdown swap",
        baseline: "Category filter dropdown",
        variant: "Category segmented control",
      },
      {
        item: 30,
        what: "Modal to drawer",
        baseline: "Add product opens a centered modal",
        variant: "Add product opens a side drawer",
      },
      {
        item: 31,
        what: "Tabs to accordion",
        baseline: "Product detail tabs: Details, Pricing, Inventory",
        variant: "Product detail accordion sections",
      },
      {
        item: 32,
        what: "Table to cards",
        baseline: "Products table",
        variant: "Products card grid",
      },
      {
        item: 33,
        what: "Inline edit to form",
        baseline: "Edit price inline in the table",
        variant: "Edit price in the product's Pricing form",
      },
      {
        item: 34,
        what: "Checkbox to switch",
        baseline: "Published checkbox",
        variant: "Published toggle switch",
      },
    ],
  },
  {
    id: "filebox",
    name: "Filebox",
    product: "File manager",
    categories: ["6. Interaction model"],
    flow: "Open a folder, search for a file, edit its description, move it to another folder, then delete two files.",
    changes: [
      {
        item: 35,
        what: "Click to double-click",
        baseline: "Single click opens a folder",
        variant: "Double-click opens a folder; single click selects it",
      },
      {
        item: 36,
        what: "Button to drag-and-drop",
        baseline: "Move to… button with a folder picker",
        variant: "Drag a file onto a sidebar folder",
      },
      {
        item: 37,
        what: "Save to autosave",
        baseline: "Description has a Save button",
        variant: "Description saves automatically",
      },
      {
        item: 38,
        what: "Shortcut replaces control",
        baseline: "Visible search box",
        variant: "⌘K or Ctrl+K command palette",
      },
      {
        item: 39,
        what: "Bulk actions added",
        baseline: "Delete one file at a time",
        variant: "Checkboxes with Delete selected and Move selected",
      },
    ],
  },
  {
    id: "tripway",
    name: "Tripway",
    product: "Hotel booking",
    categories: ["7. Flow and steps"],
    flow: "Book a hotel stay from the first step through confirmation. In the variant, choose Business as the trip purpose.",
    changes: [
      {
        item: 40,
        what: "Step removed",
        baseline: "Extras step",
        variant: "No Extras step",
      },
      {
        item: 41,
        what: "Step added",
        baseline: "No trip purpose",
        variant: "Trip purpose step: Leisure or Business",
      },
      {
        item: 42,
        what: "Steps reordered",
        baseline: "Destination, then Dates",
        variant: "Dates, then Destination",
      },
      {
        item: 43,
        what: "Pages merged",
        baseline: "Separate Guests and Room steps",
        variant: "One Guests and room step",
      },
      {
        item: 44,
        what: "Branching",
        baseline: "Same steps for everyone",
        variant: "Business trips add a Company details step",
      },
      {
        item: 45,
        what: "Confirmation removed",
        baseline: "Book now asks for confirmation",
        variant: "Book now books immediately",
      },
      {
        item: 46,
        what: "Defaults changed",
        baseline: "1 guest, Standard room",
        variant: "2 guests, Deluxe room preselected",
      },
    ],
  },
  {
    id: "peoplehub",
    name: "Peoplehub",
    product: "HR onboarding",
    categories: ["8. Forms and validation"],
    flow: "Add a new employee with the form, fix any validation errors, then find them in the directory.",
    changes: [
      {
        item: 47,
        what: "Fields changed",
        baseline: "Fax field; Job title before Department",
        variant: "Fax removed, Pronouns added, Department before Job title",
      },
      {
        item: 48,
        what: "Required changed",
        baseline: "Manager required, Phone optional",
        variant: "Phone required, Manager optional",
      },
      {
        item: 49,
        what: "Validation rules",
        baseline: "Any email, any employee ID, any start date",
        variant:
          "Email must end in @acme.com, ID must look like EMP-1234, start date can't be in the past",
      },
    ],
  },
  {
    id: "metricly",
    name: "Metricly",
    product: "Analytics",
    categories: ["9. Navigation and information architecture"],
    flow: "Check the dashboard, open a report, export it, create an alert, then update your profile and billing.",
    changes: [
      {
        item: 50,
        what: "Menu regrouped",
        baseline: "Flat menu: Dashboard, Reports, Exports, Alerts, Settings",
        variant: "Grouped: Analyze, Monitor, Account",
      },
      {
        item: 51,
        what: "Pages merged and split",
        baseline: "Separate Reports and Exports; one Settings page with tabs",
        variant:
          "Insights merges Reports and Exports; Settings splits into Profile and Billing",
      },
      {
        item: 52,
        what: "Routes renamed",
        baseline: "#/dashboard, #/reports, #/settings",
        variant:
          "#/overview, #/insights, #/account/profile; old links show Page not found",
      },
      {
        item: 53,
        what: "Top nav to side nav",
        baseline: "Top navigation bar",
        variant: "Side navigation",
      },
    ],
  },
  {
    id: "mailbird",
    name: "Mailbird",
    product: "Email campaigns",
    categories: ["10. Interruptions and gates"],
    flow: "Open campaigns, write a new campaign, schedule it, then send it.",
    changes: [
      {
        item: 54,
        what: "Popups in the path",
        baseline: "No popups",
        variant:
          "What's new dialog on load, cookie banner, and a Pro upsell when scheduling",
      },
      {
        item: 55,
        what: "New auth step",
        baseline: "Send goes straight through",
        variant: "Send asks for a 6-digit code (demo code 123456)",
      },
      {
        item: 56,
        what: "Loading states",
        baseline: "Lists and checks appear instantly",
        variant: "Campaign list skeleton and a deliverability check wait",
      },
    ],
  },
  {
    id: "notely",
    name: "Notely",
    product: "Notes",
    categories: ["11. Full redesign"],
    flow: "Open a note, edit it, tag it, then create a new note in a folder.",
    changes: [
      {
        item: 57,
        what: "Complete redesign",
        baseline: "Three-pane layout: folders, note list, editor",
        variant: "Top bar, card grid, and a full-page editor in a new palette",
      },
      {
        item: 58,
        what: "Feature removed",
        baseline: "Tags on notes and a tag filter",
        variant: "Tags removed",
      },
    ],
  },
  {
    id: "corvid",
    name: "Corvid",
    product: "Issue tracker",
    categories: ["12. Deep workflows"],
    flow: "Starting from My issues, build and save a filtered board of urgent bugs, split an issue into sub-issues and finish one, add backlog issues to the current cycle, add a milestone to a project, then add an In review status to the team workflow.",
    changes: [
      {
        item: 59,
        what: "Saved view: save action and where views live",
        baseline:
          "Teams → Engineering → Issues tab → Filter and Display → Save view button; the view appears under Favorites in the sidebar",
        variant:
          "Save as view is inside the … menu; views live on the team's Views tab, not in the sidebar",
      },
      {
        item: 60,
        what: "Sub-issues: add action and section state",
        baseline:
          "Teams → Engineering → Issues tab → ENG-118 → Sub-issues section, open → Add sub-issue inline form",
        variant:
          "Issue … menu → Add sub-issue dialog; the Sub-issues section starts collapsed",
      },
      {
        item: 61,
        what: "Cycle planning: where you add issues",
        baseline:
          "Teams → Engineering → Cycles tab → Cycle 24 → Add issues → pick from the backlog",
        variant:
          "No Add issues in the cycle; Issues tab → open each backlog issue → Cycle property → Cycle 24",
      },
      {
        item: 62,
        what: "Project milestones: tab removed",
        baseline:
          "Initiatives → Fleet platform 2027 → Fleet dashboard v2 → Milestones tab → Add milestone",
        variant:
          "Milestones tab removed; Overview side panel → Milestones + button",
      },
      {
        item: 63,
        what: "Team workflow settings: page renamed and add action moved",
        baseline:
          "Settings → Teams → Engineering → Workflow → Add status, choose a category",
        variant:
          "Settings → Teams → Engineering → Issue statuses → + on the category row",
      },
    ],
  },
];
