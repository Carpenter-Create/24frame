import { HouseEmpty } from "@/components/chrome/house";
import { SettingsPageLead } from "@/components/settings/settings-page-lead";
import { SETTINGS } from "@/lib/settings";

// 600:881 — /settings/agreements only. House empty. Do not invent a
// listing, download, Phone, Job, or Company. The 220 rail lives in the
// Access slot (AppShell).
export default function SettingsAgreementsPage() {
  return (
    <div data-settings-page="" className="flex flex-col gap-[var(--space-12)]">
      <section
        data-settings-section="agreements"
        className="flex flex-col gap-[var(--space-6)]"
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
