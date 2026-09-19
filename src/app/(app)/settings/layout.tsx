import { SettingsHeaderBack } from "@/components/chrome/settings-header-back";

// Settings shell. Mobile pane back to /settings inherits here so
// every current and future subpage gets one SoT control. Desktop
// rail stays in AppShell. Hub list has no pane back — header Home
// covers leaving the list.
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SettingsHeaderBack when="pane" />
      {children}
    </>
  );
}
