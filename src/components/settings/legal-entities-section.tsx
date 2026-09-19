"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineNotice } from "@/components/ui/inline-notice";
import { StatusChip } from "@/components/layout/status-chip";
import { formControlClass } from "@/lib/form-control";
import { SETTINGS_PANE_TITLE_CLASS } from "@/lib/settings";
import {
  LEGAL_ENTITIES,
  ENTITY_TYPES,
  entityTypeLabel,
  type EntityType,
  type LegalEntityRow,
} from "@/lib/legal-entities";
import { addLegalEntity } from "@/app/(app)/settings/organization/actions";

export function LegalEntitiesSection({
  orgId,
  canManage,
  entities,
}: {
  orgId: string;
  canManage: boolean;
  entities: LegalEntityRow[];
}) {
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState<EntityType>("other");
  const [jurisdiction, setJurisdiction] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canManage) return;
    setSaving(true);
    setError("");
    setAdded(false);
    const res = await addLegalEntity({
      orgId,
      name,
      entityType,
      jurisdiction: jurisdiction || undefined,
    });
    if (res.error) {
      setError(res.error);
      setSaving(false);
      return;
    }
    setName("");
    setEntityType("other");
    setJurisdiction("");
    setSaving(false);
    setAdded(true);
    setFormOpen(false);
    router.refresh();
  }

  return (
    <div data-settings-entities="" className="flex flex-col gap-[var(--space-6)]">
      <div className="flex items-center justify-between gap-[var(--space-4)]">
        <h2 className={SETTINGS_PANE_TITLE_CLASS}>{LEGAL_ENTITIES.title}</h2>
        {canManage ? (
          <Button type="button" data-entity-add-cta="" onClick={() => setFormOpen(true)}>
            {LEGAL_ENTITIES.add}
          </Button>
        ) : null}
      </div>

      {canManage && formOpen ? (
        <form onSubmit={onSubmit} className="flex flex-col gap-[var(--space-4)]" data-entity-add-form="">
          <div className="flex flex-col gap-[var(--space-2)]">
            <Label htmlFor="entity-name">{LEGAL_ENTITIES.nameLabel}</Label>
            <Input
              id="entity-name"
              name="name"
              type="text"
              autoComplete="off"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setAdded(false);
              }}
              required
            />
          </div>
          <div className="flex flex-col gap-[var(--space-2)]">
            <Label htmlFor="entity-type">{LEGAL_ENTITIES.typeLabel}</Label>
            <select
              id="entity-type"
              name="entityType"
              className={formControlClass("box")}
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as EntityType)}
            >
              {ENTITY_TYPES.map((value) => (
                <option key={value} value={value}>
                  {entityTypeLabel(value)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-[var(--space-2)]">
            <Label htmlFor="entity-jurisdiction">{LEGAL_ENTITIES.jurisdictionLabel}</Label>
            <Input
              id="entity-jurisdiction"
              name="jurisdiction"
              type="text"
              autoComplete="off"
              placeholder={LEGAL_ENTITIES.jurisdictionHint}
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={saving} className="self-start">
            {saving ? LEGAL_ENTITIES.adding : LEGAL_ENTITIES.add}
          </Button>
        </form>
      ) : null}

      {!canManage ? (
        <p className="t-body-sm text-ink-3">{LEGAL_ENTITIES.forbidden}</p>
      ) : null}

      {entities.length === 0 ? (
        <p className="t-body text-ink-2">{LEGAL_ENTITIES.empty}</p>
      ) : (
        <ul data-entity-list="" className="flex flex-col divide-y divide-hairline border-t border-hairline">
          {entities.map((entity) => (
            <li
              key={entity.id}
              data-entity-id={entity.id}
              className="flex items-center justify-between gap-[var(--space-4)] px-0 py-[var(--space-4)]"
            >
              <div className="flex min-w-0 flex-col">
                <span className="t-body text-ink">
                  {entity.name}
                  {entity.isDefault ? (
                    <StatusChip label={LEGAL_ENTITIES.default} tone="neutral" className="ml-2" />
                  ) : null}
                </span>
                <span className="t-body-sm text-ink-3">
                  {entityTypeLabel(entity.entityType)}
                  {entity.jurisdiction ? ` \u00b7 ${entity.jurisdiction}` : ""}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      {added ? <InlineNotice>{LEGAL_ENTITIES.added}</InlineNotice> : null}
    </div>
  );
}
