"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { InlineNotice } from "@/components/ui/inline-notice";
import { DELIVERY_STATUS_ROW_LABELS, type DeliveryStatus } from "@/lib/titles";
import { setDeliveryStatus } from "./actions";

const STATUSES: DeliveryStatus[] = ["pending", "delivered", "live", "rejected", "taken_down"];

export function DeliveryControls({ deliveryId, status }: { deliveryId: string; status: DeliveryStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function change(next: DeliveryStatus) {
    if (next === status) return;
    setBusy(true);
    setError("");
    const res = await setDeliveryStatus(deliveryId, next);
    if (res?.error) { setError(res.error); setBusy(false); return; }
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={status}
        disabled={busy}
        onChange={(e) => change(e.target.value as DeliveryStatus)}
        className="rounded-[var(--radius-sm)] border border-hairline bg-surface px-2 py-1 t-body-sm text-ink"
      >
        {STATUSES.map((s) => <option key={s} value={s}>{DELIVERY_STATUS_ROW_LABELS[s]}</option>)}
      </select>
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
    </div>
  );
}
