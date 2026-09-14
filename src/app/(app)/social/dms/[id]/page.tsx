import { redirect } from "next/navigation";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { SocialAddPeopleForm, SocialDmCompose, SocialGroupTitleForm } from "@/components/social/social-forms";
import { SocialAvatar } from "@/components/social/social-ui";
import { DETAIL_LIST, rangeFor } from "@/lib/list-bounds";
import { signedAvatarUrls } from "@/lib/s3-avatars";
import { conversationRoomLabel, displayHandle, SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { loadProfilesByIds } from "@/lib/social-feed";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
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
  const profile = await ensureOwnSocialProfile(supabase, ctx.user);

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, kind, title")
    .eq("id", id)
    .maybeSingle();

  if (!conversation) {
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
    .select("user_id, left_at")
    .eq("conversation_id", conversation.id);

  const activeIds = (participants ?? [])
    .filter((row) => row.left_at == null)
    .map((row) => row.user_id);
  const peopleIds = [
    ...new Set([
      ...activeIds,
      ...(messages ?? []).map((row) => row.sender_id).filter((id): id is string => !!id),
    ]),
  ];
  const [people, faces] = await Promise.all([
    loadProfilesByIds(supabase, peopleIds),
    signedAvatarUrls(peopleIds),
  ]);
  const others = activeIds
    .filter((userId) => userId !== ctx.user.id)
    .map((userId) => people.get(userId))
    .filter((person): person is NonNullable<typeof person> => !!person);
  const title = conversationRoomLabel(
    conversation.title,
    others.map((person) => person.display_name),
  );
  const subtitle =
    others.length === 1
      ? displayHandle(others[0].handle)
      : others.map((person) => displayHandle(person.handle)).join(", ") || undefined;

  return (
    <div data-social-dm-thread="" data-social-dm-kind={conversation.kind}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        backLink={{ href: SOCIAL_ROUTES.dms, label: SOCIAL.dms.title }}
      />
      {profile ? <SocialAddPeopleForm conversationId={conversation.id} /> : null}
      {profile && conversation.kind === "group" ? (
        <SocialGroupTitleForm conversationId={conversation.id} title={conversation.title} />
      ) : null}
      <ol className="flex flex-col gap-[var(--space-4)]">
        {(messages ?? []).map((message) => {
          const sender = message.sender_id ? people.get(message.sender_id) : null;
          const name = sender?.display_name ?? "Member";
          return (
            <li key={message.id} className="flex gap-[var(--space-3)]">
              <SocialAvatar
                name={name}
                photoUrl={message.sender_id ? faces.get(message.sender_id) ?? null : null}
              />
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
