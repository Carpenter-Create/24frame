import { HouseEmpty } from "@/components/chrome/house";
import { SettingsPageLead } from "@/components/settings/settings-page-lead";
import { REFER } from "@/lib/refer";
import { SETTINGS } from "@/lib/settings";

// 600:881 — /settings/refer only. House empty. Do not invent a
// referral product. The 220 rail lives in the Access slot (AppShell).
export default function SettingsReferPage() {
  return (
    <div data-settings-page="" className="flex flex-col gap-[var(--space-12)]">
      <section data-settings-section="refer" className="flex flex-col gap-[var(--space-6)]">
        <SettingsPageLead title={SETTINGS.refer} pathname={SETTINGS.referHref} heading="h2" />
        <HouseEmpty>{REFER.empty}</HouseEmpty>
      </section>
    </div>
  );
}
