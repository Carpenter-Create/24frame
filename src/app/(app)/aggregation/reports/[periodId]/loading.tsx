import { ListSkeleton } from "@/components/layout/page-skeletons";

export default function Loading() {
  return (
    <div data-house-rsc-fallback="">
      <ListSkeleton rows={8} />
    </div>
  );
}
