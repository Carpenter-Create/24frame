"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineNotice } from "@/components/ui/inline-notice";
import {
  ORG_TEAM,
  ORG_TEAM_EMAIL_CLASS,
  ORG_TEAM_FIELD_CLASS,
  ORG_TEAM_FIELDS_CLASS,
  ORG_TEAM_NAME_CLASS,
  ORG_TEAM_PERSON_CLASS,
  ORG_TEAM_ROLES,
  ORG_TEAM_ROW_CLASS,
  ORG_TEAM_SELECT_CLASS,
  ORG_TEAM_STACK_CLASS,
  ORG_TEAM_STATUSES,
  ORG_TEAM_STATUS_DEFAULT,
  orgTeamPersonLabel,
  type OrgTeamMember,
  type OrgTeamRole,
  type OrgTeamStatus,
} from "@/lib/org-team";
import { inviteOrgMember, updateOrgMember } from "@/app/(app)/settings/aggregation/actions";

function RoleSelect({
  id,
  value,
  disabled,
  onChange,
}: {
  id: string;
  value: OrgTeamRole;
  disabled?: boolean;
  onChange: (value: OrgTeamRole) => void;
}) {
  return (
    <select
      id={id}
      name="role"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as OrgTeamRole)}
      className={ORG_TEAM_SELECT_CLASS}
    >
      {ORG_TEAM_ROLES.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </select>
  );
}

function StatusSelect({
  id,
  value,
  disabled,
  onChange,
}: {
  id: string;
  value: OrgTeamStatus;
  disabled?: boolean;
  onChange: (value: OrgTeamStatus) => void;
}) {
  return (
    <select
      id={id}
      name="status"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as OrgTeamStatus)}
      className={ORG_TEAM_SELECT_CLASS}
    >
      {ORG_TEAM_STATUSES.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}

function MemberRow({
  orgId,
  member,
}: {
  orgId: string;
  member: OrgTeamMember;
}) {
  const router = useRouter();
  const [role, setRole] = useState(member.role);
  const [status, setStatus] = useState(member.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const person = orgTeamPersonLabel(member);

  async function persist(next: { role: OrgTeamRole; status: OrgTeamStatus }) {
    setSaving(true);
    setError("");
    const res = await updateOrgMember({
      orgId,
      membershipId: member.membershipId,
      role: next.role,
      status: next.status,
    });
    if (res.error) {
      setError(res.error);
      setSaving(false);
      return;
    }
    setSaving(false);
    router.refresh();
  }

  return (
    <div data-org-team-row="" className={ORG_TEAM_ROW_CLASS}>
      <div className={ORG_TEAM_PERSON_CLASS}>
        <span className={ORG_TEAM_NAME_CLASS}>{person.name}</span>
        {person.secondary ? (
          <span className={ORG_TEAM_EMAIL_CLASS}>{person.secondary}</span>
        ) : null}
      </div>
      <div className={ORG_TEAM_FIELDS_CLASS}>
        <div className={ORG_TEAM_FIELD_CLASS}>
          <Label htmlFor={`org-team-role-${member.membershipId}`}>{ORG_TEAM.roleLabel}</Label>
          <RoleSelect
            id={`org-team-role-${member.membershipId}`}
            value={role}
            disabled={saving}
            onChange={(next) => {
              setRole(next);
              void persist({ role: next, status });
            }}
          />
        </div>
        <div className={ORG_TEAM_FIELD_CLASS}>
          <Label htmlFor={`org-team-status-${member.membershipId}`}>{ORG_TEAM.statusLabel}</Label>
          <StatusSelect
            id={`org-team-status-${member.membershipId}`}
            value={status}
            disabled={saving}
            onChange={(next) => {
              setStatus(next);
              void persist({ role, status: next });
            }}
          />
        </div>
      </div>
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
    </div>
  );
}

export function OrgTeamForm({
  orgId,
  members,
}: {
  orgId: string;
  members: readonly OrgTeamMember[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgTeamRole>("viewer");
  const [status, setStatus] = useState<OrgTeamStatus>(ORG_TEAM_STATUS_DEFAULT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    const res = await inviteOrgMember({ orgId, email, role, status });
    if (res.error) {
      setError(res.error);
      setSaving(false);
      return;
    }
    setEmail("");
    setRole("viewer");
    setStatus(ORG_TEAM_STATUS_DEFAULT);
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div data-org-team-form="" className={ORG_TEAM_STACK_CLASS}>
      {members.length === 0 ? (
        <p className="t-body-sm text-ink-3">{ORG_TEAM.empty}</p>
      ) : (
        <div data-org-team-list="">
          {members.map((member) => (
            <MemberRow key={member.membershipId} orgId={orgId} member={member} />
          ))}
        </div>
      )}
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-[var(--space-4)]"
        data-org-team-add=""
      >
        <div className="flex flex-col gap-[var(--space-2)]">
          <Label htmlFor="org-team-email">{ORG_TEAM.emailLabel}</Label>
          <Input
            id="org-team-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setSaved(false);
            }}
          />
        </div>
        <div className={ORG_TEAM_FIELDS_CLASS}>
          <div className={ORG_TEAM_FIELD_CLASS}>
            <Label htmlFor="org-team-add-role">{ORG_TEAM.roleLabel}</Label>
            <RoleSelect id="org-team-add-role" value={role} onChange={setRole} />
          </div>
          <div className={ORG_TEAM_FIELD_CLASS}>
            <Label htmlFor="org-team-add-status">{ORG_TEAM.statusLabel}</Label>
            <StatusSelect id="org-team-add-status" value={status} onChange={setStatus} />
          </div>
        </div>
        <Button type="submit" disabled={saving} className="self-start">
          {saving ? ORG_TEAM.adding : ORG_TEAM.addUser}
        </Button>
        {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
        {saved ? <InlineNotice>{ORG_TEAM.added}</InlineNotice> : null}
      </form>
    </div>
  );
}
