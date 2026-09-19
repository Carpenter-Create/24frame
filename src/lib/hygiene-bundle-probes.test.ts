import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { scanClientBundle } from "../../scripts/security/client-bundle-grep.mjs";
import { bundleReport, formatBytes } from "../../scripts/hygiene/bundle-report.mjs";

describe("hygiene bundle probes (script + docs, not default CI)", () => {
  it("exposes post-build scripts and keeps them off the default CI jobs", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts["hygiene:bundle-grep"]).toBe(
      "node scripts/security/client-bundle-grep.mjs",
    );
    expect(pkg.scripts["hygiene:bundle-report"]).toBe(
      "node scripts/hygiene/bundle-report.mjs",
    );

    const ci = readFileSync(".github/workflows/ci.yml", "utf8");
    expect(ci).not.toContain("client-bundle-grep");
    expect(ci).not.toContain("bundle-report");
    expect(ci).not.toContain("hygiene:bundle-grep");
    expect(ci).not.toContain("pnpm build");

    const grepSrc = readFileSync("scripts/security/client-bundle-grep.mjs", "utf8");
    expect(grepSrc).toContain("process.exit(2)");
    expect(grepSrc).toContain("Not a pass");
    expect(grepSrc).not.toContain("NEWS_S3_BUCKET=");
  });

  it("flags secret-shaped strings and stays clean on public-looking JS", () => {
    const dirty = mkdtempSync(join(tmpdir(), "bundle-grep-dirty-"));
    const clean = mkdtempSync(join(tmpdir(), "bundle-grep-clean-"));
    const dirtyToken = "sk_" + "live_" + "notarealkey";
    writeFileSync(join(dirty, "chunk.js"), `const x = '${dirtyToken}';\n`);
    writeFileSync(join(clean, "chunk.js"), "const x = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';\n");

    expect(scanClientBundle(dirty)).toEqual([
      { file: expect.stringContaining("chunk.js"), pattern: "/sk_(live|test)_/" },
    ]);
    expect(scanClientBundle(clean)).toEqual([]);

    rmSync(dirty, { recursive: true, force: true });
    rmSync(clean, { recursive: true, force: true });
  });

  it("reports JS sizes from a fixture tree", () => {
    const dir = mkdtempSync(join(tmpdir(), "bundle-report-"));
    writeFileSync(join(dir, "big.js"), "a".repeat(2048));
    writeFileSync(join(dir, "skip.css"), "body{}");
    const report = bundleReport(dir);
    expect(report.files).toHaveLength(1);
    expect(report.total).toBe(2048);
    expect(formatBytes(2048)).toBe("2.0 KB");
    rmSync(dir, { recursive: true, force: true });
  });
});
