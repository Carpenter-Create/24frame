import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { HouseGrantForm } from "@/components/staff/house-grant-form";
import { HOUSE_GRANT, type GrantTier } from "@/lib/account-invite";
import { UNPAGINATED_MAX, splitProbe } from "@/lib/list-bounds";

// Staff-only grant/comp. Hidden unless gc_can(operate). Lives on
// /gc/clients, not inside the directory primitive and not on customer
// Settings. Legal / accountant are staff but cannot grant.

export async function HouseGrantSection() {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: canOperate, error: canOperateError } = await supabase.rpc("gc_can", {
    p_uid: user.id,
    p_capability: "operate",
  });
  if (canOperateError || canOperate !== true) return null;

  const { data } = await supabase.rpc("pending_house_grants", { p_limit: UNPAGINATED_MAX + 1 });
  const { rows } = splitProbe(data ?? [], UNPAGINATED_MAX);
  const pending = rows.map((row) => ({
    id: row.id,
    email: row.email,
    orgName: row.org_name,
    tier: row.tier as GrantTier,
  }));

  return (
    <section data-house-grant-section="" className="mt-[var(--space-12)] flex flex-col gap-[var(--space-4)]">
      <h2 className="t-section text-ink">{HOUSE_GRANT.title}</h2>
      <HouseGrantForm pending={pending} canGrant />
    </section>
  );
}
