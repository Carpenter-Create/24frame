"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { IdentityAvatar } from "@/components/chrome/house";
import {
  SettingsDrillRow,
  SettingsGroupList,
  SettingsGroupRow,
} from "@/components/settings/settings-drill";
import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { InlineNotice } from "@/components/ui/inline-notice";
import {
  SETTINGS,
  SETTINGS_DIALOG_ERROR_CLASS,
  SETTINGS_DIALOG_FIELD_CLASS,
  SETTINGS_DIALOG_FOOTER_CLASS,
  SETTINGS_DIALOG_FORM_CLASS,
  SETTINGS_DIALOG_GROUP_CLASS,
  SETTINGS_DIALOG_LABEL_CLASS,
  SETTINGS_DRILL_VALUE_CLASS,
  SETTINGS_SECTION_CLASS,
} from "@/lib/settings";
import {
  ACCOUNT_INVITE,
  TEAM_INVITE_DEFAULT_ROLE,
  TEAM_INVITE_ROLES,
  teamInviteUserError,
  teamRoleLabel,
  teamRowInitials,
  teamRowLabel,
  teamRowMeta,
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
  photoUrl?: string | null;
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
  currentUserId,
}: {
  orgId: string;
  canInvite: boolean;
  members: TeamMemberRow[];
  pending: TeamPendingRow[];
  entities?: LegalEntityRow[];
  currentUserId?: string;
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
    <div data-settings-team="" className={SETTINGS_SECTION_CLASS}>
      <SettingsGroupList label={ACCOUNT_INVITE.team} list="team">
        {rows.length === 0 ? (
          <SettingsGroupRow>
            <div className="py-[var(--space-3)]">
              <span className={SETTINGS_DRILL_VALUE_CLASS}>{ACCOUNT_INVITE.teamEmpty}</span>
            </div>
          </SettingsGroupRow>
        ) : (
          rows.map((row) => {
            const name = teamRowLabel(row);
            const you =
              currentUserId && row.key === currentUserId
                ? ` ${ACCOUNT_INVITE.youSuffix}`
                : "";
            return (
              <SettingsGroupRow key={row.key}>
                <div data-invite-status={row.status}>
                  <SettingsDrillRow
                    kind={`team-${row.key}`}
                    label={`${name}${you}`}
                    value={teamRowMeta(row)}
                    readOnly
                    leading={
                      <IdentityAvatar
                        avatarInitial={teamRowInitials(row.name, row.email)}
                        photoUrl={row.photoUrl}
                      />
                    }
                    trailing={
                      canInvite && row.withdrawId ? (
                        <button
                          type="button"
                          className="t-body-sm text-ink-2"
                          disabled={revoking === row.withdrawId}
                          onClick={() => {
                            if (row.withdrawId) onRevoke(row.withdrawId);
                          }}
                        >
                          {revoking === row.withdrawId
                            ? ACCOUNT_INVITE.revoking
                            : ACCOUNT_INVITE.revoke}
                        </button>
                      ) : null
                    }
                  />
                </div>
              </SettingsGroupRow>
            );
          })
        )}
        <SettingsGroupRow>
          <SettingsDrillRow
            kind="roles"
            label={ACCOUNT_INVITE.rolesLink}
            href={SETTINGS.rolesHref}
            itemAttr="data-roles-link"
          />
        </SettingsGroupRow>
        {canInvite ? (
          <SettingsGroupRow>
            <SettingsDrillRow
              kind="team-invite"
              label={ACCOUNT_INVITE.invite}
              onClick={openInvite}
              tone="accent"
              cta="team-invite"
            />
          </SettingsGroupRow>
        ) : null}
      </SettingsGroupList>

      {canInvite ? (
        <Dialog
          open={inviteOpen}
          onClose={closeInvite}
          title={ACCOUNT_INVITE.invite}
          size="md"
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

      {error && !inviteOpen ? (
        <p role="alert" data-team-invite-error="" className={SETTINGS_DIALOG_ERROR_CLASS}>
          {error}
        </p>
      ) : null}
      {sent ? <InlineNotice>{ACCOUNT_INVITE.sent}</InlineNotice> : null}
    </div>
  );
}
