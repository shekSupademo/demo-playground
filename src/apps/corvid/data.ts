import { daysFromToday } from "../../kit";

export type Member = {
  id: string;
  name: string;
  email: string;
  title: string;
  role: "Owner" | "Admin" | "Member" | "Guest";
  teamId: string;
  twoFactor:
    | "Authenticator app"
    | "Security key"
    | "Text message"
    | "Not enrolled";
  lastSignIn: string;
  joined: string;
  location: string;
};

export type Team = {
  id: string;
  name: string;
  description: string;
  lead: string;
  usedGb: number;
  limitGb: number;
  channel: string;
};

export type ApiKey = {
  id: string;
  name: string;
  suffix: string;
  scopes: string[];
  created: string;
  lastUsed: string;
  rotated: string;
};

export type DevApp = {
  id: string;
  name: string;
  description: string;
  owner: string;
  status: "Active" | "Paused";
  requests: number;
  keys: ApiKey[];
};

export type Invoice = {
  id: string;
  number: string;
  period: string;
  issued: string;
  amount: number;
  status: "Paid" | "Due";
  subscriptionId: string;
  lines: { label: string; quantity: number; unit: number }[];
};

export type Subscription = {
  id: string;
  name: string;
  seats: number;
  price: number;
  renews: string;
  status: "Active" | "Trial";
};

export type Policy = {
  id: string;
  name: string;
  summary: string;
  updated: string;
  updatedBy: string;
};

const now = new Date().toISOString();
const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 3600000).toISOString();

export const company = {
  name: "Halden Robotics",
  domain: "halden.io",
  plan: "Business",
  region: "EU (Frankfurt)",
};

export const seedTeams: Team[] = [
  {
    id: "engineering",
    name: "Engineering",
    description: "Firmware, platform and the fleet dashboard",
    lead: "Maya Chen",
    usedGb: 412,
    limitGb: 500,
    channel: "#eng",
  },
  {
    id: "design",
    name: "Design",
    description: "Product, brand and industrial design",
    lead: "Tomás Ibarra",
    usedGb: 286,
    limitGb: 300,
    channel: "#design",
  },
  {
    id: "sales",
    name: "Sales",
    description: "Field sales and partner channel",
    lead: "Grace Okafor",
    usedGb: 64,
    limitGb: 200,
    channel: "#sales",
  },
  {
    id: "support",
    name: "Customer support",
    description: "Tier 1 and 2 support, field service",
    lead: "Liam Novak",
    usedGb: 121,
    limitGb: 200,
    channel: "#support",
  },
  {
    id: "finance",
    name: "Finance",
    description: "Accounting, payroll and procurement",
    lead: "Hana Sato",
    usedGb: 38,
    limitGb: 100,
    channel: "#finance",
  },
  {
    id: "people",
    name: "People operations",
    description: "Recruiting, onboarding and benefits",
    lead: "Amara Diallo",
    usedGb: 22,
    limitGb: 100,
    channel: "#people",
  },
  {
    id: "manufacturing",
    name: "Manufacturing and quality assurance",
    description: "Assembly line, suppliers and QA testing",
    lead: "Erik Lindqvist",
    usedGb: 175,
    limitGb: 250,
    channel: "#mfg",
  },
];

const m = (
  name: string,
  teamId: string,
  title: string,
  twoFactor: Member["twoFactor"],
  lastSignIn: string,
  joinedDays: number,
  location: string,
  role: Member["role"] = "Member",
): Member => ({
  id: name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z ]/g, "")
    .replace(/ /g, "-"),
  name,
  email: `${name
    .split(" ")[0]
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z]/g, "")}@halden.io`,
  title,
  role,
  teamId,
  twoFactor,
  lastSignIn,
  joined: daysFromToday(joinedDays),
  location,
});

export const seedMembers: Member[] = [
  m(
    "Maya Chen",
    "engineering",
    "Engineering manager",
    "Authenticator app",
    hoursAgo(2),
    -912,
    "Berlin",
    "Admin",
  ),
  m(
    "Daniel Brooks",
    "engineering",
    "Senior firmware engineer",
    "Security key",
    hoursAgo(5),
    -640,
    "Munich",
  ),
  m(
    "Priya Raman",
    "engineering",
    "Platform lead",
    "Authenticator app",
    now,
    -1210,
    "Berlin",
    "Owner",
  ),
  m(
    "Kenji Watanabe",
    "engineering",
    "Backend engineer",
    "Text message",
    hoursAgo(30),
    -201,
    "Remote, Tokyo",
  ),
  m(
    "Sofia Marchetti",
    "engineering",
    "Frontend engineer",
    "Authenticator app",
    hoursAgo(9),
    -388,
    "Milan",
  ),
  m(
    "Oliver Grant",
    "engineering",
    "Site reliability engineer",
    "Not enrolled",
    daysFromToday(-12),
    -45,
    "London",
  ),
  m(
    "Noor Haddad",
    "engineering",
    "Embedded systems engineer",
    "Security key",
    hoursAgo(1),
    -530,
    "Berlin",
  ),
  m(
    "Tomás Ibarra",
    "design",
    "Head of design",
    "Authenticator app",
    hoursAgo(3),
    -803,
    "Barcelona",
    "Admin",
  ),
  m(
    "Ella Fitzgerald-Montgomery",
    "design",
    "Senior industrial designer",
    "Text message",
    hoursAgo(26),
    -455,
    "Dublin",
  ),
  m(
    "Jun Park",
    "design",
    "Product designer",
    "Authenticator app",
    hoursAgo(7),
    -176,
    "Seoul",
  ),
  m(
    "Ines Duarte",
    "design",
    "Brand designer",
    "Not enrolled",
    daysFromToday(-3),
    -20,
    "Lisbon",
  ),
  m(
    "Grace Okafor",
    "sales",
    "VP of sales",
    "Authenticator app",
    hoursAgo(4),
    -730,
    "Amsterdam",
    "Admin",
  ),
  m(
    "Marcus Hale",
    "sales",
    "Account executive",
    "Text message",
    hoursAgo(50),
    -260,
    "Chicago",
  ),
  m(
    "Lucía Romero",
    "sales",
    "Partner manager",
    "Authenticator app",
    hoursAgo(12),
    -312,
    "Madrid",
  ),
  m(
    "Felix Wagner",
    "sales",
    "Sales engineer",
    "Security key",
    hoursAgo(20),
    -98,
    "Vienna",
  ),
  m(
    "Liam Novak",
    "support",
    "Support lead",
    "Authenticator app",
    hoursAgo(6),
    -680,
    "Prague",
    "Admin",
  ),
  m(
    "Chloé Bernard",
    "support",
    "Support specialist",
    "Text message",
    hoursAgo(2),
    -150,
    "Lyon",
  ),
  m(
    "Ade Balogun",
    "support",
    "Field service engineer",
    "Not enrolled",
    daysFromToday(-1),
    -60,
    "Lagos",
  ),
  m(
    "Mia Johansson",
    "support",
    "Support specialist",
    "Authenticator app",
    hoursAgo(10),
    -222,
    "Stockholm",
  ),
  m(
    "Hana Sato",
    "finance",
    "Finance director",
    "Security key",
    hoursAgo(8),
    -990,
    "Berlin",
    "Admin",
  ),
  m(
    "Robert Klein",
    "finance",
    "Accountant",
    "Authenticator app",
    daysFromToday(-2),
    -400,
    "Hamburg",
  ),
  m(
    "Amara Diallo",
    "people",
    "Head of people",
    "Authenticator app",
    hoursAgo(14),
    -560,
    "Paris",
    "Admin",
  ),
  m(
    "Sam Rivera",
    "people",
    "Recruiter",
    "Text message",
    hoursAgo(36),
    -130,
    "Remote, Austin",
  ),
  m(
    "Erik Lindqvist",
    "manufacturing",
    "Manufacturing manager",
    "Authenticator app",
    hoursAgo(11),
    -870,
    "Gothenburg",
    "Admin",
  ),
  m(
    "Yara Costa",
    "manufacturing",
    "Quality engineer",
    "Security key",
    hoursAgo(28),
    -300,
    "Porto",
  ),
  m(
    "Ben Thompson",
    "manufacturing",
    "Supply chain analyst",
    "Not enrolled",
    daysFromToday(-20),
    -8,
    "Manchester",
    "Guest",
  ),
];

export const seedApps: DevApp[] = [
  {
    id: "billing-sync",
    name: "Billing sync",
    description:
      "Pushes usage from the fleet dashboard into the billing system every hour",
    owner: "Priya Raman",
    status: "Active",
    requests: 184220,
    keys: [
      {
        id: "production",
        name: "Production key",
        suffix: "9f3a",
        scopes: ["usage:read", "invoices:write"],
        created: daysFromToday(-410),
        lastUsed: hoursAgo(1),
        rotated: daysFromToday(-182),
      },
      {
        id: "staging",
        name: "Staging key",
        suffix: "41c7",
        scopes: ["usage:read"],
        created: daysFromToday(-300),
        lastUsed: daysFromToday(-4),
        rotated: daysFromToday(-90),
      },
    ],
  },
  {
    id: "slack-bridge",
    name: "Slack bridge",
    description: "Posts robot fault alerts to team channels",
    owner: "Noor Haddad",
    status: "Active",
    requests: 52310,
    keys: [
      {
        id: "production",
        name: "Production key",
        suffix: "c21e",
        scopes: ["alerts:read"],
        created: daysFromToday(-200),
        lastUsed: hoursAgo(3),
        rotated: daysFromToday(-60),
      },
    ],
  },
  {
    id: "warehouse-export",
    name: "Warehouse export",
    description: "Nightly export of telemetry to the data warehouse",
    owner: "Kenji Watanabe",
    status: "Active",
    requests: 9120,
    keys: [
      {
        id: "production",
        name: "Production key",
        suffix: "7b02",
        scopes: ["telemetry:read"],
        created: daysFromToday(-150),
        lastUsed: daysFromToday(-1),
        rotated: daysFromToday(-150),
      },
    ],
  },
  {
    id: "hr-import",
    name: "HR import",
    description: "Creates accounts for new hires from the HR system",
    owner: "Amara Diallo",
    status: "Paused",
    requests: 310,
    keys: [
      {
        id: "production",
        name: "Production key",
        suffix: "e88d",
        scopes: ["members:write"],
        created: daysFromToday(-95),
        lastUsed: daysFromToday(-30),
        rotated: daysFromToday(-95),
      },
    ],
  },
  {
    id: "status-page",
    name: "Status page",
    description: "Publishes fleet uptime to status.halden.io",
    owner: "Oliver Grant",
    status: "Active",
    requests: 26800,
    keys: [
      {
        id: "production",
        name: "Production key",
        suffix: "02af",
        scopes: ["uptime:read"],
        created: daysFromToday(-40),
        lastUsed: hoursAgo(0.2),
        rotated: daysFromToday(-40),
      },
    ],
  },
];

export const subscriptions: Subscription[] = [
  {
    id: "business",
    name: "Business plan",
    seats: 30,
    price: 24,
    renews: daysFromToday(4),
    status: "Active",
  },
  {
    id: "storage",
    name: "Extra storage, 1 TB",
    seats: 1,
    price: 120,
    renews: daysFromToday(4),
    status: "Active",
  },
  {
    id: "audit",
    name: "Advanced audit add-on",
    seats: 30,
    price: 4,
    renews: daysFromToday(11),
    status: "Trial",
  },
];

const monthKey = (back: number) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - back);
  return {
    key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    issued: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
  };
};

export const invoices: Invoice[] = [0, 1, 2, 3, 4, 5, 6].map((back) => {
  const { key, label, issued } = monthKey(back);
  const seats = 30 - Math.min(back, 4);
  const lines = [
    { label: "Business plan seats", quantity: seats, unit: 24 },
    { label: "Extra storage, 1 TB", quantity: 1, unit: 120 },
    ...(back === 1
      ? [{ label: "Prorated seats added mid-month", quantity: 3, unit: 12 }]
      : []),
  ];
  return {
    id: key,
    number: `INV-${key}`,
    period: label,
    issued,
    amount: lines.reduce((sum, l) => sum + l.quantity * l.unit, 0),
    status: back === 0 ? "Due" : "Paid",
    subscriptionId: "business",
    lines,
  };
});

export const policies: Policy[] = [
  {
    id: "sign-in",
    name: "Sign-in policy",
    summary: "Who can sign in, from which email domains, and how",
    updated: daysFromToday(-14),
    updatedBy: "Priya Raman",
  },
  {
    id: "password",
    name: "Password policy",
    summary: "Length, reuse and expiry rules",
    updated: daysFromToday(-90),
    updatedBy: "Priya Raman",
  },
  {
    id: "session",
    name: "Session policy",
    summary: "Idle timeout and maximum session length",
    updated: daysFromToday(-33),
    updatedBy: "Hana Sato",
  },
  {
    id: "devices",
    name: "Device policy",
    summary: "Managed devices and screen lock rules",
    updated: daysFromToday(-61),
    updatedBy: "Liam Novak",
  },
];

export const seedDomains = [
  { name: "halden.io", added: daysFromToday(-1210), verified: true },
  { name: "haldenrobotics.com", added: daysFromToday(-600), verified: true },
  { name: "halden.de", added: daysFromToday(-12), verified: false },
];

export const auditLog = [
  {
    id: "a1",
    actor: "Priya Raman",
    action: "Changed the session idle timeout to 30 minutes",
    at: hoursAgo(5),
  },
  {
    id: "a2",
    actor: "Tomás Ibarra",
    action: "Invited Ines Duarte to Design",
    at: daysFromToday(-3),
  },
  {
    id: "a3",
    actor: "Hana Sato",
    action: "Updated the payment method",
    at: daysFromToday(-6),
  },
  {
    id: "a4",
    actor: "Liam Novak",
    action: "Removed a device for Chloé Bernard",
    at: daysFromToday(-9),
  },
  {
    id: "a5",
    actor: "Priya Raman",
    action: "Added halden.de as a sign-in domain",
    at: daysFromToday(-12),
  },
];

export const notifications = [
  {
    id: "n1",
    title: "Oliver Grant hasn't set up 2-step verification",
    time: hoursAgo(3),
    unread: true,
  },
  {
    id: "n2",
    title: "Design is at 95% of its storage limit",
    time: hoursAgo(20),
    unread: true,
  },
  {
    id: "n3",
    title: "Billing sync production key is 6 months old",
    time: daysFromToday(-1),
    unread: true,
  },
  {
    id: "n4",
    title: "halden.de is waiting for DNS verification",
    time: daysFromToday(-2),
    unread: false,
  },
  {
    id: "n5",
    title: "Your Business plan renews soon",
    time: daysFromToday(-4),
    unread: false,
  },
];
