#!/usr/bin/env node
/**
 * Post-build client-bundle leak grep (hygiene audit D1 / P0-4).
 *
 * Run after `pnpm build`. Walks `.next/static` for secret-shaped strings
 * that must never ship in the browser bundle.
 *
 * Not on the default CI job — that job does not run `pnpm build`.
 * Exit 2 if there is no build artifact (do not treat as a pass).
 *
 * Does not invent a second news bucket env. Does not print matching bytes.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const STATIC_DIR = join(ROOT, ".next/static");

/** July D1 client-bundle patterns. NEXT_PUBLIC_* public keys are allowed. */
export const CLIENT_BUNDLE_SECRET_RES = [
  /sk_(live|test)_/,
  /whsec_/,
  /AKIA[0-9A-Z]{16}/,
  /SUPABASE_SERVICE_ROLE/,
  /BEGIN (RSA )?PRIVATE KEY/,
  /CLOUDFRONT_PRIVATE_KEY/,
  /RESEND_API_KEY/,
  /TURNSTILE_SECRET/,
  /service_role/,
  /TROLLEY_/,
  /AWS_SECRET_ACCESS_KEY/,
];

export function listStaticFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) listStaticFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

export function scanClientBundle(dir = STATIC_DIR) {
  const files = listStaticFiles(dir);
  const hits = [];
  for (const file of files) {
    const body = readFileSync(file, "utf8");
    for (const pattern of CLIENT_BUNDLE_SECRET_RES) {
      if (pattern.test(body)) {
        hits.push({ file: relative(ROOT, file), pattern: String(pattern) });
      }
    }
  }
  return hits;
}

function main() {
  if (!existsSync(STATIC_DIR)) {
    console.error("client-bundle-grep: no .next/static — run `pnpm build` first. Not a pass.");
    process.exit(2);
  }
  const hits = scanClientBundle();
  if (hits.length > 0) {
    console.error(`client-bundle-grep: ${hits.length} hit(s)`);
    for (const hit of hits) {
      console.error(`  ${hit.file}  ${hit.pattern}`);
    }
    process.exit(1);
  }
  console.log("client-bundle-grep: clean");
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  main();
}
