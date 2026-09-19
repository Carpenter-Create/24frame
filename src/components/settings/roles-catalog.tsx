"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineNotice } from "@/components/ui/inline-notice";
import { StatusChip } from "@/components/layout/status-chip";
import {
  ROLES_CATALOG,
  ORG_CAPABILITIES,
  ORG_CAPABILITY_LABELS,
  type OrgCapability,
  type RoleCatalogRow,
} from "@/lib/org-roles";
import {
  TEAM_LIST_AVATAR_CLASS,
} from "@/lib/account-invite";
import { createCustomRole } from "@/app/(app)/settings/organization/roles/actions";

const ROLES_TABLE_HEADER_CLASS =
  "hidden t-label text-ink-3 md:grid md:grid-cols-[minmax(10rem,2fr)_minmax(14rem,3fr)_minmax(5rem,1fr)_minmax(6rem,1fr)_minmax(5rem,1fr)] md:items-center md:gap-x-[var(--space-4)] md:py-[var(--space-3)]";

const ROLES_TABLE_ROW_CLASS =
  "flex flex-col gap-[var(--space-1)] py-[var(--space-4)] md:grid md:grid-cols-[minmax(10rem,2fr)_minmax(14rem,3fr)_minmax(5rem,1fr)_minmax(6rem,1fr)_minmax(5rem,1fr)] md:items-center md:gap-x-[var(--space-4)]";

export function RolesCatalog({
  orgId,
  canManage,
  systemRows,
  customRows,
}: {
  orgId: string;
  canManage: boolean;
  systemRows: RoleCatalogRow[];
  customRows: RoleCatalogRow[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capabilities, setCapabilities] = useState<OrgCapability[]>(["view"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);
  const router = useRouter();

  const allRows = [...systemRows, ...customRows];

  function toggleCapability(cap: OrgCapability) {
    setCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap],
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canManage) return;
    setSaving(true);
    setError("");
    setCreated(false);
    const res = await createCustomRole({ orgId, name, description, capabilities });
    if (res.error) {
      setError(res.error);
      setSaving(false);
      return;
    }
    setName("");
    setDescription("");
    setCapabilities(["view"]);
    setSaving(false);
    setCreated(true);
    setCreateOpen(false);
    router.refresh();
  }

  return (
    <div data-roles-catalog="" className="flex flex-col gap-[var(--space-6)]">
      {canManage ? (
        <div className="flex justify-end">
          <Button
            type="button"
            data-create-role-cta=""
            onClick={() => setCreateOpen(true)}
          >
            {ROLES_CATALOG.createRole}
          </Button>
        </div>
      ) : null}

      {/* Create role form */}
      {canManage && createOpen ? (
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-[var(--space-4)] rounded-2xl border border-hairline bg-surface p-[var(--space-4)]"
          data-create-role-form=""
        >
          <div className="flex flex-col gap-[var(--space-2)]">
            <Label htmlFor="role-name">{ROLES_CATALOG.nameLabel}</Label>
            <Input
              id="role-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={ROLES_CATALOG.namePlaceholder}
              required
            />
          </div>
          <div className="flex flex-col gap-[var(--space-2)]">
            <Label htmlFor="role-description">{ROLES_CATALOG.descriptionLabel}</Label>
            <Input
              id="role-description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={ROLES_CATALOG.descriptionPlaceholder}
            />
          </div>
          <fieldset className="flex flex-col gap-[var(--space-2)]">
            <legend className="t-label text-ink-2">{ROLES_CATALOG.capabilitiesLabel}</legend>
            <div className="flex flex-col gap-[var(--space-2)]">
              {ORG_CAPABILITIES.map((cap) => (
                <label
                  key={cap}
                  className="flex items-center gap-[var(--space-2)] t-body-sm text-ink"
                >
                  <input
                    type="checkbox"
                    name="capabilities"
                    value={cap}
                    checked={capabilities.includes(cap)}
                    onChange={() => toggleCapability(cap)}
                    className="accent-accent"
                  />
                  {ORG_CAPABILITY_LABELS[cap]}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex items-center gap-[var(--space-3)]">
            <Button type="submit" disabled={saving}>
              {saving ? ROLES_CATALOG.creating : ROLES_CATALOG.createRole}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {canManage ? null : (
        <p className="t-body-sm text-ink-3">{ROLES_CATALOG.forbidden}</p>
      )}

      {/* Roles table */}
      <div data-roles-list="" className="min-w-0">
        <div className={ROLES_TABLE_HEADER_CLASS} data-roles-list-head="">
          <span>{ROLES_CATALOG.roleColumn}</span>
          <span>{ROLES_CATALOG.descriptionColumn}</span>
          <span>{ROLES_CATALOG.typeColumn}</span>
          <span>{ROLES_CATALOG.membersColumn}</span>
          <span>{ROLES_CATALOG.statusColumn}</span>
        </div>
        <ul className="flex flex-col divide-y divide-hairline border-t border-hairline">
          {allRows.map((row) => (
            <li
              key={row.key}
              data-role-type={row.type}
              className={ROLES_TABLE_ROW_CLASS}
            >
              <span className="t-body font-medium text-ink">{row.name}</span>
              <span className="t-body-sm text-ink-2">{row.description}</span>
              <span className="t-body-sm text-ink-3">
                {row.type === "system"
                  ? ROLES_CATALOG.systemType
                  : ROLES_CATALOG.customType}
              </span>
              <span className="flex items-center">
                {row.memberInitials.length > 0 ? (
                  <span className="flex -space-x-2">
                    {row.memberInitials.map((initials, i) => (
                      <span
                        key={i}
                        className={`${TEAM_LIST_AVATAR_CLASS} size-7 border-2 border-surface text-[10px]`}
                      >
                        {initials}
                      </span>
                    ))}
                    {row.memberCount > 3 ? (
                      <span className="flex size-7 items-center justify-center rounded-full border-2 border-surface bg-surface-muted text-[10px] text-ink-3">
                        +{row.memberCount - 3}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span className="t-body-sm text-ink-3">&mdash;</span>
                )}
              </span>
              <StatusChip label={ROLES_CATALOG.activeStatus} tone="active" />
            </li>
          ))}
        </ul>
      </div>

      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      {created ? <InlineNotice>{ROLES_CATALOG.created}</InlineNotice> : null}
    </div>
  );
}
