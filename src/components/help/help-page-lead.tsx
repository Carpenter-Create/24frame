import { PAGE_LEAD_STACK_CLASS, PageHeaderBackLink } from "@/components/ui/page-header";
import { HELP_HELPER_CLASS, HELP_TITLE_CLASS, helpHeaderBack } from "@/lib/help";

// Get Help / pane title block. Same back · title · helper stack as
// Settings (News ArrowLeft + page-lead air). Routing stays /help —
// do not import SettingsPageLead or put this in Settings hub chrome.

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
