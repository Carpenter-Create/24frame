import { existsSync, readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ACCOUNT_PHOTO_HREF } from "@/lib/account-avatar";
import { IdentityPhoto } from "@/components/chrome/house";

const SOCIAL_LOADING = [
  "src/app/(app)/social/loading.tsx",
  "src/app/(app)/social/create/loading.tsx",
  "src/app/(app)/social/profile/loading.tsx",
  "src/app/(app)/social/stories/loading.tsx",
  "src/app/(app)/social/stories/[id]/loading.tsx",
  "src/app/(app)/social/explore/loading.tsx",
  "src/app/(app)/social/dms/loading.tsx",
  "src/app/(app)/social/profile/edit/loading.tsx",
  "src/app/(app)/social/profile/edit/bio/loading.tsx",
] as const;

const EDUCATION_LOADING = [
  "src/app/(app)/education/loading.tsx",
  "src/app/(app)/education/[slug]/loading.tsx",
] as const;

const AGGREGATION_CHILD_LOADING = [
  "src/app/(app)/aggregation/titles/loading.tsx",
  "src/app/(app)/aggregation/reports/loading.tsx",
  "src/app/(app)/aggregation/attention/loading.tsx",
] as const;

describe("nav feel — parent loading cannot paint the dashboard skeleton", () => {
  it("does not ship (app)/loading.tsx, so Social/Education/Aggregation hops keep the shell", () => {
    expect(existsSync("src/app/(app)/loading.tsx")).toBe(false);
    expect(readFileSync("src/app/(app)/layout.tsx", "utf8")).not.toContain("DashboardSkeleton");
    expect(readFileSync("src/app/(app)/layout.tsx", "utf8")).toContain("{children}");
    expect(readFileSync("src/components/chrome/app-shell.tsx", "utf8")).toContain("{children}");
  });

  it("keeps Social and Education body skeletons local — never DashboardSkeleton", () => {
    for (const path of [...SOCIAL_LOADING, ...EDUCATION_LOADING]) {
      expect(existsSync(path)).toBe(true);
      const src = readFileSync(path, "utf8");
      expect(src).not.toContain("DashboardSkeleton");
      expect(src).not.toContain("page-skeletons");
    }
  });

  it("keeps Aggregation child nav on destination skeletons, not the parent dashboard shell", () => {
    for (const path of AGGREGATION_CHILD_LOADING) {
      expect(existsSync(path)).toBe(true);
      const src = readFileSync(path, "utf8");
      expect(src).not.toContain("DashboardSkeleton");
    }
    expect(existsSync("src/app/(app)/activity/loading.tsx")).toBe(true);
    expect(readFileSync("src/app/(app)/activity/loading.tsx", "utf8")).not.toContain(
      "DashboardSkeleton",
    );
    expect(existsSync("src/app/(app)/aggregation/activity/loading.tsx")).toBe(false);
    expect(existsSync("src/app/(app)/aggregation/dashboard/loading.tsx")).toBe(true);
    expect(readFileSync("src/app/(app)/aggregation/dashboard/loading.tsx", "utf8")).toContain(
      "DashboardSkeleton",
    );
    expect(readFileSync("src/app/(app)/aggregation/dashboard/loading.tsx", "utf8")).not.toContain(
      "AppShell",
    );
  });
});

describe("nav feel — avatar keeps the known face", () => {
  it("renders the photo when src is present and never paints a letter or ?", () => {
    const html = renderToStaticMarkup(
      <IdentityPhoto avatarInitial="X" photoUrl={ACCOUNT_PHOTO_HREF} />,
    );
    expect(html).toContain(`src="${ACCOUNT_PHOTO_HREF}"`);
    expect(html).toContain('fetchPriority="high"');
    expect(html).not.toContain("?");
    expect(html).not.toContain(">X<");
    expect(html).not.toContain("letter");
  });

  it("keeps chrome identity off the page slot and sticky across a pending chrome hop", () => {
    const shellSrc = readFileSync("src/components/chrome/app-shell.tsx", "utf8");
    const layoutSrc = readFileSync("src/app/(app)/layout.tsx", "utf8");
    expect(layoutSrc).toContain("loadAppShellChrome()");
    expect(layoutSrc).not.toContain("export default async function AppLayout");
    expect(shellSrc).toContain("stickyAccountChromeIdentity");
    expect(shellSrc).toContain("rememberAccountChromeIdentity");
    expect(shellSrc).toContain("applyChromeIdentity");
    expect(shellSrc).toContain("onIdentity={applyChromeIdentity}");
    expect(shellSrc).toContain("email={identity.email}");
    expect(shellSrc).toContain("photoUrl={identity.photoUrl}");
    const accountSlot = shellSrc.slice(shellSrc.indexOf("function AccountMenuSlot"));
    const accountBody = accountSlot.slice(0, accountSlot.indexOf("\nfunction UserMenuFromChrome"));
    expect(accountBody).toContain("stickyAccountChromeIdentity");
    expect(accountBody).toContain("fallback={<UserMenu email={face.email}");
    expect(accountBody).not.toContain("email={email} name={name} photoUrl={photoUrl}");
  });
});
