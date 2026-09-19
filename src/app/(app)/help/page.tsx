import { HelpPageLead } from "@/components/help/help-page-lead";
import { HelpStack } from "@/components/help/help-stack";
import { HELP, HELP_PAGE_CLASS, HELP_SECTION_CLASS } from "@/lib/help";

// Get Help index. Rows + chevrons. Not a Settings hub pane.
export default function HelpPage() {
  return (
    <div data-help-page="" className={HELP_PAGE_CLASS}>
      <section data-help-section="index" className={HELP_SECTION_CLASS}>
        <HelpPageLead title={HELP.title} helper={HELP.helper} pathname={HELP.href} />
        <HelpStack />
      </section>
    </div>
  );
}
