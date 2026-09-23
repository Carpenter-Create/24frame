import { DashboardSkeleton } from "@/components/layout/page-skeletons";

// Dashboard-local body only. Do not put this on (app)/loading.tsx — that
// wraps every Social / Education / Aggregation hop in the Aggregation
// dashboard skeleton and makes chrome feel like a full reload.
export default function Loading() {
  return (
    <div data-house-rsc-fallback="">
      <DashboardSkeleton />
    </div>
  );
}
