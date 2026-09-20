"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { InlineNotice } from "@/components/ui/inline-notice";
import { StatusChip } from "@/components/layout/status-chip";
import {
  SETTINGS_DIALOG_ERROR_CLASS,
  SETTINGS_DIALOG_FIELD_CLASS,
  SETTINGS_DIALOG_FOOTER_CLASS,
  SETTINGS_DIALOG_FORM_CLASS,
  SETTINGS_DIALOG_GROUP_CLASS,
  SETTINGS_DIALOG_LABEL_CLASS,
  SETTINGS_PANE_TITLE_CLASS,
} from "@/lib/settings";
import {
  ACCOUNT_INVITE,
  TEAM_INVITE_DEFAULT_ROLE,
  TEAM_INVITE_ROLES,
  TEAM_LIST_AVATAR_CLASS,
  TEAM_LIST_HEADER_CLASS,
  TEAM_LIST_ROW_CLASS,
  TEAM_ROLE_PILL_CLASS,
  inviteDateLabel,
  inviteStatusLabel,
  teamIdentityName,
  teamInviteUserError,
  teamRoleLabel,
  teamRowInitials,
  toTeamListRows,
  type OrgRole,
} from "@/lib/account-invite";
import {
  ENTITY_SCOPE,
  entityScopeLabel,
  type EntityScope,
  type LegalEntityRow,
} from "@/lib/legal-entities";
import { inviteTeamMember, revokeTeamInvite } from "@/app/(app)/settings/organization/actions";

export type TeamMemberRow = {
  userId: string;
  email: string;
  role: OrgRole;
  name: string | null;
  sentAt: string | null;
  acceptedAt: string;
};

export type TeamPendingRow = {
  id: string;
  email: string;
  role: OrgRole;
  sentAt: string;
  entityScope: EntityScope;
};

export function TeamInviteForm({
  orgId,
  canInvite,
  members,
  pending,
  entities = [],
}: {
  orgId: string;
  canInvite: boolean;
  members: TeamMemberRow[];
  pending: TeamPendingRow[];
  entities?: LegalEntityRow[];
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>(TEAM_INVITE_DEFAULT_ROLE);
  const [entityScope, setEntityScope] = useState<EntityScope>("all");
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const router = useRouter();

  const visiblePending = pending.filter((row) => !hiddenIds.includes(row.id));
  const rows = toTeamListRows(members, visiblePending);
  const showEntityScope = entities.length > 1;

  function toggleEntity(id: string) {
    setSelectedEntityIds((prev) =>
      prev.includes(id) ? prev.filter((eid) => eid !== id) : [...prev, id],
    );
  }

  function openInvite() {
    setError("");
    setSent(false);
    setInviteOpen(true);
  }

  function closeInvite() {
    setInviteOpen(false);
    setSaving(false);
    setError("");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canInvite) return;
    setSaving(true);
    setError("");
    setSent(false);
    const res = await inviteTeamMember({
      orgId,
      email,
      role,
      entityScope,
      entityIds: entityScope === "selected" ? selectedEntityIds : undefined,
    });
    if (res.error) {
      setError(teamInviteUserError(res.error, "send"));
      setSaving(false);
      return;
    }
    setEmail("");
    setRole(TEAM_INVITE_DEFAULT_ROLE);
    setEntityScope("all");
    setSelectedEntityIds([]);
    setSaving(false);
    setSent(true);
    setInviteOpen(false);
    router.refresh();
  }

  async function onRevoke(id: string) {
    if (!canInvite) return;
    setRevoking(id);
    setError("");
    const res = await revokeTeamInvite({ id });
    if (res.error) setError(teamInviteUserError(res.error, "revoke"));
    else {
      setHiddenIds((current) => [...current, id]);
      router.refresh();
    }
    setRevoking(null);
  }

  return (
    <div data-settings-team="" className="flex flex-col gap-[var(--space-6)]">
      <div className="flex items-center justify-between gap-[var(--space-4)]">
        <h2 className={SETTINGS_PANE_TITLE_CLASS}>{ACCOUNT_INVITE.team}</h2>
        {canInvite ? (
          <Button type="button" data-team-invite-cta="" onClick={openInvite}>
            {ACCOUNT_INVITE.invite}
          </Button>
        ) : null}
      </div>

      {canInvite ? (
        <Dialog
          open={inviteOpen}
          onClose={closeInvite}
          title={ACCOUNT_INVITE.invite}
          size="md"
          presentation="sheet"
        >
          <form
            onSubmit={onSubmit}
            className={SETTINGS_DIALOG_FORM_CLASS}
            data-team-invite-form=""
          >
            <div className={SETTINGS_DIALOG_GROUP_CLASS} data-team-invite-fields="">
              <div className={SETTINGS_DIALOG_FIELD_CLASS}>
                <label htmlFor="team-invite-email" className={SETTINGS_DIALOG_LABEL_CLASS}>
                  {ACCOUNT_INVITE.emailLabel}
                </label>
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
              <div className={SETTINGS_DIALOG_FIELD_CLASS}>
                <label htmlFor="team-invite-role" className={SETTINGS_DIALOG_LABEL_CLASS}>
                  {ACCOUNT_INVITE.roleLabel}
                </label>
                <Select
                  id="team-invite-role"
                  name="role"
                  value={role}
                  aria-label={ACCOUNT_INVITE.roleLabel}
                  options={TEAM_INVITE_ROLES.map((value) => ({
                    value,
                    label: teamRoleLabel(value),
                  }))}
                  onChange={(next) => setRole(next as OrgRole)}
                />
              </div>
              {showEntityScope ? (
                <>
                  <div className={SETTINGS_DIALOG_FIELD_CLASS}>
                    <label htmlFor="team-invite-scope" className={SETTINGS_DIALOG_LABEL_CLASS}>
                      {ENTITY_SCOPE.scopeLabel}
                    </label>
                    <Select
                      id="team-invite-scope"
                      name="entityScope"
                      value={entityScope}
                      aria-label={ENTITY_SCOPE.scopeLabel}
                      options={[
                        { value: "all", label: entityScopeLabel("all") },
                        { value: "selected", label: entityScopeLabel("selected") },
                      ]}
                      onChange={(next) => setEntityScope(next as EntityScope)}
                    />
                    <p className="t-body-sm text-ink-3">{ENTITY_SCOPE.scopeHint}</p>
                  </div>
                  {entityScope === "selected" ? (
                    <fieldset className="flex flex-col gap-[var(--space-2)]" data-entity-picker="">
                      <legend className={SETTINGS_DIALOG_LABEL_CLASS}>
                        {ENTITY_SCOPE.entityPickerLabel}
                      </legend>
                      {entities.map((entity) => (
                        <label
                          key={entity.id}
                          className="flex items-center gap-2 t-body-sm text-ink-2"
                        >
                          <input
                            type="checkbox"
                            checked={selectedEntityIds.includes(entity.id)}
                            onChange={() => toggleEntity(entity.id)}
                          />
                          {entity.name}
                        </label>
                      ))}
                    </fieldset>
                  ) : null}
                </>
              ) : null}
            </div>
            {error ? (
              <p role="alert" data-team-invite-error="" className={SETTINGS_DIALOG_ERROR_CLASS}>
                {error}
              </p>
            ) : null}
            <DialogFooter className={SETTINGS_DIALOG_FOOTER_CLASS}>
              <Button
                type="button"
                variant="secondary"
                className="max-md:w-full"
                disabled={saving}
                onClick={closeInvite}
              >
                {ACCOUNT_INVITE.cancel}
              </Button>
              <Button type="submit" className="max-md:w-full" disabled={saving}>
                {saving ? ACCOUNT_INVITE.inviting : ACCOUNT_INVITE.invite}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      ) : null}

      {canInvite ? null : (
        <p className="t-body-sm text-ink-3">{ACCOUNT_INVITE.forbidden}</p>
      )}

      {rows.length === 0 ? (
        <p className="t-body text-ink-2">{ACCOUNT_INVITE.teamEmpty}</p>
      ) : (
        <div data-team-list="" className="overflow-x-auto">
          <div className={TEAM_LIST_HEADER_CLASS} data-team-list-head="">
            <span>{ACCOUNT_INVITE.nameColumn}</span>
            <span>{ACCOUNT_INVITE.roleLabel}</span>
            <span>{ACCOUNT_INVITE.statusColumn}</span>
            <span>{ACCOUNT_INVITE.sentColumn}</span>
            <span>{ACCOUNT_INVITE.acceptedColumn}</span>
            <span />
          </div>
          <ul className="flex flex-col divide-y divide-hairline border-t border-hairline">
            {rows.map((row) => {
              const name = teamIdentityName(row.name);
              return (
                <li
                  key={row.key}
                  data-invite-status={row.status}
                  className={TEAM_LIST_ROW_CLASS}
                >
                  <span className="flex min-w-0 items-center gap-[var(--space-3)]">
                    <span className={TEAM_LIST_AVATAR_CLASS} data-team-avatar="">
                      {teamRowInitials(name, row.email)}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="t-body text-ink">{name ?? row.email}</span>
                      {name ? (
                        <span className="t-body-sm text-ink-3">{row.email}</span>
                      ) : null}
                    </span>
                  </span>
                  <span className={TEAM_ROLE_PILL_CLASS}>{teamRoleLabel(row.role)}</span>
                  <StatusChip
                    label={inviteStatusLabel(row.status)}
                    tone={row.status === "accepted" ? "active" : "neutral"}
                  />
                  <span className="t-body-sm text-ink-3" data-invite-date="sent">
                    {inviteDateLabel(row.sentAt)}
                  </span>
                  <span className="t-body-sm text-ink-3" data-invite-date="accepted">
                    {inviteDateLabel(row.acceptedAt)}
                  </span>
                  <span className="justify-self-end">
                    {canInvite && row.withdrawId ? (
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={revoking === row.withdrawId}
                        onClick={() => {
                          if (row.withdrawId) onRevoke(row.withdrawId);
                        }}
                      >
                        {revoking === row.withdrawId ? ACCOUNT_INVITE.revoking : ACCOUNT_INVITE.revoke}
                      </Button>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {error && !inviteOpen ? (
        <p role="alert" data-team-invite-error="" className={SETTINGS_DIALOG_ERROR_CLASS}>
          {error}
        </p>
      ) : null}
      {sent ? <InlineNotice>{ACCOUNT_INVITE.sent}</InlineNotice> : null}
    </div>
  );
}
