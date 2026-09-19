import { createClient } from "@/lib/supabase/server";
import { titleArtworkUrls } from "@/lib/artwork";
import { LIST_PAGE, probeRange, splitProbe } from "@/lib/list-bounds";
import { InlineNotice } from "@/components/ui/inline-notice";
import { PageHeader } from "@/components/ui/page-header";
import { AvailsGrid } from "@/components/avails/avails-grid";
import { AVAILS_PAGE, toAvailsTile } from "@/lib/avails";

// Staff /avails body. avails-grid-3: 3-wide landscape tiles (house 16
// gap), 1-wide phone stack. Shared Titles landscape art + quiet title.
// Live / Approved only. Cross-org via is_gc_staff. Click → staff title.

export default async function AvailsPage() {
  const supabase = await createClient();
  const [from, to] = probeRange(LIST_PAGE);
  const { data: titlePage } = await supabase
    .from("titles")
    .select("id, title")
    .eq("status", "live")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);
  const { rows: list, truncated } = splitProbe(titlePage, LIST_PAGE);
  const posters = await titleArtworkUrls(
    supabase,
    list.map((t) => t.id),
  );
  const tiles = list.map((t) =>
    toAvailsTile(t, posters.get(t.id)?.banner ?? null),
  );

  return (
    <>
      <PageHeader title={AVAILS_PAGE.title} />
      {truncated ? (
        <InlineNotice tone="info">{AVAILS_PAGE.truncated(LIST_PAGE)}</InlineNotice>
      ) : null}
      <AvailsGrid tiles={tiles} />
    </>
  );
}
