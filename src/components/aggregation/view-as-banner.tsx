import { stopAggregationViewAs } from "@/app/(app)/aggregation/view-as-actions";
import {
  AGGREGATION_VIEW_AS,
  AGGREGATION_VIEW_AS_BANNER_CLASS,
} from "@/lib/aggregation-impersonation";
import { Button } from "@/components/ui/button";

export function AggregationViewAsBanner({ orgName }: { orgName: string }) {
  return (
    <div data-aggregation-view-as="" role="status" className={AGGREGATION_VIEW_AS_BANNER_CLASS}>
      <p className="min-w-0 break-words t-body-sm text-ink">{AGGREGATION_VIEW_AS.banner(orgName)}</p>
      <form action={stopAggregationViewAs}>
        <Button type="submit" variant="secondary">
          {AGGREGATION_VIEW_AS.exit}
        </Button>
      </form>
    </div>
  );
}
