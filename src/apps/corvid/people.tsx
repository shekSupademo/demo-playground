import {
  Building2,
  Globe2,
  HardDrive,
  MoreHorizontal,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Avatar, Badge, EmptyState, formatDate, relativeTime } from "../../kit";
import { cx, Dialog, Menu } from "../../ui";
import { company, type Team } from "./data";
import {
  ConfirmDialog,
  Facts,
  LinkList,
  Page,
  Section,
  Table,
  Tabs,
  TwoFactorBadge,
  t,
  UsageBar,
  useTab,
} from "./parts";
import { useStore } from "./store";

const home = { label: "Home", to: "/" };
const people = { label: "People", to: "/people" };
const teamsCrumb = { label: "Teams", to: "/people/teams" };
const org = { label: "Organization", to: "/organization" };

export function PeopleHub() {
  const { members, teams } = useStore();
  const pending = members.filter((m) => m.twoFactor === "Not enrolled").length;
  return (
    <Page
      crumbs={[home, { label: "People" }]}
      title="People"
      description="Teams, members and the roles they hold in Halden Robotics."
    >
      <LinkList
        items={[
          {
            to: "/people/teams",
            label: "Teams",
            description: "Membership, team leads and team settings",
            Icon: Users,
            testId: "hub-teams",
            aside: `${teams.length} teams`,
          },
          {
            to: "/people/members",
            label: "All members",
            description: "Everyone with an account, across every team",
            Icon: UserRound,
            testId: "hub-members",
            aside: `${members.length} members`,
          },
        ]}
      />
      <p className="text-sm text-slate-500">
        {pending} members haven't set up 2-step verification. Open a member's
        profile to see their sign-in methods.
      </p>
    </Page>
  );
}

export function TeamsList() {
  const { teams, members } = useStore();
  const [q, setQ] = useState("");
  const shown = teams.filter((x) =>
    x.name.toLowerCase().includes(q.trim().toLowerCase()),
  );
  return (
    <Page
      crumbs={[home, people, { label: "Teams" }]}
      title="Teams"
      description="Each team has its own members, lead and settings."
    >
      <label className="relative block max-w-xs">
        <span className="sr-only">Search teams</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search teams"
          className={cx(t.input, "pl-9")}
        />
      </label>
      {shown.length === 0 ? (
        <div className={t.panel}>
          <EmptyState
            icon={<Users className="size-5" />}
            title="No teams match"
            body={`Nothing matches “${q.trim()}”. Check the spelling or clear the search.`}
            action={
              <button
                type="button"
                className={t.secondary}
                onClick={() => setQ("")}
              >
                Clear search
              </button>
            }
          />
        </div>
      ) : (
        <Table
          head={[
            { label: "Team" },
            { label: "Lead" },
            { label: "Members", right: true },
            { label: "Storage" },
          ]}
        >
          {shown.map((team) => (
            <tr key={team.id} className="hover:bg-slate-50">
              <td className="max-w-72 px-5 py-3">
                <Link
                  to={`/people/teams/${team.id}`}
                  data-testid={`team-${team.id}`}
                  className={cx(
                    "block truncate font-medium hover:text-[#3046C5]",
                    t.focus,
                  )}
                  title={team.name}
                >
                  {team.name}
                </Link>
                <span
                  className="block truncate text-xs text-slate-500"
                  title={team.description}
                >
                  {team.description}
                </span>
              </td>
              <td className="px-5 py-3">
                <span className="flex items-center gap-2">
                  <Avatar name={team.lead} size={24} />
                  {team.lead}
                </span>
              </td>
              <td className="px-5 py-3 text-right tabular-nums">
                {members.filter((x) => x.teamId === team.id).length}
              </td>
              <td className="w-48 px-5 py-3">
                <UsageBar used={team.usedGb} limit={team.limitGb} />
                <span className="mt-1 block text-xs text-slate-500 tabular-nums">
                  {team.usedGb} of {team.limitGb} GB
                </span>
              </td>
            </tr>
          ))}
        </Table>
      )}
      <p className="text-sm text-slate-500">
        Showing {shown.length} of {teams.length} teams
      </p>
    </Page>
  );
}

const teamTabs = ["members", "settings"] as const;

export function TeamRecord() {
  const { teamId } = useParams();
  const { teams, members, v } = useStore();
  const [tab, setTab] = useTab(teamTabs);
  const team = teams.find((x) => x.id === teamId);
  if (!team) return <Navigate to="/people/teams" replace />;
  const list = members.filter((x) => x.teamId === team.id);
  return (
    <Page
      crumbs={[home, people, teamsCrumb, { label: team.name }]}
      title={team.name}
      description={team.description}
      meta={
        <>
          <span>Lead: {team.lead}</span>
          <span className="tabular-nums">{list.length} members</span>
          <span>Slack: {team.channel}</span>
        </>
      }
    >
      <Tabs
        tabs={teamTabs}
        current={tab}
        onChange={setTab}
        labels={{ members: "Members", settings: "Settings" }}
      />
      {tab === "members" ? (
        <Table
          head={[
            { label: "Name" },
            { label: "Role" },
            { label: "2-step verification" },
            { label: "Last sign-in" },
          ]}
        >
          {list.map((x) => (
            <tr key={x.id} className="hover:bg-slate-50">
              <td className="px-5 py-3">
                <Link
                  to={`/people/teams/${team.id}/members/${x.id}`}
                  data-testid={`member-${x.id}`}
                  className={cx("flex items-center gap-3 rounded", t.focus)}
                >
                  <Avatar name={x.name} size={32} />
                  <span className="min-w-0">
                    <span
                      className="block max-w-56 truncate font-medium hover:text-[#3046C5]"
                      title={x.name}
                    >
                      {x.name}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {x.title}
                    </span>
                  </span>
                </Link>
              </td>
              <td className="px-5 py-3">
                <Badge tone={x.role === "Member" ? "neutral" : "info"}>
                  {x.role}
                </Badge>
              </td>
              <td className="px-5 py-3">
                <TwoFactorBadge value={x.twoFactor} />
              </td>
              <td className="px-5 py-3 text-slate-600">
                {relativeTime(x.lastSignIn)}
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <TeamSettings team={team} v={v} />
      )}
    </Page>
  );
}

function TeamSettings({ team, v }: { team: Team; v: boolean }) {
  const { toast } = useStore();
  const [name, setName] = useState(team.name);
  const [channel, setChannel] = useState(team.channel);
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <form
        className={cx(t.panel, "flex flex-col gap-4 p-5")}
        onSubmit={(e) => {
          e.preventDefault();
          toast("Team details saved");
        }}
      >
        <h2 className="font-semibold">General</h2>
        <label className="text-sm">
          <span className="font-medium">Team name</span>
          <input
            className={cx(t.input, "mt-1.5")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="font-medium">Slack channel</span>
          <input
            className={cx(t.input, "mt-1.5")}
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          />
        </label>
        <div>
          <button type="submit" className={t.primary} disabled={!name.trim()}>
            Save team details
          </button>
        </div>
      </form>
      <div className="flex min-w-0 flex-col gap-3">
        <h2 className="font-semibold">More settings</h2>
        <LinkList
          items={[
            ...(v
              ? []
              : [
                  {
                    to: `/people/teams/${team.id}/storage`,
                    label: "Storage",
                    description: "Usage and the team's storage limit",
                    Icon: HardDrive,
                    testId: "settings-storage",
                  },
                ]),
            {
              to: `/people/teams/${team.id}/access`,
              label: "Shared drive access",
              description: "Who outside the team can open its files",
              Icon: Globe2,
              testId: "settings-access",
            },
          ]}
        />
      </div>
    </div>
  );
}

export function TeamAccess() {
  const { teamId } = useParams();
  const { teams, toast } = useStore();
  const team = teams.find((x) => x.id === teamId);
  const [mode, setMode] = useState("team");
  if (!team) return <Navigate to="/people/teams" replace />;
  return (
    <Page
      crumbs={[
        home,
        people,
        teamsCrumb,
        { label: team.name, to: `/people/teams/${team.id}?tab=settings` },
        { label: "Shared drive access" },
      ]}
      title="Shared drive access"
      description={`Choose who can open files in the ${team.name} shared drive.`}
    >
      <fieldset className={cx(t.panel, "flex max-w-xl flex-col gap-3 p-5")}>
        <legend className="sr-only">Access</legend>
        {[
          ["team", "Team members only"],
          ["org", "Everyone at Halden Robotics"],
          ["link", "Anyone with the link, read only"],
        ].map(([value, label]) => (
          <label key={value} className="flex items-center gap-3 text-sm">
            <input
              type="radio"
              name="access"
              value={value}
              checked={mode === value}
              onChange={() => setMode(value)}
              className="accent-[#3046C5]"
            />
            {label}
          </label>
        ))}
        <div className="pt-2">
          <button
            type="button"
            className={t.primary}
            onClick={() => toast("Access saved")}
          >
            Save access
          </button>
        </div>
      </fieldset>
    </Page>
  );
}

function LimitDialog({
  team,
  open,
  onClose,
}: {
  team: Team;
  open: boolean;
  onClose: () => void;
}) {
  const { setLimit } = useStore();
  const [value, setValue] = useState(String(team.limitGb));
  const n = Number(value);
  const error =
    !Number.isInteger(n) || n <= 0
      ? "Enter a whole number of GB"
      : n < team.usedGb
        ? `The team already uses ${team.usedGb} GB`
        : "";
  const [touched, setTouched] = useState(false);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Edit storage limit for ${team.name}`}
      className={t.dialog}
    >
      <form
        className="mt-4 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (error) return;
          setLimit(team, n);
          onClose();
        }}
      >
        <label className="text-sm">
          <span className="font-medium">Limit in GB</span>
          <input
            type="number"
            inputMode="numeric"
            className={cx(t.input, "mt-1.5 tabular-nums")}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={(e) => e.target.select()}
            aria-invalid={touched && !!error}
            data-testid="storage-limit"
          />
        </label>
        {touched && error && <p className="text-sm text-rose-600">{error}</p>}
        <p className="text-sm text-slate-500">
          Currently using {team.usedGb} GB. Your plan includes 2 TB across all
          teams.
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" className={t.secondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={t.primary} data-testid="save-limit">
            Save limit
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function TeamStorage() {
  const { teamId } = useParams();
  const { teams } = useStore();
  const [open, setOpen] = useState(false);
  const team = teams.find((x) => x.id === teamId);
  if (!team) return <Navigate to="/people/teams" replace />;
  return (
    <Page
      crumbs={[
        home,
        people,
        teamsCrumb,
        { label: team.name, to: `/people/teams/${team.id}?tab=settings` },
        { label: "Storage" },
      ]}
      title="Storage"
      description={`Files, recordings and logs stored by ${team.name}.`}
      actions={
        <button
          type="button"
          className={t.primary}
          onClick={() => setOpen(true)}
          data-testid="edit-limit"
        >
          Edit limit
        </button>
      }
    >
      <div className={cx(t.panel, "flex max-w-xl flex-col gap-3 p-5")}>
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-semibold tabular-nums">
            {team.usedGb} GB
          </span>
          <span
            className="text-sm text-slate-500 tabular-nums"
            data-testid={`limit-${team.id}`}
          >
            of {team.limitGb} GB
          </span>
        </div>
        <UsageBar used={team.usedGb} limit={team.limitGb} />
      </div>
      <Section title="Largest folders">
        <Table head={[{ label: "Folder" }, { label: "Size", right: true }]}>
          {[
            ["Releases", 0.42],
            ["Test recordings", 0.31],
            ["Design files", 0.17],
            ["Other", 0.1],
          ].map(([label, share]) => (
            <tr key={label}>
              <td className="px-5 py-3">{label}</td>
              <td className="px-5 py-3 text-right tabular-nums">
                {Math.round(team.usedGb * Number(share))} GB
              </td>
            </tr>
          ))}
        </Table>
      </Section>
      <LimitDialog
        key={`${team.id}-${open}`}
        team={team}
        open={open}
        onClose={() => setOpen(false)}
      />
    </Page>
  );
}

const memberTabs = ["profile", "security", "activity"] as const;

export function MemberRecord() {
  const { teamId, memberId } = useParams();
  const { teams, members, v, resetTwoFactor, toast } = useStore();
  const [tab, setTab] = useTab(memberTabs);
  const [confirming, setConfirming] = useState(false);
  const team = teams.find((x) => x.id === teamId);
  const member = members.find((x) => x.id === memberId);
  if (!team || !member) return <Navigate to="/people/teams" replace />;
  const enrolled = member.twoFactor !== "Not enrolled";
  return (
    <Page
      crumbs={[
        home,
        people,
        teamsCrumb,
        { label: team.name, to: `/people/teams/${team.id}` },
        { label: member.name },
      ]}
      title={
        <span className="flex items-center gap-3">
          <Avatar name={member.name} size={40} />
          <span className="min-w-0 truncate">{member.name}</span>
        </span>
      }
      description={`${member.title}, ${team.name}`}
      actions={
        <>
          <button
            type="button"
            className={t.secondary}
            onClick={() => toast(`Message sent to ${member.name}`)}
          >
            Send message
          </button>
          <Menu
            label={`More actions for ${member.name}`}
            trigger={<MoreHorizontal className="size-5" aria-hidden />}
            triggerClassName={t.ghost}
            testId="member-actions"
            items={[
              {
                label: "Change team",
                onSelect: () => toast("Team picker opened"),
              },
              ...(v && enrolled
                ? [
                    {
                      label: "Reset 2-step",
                      onSelect: () => setConfirming(true),
                      testId: "menu-reset-2fa",
                    },
                  ]
                : []),
              {
                label: "Suspend account",
                onSelect: () => toast(`${member.name} suspended`),
                danger: true,
              },
            ]}
          />
        </>
      }
    >
      <Tabs
        tabs={memberTabs}
        current={tab}
        onChange={setTab}
        labels={{
          profile: "Profile",
          security: v ? "Sign-in and security" : "Security",
          activity: "Activity",
        }}
      />
      {tab === "profile" && (
        <Facts
          items={[
            ["Email", member.email],
            ["Role", member.role],
            ["Team", team.name],
            ["Location", member.location],
            ["Joined", formatDate(member.joined)],
            ["Last sign-in", relativeTime(member.lastSignIn)],
          ]}
        />
      )}
      {tab === "security" && (
        <div className="flex max-w-3xl flex-col gap-6">
          <section
            className={cx(t.panel, "flex flex-wrap items-center gap-4 p-5")}
          >
            <ShieldCheck className="size-6 text-[#3046C5]" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">2-step verification</h2>
              <p
                className="mt-1 flex items-center gap-2 text-sm text-slate-600"
                data-testid="twofa-status"
              >
                Method: <TwoFactorBadge value={member.twoFactor} />
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {enrolled
                  ? "Reset it if they lost their phone or key. They'll set it up again at next sign-in."
                  : "They'll be asked to set it up at next sign-in."}
              </p>
            </div>
            {!v && enrolled && (
              <button
                type="button"
                className={t.secondary}
                onClick={() => setConfirming(true)}
                data-testid="reset-2fa"
              >
                Reset 2-step
              </button>
            )}
          </section>
          <Section title="Signed-in devices">
            <Table
              head={[
                { label: "Device" },
                { label: "Location" },
                { label: "Last active" },
              ]}
            >
              {[
                ["MacBook Pro, Chrome", member.location, member.lastSignIn],
                [
                  "iPhone 15, Corvid app",
                  member.location,
                  new Date(Date.now() - 86400000 * 2).toISOString(),
                ],
              ].map(([d, l, at]) => (
                <tr key={d}>
                  <td className="px-5 py-3">{d}</td>
                  <td className="px-5 py-3">{l}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {relativeTime(at)}
                  </td>
                </tr>
              ))}
            </Table>
          </Section>
        </div>
      )}
      {tab === "activity" && (
        <ol className={cx(t.panel, "divide-y divide-slate-100")}>
          {[
            ["Signed in", member.lastSignIn],
            ["Joined " + team.name, member.joined],
          ].map(([what, at]) => (
            <li
              key={what}
              className="flex justify-between gap-4 px-5 py-3 text-sm"
            >
              <span>{what}</span>
              <span className="text-slate-500">{relativeTime(at)}</span>
            </li>
          ))}
        </ol>
      )}
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Reset 2-step verification for ${member.name}?`}
        body={`Their ${member.twoFactor.toLowerCase()} stops working right away. They'll set up a new method the next time they sign in.`}
        confirm="Reset 2-step"
        onConfirm={() => resetTwoFactor(member)}
        testId="confirm-reset-2fa"
      />
    </Page>
  );
}

export function AllMembers() {
  const { members, teams } = useStore();
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const shown = members.filter(
    (x) => x.name.toLowerCase().includes(term) || x.email.includes(term),
  );
  return (
    <Page
      crumbs={[home, people, { label: "All members" }]}
      title="All members"
      description="Everyone with a Corvid account at Halden Robotics."
    >
      <label className="relative block max-w-xs">
        <span className="sr-only">Search members</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email"
          className={cx(t.input, "pl-9")}
        />
      </label>
      <Table
        head={[
          { label: "Name" },
          { label: "Team" },
          { label: "Role" },
          { label: "Joined" },
        ]}
      >
        {shown.map((x) => {
          const team = teams.find((tm) => tm.id === x.teamId);
          return (
            <tr key={x.id} className="hover:bg-slate-50">
              <td className="px-5 py-3">
                <Link
                  to={`/people/teams/${x.teamId}/members/${x.id}`}
                  className={cx(
                    "flex items-center gap-3 rounded font-medium hover:text-[#3046C5]",
                    t.focus,
                  )}
                >
                  <Avatar name={x.name} size={28} />
                  <span className="max-w-56 truncate" title={x.name}>
                    {x.name}
                  </span>
                </Link>
              </td>
              <td className="max-w-48 truncate px-5 py-3" title={team?.name}>
                {team?.name}
              </td>
              <td className="px-5 py-3">{x.role}</td>
              <td className="px-5 py-3 text-slate-600">
                {formatDate(x.joined)}
              </td>
            </tr>
          );
        })}
      </Table>
      <p className="text-sm text-slate-500">
        Showing {shown.length} of {members.length} members
      </p>
    </Page>
  );
}

export function OrganizationHub() {
  const { v, teams } = useStore();
  const used = teams.reduce((s, x) => s + x.usedGb, 0);
  return (
    <Page
      crumbs={[home, { label: "Organization" }]}
      title="Organization"
      description="Company details and settings that apply to every team."
    >
      <LinkList
        items={[
          {
            to: "/organization/profile",
            label: "Company profile",
            description: "Name, logo and primary contact",
            Icon: Building2,
            testId: "hub-profile",
          },
          {
            to: "/organization/regions",
            label: "Data region",
            description: `Where your data is stored, currently ${company.region}`,
            Icon: Globe2,
            testId: "hub-regions",
          },
          ...(v
            ? [
                {
                  to: "/organization/storage",
                  label: "Storage",
                  description: "Usage and storage limits for every team",
                  Icon: HardDrive,
                  testId: "hub-storage",
                  aside: `${used} GB used`,
                },
              ]
            : []),
        ]}
      />
    </Page>
  );
}

export function OrganizationProfile() {
  const { toast } = useStore();
  const [name, setName] = useState(company.name);
  return (
    <Page
      crumbs={[home, org, { label: "Company profile" }]}
      title="Company profile"
      description="Shown on invites, invoices and the sign-in page."
    >
      <form
        className={cx(t.panel, "flex max-w-xl flex-col gap-4 p-5")}
        onSubmit={(e) => {
          e.preventDefault();
          toast("Company profile saved");
        }}
      >
        <label className="text-sm">
          <span className="font-medium">Company name</span>
          <input
            className={cx(t.input, "mt-1.5")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="font-medium">Primary domain</span>
          <input
            className={cx(t.input, "mt-1.5")}
            defaultValue={company.domain}
          />
        </label>
        <div>
          <button type="submit" className={t.primary} disabled={!name.trim()}>
            Save profile
          </button>
        </div>
      </form>
    </Page>
  );
}

export function OrganizationRegions() {
  return (
    <Page
      crumbs={[home, org, { label: "Data region" }]}
      title="Data region"
      description="Your data region is set when the account is created. Contact support to move it."
    >
      <Facts
        items={[
          ["Region", company.region],
          ["Backups", "EU (Dublin)"],
          ["Encryption", "AES-256 at rest"],
        ]}
      />
    </Page>
  );
}

export function OrganizationStorage() {
  const { teams } = useStore();
  const [editing, setEditing] = useState<Team | null>(null);
  return (
    <Page
      crumbs={[home, org, { label: "Storage" }]}
      title="Storage"
      description="Set how much each team can store. Limits apply right away."
    >
      <Table
        head={[
          { label: "Team" },
          { label: "Used", right: true },
          { label: "Limit", right: true },
          { label: "" },
          { label: "" },
        ]}
      >
        {teams.map((team) => (
          <tr key={team.id} className="hover:bg-slate-50">
            <td
              className="max-w-64 truncate px-5 py-3 font-medium"
              title={team.name}
            >
              {team.name}
            </td>
            <td className="px-5 py-3 text-right tabular-nums">
              {team.usedGb} GB
            </td>
            <td
              className="px-5 py-3 text-right tabular-nums"
              data-testid={`limit-${team.id}`}
            >
              {team.limitGb} GB
            </td>
            <td className="w-40 px-5 py-3">
              <UsageBar used={team.usedGb} limit={team.limitGb} />
            </td>
            <td className="px-5 py-3 text-right">
              <button
                type="button"
                className={t.link}
                onClick={() => setEditing(team)}
                data-testid={`edit-limit-${team.id}`}
                aria-label={`Edit limit for ${team.name}`}
              >
                Edit limit
              </button>
            </td>
          </tr>
        ))}
      </Table>
      {editing && (
        <LimitDialog team={editing} open onClose={() => setEditing(null)} />
      )}
    </Page>
  );
}
