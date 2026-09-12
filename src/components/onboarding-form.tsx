"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineNotice } from "@/components/ui/inline-notice";
import { createOrg } from "@/app/actions";
import { ONBOARDING_ORGANIZATION } from "@/lib/onboarding";

// First-run onboarding: name the organization → create_org_and_membership RPC.
// Controlled input + manual validation + inline notice (house form pattern).
export function OnboardingForm() {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError(ONBOARDING_ORGANIZATION.nameRequired);
      return;
    }
    setSaving(true);
    setError("");
    const res = await createOrg(name.trim());
    // Success redirects server-side; only a failure returns here.
    if (res?.error) {
      setError(res.error);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="org-name">{ONBOARDING_ORGANIZATION.nameLabel}</Label>
        <Input
          id="org-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Films"
        />
      </div>
      <Button type="submit" disabled={saving || !name.trim()} className="self-start">
        {saving ? ONBOARDING_ORGANIZATION.creating : ONBOARDING_ORGANIZATION.submit}
      </Button>
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
    </form>
  );
}
