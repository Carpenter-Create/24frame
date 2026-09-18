"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { TitlesLandscapeArt } from "@/components/titles/titles-catalog";
import { StatusProgressTrack } from "@/components/ui/status-progress-track";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { deliverStepperHref } from "@/lib/deliver-stepper";
import {
  LICENSING_VENDOR_INDENT_CLASS,
  licensingActivityDate,
  licensingDeliverLabel,
  licensingDeliverVisible,
  licensingTitleMeta,
  type LicensingTitleGroup,
} from "@/lib/gc-deliveries";
import {
  TITLES_LIST_CLASS,
  TITLES_LIST_ROW_CLASS,
  TITLES_ROW_COPY_CLASS,
  TITLES_ROW_META_CLASS,
  TITLES_ROW_NAME_CLASS,
  TITLES_THUMB_CLASS,
} from "@/lib/titles-catalog";

// Titles catalog parent + indented vendor sub-rows. Phone stacks art /
// title / track / date — never a horizontal meta cram. Deliver · N only
// when ≥1 title is selected.

function SelectMark({
  titleId,
  selected,
  onToggle,
}: {
  titleId: string;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={`Select ${titleId}`}
      data-gc-licensing-select={titleId}
      onClick={() => onToggle(titleId)}
      className={cn(
        "flex size-[18px] shrink-0 items-center justify-center rounded-[4px]",
        selected ? "bg-accent text-accent-contrast" : "border-[1.5px] border-hairline bg-surface",
      )}
    >
      {selected ? (
        <span aria-hidden className="t-label font-bold">
          ✓
        </span>
      ) : null}
    </button>
  );
}

function VendorSubRow({
  deliveryId,
  vendorName,
  status,
  submittedAt,
}: {
  deliveryId: string;
  vendorName: string;
  status: string;
  submittedAt: string | null;
}) {
  const submitted = licensingActivityDate(submittedAt);
  return (
    <div
      data-gc-licensing-vendor={deliveryId}
      data-gc-licensing-indent=""
      className={cn(
        LICENSING_VENDOR_INDENT_CLASS,
        "flex flex-col gap-[var(--space-2)] py-[var(--space-3)] pr-[var(--space-4)] md:flex-row md:items-center md:justify-between",
      )}
    >
      <span className="t-body-sm font-medium text-ink">{vendorName}</span>
      <span className="flex flex-col gap-[var(--space-2)] md:flex-row md:items-center md:gap-[var(--space-4)]">
        <StatusProgressTrack
          pipeline="delivery"
          status={status}
          data-gc-licensing-track=""
        />
        {submitted ? (
          <span className="t-body-sm text-ink-3" data-gc-licensing-submitted="">
            {submitted}
          </span>
        ) : null}
      </span>
    </div>
  );
}

function TitleGroup({
  group,
  selected,
  onToggle,
}: {
  group: LicensingTitleGroup;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div data-gc-licensing-title={group.id} className="flex flex-col">
      <div
        className={cn(
          TITLES_LIST_ROW_CLASS,
          "md:border-b-0",
        )}
        data-gc-licensing-parent=""
      >
        <TitlesLandscapeArt
          title={group.title}
          stillUrl={group.stillUrl}
          className={TITLES_THUMB_CLASS}
        />
        <span className={TITLES_ROW_META_CLASS}>
          <span className={TITLES_ROW_COPY_CLASS}>
            <span className={TITLES_ROW_NAME_CLASS} data-gc-licensing-name="">
              {group.title}
            </span>
            {licensingTitleMeta(group) ? (
              <span className="t-body-sm text-ink-3" data-gc-licensing-meta="">
                {licensingTitleMeta(group)}
              </span>
            ) : null}
          </span>
          <SelectMark titleId={group.id} selected={selected} onToggle={onToggle} />
        </span>
      </div>
      {group.vendors.map((row) => (
        <VendorSubRow
          key={row.deliveryId}
          deliveryId={row.deliveryId}
          vendorName={row.vendorName}
          status={row.status}
          submittedAt={row.submittedAt}
        />
      ))}
    </div>
  );
}

export function LicensingStatusList({
  groups,
}: {
  groups: readonly LicensingTitleGroup[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((row) => row !== id) : [...current, id],
    );
  }

  const showDeliver = licensingDeliverVisible(selected.length);

  return (
    <div data-gc-licensing-list="">
      <div className={TITLES_LIST_CLASS}>
        {groups.map((group) => (
          <TitleGroup
            key={group.id}
            group={group}
            selected={selected.includes(group.id)}
            onToggle={toggle}
          />
        ))}
      </div>
      {showDeliver ? (
        <div
          data-gc-licensing-deliver-bar=""
          className="sticky bottom-0 z-10 mt-[var(--space-4)] flex justify-end bg-bg py-[var(--space-3)] max-md:w-full"
        >
          <Button
            type="button"
            data-gc-licensing-deliver=""
            className="max-md:w-full"
            onClick={() => router.push(deliverStepperHref(selected))}
          >
            {licensingDeliverLabel(selected.length)}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
