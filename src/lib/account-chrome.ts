import { isActivityPath } from "@/lib/activity";
import { isHelpPath } from "@/lib/help";

// Adam lock 2026-09-20: Get Help and Activity are the same
// account-chrome shell — header + content column only. No
// Aggregation rail, no Settings-style account rail, no twin
// rail. Settings keeps the shared dest-rail slot. Do not invent a third.

export function isAccountChromeNoRailPath(pathname: string): boolean {
  return isHelpPath(pathname) || isActivityPath(pathname);
}
