#!/usr/bin/env node
/**
 * Post-build JS weight report (hygiene audit blind spot 7).
 *
 * Run after `pnpm build`. Lists `.next/static` JS files by size.
 * Not a second analyzer package. Not on the default CI job
 * (checks does not run `pnpm build`).
 *
 * Exit 2 if there is no build artifact.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const STATIC_DIR = join(ROOT, ".next/static");
const TOP = Number(process.env.BUNDLE_REPORT_TOP ?? 20);

export function listJsFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) listJsFiles(full, acc);
    else if (name.endsWith(".js")) acc.push({ file: full, bytes: stat.size });
  }
  return acc;
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function bundleReport(dir = STATIC_DIR) {
  const files = listJsFiles(dir).sort((a, b) => b.bytes - a.bytes);
  const total = files.reduce((sum, row) => sum + row.bytes, 0);
  return { files, total };
}

function main() {
  if (!existsSync(STATIC_DIR)) {
    console.error("bundle-report: no .next/static — run `pnpm build` first.");
    process.exit(2);
  }
  const { files, total } = bundleReport();
  console.log(`bundle-report: ${files.length} JS files, ${formatBytes(total)} total`);
  for (const row of files.slice(0, TOP)) {
    console.log(`  ${formatBytes(row.bytes).padStart(10)}  ${relative(ROOT, row.file)}`);
  }
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  main();
}
