import { SocialHomeSkeleton } from "@/components/social/social-skeletons";

// Instant Social Home feedback. Also unlocks Next.js prefetch of this
// dynamic segment — without a local loading.tsx the parent (app) shell
// would paint the Aggregation dashboard skeleton.
export default function Loading() {
  return <SocialHomeSkeleton />;
}
