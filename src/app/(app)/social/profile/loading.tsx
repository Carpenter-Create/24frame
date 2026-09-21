import { cookies } from "next/headers";

import { SocialProfileOptimisticShell } from "@/components/social/social-own-profile";
import { SocialProfileSkeleton } from "@/components/social/social-skeletons";
import { readSocialProfileOptimisticCookie } from "@/lib/social-profile-edit";

export default async function Loading() {
  const jar = await cookies();
  const overlay = readSocialProfileOptimisticCookie((name) => jar.get(name)?.value);
  return (
    <div data-house-rsc-fallback="">
      <SocialProfileOptimisticShell
        serverOverlay={overlay}
        fallback={<SocialProfileSkeleton />}
      />
    </div>
  );
}
