"use client";

import { useRef } from "react";

import { SocialIcon } from "@/components/social/social-icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import {
  SOCIAL_PROFILE_CHIP_BAND_CLASS,
  SOCIAL_PROFILE_CHIP_COUNT_CLASS,
  SOCIAL_PROFILE_CHIP_FACE_CLASS,
  SOCIAL_PROFILE_CHIP_GROUP_CLASS,
  SOCIAL_PROFILE_CHIP_GROUP_LABEL_CLASS,
  SOCIAL_PROFILE_CHIP_GROUPS_CLASS,
  SOCIAL_PROFILE_CHIP_HELP_CLASS,
  SOCIAL_TOPIC_CHIP_BANK_CLASS,
  socialTopicChipSelectClass,
} from "@/lib/social-chrome";

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
    <div data-social-profile-chip-groups="" className={SOCIAL_PROFILE_CHIP_GROUPS_CLASS}>
      {groups.map((group) => (
        <div
          key={group.id}
          data-social-profile-chip-group={group.id}
          {...{ [`data-${dataPrefix}-group`]: group.id }}
          className={SOCIAL_PROFILE_CHIP_GROUP_CLASS}
        >
          {group.label ? (
            <p className={SOCIAL_PROFILE_CHIP_GROUP_LABEL_CLASS}>{group.label}</p>
          ) : null}
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

export function SocialProfileChipSelectFace({
  selected,
  countLabel,
  helper,
  searchId,
  searchValue,
  searchPlaceholder,
  groups,
  blocked,
  dataPrefix,
  hostAttr,
  selectedAttr,
  countAttr,
  noticeAttr,
  reorderable = false,
  dragType,
  onSearch,
  onToggle,
  onReorder,
}: {
  selected: readonly SocialProfileChipOption[];
  countLabel: string;
  helper: string;
  searchId: string;
  searchValue: string;
  searchPlaceholder: string;
  groups: readonly SocialProfileChipGroup[];
  blocked?: boolean;
  dataPrefix: string;
  hostAttr: string;
  selectedAttr: string;
  countAttr: string;
  noticeAttr: string;
  reorderable?: boolean;
  dragType?: string;
  onSearch: (query: string) => void;
  onToggle: (id: string) => void;
  onReorder?: (fromId: string, toId: string) => void;
}) {
  return (
    <div data-social-profile-chip-face="" {...{ [hostAttr]: "" }} className={SOCIAL_PROFILE_CHIP_FACE_CLASS}>
      <div data-social-profile-chip-band="" className={SOCIAL_PROFILE_CHIP_BAND_CLASS}>
        {selected.length > 0 ? (
          <div {...{ [selectedAttr]: "" }} className={SOCIAL_TOPIC_CHIP_BANK_CLASS}>
            {selected.map((option) => (
              <SocialProfileSelectChip
                key={option.id}
                option={option}
                selected
                chip
                reorderable={reorderable}
                dragType={dragType}
                dataPrefix={dataPrefix}
                onToggle={onToggle}
                onReorder={onReorder}
              />
            ))}
          </div>
        ) : null}
        <p {...{ [countAttr]: "" }} className={SOCIAL_PROFILE_CHIP_COUNT_CLASS}>
          {countLabel}
        </p>
      </div>
      <p {...{ [noticeAttr]: "" }} className={SOCIAL_PROFILE_CHIP_HELP_CLASS}>
        {helper}
      </p>
      <Input
        id={searchId}
        value={searchValue}
        onChange={(event) => onSearch(event.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        autoComplete="off"
      />
      <SocialProfileChipBank
        groups={groups}
        selectedIds={selected.map((option) => option.id)}
        blocked={blocked}
        dataPrefix={dataPrefix}
        onToggle={onToggle}
      />
    </div>
  );
}
