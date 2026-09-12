import { redirect } from "next/navigation";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { SocialDmCompose } from "@/components/social/social-forms";
import { SocialAvatar, SocialNeedProfile } from "@/components/social/social-ui";
import { DETAIL_LIST, rangeFor } from "@/lib/list-bounds";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { loadOwnProfile, loadProfilesByIds } from "@/lib/social-feed";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { markSocialDmRead } from "../../actions";

export default async function SocialDmThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const profile = await loadOwnProfile(supabase, ctx.user.id);

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, kind")
    .eq("id", id)
    .maybeSingle();

  if (!conversation || conversation.kind !== "direct") {
    return (
      <div data-social-dm-missing="">
        <PageHeader title={SOCIAL.dms.thread} backLink={{ href: SOCIAL_ROUTES.dms }} />
        <HouseEmpty>{SOCIAL.dms.missing}</HouseEmpty>
      </div>
    );
  }

  if (profile) await markSocialDmRead(conversation.id);

  const { data: messages } = await supabase
    .from("messages")
    .select("id, body, sender_id, created_at, status")
    .eq("conversation_id", conversation.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .range(...rangeFor(DETAIL_LIST));

  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversation.id);

  const people = await loadProfilesByIds(
    supabase,
    [...new Set((participants ?? []).map((row) => row.user_id))],
  );
  const peer = [...people.values()].find((person) => person.id !== ctx.user.id) ?? null;

  return (
    <div data-social-dm-thread="">
      <PageHeader
        title={peer?.display_name ?? SOCIAL.dms.thread}
        subtitle={peer ? `@${peer.handle}` : undefined}
        backLink={{ href: SOCIAL_ROUTES.dms, label: SOCIAL.dms.title }}
      />
      {!profile ? <SocialNeedProfile /> : null}
      <ol className="flex flex-col gap-[var(--space-4)]">
        {(messages ?? []).map((message) => {
          const sender = message.sender_id ? people.get(message.sender_id) : null;
          const name = sender?.display_name ?? "Member";
          return (
            <li key={message.id} className="flex gap-[var(--space-3)]">
              <SocialAvatar name={name} />
              <div>
                <p className="t-body-sm text-ink-3">{name}</p>
                <p className="t-body text-ink whitespace-pre-wrap">{message.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
      {(messages ?? []).length === 0 ? <HouseEmpty>{SOCIAL.dms.empty}</HouseEmpty> : null}
      {profile ? <SocialDmCompose conversationId={conversation.id} /> : null}
    </div>
  );
}
