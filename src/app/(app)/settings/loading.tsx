import { CardListSkeleton } from "@/components/layout/page-skeletons";

export default function Loading() {
  return (
    <div data-house-rsc-fallback="">
      <CardListSkeleton cards={1} />
    </div>
  );
}
