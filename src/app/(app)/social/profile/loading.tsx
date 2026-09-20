import { SocialProfileOptimisticShell } from "@/components/social/social-own-profile";
import { SocialProfileSkeleton } from "@/components/social/social-skeletons";

export default function Loading() {
  return (
    <SocialProfileOptimisticShell fallback={<SocialProfileSkeleton />} />
  );
}
