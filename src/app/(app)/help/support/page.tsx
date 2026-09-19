import { HouseEmpty } from "@/components/chrome/house";
import { HelpPageLead } from "@/components/help/help-page-lead";
import { HELP, HELP_PAGE_CLASS, HELP_SECTION_CLASS } from "@/lib/help";

// Contact support stub. No mailto SoT — blank pane, not an inbox.
export default function HelpSupportPage() {
  return (
    <div data-help-page="" className={HELP_PAGE_CLASS}>
      <section data-help-section="support" className={HELP_SECTION_CLASS}>
        <HelpPageLead title={HELP.support} pathname={HELP.supportHref} />
        <HouseEmpty>{HELP.supportEmpty}</HouseEmpty>
      </section>
    </div>
  );
}
