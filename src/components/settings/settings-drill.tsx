import type { ReactNode } from "react";
import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/ssr";

import { cn } from "@/lib/cn";
import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import { SettingsPageLead } from "@/components/settings/settings-page-lead";
import {
  SETTINGS_DRILL_ACCENT_CLASS,
  SETTINGS_DRILL_CHEVRON_CLASS,
  SETTINGS_DRILL_COPY_CLASS,
  SETTINGS_DRILL_LEADING_BODY_CLASS,
  SETTINGS_DRILL_ROW_CLASS,
  SETTINGS_DRILL_VALUE_CLASS,
  SETTINGS_DRILL_VALUE_TRAIL_CHEVRON_CLASS,
  SETTINGS_DRILL_VALUE_TRAIL_CLASS,
  SETTINGS_DRILL_VALUE_TRAIL_COPY_CLASS,
  SETTINGS_DRILL_VALUE_TRAIL_LABEL_CLASS,
  SETTINGS_DRILL_VALUE_TRAIL_TEXT_CLASS,
  SETTINGS_GROUP_CLASS,
  SETTINGS_GROUP_LABEL_CLASS,
  SETTINGS_GROUP_LIST_CLASS,
  SETTINGS_GROUP_STACK_CLASS,
  SETTINGS_PANE_CLASS,
  SETTINGS_SECTION_CLASS,
  type SettingsHubSection,
} from "@/lib/settings";

// House Settings drill-in — Coinbase / Apple index row + edit pane.
// Light 24Frame register. One SoT for Profile, Preferences, Rights
// Holder (company · legal entities · team), Settings index, and Get
// Help. Do not fork a lookalike. Index: label · muted value · chevron.
// Person rows may pass leading (house IdentityAvatar). Invite / Add
// stay accent doors — no fake face. Phone stacks identity · action.
// Action rows (Add / Invite) use accent and live inside the group.
// Edit pane: page-lead back, title, helper, single control.
// layout="value-trail" is the PrefDrillGroup horizontal drill
// (label left, value + chevron trailing). It does not apply when
// leading, badge, or helper is set — those stay on the stacked copy.

export type SettingsDrillLayout = "value-trail";

export type SettingsDrillCta =
  | "company-edit"
  | "entity-add"
  | "entity-edit"
  | "team-invite";

const DRILL_CTA_ATTR: Record<SettingsDrillCta, string> = {
  "company-edit": "data-company-edit",
  "entity-add": "data-entity-add-cta",
  "entity-edit": "data-entity-edit",
  "team-invite": "data-team-invite-cta",
};

function drillCtaProps(cta?: SettingsDrillCta): Record<string, string> {
  if (!cta) return {};
  return { [DRILL_CTA_ATTR[cta]]: "" };
}

export function SettingsDrillRow({
  label,
  value,
  href,
  kind,
  readOnly = false,
  helper,
  badge,
  itemAttr,
  leading,
  trailing,
  onClick,
  tone = "default",
  cta,
  layout,
}: {
  label: string;
  value?: string;
  href?: string;
  kind: string;
  readOnly?: boolean;
  helper?: string;
  badge?: ReactNode;
  itemAttr?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  tone?: "default" | "accent";
  cta?: SettingsDrillCta;
  layout?: SettingsDrillLayout;
}) {
  const hasHref = Boolean(href) && !readOnly;
  const hasClick = Boolean(onClick) && !readOnly;
  const canOpen = hasHref || hasClick;
  const rowClass = cn(
    SETTINGS_DRILL_ROW_CLASS,
    tone === "accent" && SETTINGS_DRILL_ACCENT_CLASS,
  );
  const marks = {
    ...drillCtaProps(cta),
    ...(itemAttr ? { [itemAttr]: kind } : {}),
  };
  const chevron = canOpen ? (
    <CaretRight
      className={SETTINGS_DRILL_CHEVRON_CLASS}
      weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
    />
  ) : null;
  // Horizontal value trail only for plain label/value drills.
  // Leading, badge, and helper rows keep the stacked copy.
  const valueTrail =
    layout === "value-trail" && !leading && !helper && !badge ? (
      <span data-settings-drill-value-trail="" className={SETTINGS_DRILL_VALUE_TRAIL_CLASS}>
        <span data-settings-drill-value-copy="" className={SETTINGS_DRILL_VALUE_TRAIL_COPY_CLASS}>
          <span className={SETTINGS_DRILL_VALUE_TRAIL_LABEL_CLASS}>{label}</span>
          {value ? (
            <span className={SETTINGS_DRILL_VALUE_TRAIL_TEXT_CLASS}>{value}</span>
          ) : null}
        </span>
        {trailing || chevron ? (
          <span data-settings-drill-chevron="" className={SETTINGS_DRILL_VALUE_TRAIL_CHEVRON_CLASS}>
            {trailing}
            {chevron}
          </span>
        ) : null}
      </span>
    ) : null;
  const copy = (
    <span className={SETTINGS_DRILL_COPY_CLASS}>
      {badge ? (
        <span className="flex min-w-0 flex-wrap items-center gap-[var(--space-2)]">
          <span>{label}</span>
          {badge}
        </span>
      ) : (
        <span>{label}</span>
      )}
      {value ? <span className={SETTINGS_DRILL_VALUE_CLASS}>{value}</span> : null}
      {helper ? <span className={SETTINGS_DRILL_VALUE_CLASS}>{helper}</span> : null}
    </span>
  );
  const actions =
    trailing || canOpen ? (
      <span className="flex shrink-0 items-center gap-[var(--space-3)]">
        {trailing}
        {chevron}
      </span>
    ) : null;
  const identity = valueTrail ?? (
    <>
      {copy}
      {actions}
    </>
  );
  const body = leading ? (
    <>
      <span data-settings-drill-leading="" className="shrink-0">
        {leading}
      </span>
      <span className={SETTINGS_DRILL_LEADING_BODY_CLASS}>{identity}</span>
    </>
  ) : (
    identity
  );

  if (hasHref && hasClick && href) {
    return (
      <>
        <Link
          href={href}
          data-settings-drill-row={kind}
          className={cn(rowClass, "md:hidden")}
          {...marks}
        >
          {body}
        </Link>
        <button
          type="button"
          data-settings-drill-row={kind}
          className={cn(rowClass, "hidden md:flex")}
          onClick={onClick}
          {...marks}
        >
          {body}
        </button>
      </>
    );
  }

  if (hasHref && href) {
    return (
      <Link
        href={href}
        data-settings-drill-row={kind}
        className={rowClass}
        {...marks}
      >
        {body}
      </Link>
    );
  }

  if (hasClick) {
    return (
      <button
        type="button"
        data-settings-drill-row={kind}
        className={rowClass}
        onClick={onClick}
        {...marks}
      >
        {body}
      </button>
    );
  }

  return (
    <div
      data-settings-drill-row={kind}
      data-settings-drill-readonly=""
      className={rowClass}
      {...marks}
    >
      {body}
    </div>
  );
}

export function SettingsGroupList({
  label,
  list,
  children,
}: {
  label?: string;
  list?: string;
  children?: ReactNode;
}) {
  return (
    <div className={SETTINGS_GROUP_STACK_CLASS}>
      {label ? (
        <h2 className={`${SETTINGS_GROUP_LABEL_CLASS} px-[var(--space-4)]`}>{label}</h2>
      ) : null}
      <div
        data-settings-group=""
        data-entity-list={list === "entity" ? "" : undefined}
        data-team-list={list === "team" ? "" : undefined}
        className={SETTINGS_GROUP_CLASS}
      >
        <ul className={SETTINGS_GROUP_LIST_CLASS}>{children}</ul>
      </div>
    </div>
  );
}

export function SettingsGroupRow({ children }: { children?: ReactNode }) {
  return <li>{children}</li>;
}

export function SettingsEditPane({
  title,
  helper,
  pathname,
  hub,
  children,
}: {
  title: string;
  helper?: string;
  pathname: string;
  hub?: SettingsHubSection;
  children?: ReactNode;
}) {
  return (
    <div
      data-settings-page=""
      data-settings-edit-pane=""
      data-settings-hub={hub}
      className={SETTINGS_PANE_CLASS}
    >
      <section data-settings-section="edit" className={SETTINGS_SECTION_CLASS}>
        <SettingsPageLead title={title} pathname={pathname} helper={helper} />
        {children}
      </section>
    </div>
  );
}
