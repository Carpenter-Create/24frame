"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Select } from "@/components/ui/select";
import {
  ENTITY_TYPES,
  LEGAL_ENTITIES,
  entityTypeLabel,
  type EntityType,
  type LegalEntityRow,
} from "@/lib/legal-entities";
import {
  SETTINGS,
  SETTINGS_DIALOG_FIELD_CLASS,
  SETTINGS_DIALOG_FORM_CLASS,
} from "@/lib/settings";
import {
  addLegalEntity,
  updateLegalEntity,
} from "@/app/(app)/settings/organization/actions";

// One SoT legal-entity form body — Dialog on desktop, add/edit pane
// on mobile. Do not fork fields per chrome.

export function LegalEntityEditor({
  orgId,
  mode,
  entity,
  chrome,
  onClose,
  onSaved,
}: {
  orgId: string;
  mode: "add" | "edit";
  entity?: LegalEntityRow;
  chrome: "dialog" | "pane";
  onClose?: () => void;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(entity?.name ?? "");
  const [entityType, setEntityType] = useState<EntityType>(entity?.entityType ?? "other");
  const [jurisdiction, setJurisdiction] = useState(entity?.jurisdiction ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res =
      mode === "edit" && entity
        ? await updateLegalEntity({
            orgId,
            entityId: entity.id,
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
    if (chrome === "pane") {
      router.push(SETTINGS.organizationHref);
    } else {
      onSaved?.();
    }
    router.refresh();
  }

  const submitLabel =
    mode === "edit"
      ? saving
        ? LEGAL_ENTITIES.saving
        : LEGAL_ENTITIES.save
      : saving
        ? LEGAL_ENTITIES.adding
        : LEGAL_ENTITIES.add;

  return (
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
      {chrome === "dialog" ? (
        <DialogFooter>
          <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>
            {LEGAL_ENTITIES.cancel}
          </Button>
          <Button type="submit" disabled={saving}>
            {submitLabel}
          </Button>
        </DialogFooter>
      ) : (
        <Button type="submit" disabled={saving}>
          {submitLabel}
        </Button>
      )}
    </form>
  );
}
