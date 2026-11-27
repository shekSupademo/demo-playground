import { daysFromToday } from "../../kit";

export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  fax: string;
  pronouns: string;
  jobTitle: string;
  department: string;
  manager: string;
  employeeId: string;
  startDate: string;
};

export type Person = Employee & {
  location: string;
  onLeave: boolean;
  checklist: boolean[] | null;
  addedByYou: boolean;
};

export type Status = "Active" | "Onboarding" | "Starting soon" | "On leave";

export type TimeOff = {
  id: string;
  personId: string;
  type: "Vacation" | "Sick leave" | "Parental leave" | "Personal";
  start: string;
  end: string;
  status: "Pending" | "Approved" | "Declined";
  note: string;
};

export const departments = [
  "Engineering",
  "Design",
  "Marketing",
  "Sales",
  "People",
  "Finance",
  "Customer Success",
];

export const departmentColors: Record<string, string> = {
  Engineering: "#E11D48",
  Design: "#F472B6",
  Marketing: "#F59E0B",
  Sales: "#0EA5E9",
  People: "#8B5CF6",
  Finance: "#10B981",
  "Customer Success": "#64748B",
};

export const pronounOptions = [
  "She/her",
  "He/him",
  "They/them",
  "Prefer not to say",
];

export const onboardingTasks = [
  "Sign offer letter",
  "Complete tax and payroll forms",
  "Set up laptop and accounts",
  "Meet your manager",
  "Finish security training",
  "Join your first team standup",
];

export const blank: Omit<Employee, "id"> = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  fax: "",
  pronouns: "",
  jobTitle: "",
  department: "",
  manager: "",
  employeeId: "",
  startDate: "",
};

type Row = [
  string,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  string,
  { done?: number; onLeave?: boolean; noPhone?: boolean; fax?: boolean }?,
];

const rows: Row[] = [
  [
    "1001",
    "Grace",
    "Okafor",
    "Chief People Officer",
    "People",
    "",
    -2450,
    "She/her",
    "San Francisco",
    { fax: true },
  ],
  [
    "1014",
    "Daniel",
    "Hughes",
    "VP of Engineering",
    "Engineering",
    "Grace Okafor",
    -2100,
    "He/him",
    "San Francisco",
  ],
  [
    "1027",
    "Mei",
    "Tanaka",
    "Design Lead",
    "Design",
    "Grace Okafor",
    -1920,
    "She/her",
    "Toronto",
  ],
  [
    "1031",
    "Wei",
    "Zhang",
    "Staff Engineer",
    "Engineering",
    "Daniel Hughes",
    -1500,
    "He/him",
    "San Francisco",
  ],
  [
    "1042",
    "Luis",
    "Romero",
    "Senior Software Engineer",
    "Engineering",
    "Daniel Hughes",
    -1650,
    "He/him",
    "Austin",
  ],
  [
    "1058",
    "Aisha",
    "Rahman",
    "Product Designer",
    "Design",
    "Mei Tanaka",
    -1380,
    "She/her",
    "London",
  ],
  [
    "1063",
    "Tom",
    "Becker",
    "Head of Sales",
    "Sales",
    "Grace Okafor",
    -1300,
    "He/him",
    "New York",
    { fax: true },
  ],
  [
    "1066",
    "Priya",
    "Desai",
    "People Operations Manager",
    "People",
    "Grace Okafor",
    -980,
    "She/her",
    "San Francisco",
  ],
  [
    "1071",
    "Riley",
    "Nguyen",
    "Marketing Manager",
    "Marketing",
    "Grace Okafor",
    -1050,
    "They/them",
    "Remote",
  ],
  [
    "1077",
    "Nikolai",
    "Ivanov",
    "Customer Onboarding Lead",
    "Customer Success",
    "Tom Becker",
    -900,
    "He/him",
    "Berlin",
    { noPhone: true },
  ],
  [
    "1085",
    "Sofia",
    "Marino",
    "Financial Analyst",
    "Finance",
    "Grace Okafor",
    -800,
    "She/her",
    "New York",
    { fax: true },
  ],
  [
    "1088",
    "Mateo",
    "Fernández-Castillo",
    "Senior Customer Success Manager",
    "Customer Success",
    "Tom Becker",
    -700,
    "He/him",
    "Madrid",
  ],
  [
    "1092",
    "Kwame",
    "Asante",
    "Support Specialist",
    "Customer Success",
    "Tom Becker",
    -600,
    "He/him",
    "Austin",
  ],
  [
    "1095",
    "David",
    "Cohen",
    "Field Marketing Manager",
    "Marketing",
    "Riley Nguyen",
    -610,
    "He/him",
    "Chicago",
    { onLeave: true },
  ],
  [
    "1098",
    "Jamal",
    "Wright",
    "Site Reliability Engineer",
    "Engineering",
    "Daniel Hughes",
    -500,
    "He/him",
    "Austin",
  ],
  [
    "1104",
    "Hannah",
    "Schmidt",
    "Frontend Engineer",
    "Engineering",
    "Daniel Hughes",
    -420,
    "She/her",
    "Berlin",
  ],
  [
    "1107",
    "Isabella",
    "Rossi",
    "Payroll Specialist",
    "Finance",
    "Sofia Marino",
    -420,
    "She/her",
    "Remote",
    { onLeave: true },
  ],
  [
    "1112",
    "Olivia",
    "Brennan",
    "Account Executive",
    "Sales",
    "Tom Becker",
    -350,
    "She/her",
    "New York",
  ],
  [
    "1118",
    "Noah",
    "Kim",
    "Content Strategist",
    "Marketing",
    "Riley Nguyen",
    -310,
    "He/him",
    "Remote",
  ],
  [
    "1121",
    "Maria",
    "Gonzalez",
    "Office and Workplace Coordinator",
    "People",
    "Priya Desai",
    -280,
    "She/her",
    "Austin",
  ],
  [
    "1125",
    "Connor",
    "Walsh",
    "Accounts Payable Specialist",
    "Finance",
    "",
    -260,
    "He/him",
    "Remote",
    { noPhone: true },
  ],
  [
    "1133",
    "Elena",
    "Petrova",
    "Data Engineer",
    "Engineering",
    "Daniel Hughes",
    -230,
    "She/her",
    "Berlin",
  ],
  [
    "1139",
    "Chloé",
    "Dubois",
    "Brand Designer",
    "Design",
    "Mei Tanaka",
    -150,
    "She/her",
    "London",
  ],
  [
    "1144",
    "Samuel",
    "Osei",
    "Sales Development Representative",
    "Sales",
    "Olivia Brennan",
    -90,
    "He/him",
    "New York",
  ],
  [
    "1150",
    "Ana",
    "Lima",
    "QA Engineer",
    "Engineering",
    "Daniel Hughes",
    -45,
    "She/her",
    "Remote",
    { done: 6 },
  ],
  [
    "1156",
    "Arjun",
    "Mehta",
    "Backend Engineer",
    "Engineering",
    "Luis Romero",
    -21,
    "He/him",
    "Austin",
    { done: 4 },
  ],
  [
    "1161",
    "Zoe",
    "Clarke",
    "Customer Support Specialist",
    "Customer Success",
    "Kwame Asante",
    -12,
    "She/her",
    "Austin",
    { done: 3 },
  ],
  [
    "1164",
    "Ben",
    "Lawson",
    "Recruiter",
    "People",
    "Priya Desai",
    -6,
    "He/him",
    "San Francisco",
    { done: 2, noPhone: true },
  ],
  [
    "1167",
    "Fatima",
    "Al-Sayed",
    "Senior Product Designer",
    "Design",
    "Mei Tanaka",
    -3,
    "She/her",
    "London",
    { done: 1 },
  ],
  [
    "1170",
    "Yuki",
    "Sato",
    "Product Marketing Manager",
    "Marketing",
    "Riley Nguyen",
    5,
    "She/her",
    "Toronto",
    { done: 1 },
  ],
  [
    "1173",
    "Lucas",
    "Moreau",
    "Solutions Engineer",
    "Sales",
    "Tom Becker",
    12,
    "He/him",
    "New York",
    { done: 0 },
  ],
];

const ascii = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

export const seed: Person[] = rows
  .map(
    ([
      id,
      firstName,
      lastName,
      jobTitle,
      department,
      manager,
      offset,
      pronouns,
      location,
      extra = {},
    ]) => ({
      id,
      firstName,
      lastName,
      email: `${ascii(firstName)}.${ascii(lastName)}@acme.com`,
      phone: extra.noPhone ? "" : `+1 415 555 0${id.slice(1)}`,
      fax: extra.fax ? `+1 415 555 9${id.slice(1)}` : "",
      pronouns,
      jobTitle,
      department,
      manager,
      employeeId: `EMP-${id}`,
      startDate: daysFromToday(offset),
      location,
      onLeave: extra.onLeave ?? false,
      checklist:
        extra.done === undefined
          ? null
          : onboardingTasks.map((_, i) => i < (extra.done ?? 0)),
      addedByYou: false,
    }),
  )
  .sort((a, b) => b.startDate.localeCompare(a.startDate));

export const seedTimeOff: TimeOff[] = [
  {
    id: "t1",
    personId: "1042",
    type: "Vacation",
    start: daysFromToday(4),
    end: daysFromToday(8),
    status: "Pending",
    note: "Family trip to Oaxaca",
  },
  {
    id: "t2",
    personId: "1112",
    type: "Personal",
    start: daysFromToday(2),
    end: daysFromToday(2),
    status: "Pending",
    note: "Moving apartments",
  },
  {
    id: "t3",
    personId: "1139",
    type: "Vacation",
    start: daysFromToday(15),
    end: daysFromToday(26),
    status: "Pending",
    note: "",
  },
  {
    id: "t4",
    personId: "1098",
    type: "Sick leave",
    start: daysFromToday(0),
    end: daysFromToday(1),
    status: "Approved",
    note: "",
  },
  {
    id: "t5",
    personId: "1095",
    type: "Parental leave",
    start: daysFromToday(-40),
    end: daysFromToday(50),
    status: "Approved",
    note: "Back in the new year",
  },
  {
    id: "t6",
    personId: "1107",
    type: "Personal",
    start: daysFromToday(-10),
    end: daysFromToday(20),
    status: "Approved",
    note: "",
  },
  {
    id: "t7",
    personId: "1027",
    type: "Vacation",
    start: daysFromToday(-1),
    end: daysFromToday(3),
    status: "Approved",
    note: "Lisbon",
  },
  {
    id: "t8",
    personId: "1118",
    type: "Vacation",
    start: daysFromToday(9),
    end: daysFromToday(12),
    status: "Pending",
    note: "Long weekend",
  },
  {
    id: "t9",
    personId: "1088",
    type: "Vacation",
    start: daysFromToday(-30),
    end: daysFromToday(-24),
    status: "Approved",
    note: "",
  },
  {
    id: "t10",
    personId: "1133",
    type: "Sick leave",
    start: daysFromToday(-14),
    end: daysFromToday(-13),
    status: "Approved",
    note: "",
  },
  {
    id: "t11",
    personId: "1063",
    type: "Vacation",
    start: daysFromToday(-5),
    end: daysFromToday(-2),
    status: "Declined",
    note: "Overlaps with the quarter close",
  },
  {
    id: "t12",
    personId: "1121",
    type: "Personal",
    start: daysFromToday(21),
    end: daysFromToday(21),
    status: "Pending",
    note: "Jury duty",
  },
  {
    id: "t13",
    personId: "1092",
    type: "Vacation",
    start: daysFromToday(30),
    end: daysFromToday(41),
    status: "Approved",
    note: "Visiting family in Accra",
  },
  {
    id: "t14",
    personId: "1014",
    type: "Vacation",
    start: daysFromToday(-60),
    end: daysFromToday(-52),
    status: "Approved",
    note: "",
  },
];

const minutesAgo = (m: number) =>
  new Date(Date.now() - m * 60000).toISOString();

export const notifications = [
  {
    id: "n1",
    title: "Luis Romero requested 5 days of vacation",
    time: minutesAgo(18),
    unread: true,
  },
  {
    id: "n2",
    title: "Fatima Al-Sayed finished security training",
    time: minutesAgo(95),
    unread: true,
  },
  {
    id: "n3",
    title: "Yuki Sato signed her offer letter",
    time: minutesAgo(60 * 5),
    unread: true,
  },
  {
    id: "n4",
    title: "Payroll for this period closes on Friday",
    time: minutesAgo(60 * 26),
    unread: false,
  },
  {
    id: "n5",
    title: "Olivia Brennan's 1-year anniversary is next week",
    time: minutesAgo(60 * 50),
    unread: false,
  },
];

export const fullName = (e: Pick<Employee, "firstName" | "lastName">) =>
  `${e.firstName} ${e.lastName}`;

export function statusOf(p: Person, today: string): Status {
  if (p.onLeave) return "On leave";
  if (p.startDate > today) return "Starting soon";
  if (p.checklist && p.checklist.some((done) => !done)) return "Onboarding";
  return "Active";
}

export function dayCount(start: string, end: string) {
  const ms =
    new Date(`${end}T00:00:00`).getTime() -
    new Date(`${start}T00:00:00`).getTime();
  return Math.round(ms / 86400000) + 1;
}
