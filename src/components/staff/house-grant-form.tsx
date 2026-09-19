"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineNotice } from "@/components/ui/inline-notice";
import { formControlClass } from "@/lib/form-control";
import {
  GRANT_TIER_LABELS,
  HOUSE_GRANT,
  HOUSE_GRANT_DEFAULT_TIER,
  grantTierLabel,
  type GrantTier,
} from "@/lib/account-invite";
import {
  grantHouseAccount,
  revokeHouseGrant,
} from "@/app/(app)/(operator)/aggregation/gc/clients/grant-actions";

export type HouseGrantRow = {
  id: string;
  email: string;
  orgName: string;
  tier: GrantTier;
};

export function HouseGrantForm({
  pending,
  canGrant,
}: {
  pending: HouseGrantRow[];
  canGrant: boolean;
}) {
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [tier, setTier] = useState<GrantTier>(HOUSE_GRANT_DEFAULT_TIER);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canGrant) return;
    setSaving(true);
    setError("");
    setSent(false);
    const res = await grantHouseAccount({ email, orgName, tier });
    if (res.error) {
      setError(res.error);
      setSaving(false);
      return;
    }
    setEmail("");
    setOrgName("");
    setTier(HOUSE_GRANT_DEFAULT_TIER);
    setSaving(false);
    setSent(true);
  }

  async function onRevoke(id: string) {
    setRevoking(id);
    setError("");
    const res = await revokeHouseGrant({ id });
    if (res.error) setError(res.error);
    setRevoking(null);
  }

  return (
    <div data-house-grant="" className="flex flex-col gap-[var(--space-4)]">
      {pending.length === 0 ? (
        <p className="t-body text-ink-2">{HOUSE_GRANT.empty}</p>
      ) : (
        <ul className="flex flex-col gap-[var(--space-3)]">
          {pending.map((row) => (
            <li key={row.id} className="flex items-baseline justify-between gap-[var(--space-4)]">
              <span className="t-body text-ink">
                {row.email}
                <span className="t-body-sm text-ink-3">
                  {" "}
                  · {row.orgName} · {grantTierLabel(row.tier)}
                </span>
              </span>
              {canGrant ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={revoking === row.id}
                  onClick={() => onRevoke(row.id)}
                >
                  {revoking === row.id ? HOUSE_GRANT.granting : HOUSE_GRANT.revoke}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canGrant ? (
      <form onSubmit={onSubmit} className="flex flex-col gap-[var(--space-4)]" data-house-grant-form="">
        <div className="flex flex-col gap-[var(--space-2)]">
          <Label htmlFor="house-grant-email">{HOUSE_GRANT.emailLabel}</Label>
          <Input
            id="house-grant-email"
            name="email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSent(false);
            }}
            required
          />
        </div>
        <div className="flex flex-col gap-[var(--space-2)]">
          <Label htmlFor="house-grant-org">{HOUSE_GRANT.orgLabel}</Label>
          <Input
            id="house-grant-org"
            name="org_name"
            value={orgName}
            onChange={(e) => {
              setOrgName(e.target.value);
              setSent(false);
            }}
            required
          />
        </div>
        <div className="flex flex-col gap-[var(--space-2)]">
          <Label htmlFor="house-grant-tier">{HOUSE_GRANT.tierLabel}</Label>
          <select
            id="house-grant-tier"
            name="tier"
            className={formControlClass("box")}
            value={tier}
            onChange={(e) => setTier(e.target.value as GrantTier)}
          >
            {(Object.keys(GRANT_TIER_LABELS) as GrantTier[]).map((value) => (
              <option key={value} value={value}>
                {grantTierLabel(value)}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={saving} className="self-start">
          {saving ? HOUSE_GRANT.granting : HOUSE_GRANT.grant}
        </Button>
      </form>
      ) : (
        <p className="t-body-sm text-ink-3">{HOUSE_GRANT.forbidden}</p>
      )}
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      {sent ? <InlineNotice>{HOUSE_GRANT.sent}</InlineNotice> : null}
    </div>
  );
}
