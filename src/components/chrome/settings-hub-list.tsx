"use client";

import { SettingsPageLead } from "@/components/settings/settings-page-lead";
import { SettingsDrillRow } from "@/components/settings/settings-drill";
import { cn } from "@/lib/cn";
import {
  SETTINGS,
  SETTINGS_DRILL_LIST_CLASS,
  SETTINGS_HUB_NAV,
  SETTINGS_PANE_CLASS,
  SETTINGS_SECTION_CLASS,
} from "@/lib/settings";

// Mobile Settings list → push. Same section order as the desktop
// rail. SettingsDrillRow SoT — label · chevron. Hidden at md,
// where the rail stays.
export function SettingsHubList({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      data-settings-page=""
      data-settings-hub-list=""
      className={cn(SETTINGS_PANE_CLASS, className)}
    >
      <section data-settings-section="list" className={SETTINGS_SECTION_CLASS}>
        <SettingsPageLead title={SETTINGS.title} pathname={SETTINGS.href} />
        <nav data-settings-hub-list-nav="" className={SETTINGS_DRILL_LIST_CLASS}>
          {SETTINGS_HUB_NAV.map((item) => (
            <SettingsDrillRow
              key={item.kind}
              kind={item.kind}
              label={item.label}
              href={item.href}
              itemAttr="data-settings-hub-list-item"
            />
          ))}
        </nav>
      </section>
    </div>
  );
}
