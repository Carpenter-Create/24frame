"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineNotice } from "@/components/ui/inline-notice";
import { StatusChip } from "@/components/layout/status-chip";
import { formControlClass } from "@/lib/form-control";
import {
  ACCOUNT_INVITE,
  TEAM_INVITE_DEFAULT_ROLE,
  TEAM_INVITE_ROLES,
  inviteDateLabel,
  teamRoleLabel,
  type OrgRole,
} from "@/lib/account-invite";
import { inviteTeamMember, revokeTeamInvite } from "@/app/(app)/settings/organization/actions";

export type TeamMemberRow = {
  userId: string;
  email: string;
  role: OrgRole;
  acceptedAt: string;
};

export type TeamPendingRow = {
  id: string;
  email: string;
  role: OrgRole;
  sentAt: string;
};

export function TeamInviteForm({
  orgId,
  canInvite,
  members,
  pending,
}: {
  orgId: string;
  canInvite: boolean;
  members: TeamMemberRow[];
  pending: TeamPendingRow[];
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>(TEAM_INVITE_DEFAULT_ROLE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canInvite) return;
    setSaving(true);
    setError("");
    setSent(false);
    const res = await inviteTeamMember({ orgId, email, role });
    if (res.error) {
      setError(res.error);
      setSaving(false);
      return;
    }
    setEmail("");
    setRole(TEAM_INVITE_DEFAULT_ROLE);
    setSaving(false);
    setSent(true);
  }

  async function onRevoke(id: string) {
    if (!canInvite) return;
    setRevoking(id);
    setError("");
    const res = await revokeTeamInvite({ id });
    if (res.error) setError(res.error);
    setRevoking(null);
  }

  return (
    <div data-settings-team="" className="flex flex-col gap-[var(--space-4)]">
      {members.length === 0 && pending.length === 0 ? (
        <p className="t-body text-ink-2">{ACCOUNT_INVITE.teamEmpty}</p>
      ) : (
        <ul className="flex flex-col gap-[var(--space-3)]">
          {members.map((member) => (
            <li
              key={member.userId}
              data-invite-status="accepted"
              className="flex items-baseline justify-between gap-[var(--space-4)]"
            >
              <span className="t-body text-ink">{member.email}</span>
              <span className="flex items-center gap-[var(--space-3)]">
                <StatusChip label={ACCOUNT_INVITE.accepted} tone="active" />
                <span className="t-body-sm text-ink-3" data-invite-date="">
                  {inviteDateLabel(member.acceptedAt)}
                </span>
                <span className="t-body-sm text-ink-3">{teamRoleLabel(member.role)}</span>
              </span>
            </li>
          ))}
          {pending.map((invite) => (
            <li
              key={invite.id}
              data-invite-status="invited"
              className="flex items-baseline justify-between gap-[var(--space-4)]"
            >
              <span className="t-body text-ink-2">{invite.email}</span>
              <span className="flex items-center gap-[var(--space-3)]">
                <StatusChip label={ACCOUNT_INVITE.invited} tone="neutral" />
                <span className="t-body-sm text-ink-3" data-invite-date="">
                  {inviteDateLabel(invite.sentAt)}
                </span>
                <span className="t-body-sm text-ink-3">{teamRoleLabel(invite.role)}</span>
                {canInvite ? (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={revoking === invite.id}
                    onClick={() => onRevoke(invite.id)}
                  >
                    {revoking === invite.id ? ACCOUNT_INVITE.revoking : ACCOUNT_INVITE.revoke}
                  </Button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}

      {canInvite ? (
        <form onSubmit={onSubmit} className="flex flex-col gap-[var(--space-4)]" data-team-invite-form="">
          <div className="flex flex-col gap-[var(--space-2)]">
            <Label htmlFor="team-invite-email">{ACCOUNT_INVITE.emailLabel}</Label>
            <Input
              id="team-invite-email"
              name="email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSent(false);
              }}
              required
            />
          </div>
          <div className="flex flex-col gap-[var(--space-2)]">
            <Label htmlFor="team-invite-role">{ACCOUNT_INVITE.roleLabel}</Label>
            <select
              id="team-invite-role"
              name="role"
              className={formControlClass("box")}
              value={role}
              onChange={(e) => setRole(e.target.value as OrgRole)}
            >
              {TEAM_INVITE_ROLES.map((value) => (
                <option key={value} value={value}>
                  {teamRoleLabel(value)}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={saving} className="self-start">
            {saving ? ACCOUNT_INVITE.inviting : ACCOUNT_INVITE.invite}
          </Button>
        </form>
      ) : (
        <p className="t-body-sm text-ink-3">{ACCOUNT_INVITE.forbidden}</p>
      )}
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      {sent ? <InlineNotice>{ACCOUNT_INVITE.sent}</InlineNotice> : null}
    </div>
  );
}
