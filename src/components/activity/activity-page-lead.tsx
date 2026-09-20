import { PAGE_LEAD_STACK_CLASS, PageHeaderBackLink } from "@/components/ui/page-header";
import {
  ACTIVITY_HELPER_CLASS,
  ACTIVITY_TITLE_CLASS,
  activityHeaderBack,
} from "@/lib/activity";

// Activity title block. Same PAGE_LEAD_STACK_CLASS back · title ·
// helper air as Settings and Get Help (News ArrowLeft + page-lead
// SoT). Routing stays /activity — do not import SettingsPageLead or
// HelpPageLead. Back stays visible on desktop: Activity has no
// Settings rail.

export function ActivityPageLead({
  title,
  helper,
  pathname,
}: {
  title: string;
  helper?: string;
  pathname: string;
}) {
  const back = activityHeaderBack(pathname);

  return (
    <div data-activity-page-lead="" className={PAGE_LEAD_STACK_CLASS}>
      <PageHeaderBackLink href={back.href} label={back.label} />
      <h1 className={ACTIVITY_TITLE_CLASS}>{title}</h1>
      {helper ? (
        <p data-activity-page-lead-helper="" className={ACTIVITY_HELPER_CLASS}>
          {helper}
        </p>
      ) : null}
    </div>
  );
}
