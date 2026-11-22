import defaults from "../demoVariantDefaults.json";

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
    name: "App branding",
    category: "Rebranding",
    baseline: "Northbeam uses its original wordmark, sidebar, and indigo palette.",
    variant: "Fieldnote",
    changes: [
      "Rebrand the entire app with a Fieldnote wordmark, leaf icon, and browser tab title.",
      "Use forest-green navigation, warm surfaces, green accents, and serif page headings.",
      "Rename Home to Overview and Insights to Analytics. Refresh chart colors and report labels.",
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

export const defaultVariants = Object.fromEntries(
  demoFeatureIds.map((id) => [id, (defaults as Record<string, string>)[id] === "variant" ? "variant" : "baseline"]),
) as DemoVariants;

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
