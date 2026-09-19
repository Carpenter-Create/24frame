"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineNotice } from "@/components/ui/inline-notice";
import { StatusChip } from "@/components/layout/status-chip";
import { Select } from "@/components/ui/select";
import {
  SETTINGS_DIALOG_FIELD_CLASS,
  SETTINGS_DIALOG_FORM_CLASS,
  SETTINGS_PANE_TITLE_CLASS,
} from "@/lib/settings";
import {
  LEGAL_ENTITIES,
  ENTITY_TYPES,
  ENTITY_LIST_HEADER_CLASS,
  ENTITY_LIST_ROW_CLASS,
  ENTITY_LIST_VALUE_CLASS,
  entityTypeLabel,
  entityJurisdictionLabel,
  entityJurisdictionClass,
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
  const [mode, setMode] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState<EntityType>("other");
  const [jurisdiction, setJurisdiction] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const router = useRouter();

  function resetDraft() {
    setName("");
    setEntityType("other");
    setJurisdiction("");
    setEditingId(null);
  }

  function closeModal() {
    setMode(null);
    setSaving(false);
    setError("");
    resetDraft();
  }

  function openAdd() {
    resetDraft();
    setError("");
    setAdded(false);
    setMode("add");
  }

  function openEdit(entity: LegalEntityRow) {
    setAdded(false);
    setError("");
    setEditingId(entity.id);
    setName(entity.name);
    setEntityType(entity.entityType);
    setJurisdiction(entity.jurisdiction ?? "");
    setMode("edit");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canManage || !mode) return;
    setSaving(true);
    setError("");
    setAdded(false);
    const res =
      mode === "edit" && editingId
        ? await updateLegalEntity({
            orgId,
            entityId: editingId,
            name,
            entityType,
            jurisdiction,
          })
        : await addLegalEntity({
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
    if (mode === "add") setAdded(true);
    closeModal();
    router.refresh();
  }

  return (
    <div data-settings-entities="" className="flex flex-col gap-[var(--space-6)]">
      <div className="flex items-center justify-between gap-[var(--space-4)]">
        <h2 className={SETTINGS_PANE_TITLE_CLASS}>{LEGAL_ENTITIES.title}</h2>
        {canManage ? (
          <Button type="button" data-entity-add-cta="" onClick={openAdd}>
            {LEGAL_ENTITIES.add}
          </Button>
        ) : null}
      </div>

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
            <span className="justify-self-end">{LEGAL_ENTITIES.actionsColumn}</span>
          </div>
          <ul className="flex flex-col divide-y divide-hairline border-t border-hairline">
            {entities.map((entity) => (
              <li
                key={entity.id}
                data-entity-id={entity.id}
                className={ENTITY_LIST_ROW_CLASS}
              >
                <span className="flex min-w-0 items-center gap-[var(--space-2)]">
                  <span className={ENTITY_LIST_VALUE_CLASS}>{entity.name}</span>
                  {entity.isDefault ? (
                    <StatusChip label={LEGAL_ENTITIES.default} tone="neutral" />
                  ) : null}
                </span>
                <span className={ENTITY_LIST_VALUE_CLASS}>
                  {entityTypeLabel(entity.entityType)}
                </span>
                <span className={entityJurisdictionClass(entity.jurisdiction)}>
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
            ))}
          </ul>
        </div>
      )}

      {error && !mode ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      {added ? <InlineNotice>{LEGAL_ENTITIES.added}</InlineNotice> : null}

      {canManage ? (
        <Dialog
          open={mode !== null}
          onClose={closeModal}
          title={mode === "edit" ? LEGAL_ENTITIES.edit : LEGAL_ENTITIES.add}
          size="md"
        >
          <form
            onSubmit={onSubmit}
            className={SETTINGS_DIALOG_FORM_CLASS}
            data-entity-add-form={mode === "add" ? "" : undefined}
            data-entity-edit-form={mode === "edit" ? "" : undefined}
          >
            <div className={SETTINGS_DIALOG_FIELD_CLASS}>
              <Label htmlFor="entity-name">{LEGAL_ENTITIES.nameLabel}</Label>
              <Input
                id="entity-name"
                name="name"
                type="text"
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className={SETTINGS_DIALOG_FIELD_CLASS}>
              <Label htmlFor="entity-type">{LEGAL_ENTITIES.typeLabel}</Label>
              <Select
                id="entity-type"
                name="entityType"
                value={entityType}
                aria-label={LEGAL_ENTITIES.typeLabel}
                options={ENTITY_TYPES.map((value) => ({
                  value,
                  label: entityTypeLabel(value),
                }))}
                onChange={(next) => setEntityType(next as EntityType)}
              />
            </div>
            <div className={SETTINGS_DIALOG_FIELD_CLASS}>
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
            {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
            <DialogFooter>
              <Button type="button" variant="secondary" disabled={saving} onClick={closeModal}>
                {LEGAL_ENTITIES.cancel}
              </Button>
              <Button type="submit" disabled={saving}>
                {mode === "edit"
                  ? saving
                    ? LEGAL_ENTITIES.saving
                    : LEGAL_ENTITIES.save
                  : saving
                    ? LEGAL_ENTITIES.adding
                    : LEGAL_ENTITIES.add}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      ) : null}
    </div>
  );
}
