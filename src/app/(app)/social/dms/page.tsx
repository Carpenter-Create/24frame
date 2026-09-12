import Link from "next/link";
import { redirect } from "next/navigation";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { SocialAvatar, SocialNeedProfile } from "@/components/social/social-ui";
import { SOCIAL, socialDmHref } from "@/lib/social";
import { loadOwnProfile, loadProfilesByIds } from "@/lib/social-feed";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialDmsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const supabase = await createClient();
  const profile = await loadOwnProfile(supabase, ctx.user.id);
  const { data: inbox } = profile
    ? await supabase.rpc("get_dm_inbox", { p_limit: 50 })
    : { data: [] as never[] };

  const rows = inbox ?? [];
  const peers = await loadProfilesByIds(
    supabase,
    [...new Set(rows.map((row) => row.peer_id).filter((id): id is string => !!id))],
  );

  return (
    <div data-social-dms="">
      <PageHeader title={SOCIAL.dms.title} subtitle={SOCIAL.dms.subtitle} />
      {!profile ? <SocialNeedProfile /> : null}
      {profile && rows.length === 0 ? <HouseEmpty>{SOCIAL.dms.empty}</HouseEmpty> : null}
      <ul className="flex flex-col">
        {rows.map((row) => {
          const peer = row.peer_id ? peers.get(row.peer_id) : null;
          const name = peer?.display_name ?? "Member";
          return (
            <li key={row.conversation_id} className="border-b border-hairline py-[var(--space-4)]">
              <Link
                href={socialDmHref(row.conversation_id)}
                className="flex items-center gap-[var(--space-3)]"
              >
                <SocialAvatar name={name} />
                <div className="min-w-0">
                  <p className="t-body font-medium text-ink">{name}</p>
                  {row.unread_count > 0 ? (
                    <p className="t-body-sm text-ink-3">{row.unread_count} unread</p>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
