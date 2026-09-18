import { redirect } from "next/navigation";

import { OverviewPulse } from "@/components/overview/overview-pulse";
import { HouseEmpty } from "@/components/chrome/house";
import { OVERVIEW } from "@/lib/overview";
import { loadOverviewPulse } from "@/lib/overview-load";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/supabase/context";

export default async function HomePage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  if (!ctx.activeOrg && !ctx.isGcStaff) {
    return (
      <div data-home-page="" data-overview-page="">
        <h1 className="t-title text-ink">{OVERVIEW.title}</h1>
        <HouseEmpty>{OVERVIEW.noOrg}</HouseEmpty>
      </div>
    );
  }

  const supabase = await createClient();
  const model = await loadOverviewPulse(ctx, supabase);

  return (
    <div data-home-page="" data-overview-page="">
      <OverviewPulse model={model} />
    </div>
  );
}
