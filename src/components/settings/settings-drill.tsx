import type { ReactNode } from "react";
import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/ssr";

import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import { SettingsPageLead } from "@/components/settings/settings-page-lead";
import {
  SETTINGS_DRILL_COPY_CLASS,
  SETTINGS_DRILL_ROW_CLASS,
  SETTINGS_DRILL_VALUE_CLASS,
  SETTINGS_PANE_CLASS,
  SETTINGS_RAIL_CHEVRON_CLASS,
  SETTINGS_SECTION_CLASS,
  type SettingsHubSection,
} from "@/lib/settings";

// House Settings drill-in — Coinbase index row + edit pane.
// Light 24Frame register. Do not fork a lookalike in Rights Holder
// or Legal Entities. Index: label · muted value · chevron. Edit pane:
// page-lead back, title, helper, single control.

export function SettingsDrillRow({
  label,
  value,
  href,
  kind,
  readOnly = false,
  helper,
  badge,
}: {
  label: string;
  value?: string;
  href?: string;
  kind: string;
  readOnly?: boolean;
  helper?: string;
  badge?: ReactNode;
}) {
  const canOpen = Boolean(href) && !readOnly;
  const body = (
    <>
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
      {canOpen ? (
        <CaretRight
          className={SETTINGS_RAIL_CHEVRON_CLASS}
          weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
        />
      ) : null}
    </>
  );

  if (canOpen && href) {
    return (
      <Link
        href={href}
        data-settings-drill-row={kind}
        className={SETTINGS_DRILL_ROW_CLASS}
      >
        {body}
      </Link>
    );
  }

  return (
    <div
      data-settings-drill-row={kind}
      data-settings-drill-readonly=""
      className={SETTINGS_DRILL_ROW_CLASS}
    >
      {body}
    </div>
  );
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
