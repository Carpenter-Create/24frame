import { TextAction } from "@/components/chrome/house";
import {
  FINANCE_CLIENT,
  FINANCE_CLIENT_HREF,
  FINANCE_HREF,
  FINANCE_PAGE,
} from "@/lib/finance";
import type { ClientFinanceGlance } from "@/lib/finance-glance";

// Staff stub stays the Slice 1 rail pointer. Client glance is the recipient
// org purse: rate, balance/threshold, latest closed statement.

export function DashboardFinanceGlance() {
  return (
    <div data-finance-glance-stub="" className="flex flex-col gap-1">
      <p className="t-body-sm text-ink-3">{FINANCE_PAGE.glance}</p>
      <TextAction href={FINANCE_HREF}>{FINANCE_PAGE.glanceCta}</TextAction>
    </div>
  );
}

export function DashboardClientFinanceGlance({ glance }: { glance: ClientFinanceGlance }) {
  return (
    <div data-finance-glance="" className="flex flex-col gap-2">
      <p className="t-label text-ink-3">{FINANCE_CLIENT.title}</p>
      <p className="flex justify-between gap-4 t-body-sm text-ink-2" data-finance-glance-rate="">
        <span>{FINANCE_CLIENT.glanceRate}</span>
        <span className="text-ink">{glance.rateLabel}</span>
      </p>
      <p className="flex justify-between gap-4 t-body-sm text-ink-2" data-finance-glance-balance="">
        <span>{FINANCE_CLIENT.glanceBalance}</span>
        <span className="text-ink">{glance.balanceLabel}</span>
      </p>
      <p className="flex justify-between gap-4 t-body-sm text-ink-2" data-finance-glance-threshold="">
        <span>{FINANCE_CLIENT.glanceThreshold}</span>
        <span className="text-ink">{glance.thresholdLabel}</span>
      </p>
      <p className="flex justify-between gap-4 t-body-sm text-ink-2" data-finance-glance-latest="">
        <span>{FINANCE_CLIENT.glanceLatest}</span>
        <span className="text-ink">{glance.latestLabel}</span>
      </p>
      <TextAction href={glance.latestHref ?? FINANCE_CLIENT_HREF}>{FINANCE_CLIENT.glanceCta}</TextAction>
    </div>
  );
}
