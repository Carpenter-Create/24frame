import { HouseEmpty } from "@/components/chrome/house";
import { SettingsPageLead } from "@/components/settings/settings-page-lead";
import { REFER } from "@/lib/refer";
import { SETTINGS, SETTINGS_PANE_CLASS, SETTINGS_SECTION_CLASS } from "@/lib/settings";

// 600:881 — /settings/refer only. House empty. Do not invent a
// referral product. The dest rail lives in the Access slot (AppShell).
export default function SettingsReferPage() {
  return (
    <div data-settings-page="" className={SETTINGS_PANE_CLASS}>
      <section data-settings-section="refer" className={SETTINGS_SECTION_CLASS}>
        <SettingsPageLead title={SETTINGS.refer} pathname={SETTINGS.referHref} heading="h2" />
        <HouseEmpty>{REFER.empty}</HouseEmpty>
      </section>
    </div>
  );
}
