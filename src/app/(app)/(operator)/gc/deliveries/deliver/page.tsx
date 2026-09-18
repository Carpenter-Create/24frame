import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { DeliverStepper } from "@/components/licensing/deliver-stepper";
import { DELIVER_STEPPER, parseDeliverTitleIds } from "@/lib/deliver-stepper";
import { loadGcDeliveryCompanions, uniqueIds } from "@/lib/gc-deliveries-companions";
import { UNPAGINATED_MAX, rangeFor } from "@/lib/list-bounds";

import { createDeliveries } from "../actions";

export default async function DeliverStepperPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const sp = await (searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>));
  const titleIds = parseDeliverTitleIds(sp.titles);
  if (titleIds.length === 0) redirect(DELIVER_STEPPER.listHref);

  const supabase = await createClient();
  const { data: titleRows } = await supabase
    .from("titles")
    .select("id, title")
    .in("id", titleIds)
    .range(...rangeFor(UNPAGINATED_MAX));
  const titles = titleIds
    .map((id) => (titleRows ?? []).find((row) => row.id === id))
    .filter((row): row is { id: string; title: string } => Boolean(row));
  if (titles.length === 0) redirect(DELIVER_STEPPER.listHref);

  const { data: vendorRows } = await supabase
    .from("vendors")
    .select("id, name")
    .eq("active", true)
    .order("name")
    .range(...rangeFor(UNPAGINATED_MAX));
  const companions = await loadGcDeliveryCompanions(supabase, {
    formTitleIds: uniqueIds(titles.map((title) => title.id)),
    pageTitleIds: [],
    pageDeliveryIds: [],
  });
  const grantsByTitle: Record<
    string,
    { id: string; title_id: string; rights_type: string; territory_mode: string; territories: string[] | null }[]
  > = {};
  for (const grant of companions.grants.rows) {
    (grantsByTitle[grant.title_id] ??= []).push(grant);
  }

  return (
    <div
      data-deliver-stepper-page=""
      className="fixed inset-0 z-50 overflow-y-auto bg-surface-muted max-md:bg-surface"
    >
      <div className="mx-auto flex min-h-full w-full max-w-[840px] flex-col justify-center px-[var(--space-4)] py-[var(--space-6)] md:px-[var(--space-12)]">
        <div className="flex w-full flex-col rounded-[var(--radius-lg)] border border-hairline bg-surface px-[var(--space-4)] py-[var(--space-8)] max-md:border-0 max-md:px-0 max-md:py-[var(--space-6)]">
          <DeliverStepper
            titles={titles}
            vendors={(vendorRows ?? []).map((vendor) => ({ id: vendor.id, name: vendor.name }))}
            grantsByTitle={grantsByTitle}
            create={createDeliveries}
          />
        </div>
      </div>
    </div>
  );
}
