import { SocialHomeSkeleton } from "@/components/social/social-skeletons";

// Instant Social Home feedback. Also unlocks Next.js prefetch of this
// dynamic segment. Parent (app)/loading.tsx is gone so a hop here cannot
// paint the Aggregation dashboard skeleton over the sticky shell.
export default function Loading() {
  return (
    <div data-house-rsc-fallback="">
      <SocialHomeSkeleton />
    </div>
  );
}
