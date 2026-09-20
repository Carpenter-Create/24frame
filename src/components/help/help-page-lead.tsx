import { PAGE_LEAD_STACK_CLASS, PageHeaderBackLink } from "@/components/ui/page-header";
import { HELP_HELPER_CLASS, HELP_TITLE_CLASS, helpHeaderBack } from "@/lib/help";

// Get Help / pane title block. Same PAGE_LEAD_STACK_CLASS back ·
// title · helper air as Settings (News ArrowLeft + page-lead SoT).
// Routing stays /help — do not import SettingsPageLead or put this
// in Settings hub chrome. Back stays visible on desktop: Help has
// no Settings rail.

export function HelpPageLead({
  title,
  helper,
  pathname,
}: {
  title: string;
  helper?: string;
  pathname: string;
}) {
  const back = helpHeaderBack(pathname);

  return (
    <div data-help-page-lead="" className={PAGE_LEAD_STACK_CLASS}>
      <PageHeaderBackLink href={back.href} label={back.label} />
      <h1 className={HELP_TITLE_CLASS}>{title}</h1>
      {helper ? (
        <p data-help-page-helper="" className={HELP_HELPER_CLASS}>
          {helper}
        </p>
      ) : null}
    </div>
  );
}
