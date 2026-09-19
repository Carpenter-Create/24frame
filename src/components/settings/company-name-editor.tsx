"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineNotice } from "@/components/ui/inline-notice";
import { ACCOUNT_NAME_MAX, COMPANY_PROFILE } from "@/lib/account-profile";
import {
  SETTINGS_DIALOG_FIELD_CLASS,
  SETTINGS_DIALOG_FORM_CLASS,
  SETTINGS_DIALOG_HELP_CLASS,
} from "@/lib/settings";
import { saveCompanyName } from "@/app/(app)/account/actions";

// One SoT company-name form body — Dialog on desktop, edit pane on
// mobile. Do not fork fields per chrome.

export function CompanyNameEditor({
  orgId,
  name,
  chrome,
  onClose,
  onSaved,
}: {
  orgId: string;
  name: string;
  chrome: "dialog" | "pane";
  onClose?: () => void;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setSaving(true);
    setError("");
    const res = await saveCompanyName({ orgId, name: value });
    if (res.error) {
      setError(res.error);
      setSaving(false);
      return;
    }
    form.querySelector<HTMLInputElement>("#company-name")?.blur();
    if (chrome === "pane") {
      router.push(COMPANY_PROFILE.href);
    } else {
      onSaved?.();
    }
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className={SETTINGS_DIALOG_FORM_CLASS}
      data-company-profile-form=""
    >
      {chrome === "dialog" ? (
        <p className={SETTINGS_DIALOG_HELP_CLASS}>{COMPANY_PROFILE.subtitle}</p>
      ) : null}
      <div className={SETTINGS_DIALOG_FIELD_CLASS}>
        <Label htmlFor="company-name">{COMPANY_PROFILE.nameLabel}</Label>
        <Input
          id="company-name"
          name="company_name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={ACCOUNT_NAME_MAX}
          autoComplete="organization"
        />
      </div>
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      {chrome === "dialog" ? (
        <DialogFooter>
          <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>
            {COMPANY_PROFILE.cancel}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? COMPANY_PROFILE.saving : COMPANY_PROFILE.save}
          </Button>
        </DialogFooter>
      ) : (
        <Button type="submit" disabled={saving}>
          {saving ? COMPANY_PROFILE.saving : COMPANY_PROFILE.save}
        </Button>
      )}
    </form>
  );
}
