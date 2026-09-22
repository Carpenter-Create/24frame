import { HouseEmpty } from "@/components/chrome/house";
import { SettingsPageLead } from "@/components/settings/settings-page-lead";
import { SETTINGS, SETTINGS_PANE_CLASS, SETTINGS_SECTION_CLASS } from "@/lib/settings";

// 600:881 — /settings/agreements only. House empty. Do not invent a
// listing, download, Phone, Job, or Company. The dest rail lives in the
// Access slot (AppShell).
export default function SettingsAgreementsPage() {
  return (
    <div data-settings-page="" className={SETTINGS_PANE_CLASS}>
      <section
        data-settings-section="agreements"
        className={SETTINGS_SECTION_CLASS}
      >
        <SettingsPageLead
          title={SETTINGS.agreements}
          pathname={SETTINGS.agreementsHref}
          heading="h2"
        />
        <HouseEmpty>{SETTINGS.agreementsEmpty}</HouseEmpty>
      </section>
    </div>
  );
}
