"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { markNotificationsRead } from "@/app/(app)/aggregation/messages/actions";
import { ACTIVITY_PAGE } from "@/lib/activity";

// Complete = Done = read. One RPC, one state.
export function MarkDone({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      data-activity-done=""
      disabled={pending}
      onClick={() =>
        start(async () => {
          await markNotificationsRead([id]);
          router.refresh();
        })
      }
      className="shrink-0 t-label text-ink-3 underline-offset-2 transition-colors hover:text-ink-2 hover:underline disabled:opacity-50"
    >
      {ACTIVITY_PAGE.done}
    </button>
  );
}
