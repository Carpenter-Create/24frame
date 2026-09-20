import { PAGE_LEAD_STACK_CLASS, PageHeaderBackLink } from "@/components/ui/page-header";
import { SettingsHubBackLink } from "@/components/settings/settings-hub-back-link";
import {
  SETTINGS,
  SETTINGS_EDIT_HELPER_CLASS,
  SETTINGS_PAGE_LEAD_BACK_CLASS,
  SETTINGS_PANE_TITLE_CLASS,
  settingsHeaderBack,
} from "@/lib/settings";

// Settings title block — one SoT for hub + every pane. Keeps the
// custom t-section h1 and mounts News PageHeader ArrowLeft above it.
// Hub uses SettingsHubBackLink (Back + history). Activity and Get
// Help consume that same leaf. Panes stay Link to the parent
// (Settings, or the section for a drill-in). Drill-in panes pass
// helper. Do not hand-roll a twin back link per page.
export function SettingsPageLead({
  title,
  pathname,
  heading: Heading = "h1",
  helper,
}: {
  title: string;
  pathname: string;
  heading?: "h1" | "h2";
  helper?: string;
}) {
  const back = settingsHeaderBack(pathname);
  const isHub = pathname === SETTINGS.href;

  return (
    <div data-settings-page-lead="" className={PAGE_LEAD_STACK_CLASS}>
      {isHub ? (
        <SettingsHubBackLink className={SETTINGS_PAGE_LEAD_BACK_CLASS} />
      ) : (
        <PageHeaderBackLink
          href={back.href}
          label={back.label}
          className={SETTINGS_PAGE_LEAD_BACK_CLASS}
        />
      )}
      <Heading className={SETTINGS_PANE_TITLE_CLASS}>{title}</Heading>
      {helper ? (
        <p data-settings-page-lead-helper="" className={SETTINGS_EDIT_HELPER_CLASS}>
          {helper}
        </p>
      ) : null}
    </div>
  );
}
