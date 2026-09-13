import { TextAction } from "@/components/chrome/house";
import { FINANCE_HREF, FINANCE_PAGE } from "@/lib/finance";

// Slice 1 stub. Rail door is the live surface. Home does not invent a finance IA.
export function DashboardFinanceGlance() {
  return (
    <div data-finance-glance-stub="" className="flex flex-col gap-1">
      <p className="t-body-sm text-ink-3">{FINANCE_PAGE.glance}</p>
      <TextAction href={FINANCE_HREF}>{FINANCE_PAGE.glanceCta}</TextAction>
    </div>
  );
}
