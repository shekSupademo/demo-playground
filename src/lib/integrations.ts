// The rows of Settings → Integrations, top to bottom. Add, remove or reorder rows here.
export type Integration = { id: string; name: string; description: string; logo: string; color: string };

export const INTEGRATIONS: Integration[] = [
  { id: "quickbooks", name: "QuickBooks", description: "Sync transactions and categories to your books.", logo: "QB", color: "#2ca01c" },
  { id: "slack", name: "Slack", description: "Post payment and card alerts to a channel.", logo: "S", color: "#611f69" },
  { id: "gusto", name: "Gusto", description: "Fund payroll runs from your Payroll account.", logo: "G", color: "#f45d48" },
];
