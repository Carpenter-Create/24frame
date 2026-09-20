"use client";

import { useEffect, useState } from "react";

import { SettingsDrillRow, SettingsGroupList, SettingsGroupRow } from "@/components/settings/settings-drill";
import { CompanyNameEditor } from "@/components/settings/company-name-editor";
import { Dialog } from "@/components/ui/dialog";
import { InlineNotice } from "@/components/ui/inline-notice";
import {
  COMPANY_PROFILE,
  COMPANY_PROFILE_SAVED_MS,
} from "@/lib/account-profile";
import { SETTINGS_SECTION_CLASS } from "@/lib/settings";

// organizations.name. member_can(manage_settings) is the write gate
// (same function as RLS). Bind save to the org this form rendered.
// One SettingsDrillRow in the house inset group. Desktop Dialog;
// mobile Coinbase drill → company edit pane. Not a Card. Not an
// Edit pill.
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
    <div data-company-profile="" className={SETTINGS_SECTION_CLASS}>
      <SettingsGroupList>
        <SettingsGroupRow>
          <SettingsDrillRow
            kind="company-name"
            label={COMPANY_PROFILE.nameLabel}
            value={name}
            href={canEdit ? COMPANY_PROFILE.editHref : undefined}
            onClick={canEdit ? openEdit : undefined}
            readOnly={!canEdit}
            cta={canEdit ? "company-edit" : undefined}
          />
        </SettingsGroupRow>
      </SettingsGroupList>
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
