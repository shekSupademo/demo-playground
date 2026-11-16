import { UserPlus } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Field, Input, Modal, PageHeader, Panel, Select } from "../components/ui";
import type { Role } from "../data/types";
import { uid } from "../lib/format";
import { useDispatch, useStore } from "../state/store";
import { useToast } from "../state/toast";

const roleHelp: Record<Role, string> = {
  admin: "Full access, including payments and team",
  bookkeeper: "Read-only access plus categorizing and exports",
  employee: "Their own cards and receipts",
};

export function Team() {
  const { members } = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  const [inviting, setInviting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("employee");
  const emailOk = /\S+@\S+\.\S+/.test(email);
  const dupe = members.some((m) => m.email.toLowerCase() === email.toLowerCase());
  const admins = members.filter((m) => m.role === "admin" && m.status === "active").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Team" subtitle="Invite teammates and choose what each of them can do." />
      <Panel
        title={`Team members (${members.length})`}
        padded={false}
        action={
          <Button size="sm" variant="primary" onClick={() => setInviting(true)} data-testid="invite-member">
            <UserPlus className="size-3.5" /> Invite
          </Button>
        }
      >
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800" data-testid="member-list">
          {members.map((m) => {
            const lastAdmin = m.role === "admin" && admins <= 1;
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <span className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold dark:bg-zinc-800">
                  {m.name.split(" ").map((p) => p[0]).join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {m.name} {m.status === "invited" && <Badge tone="amber">Invited</Badge>}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{m.email}</p>
                </div>
                <Select
                  className="h-8 w-36"
                  value={m.role}
                  disabled={lastAdmin}
                  title={lastAdmin ? "You need at least one admin" : undefined}
                  aria-label={`Role for ${m.name}`}
                  onChange={(e) => {
                    dispatch({ type: "member/setRole", id: m.id, role: e.target.value as Role });
                    toast(`${m.name} is now ${e.target.value}`);
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="bookkeeper">Bookkeeper</option>
                  <option value="employee">Employee</option>
                </Select>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={lastAdmin}
                  onClick={() => {
                    dispatch({ type: "member/remove", id: m.id });
                    toast(`${m.name} removed`);
                  }}
                >
                  {m.status === "invited" ? "Revoke" : "Remove"}
                </Button>
              </li>
            );
          })}
        </ul>
        <Modal
          open={inviting}
          onClose={() => setInviting(false)}
          title="Invite a teammate"
          testId="invite-modal"
          footer={
            <>
              <Button variant="ghost" onClick={() => setInviting(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!name.trim() || !emailOk || dupe}
                onClick={() => {
                  dispatch({ type: "member/invite", member: { id: uid("mem"), name: name.trim(), email, role, status: "invited" } });
                  toast(`Invite sent to ${email}`);
                  setName("");
                  setEmail("");
                  setRole("employee");
                  setInviting(false);
                }}
              >
                Send invite
              </Button>
            </>
          }
        >
          <Field label="Full name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Work email" error={email && !emailOk ? "Enter a valid email" : dupe ? "Already on the team" : undefined}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Role" hint={roleHelp[role]}>
            <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="admin">Admin</option>
              <option value="bookkeeper">Bookkeeper</option>
              <option value="employee">Employee</option>
            </Select>
          </Field>
        </Modal>
      </Panel>
    </div>
  );
}
