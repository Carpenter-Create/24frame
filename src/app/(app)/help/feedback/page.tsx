import { HouseEmpty } from "@/components/chrome/house";
import { HelpPageLead } from "@/components/help/help-page-lead";
import { HELP, HELP_PAGE_CLASS, HELP_SECTION_CLASS } from "@/lib/help";

// Give feedback. Blank now — form later on this same route.
// Not a Settings hub pane. Not /account/feedback.
export default function HelpFeedbackPage() {
  return (
    <div data-help-page="" data-help-feedback="" className={HELP_PAGE_CLASS}>
      <section data-help-section="feedback" className={HELP_SECTION_CLASS}>
        <HelpPageLead
          title={HELP.feedback}
          helper={HELP.feedbackHelper}
          pathname={HELP.feedbackHref}
        />
        <HouseEmpty>{HELP.feedbackEmpty}</HouseEmpty>
      </section>
    </div>
  );
}
