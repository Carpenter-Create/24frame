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
  ENTITY_LIST_HEADER_CLASS,
  ENTITY_LIST_ROW_CLASS,
  entityTypeLabel,
  entityJurisdictionLabel,
  type EntityType,
  type LegalEntityRow,
} from "@/lib/legal-entities";
import {
  addLegalEntity,
  updateLegalEntity,
} from "@/app/(app)/settings/organization/actions";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<EntityType>("other");
  const [editJurisdiction, setEditJurisdiction] = useState("");
  const router = useRouter();

  function openEdit(entity: LegalEntityRow) {
    setFormOpen(false);
    setEditingId(entity.id);
    setEditName(entity.name);
    setEditType(entity.entityType);
    setEditJurisdiction(entity.jurisdiction ?? "");
    setError("");
    setAdded(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditType("other");
    setEditJurisdiction("");
    setError("");
  }

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

  async function onUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canManage || !editingId) return;
    setSaving(true);
    setError("");
    setAdded(false);
    const res = await updateLegalEntity({
      orgId,
      entityId: editingId,
      name: editName,
      entityType: editType,
      jurisdiction: editJurisdiction,
    });
    if (res.error) {
      setError(res.error);
      setSaving(false);
      return;
    }
    setSaving(false);
    setEditingId(null);
    router.refresh();
  }

  return (
    <div data-settings-entities="" className="flex flex-col gap-[var(--space-6)]">
      <div className="flex items-center justify-between gap-[var(--space-4)]">
        <h2 className={SETTINGS_PANE_TITLE_CLASS}>{LEGAL_ENTITIES.title}</h2>
        {canManage ? (
          <Button
            type="button"
            data-entity-add-cta=""
            onClick={() => {
              cancelEdit();
              setFormOpen(true);
            }}
          >
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
        <div data-entity-list="" className="overflow-x-auto">
          <div className={ENTITY_LIST_HEADER_CLASS} data-entity-list-head="">
            <span>{LEGAL_ENTITIES.nameColumn}</span>
            <span>{LEGAL_ENTITIES.typeColumn}</span>
            <span>{LEGAL_ENTITIES.jurisdictionColumn}</span>
            <span />
          </div>
          <ul className="flex flex-col divide-y divide-hairline border-t border-hairline">
            {entities.map((entity) =>
              editingId === entity.id ? (
                <li key={entity.id} data-entity-id={entity.id}>
                  <form
                    onSubmit={onUpdate}
                    className="flex flex-col gap-[var(--space-4)] py-[var(--space-4)]"
                    data-entity-edit-form=""
                  >
                    {entity.isDefault ? (
                      <StatusChip label={LEGAL_ENTITIES.default} tone="neutral" />
                    ) : null}
                    <div className="flex flex-col gap-[var(--space-2)]">
                      <Label htmlFor={`entity-edit-name-${entity.id}`}>
                        {LEGAL_ENTITIES.nameLabel}
                      </Label>
                      <Input
                        id={`entity-edit-name-${entity.id}`}
                        name="name"
                        type="text"
                        autoComplete="off"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-[var(--space-2)]">
                      <Label htmlFor={`entity-edit-type-${entity.id}`}>
                        {LEGAL_ENTITIES.typeLabel}
                      </Label>
                      <select
                        id={`entity-edit-type-${entity.id}`}
                        name="entityType"
                        className={formControlClass("box")}
                        value={editType}
                        onChange={(e) => setEditType(e.target.value as EntityType)}
                      >
                        {ENTITY_TYPES.map((value) => (
                          <option key={value} value={value}>
                            {entityTypeLabel(value)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-[var(--space-2)]">
                      <Label htmlFor={`entity-edit-jurisdiction-${entity.id}`}>
                        {LEGAL_ENTITIES.jurisdictionLabel}
                      </Label>
                      <Input
                        id={`entity-edit-jurisdiction-${entity.id}`}
                        name="jurisdiction"
                        type="text"
                        autoComplete="off"
                        placeholder={LEGAL_ENTITIES.jurisdictionHint}
                        value={editJurisdiction}
                        onChange={(e) => setEditJurisdiction(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-[var(--space-3)]">
                      <Button type="submit" disabled={saving}>
                        {saving ? LEGAL_ENTITIES.saving : LEGAL_ENTITIES.save}
                      </Button>
                      <Button type="button" variant="ghost" disabled={saving} onClick={cancelEdit}>
                        {LEGAL_ENTITIES.cancel}
                      </Button>
                    </div>
                  </form>
                </li>
              ) : (
                <li
                  key={entity.id}
                  data-entity-id={entity.id}
                  className={ENTITY_LIST_ROW_CLASS}
                >
                  <span className="flex min-w-0 items-center gap-[var(--space-2)]">
                    <span className="t-body text-ink">{entity.name}</span>
                    {entity.isDefault ? (
                      <StatusChip label={LEGAL_ENTITIES.default} tone="neutral" />
                    ) : null}
                  </span>
                  <span className="t-body text-ink">{entityTypeLabel(entity.entityType)}</span>
                  <span className="t-body-sm text-ink-3">
                    {entityJurisdictionLabel(entity.jurisdiction)}
                  </span>
                  <span className="justify-self-end">
                    {canManage ? (
                      <Button
                        type="button"
                        variant="ghost"
                        data-entity-edit=""
                        onClick={() => openEdit(entity)}
                      >
                        {LEGAL_ENTITIES.edit}
                      </Button>
                    ) : null}
                  </span>
                </li>
              ),
            )}
          </ul>
        </div>
      )}

      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      {added ? <InlineNotice>{LEGAL_ENTITIES.added}</InlineNotice> : null}
    </div>
  );
}
