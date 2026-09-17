import { PageHeader } from "@/components/ui/page-header";
import { InlineNotice } from "@/components/ui/inline-notice";
import { TitlesLandscapeTile } from "@/components/titles/titles-catalog";
import { titleArtworkUrls } from "@/lib/artwork";
import {
  AVAILS_GRID_CLASS,
  AVAILS_PAGE,
  availsTilesFromRows,
} from "@/lib/avails";
import { LIST_PAGE, probeRange, splitProbe } from "@/lib/list-bounds";
import { createClient } from "@/lib/supabase/server";

// Staff Avails = Approved titles (`status = live`) across orgs. Layout B:
// 3-wide desktop grid of the shared Titles landscape tile. Phone stacks
// the same tile 1-wide. No StatusProgressTrack. Click → staff title detail.
export default async function AvailsPage() {
  const supabase = await createClient();
  const [tFrom, tTo] = probeRange(LIST_PAGE);
  const { data: titlePage } = await supabase
    .from("titles")
    .select("id, title")
    .eq("status", "live")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(tFrom, tTo);
  const { rows: list, truncated } = splitProbe(titlePage, LIST_PAGE);
  const artwork = await titleArtworkUrls(
    supabase,
    list.map((row) => row.id),
  );
  const tiles = availsTilesFromRows(
    list.map((row) => ({
      id: row.id,
      title: row.title,
      bannerUrl: artwork.get(row.id)?.banner ?? null,
    })),
  );

  return (
    <>
      <PageHeader title={AVAILS_PAGE.title} />
      {truncated ? (
        <InlineNotice tone="info">{AVAILS_PAGE.truncated(String(LIST_PAGE))}</InlineNotice>
      ) : null}
      {tiles.length === 0 ? (
        <div
          className="overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface px-[var(--space-4)] py-[var(--space-4)]"
          data-avails-empty=""
        >
          <p className="t-body-sm text-ink-3">{AVAILS_PAGE.empty}</p>
        </div>
      ) : (
        <div className={AVAILS_GRID_CLASS} data-avails-grid="">
          {tiles.map((tile) => (
            <TitlesLandscapeTile
              key={tile.id}
              href={tile.href}
              title={tile.title}
              stillUrl={tile.stillUrl}
            />
          ))}
        </div>
      )}
    </>
  );
}
