import { redirect } from "next/navigation";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { SOCIAL, socialGroupHref, socialPostHref } from "@/lib/social";
import { requireSocialSession } from "@/lib/social-session";

export default async function SocialGroupPostRedirectPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const [session, { slug, postId }] = await Promise.all([requireSocialSession(), params]);
  const { supabase } = session;
  const { data: group } = await supabase
    .from("groups")
    .select("id, slug")
    .eq("slug", decodeURIComponent(slug))
    .maybeSingle();
  const { data: post } = await supabase
    .from("posts")
    .select("id, group_id")
    .eq("id", postId)
    .maybeSingle();

  if (!group || !post || post.group_id !== group.id) {
    return (
      <div data-social-post-missing="">
        <PageHeader title={SOCIAL.post.title} backLink={{ href: socialGroupHref(decodeURIComponent(slug)) }} />
        <HouseEmpty>{SOCIAL.post.missing}</HouseEmpty>
      </div>
    );
  }

  redirect(socialPostHref(post.id));
}
