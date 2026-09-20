"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "@phosphor-icons/react";

import { markNotificationsRead } from "@/app/(app)/aggregation/messages/actions";
import { ACTIVITY_PAGE } from "@/lib/activity";
import { PHOSPHOR_CHROME_ICON_CLASS, PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

// X clears the row. Cleared items leave the live feed. One RPC.
export function MarkDone({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      data-activity-done=""
      aria-label={ACTIVITY_PAGE.dismiss}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await markNotificationsRead([id]);
          router.refresh();
        })
      }
      className="shrink-0 text-ink-3 hover:text-ink-2 disabled:opacity-50"
    >
      <X className={PHOSPHOR_CHROME_ICON_CLASS} weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
    </button>
  );
}
