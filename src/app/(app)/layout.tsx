import { Suspense } from "react";

import { AppShell } from "@/components/chrome/app-shell";
import { appShellUnread, enforceAppAccess, loadAppShellChrome } from "@/lib/app-shell-chrome";

// Sync layout. Next 16: awaiting cookies() / uncached fetches in this file
// blocks child loading.tsx — the leftover ≥1s on Social tab clicks after #284.
// Chrome data starts here as a promise. Access gates run in a sibling Suspense.
// The page slot is not behind S3 Head or getActiveOrgTier.

async function AppAccessGate() {
  await enforceAppAccess();
  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const chrome = loadAppShellChrome();
  return (
    <>
      <Suspense fallback={null}>
        <AppAccessGate />
      </Suspense>
      <AppShell chrome={chrome} messagesUnread={appShellUnread(chrome)}>
        {children}
      </AppShell>
    </>
  );
}
