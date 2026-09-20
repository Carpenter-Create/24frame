import { redirect } from "next/navigation";

import { socialProfileHref } from "@/lib/social";

export const runtime = "edge";

export default async function SocialMemberRedirectPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  redirect(socialProfileHref(handle));
}
