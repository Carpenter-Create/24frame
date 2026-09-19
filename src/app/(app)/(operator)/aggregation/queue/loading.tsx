import { CatalogSkeleton } from "@/components/layout/page-skeletons";

// Instant feedback on navigate, and — just as importantly — this is what lets
// Next.js prefetch this dynamic route at all. Same landscape-row skeleton as
// /titles — Queue consumes that list primitive.
export default function Loading() {
  return <CatalogSkeleton />;
}
