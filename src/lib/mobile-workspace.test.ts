import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const DONOR_REF = "qxribdfzkvffambaartp";

describe("expo workspace lock", () => {
  it("keeps the dashboard at root and isolates Expo from dashboard gates", () => {
    const workspace = readFileSync("pnpm-workspace.yaml", "utf8");
    const tsconfig = readFileSync("tsconfig.json", "utf8");
    const eslint = readFileSync("eslint.config.mjs", "utf8");
    const vitest = readFileSync("vitest.config.ts", "utf8");
    const pkg = JSON.parse(readFileSync("apps/mobile/package.json", "utf8")) as { name: string };
    const dashboard = JSON.parse(readFileSync("package.json", "utf8")) as { name: string };
    expect(dashboard.name).toBe("@24frame/dashboard");
    expect(pkg.name).toBe("@24frame/mobile");
    expect(workspace).toContain("apps/mobile");
    expect(tsconfig).toContain('"apps"');
    expect(eslint).toContain("apps/**");
    expect(vitest).toContain("apps/mobile/src/lib/**/*.test.ts");
    expect(existsSync("apps/mobile/eas.json")).toBe(false);
  });

  it("keeps mobile on survivor Auth, iOS-first, one 24Frame product", () => {
    const config = readFileSync("apps/mobile/app.config.js", "utf8");
    const auth = readFileSync("apps/mobile/src/lib/auth.ts", "utf8");
    const env = readFileSync("apps/mobile/src/lib/survivor-env.cjs", "utf8");
    const product = readFileSync("apps/mobile/src/lib/product.ts", "utf8");
    const home = readFileSync("apps/mobile/src/screens/home-screen.tsx", "utf8");
    const middleware = readFileSync("src/lib/supabase/middleware.ts", "utf8");
    expect(config).toContain('name: "24Frame"');
    expect(config).toContain('slug: "24Frame"');
    expect(config).toContain('platforms: ["ios"]');
    expect(config).toContain("appOrigin");
    expect(config).not.toContain("android");
    expect(config).not.toContain("bundleIdentifier");
    expect(config).not.toContain("eas");
    expect(auth).toContain("requestEmailCodeViaHousePipe");
    expect(auth).toContain("/api/mobile/request-sign-in");
    expect(auth).not.toMatch(/\.signInWithOtp\s*\(/);
    expect(auth).not.toContain("signInWithPassword");
    expect(middleware).toContain('path.startsWith("/api/mobile")');
    expect(env).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(env).toContain("EXPO_PUBLIC_APP_ORIGIN");
    expect(env).toContain(DONOR_REF);
    expect(env).toContain("REJECTED_DONOR_PROJECT_REF");
    expect(env).toContain("https://app.24frame.co");
    expect(product).toContain('PRODUCT_NAME = "24Frame"');
    expect(product).toContain("Social+Education");
    expect(product).toContain("Aggregation / Social+Education");
    expect(product).toContain("not a Social-only app");
    expect(home).toContain("PRODUCT_NAME");
    expect(home).toContain("PRODUCT_WORKSPACES");
    expect(home).toContain("SOCIAL_EDUCATION_WORKSPACE");
    expect(home).not.toContain("signedAvatarUrl");
    expect(home).not.toContain("from(\"courses\")");
    expect(home).not.toContain("/titles");
    expect(home).not.toContain("from(\"organizations\")");
    expect(config).not.toMatch(new RegExp(DONOR_REF));
    expect(auth).not.toMatch(new RegExp(DONOR_REF));
  });
});
