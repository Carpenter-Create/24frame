"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineNotice } from "@/components/ui/inline-notice";
import {
  ACCOUNT_NAME_MAX,
  COMPANY_PROFILE,
  COMPANY_PROFILE_COPY_CLASS,
  COMPANY_PROFILE_SAVED_MS,
  COMPANY_PROFILE_VIEW_CLASS,
} from "@/lib/account-profile";
import {
  SETTINGS_DIALOG_FIELD_CLASS,
  SETTINGS_DIALOG_FORM_CLASS,
  SETTINGS_DIALOG_HELP_CLASS,
} from "@/lib/settings";
import { saveCompanyName } from "./actions";

// organizations.name. member_can(manage_settings) is the write gate
// (same function as RLS). Bind save to the org this form rendered.
// Page is read-only; Edit opens the house Dialog.
export function CompanyProfileForm({
  orgId,
  name,
  canEdit,
}: {
  orgId: string;
  name: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const id = window.setTimeout(() => setSaved(false), COMPANY_PROFILE_SAVED_MS);
    return () => window.clearTimeout(id);
  }, [saved]);

  function openEdit() {
    if (!canEdit) return;
    setValue(name);
    setError("");
    setSaved(false);
    setOpen(true);
  }

  function closeEdit() {
    setOpen(false);
    setError("");
    setSaving(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canEdit) return;
    const form = e.currentTarget;
    setSaving(true);
    setError("");
    setSaved(false);
    const res = await saveCompanyName({ orgId, name: value });
    if (res.error) {
      setError(res.error);
      setSaving(false);
      return;
    }
    setSaving(false);
    setSaved(true);
    form.querySelector<HTMLInputElement>("#company-name")?.blur();
    setOpen(false);
    router.refresh();
  }

  return (
    <div data-company-profile="">
      <div className={COMPANY_PROFILE_VIEW_CLASS}>
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
      {error && !open ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      {saved ? <InlineNotice>{COMPANY_PROFILE.saved}</InlineNotice> : null}

      {canEdit ? (
        <Dialog
          open={open}
          onClose={closeEdit}
          title={COMPANY_PROFILE.nameLabel}
          size="sm"
        >
          <form
            onSubmit={onSubmit}
            className={SETTINGS_DIALOG_FORM_CLASS}
            data-company-profile-form=""
          >
            <p className={SETTINGS_DIALOG_HELP_CLASS}>{COMPANY_PROFILE.subtitle}</p>
            <div className={SETTINGS_DIALOG_FIELD_CLASS}>
              <Label htmlFor="company-name">{COMPANY_PROFILE.nameLabel}</Label>
              <Input
                id="company-name"
                name="company_name"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setSaved(false);
                }}
                maxLength={ACCOUNT_NAME_MAX}
                autoComplete="organization"
              />
            </div>
            {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
            <DialogFooter>
              <Button type="button" variant="secondary" disabled={saving} onClick={closeEdit}>
                {COMPANY_PROFILE.cancel}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? COMPANY_PROFILE.saving : COMPANY_PROFILE.save}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      ) : null}
    </div>
  );
}
