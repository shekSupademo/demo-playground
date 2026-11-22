export const demoFeatures = {
  cards: {
    name: "Cards",
    category: "UI change",
    baseline: "New card opens the existing two-step issue-card modal.",
    variant: "Card controls refresh",
    changes: [
      "Replace the plain Cards header with a full-width orange Card management banner.",
      "Rename New card to Issue card and give it a high-contrast button beside expandable Card tips.",
      "Add a Your cards section and apply warm accents to card borders, progress bars, and management links.",
      "Keep the same issue-card form and submit action.",
    ],
  },
  payments: {
    name: "Payments",
    category: "Flow change",
    baseline: "Send money opens one details form, followed by Review.",
    variant: "Guided payment",
    changes: [
      "Hide Send money under the three-dot More payment actions menu on Payments.",
      "Require a document type, a supporting file, and confirmation that it matches the recipient.",
      "Move the date and memo from Amount into a separate Delivery step before Review.",
    ],
  },
  bills: {
    name: "Bills",
    category: "Big flow change",
    baseline: "Move bills through the Inbox, Approved, Scheduled, and Paid board columns.",
    variant: "Vendor-first payments",
    changes: [
      "Replace the status board with a searchable vendor list.",
      "Open a vendor drawer to see individual bills, their status, and due dates.",
      "Choose Pay now or Schedule, then confirm the amount and timing.",
    ],
  },
  insights: {
    name: "Insights",
    category: "Rebranding",
    baseline: "Insights uses the Northbeam dashboard styling and chart labels.",
    variant: "Fieldnote Analytics",
    changes: [
      "Introduce the Fieldnote Analytics name and a leaf mark.",
      "Apply a forest-green palette, serif title, and new chart and panel labels.",
      "Keep the date ranges, underlying metrics, and transaction drill-downs.",
    ],
  },
} as const;

export type DemoFeature = keyof typeof demoFeatures;
export type DemoVariant = "baseline" | "variant";
export type DemoVariants = Record<DemoFeature, DemoVariant>;

export const demoFeatureIds = Object.keys(demoFeatures) as DemoFeature[];
export const baselineVariants: DemoVariants = {
  cards: "baseline",
  payments: "baseline",
  bills: "baseline",
  insights: "baseline",
};

export function decodeVariants(value: string): DemoVariants {
  const enabled = new Set(value.split(","));
  return Object.fromEntries(
    demoFeatureIds.map((id) => [id, enabled.has(id) ? "variant" : "baseline"]),
  ) as DemoVariants;
}

export function encodeVariants(variants: DemoVariants) {
  return demoFeatureIds.filter((id) => variants[id] === "variant").join(",");
}

export function variantUrl(variants: DemoVariants, route: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("variants", encodeVariants(variants));
  url.hash = route;
  return url.toString();
}
