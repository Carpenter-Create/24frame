import { redirect } from "next/navigation";

import { InlineNotice } from "@/components/ui/inline-notice";
import { PageHeader } from "@/components/ui/page-header";
import { NewsRail } from "@/components/news/news-rail";
import { NEWS_PAGE } from "@/lib/news";
import { loadNewsHistory } from "@/lib/news-load";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/supabase/context";

export default async function NewsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const now = new Date();
  const supabase = await createClient();
  const loaded = await loadNewsHistory(supabase, now);

  return (
    <div data-news-history="">
      <PageHeader title={NEWS_PAGE.title} subtitle={NEWS_PAGE.subtitle} />
      {loaded.truncated ? (
        <InlineNotice tone="info" className="mb-4" data-my-list-truncated="news">
          {NEWS_PAGE.truncated}
        </InlineNotice>
      ) : null}
      <NewsRail items={loaded.failed ? [] : loaded.rows} now={now} />
    </div>
  );
}
