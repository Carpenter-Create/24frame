"use client";

import { useEffect, useState } from "react";

import { SettingsDrillRow } from "@/components/settings/settings-drill";
import { CompanyNameEditor } from "@/components/settings/company-name-editor";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { InlineNotice } from "@/components/ui/inline-notice";
import { cn } from "@/lib/cn";
import {
  COMPANY_PROFILE,
  COMPANY_PROFILE_COPY_CLASS,
  COMPANY_PROFILE_SAVED_MS,
  COMPANY_PROFILE_VIEW_CLASS,
} from "@/lib/account-profile";
import { SETTINGS_DRILL_LIST_CLASS } from "@/lib/settings";

// organizations.name. member_can(manage_settings) is the write gate
// (same function as RLS). Bind save to the org this form rendered.
// Desktop: read-only row; Edit opens the house Dialog.
// Mobile: Coinbase drill row → company edit pane.
export function CompanyProfileForm({
  orgId,
  name,
  canEdit,
}: {
  orgId: string;
  name: string;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const id = window.setTimeout(() => setSaved(false), COMPANY_PROFILE_SAVED_MS);
    return () => window.clearTimeout(id);
  }, [saved]);

  function openEdit() {
    if (!canEdit) return;
    setSaved(false);
    setOpen(true);
  }

  function closeEdit() {
    setOpen(false);
  }

  return (
    <div data-company-profile="">
      {canEdit ? (
        <div className={`md:hidden ${SETTINGS_DRILL_LIST_CLASS}`}>
          <SettingsDrillRow
            kind="company-name"
            label={COMPANY_PROFILE.nameLabel}
            value={name}
            href={COMPANY_PROFILE.editHref}
          />
        </div>
      ) : null}
      <div className={cn(COMPANY_PROFILE_VIEW_CLASS, canEdit && "max-md:hidden")}>
        <div className={COMPANY_PROFILE_COPY_CLASS}>
          <span className="t-label text-ink-3">{COMPANY_PROFILE.nameLabel}</span>
          <span className="t-body text-ink">{name}</span>
        </div>
        {canEdit ? (
          <Button type="button" variant="ghost" data-company-edit="" onClick={openEdit}>
            {COMPANY_PROFILE.edit}
          </Button>
        ) : null}
      </div>
      {canEdit ? null : (
        <p className="t-body-sm text-ink-3">{COMPANY_PROFILE.forbidden}</p>
      )}
      {saved ? <InlineNotice>{COMPANY_PROFILE.saved}</InlineNotice> : null}

      {canEdit ? (
        <Dialog
          open={open}
          onClose={closeEdit}
          title={COMPANY_PROFILE.nameLabel}
          size="sm"
        >
          {open ? (
            <CompanyNameEditor
              orgId={orgId}
              name={name}
              chrome="dialog"
              onClose={closeEdit}
              onSaved={() => {
                setSaved(true);
                closeEdit();
              }}
            />
          ) : null}
        </Dialog>
      ) : null}
    </div>
  );
}
