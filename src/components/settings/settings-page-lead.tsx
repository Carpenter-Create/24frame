import { PageHeaderBackLink } from "@/components/ui/page-header";
import {
  SETTINGS_PAGE_LEAD_BACK_CLASS,
  SETTINGS_PANE_TITLE_CLASS,
  settingsHeaderBack,
} from "@/lib/settings";

// Settings title block — one SoT for hub + every pane. Keeps the
// custom t-section h1 and mounts News PageHeader ArrowLeft above it.
// Do not hand-roll a twin back link per page.
export function SettingsPageLead({
  title,
  pathname,
  heading: Heading = "h1",
}: {
  title: string;
  pathname: string;
  heading?: "h1" | "h2";
}) {
  const back = settingsHeaderBack(pathname);

  return (
    <div data-settings-page-lead="" className="flex flex-col gap-1">
      <PageHeaderBackLink
        href={back.href}
        label={back.label}
        className={SETTINGS_PAGE_LEAD_BACK_CLASS}
      />
      <Heading className={SETTINGS_PANE_TITLE_CLASS}>{title}</Heading>
    </div>
  );
}
