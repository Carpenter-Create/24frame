import { HouseEmpty } from "@/components/chrome/house";
import { HelpPageLead } from "@/components/help/help-page-lead";
import { HELP, HELP_PAGE_CLASS, HELP_SECTION_CLASS } from "@/lib/help";

// Help center stub. No house help URL SoT — blank pane, not a
// knowledge base. Form/articles later stay off this route unless
// a URL is accepted.
export default function HelpCenterPage() {
  return (
    <div data-help-page="" className={HELP_PAGE_CLASS}>
      <section data-help-section="center" className={HELP_SECTION_CLASS}>
        <HelpPageLead title={HELP.center} pathname={HELP.centerHref} />
        <HouseEmpty>{HELP.centerEmpty}</HouseEmpty>
      </section>
    </div>
  );
}
