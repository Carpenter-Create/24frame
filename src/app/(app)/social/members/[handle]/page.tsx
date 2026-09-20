import { redirect } from "next/navigation";

import { SOCIAL_EDGE_RUNTIME } from "@/lib/social-edge";
import { socialProfileHref } from "@/lib/social";

export const runtime = SOCIAL_EDGE_RUNTIME;

export default async function SocialMemberRedirectPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  redirect(socialProfileHref(handle));
}
