"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ACTIVITY } from "@/lib/activity";

import { markActivityDone } from "./actions";

export function MarkDone({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      data-activity-mark-done=""
      disabled={pending}
      onClick={() =>
        start(async () => {
          await markActivityDone([id]);
          router.refresh();
        })
      }
      className="shrink-0 t-label text-ink-3 underline-offset-2 transition-colors hover:text-ink-2 hover:underline disabled:opacity-50"
    >
      {ACTIVITY.markDone}
    </button>
  );
}

export function MarkAllDone({ ids }: { ids: string[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="secondary"
      data-activity-mark-all-done=""
      disabled={pending}
      onClick={() =>
        start(async () => {
          await markActivityDone(ids);
          router.refresh();
        })
      }
    >
      {ACTIVITY.markAllDone}
    </Button>
  );
}
