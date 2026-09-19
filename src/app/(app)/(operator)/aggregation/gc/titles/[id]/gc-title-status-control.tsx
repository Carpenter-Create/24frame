"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Textarea } from "@/components/ui/textarea";
import { formControlClass } from "@/lib/form-control";
import {
  TITLE_STATUS_OVERRIDE,
  TITLE_STATUS_OVERRIDE_VALUES,
  titleStatusOverrideConfirmBody,
  titleStatusOverrideOptionLabel,
} from "@/lib/title-status-override";
import type { TitleStatus } from "@/lib/titles";
import { setGcTitleStatus } from "./actions";

export function GcTitleStatusControl({
  titleId,
  titleName,
  status,
  locked,
}: {
  titleId: string;
  titleName: string;
  status: TitleStatus;
  locked: boolean;
}) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState<TitleStatus>(status);
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    if (!reason.trim()) {
      setError(TITLE_STATUS_OVERRIDE.reasonRequired);
      return;
    }
    setSaving(true);
    setError("");
    const res = await setGcTitleStatus({
      titleId,
      status: nextStatus,
      reason,
    });
    if (res.error) {
      setError(res.error);
      setSaving(false);
      return;
    }
    setOpen(false);
    setSaving(false);
    setReason("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2" data-gc-title-status="">
      <span className="t-label text-ink-3">{TITLE_STATUS_OVERRIDE.label}</span>
      {locked ? (
        <p className="t-body-sm text-ink-3" data-gc-title-status-locked="">
          {TITLE_STATUS_OVERRIDE.locked}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <select
              aria-label={TITLE_STATUS_OVERRIDE.label}
              data-gc-title-status-select=""
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value as TitleStatus)}
              className={formControlClass("box", "sm:max-w-[16rem]")}
            >
              {TITLE_STATUS_OVERRIDE_VALUES.map((value) => (
                <option key={value} value={value}>
                  {titleStatusOverrideOptionLabel(value)}
                </option>
              ))}
            </select>
            <Textarea
              aria-label={TITLE_STATUS_OVERRIDE.reasonLabel}
              data-gc-title-status-reason=""
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={TITLE_STATUS_OVERRIDE.reasonPlaceholder}
              rows={2}
            />
            <Button
              type="button"
              data-gc-title-status-open=""
              className="shrink-0"
              onClick={() => {
                setError("");
                if (!reason.trim()) {
                  setError(TITLE_STATUS_OVERRIDE.reasonRequired);
                  return;
                }
                setOpen(true);
              }}
            >
              {TITLE_STATUS_OVERRIDE.confirm}
            </Button>
          </div>
          {error && !open ? <InlineNotice tone="error">{error}</InlineNotice> : null}
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            title={TITLE_STATUS_OVERRIDE.confirmTitle}
            size="sm"
          >
            <p className="t-body-sm text-ink-2">
              {titleStatusOverrideConfirmBody(titleName, nextStatus)}
            </p>
            {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                {TITLE_STATUS_OVERRIDE.cancelLabel}
              </Button>
              <Button
                type="button"
                data-gc-title-status-confirm=""
                disabled={saving}
                onClick={() => void confirm()}
              >
                {TITLE_STATUS_OVERRIDE.confirm}
              </Button>
            </DialogFooter>
          </Dialog>
        </>
      )}
    </div>
  );
}
