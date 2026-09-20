"use client";

import { useRef } from "react";

import { SocialIcon } from "@/components/social/social-icon";
import { cn } from "@/lib/cn";
import { SOCIAL_TOPIC_CHIP_BANK_CLASS, socialTopicChipSelectClass } from "@/lib/social-chrome";

export type SocialProfileChipOption = {
  id: string;
  label: string;
};

export type SocialProfileChipGroup = {
  id: string;
  label?: string | null;
  options: readonly SocialProfileChipOption[];
};

export function SocialProfileSelectChip({
  option,
  selected,
  blocked,
  dataPrefix,
  chip = false,
  reorderable = false,
  dragType,
  onToggle,
  onReorder,
}: {
  option: SocialProfileChipOption;
  selected: boolean;
  blocked?: boolean;
  dataPrefix: string;
  chip?: boolean;
  reorderable?: boolean;
  dragType?: string;
  onToggle: (id: string) => void;
  onReorder?: (fromId: string, toId: string) => void;
}) {
  const dragged = useRef(false);
  const idleBlocked = Boolean(blocked) && !selected;
  const canDrag = Boolean(reorderable && dragType && onReorder && selected && !idleBlocked);
  const dataAttrs = chip
    ? { [`data-${dataPrefix}-chip`]: option.id }
    : {
        [`data-${dataPrefix}`]: option.id,
        ...(selected ? { [`data-${dataPrefix}-selected`]: "" } : {}),
      };

  return (
    <button
      type="button"
      data-social-profile-chip=""
      {...dataAttrs}
      aria-pressed={selected}
      aria-label={selected ? `Remove ${option.label}` : option.label}
      disabled={idleBlocked}
      draggable={canDrag}
      className={cn(
        socialTopicChipSelectClass(selected),
        "gap-1 text-left",
        idleBlocked ? "cursor-not-allowed opacity-50" : null,
        canDrag ? "cursor-grab" : null,
      )}
      onDragStart={(event) => {
        if (!canDrag || !dragType) return;
        dragged.current = true;
        event.dataTransfer.setData(dragType, option.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(event) => {
        if (!canDrag) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        if (!canDrag || !dragType || !onReorder) return;
        event.preventDefault();
        const fromId = event.dataTransfer.getData(dragType);
        if (fromId) onReorder(fromId, option.id);
      }}
      onClick={() => {
        if (idleBlocked) return;
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        onToggle(option.id);
      }}
    >
      <span className="min-w-0">{option.label}</span>
      {selected ? <SocialIcon name="x" size={10} className="shrink-0" /> : null}
    </button>
  );
}

export function SocialProfileChipBank({
  groups,
  selectedIds,
  blocked,
  dataPrefix,
  onToggle,
}: {
  groups: readonly SocialProfileChipGroup[];
  selectedIds: readonly string[];
  blocked?: boolean;
  dataPrefix: string;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <div
          key={group.id}
          data-social-profile-chip-group={group.id}
          {...{ [`data-${dataPrefix}-group`]: group.id }}
          className="flex flex-col gap-2"
        >
          {group.label ? <p className="t-label text-ink-2">{group.label}</p> : null}
          <div className={SOCIAL_TOPIC_CHIP_BANK_CLASS}>
            {group.options.map((option) => (
              <SocialProfileSelectChip
                key={option.id}
                option={option}
                selected={selectedIds.includes(option.id)}
                blocked={blocked}
                dataPrefix={dataPrefix}
                onToggle={onToggle}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
