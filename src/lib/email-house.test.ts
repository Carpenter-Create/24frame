import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  EMAIL_ACCENT,
  EMAIL_ADDRESS,
  EMAIL_BG,
  EMAIL_BORDER,
  EMAIL_CARD_RADIUS,
  EMAIL_CARD_WIDTH,
  EMAIL_COPYRIGHT,
  EMAIL_GEIST_HREF,
  EMAIL_INK,
  EMAIL_LEGAL_URL,
  EMAIL_LOGO_URL,
  EMAIL_SITE_LABEL,
  EMAIL_SITE_URL,
  EMAIL_SLOGAN,
  housePrimaryLink,
  wrapHouseEmail,
} from "./email-house";

const SPORTY_BLUE = "#1769FF";
const LOGO_PNG = resolve(__dirname, "../../public/email-logo.png");

function productResidue(html: string): string {
  return html.replaceAll("Global Content Holdings LLC", "");
}

function assertHouseChrome(html: string) {
  expect(EMAIL_ACCENT).toBe(SPORTY_BLUE);
  expect(html).toContain(EMAIL_LOGO_URL);
  expect(html).toContain('alt="24Frame"');
  expect(html).toContain(EMAIL_SLOGAN);
  expect(html).toContain(EMAIL_SITE_URL);
  expect(html).toContain(EMAIL_SITE_LABEL);
  expect(html).toContain(`color:${SPORTY_BLUE}`);
  expect(html).toContain(`background:${EMAIL_BG}`);
  expect(html).toContain(`max-width:${EMAIL_CARD_WIDTH}px`);
  expect(html).toContain(`border-radius:${EMAIL_CARD_RADIUS}`);
  expect(html).toContain(`border:1px solid ${EMAIL_BORDER}`);
  expect(html).toContain(EMAIL_COPYRIGHT);
  expect(html).toContain(EMAIL_ADDRESS);
  expect(html).toContain(EMAIL_LEGAL_URL);
  expect(html).toContain(EMAIL_GEIST_HREF);
  expect(html).toContain("24Frame");
  expect(html).not.toMatch(/background:\s*#1769FF/i);
  expect(html).not.toMatch(/border-radius:\s*999px/);
  expect(html).not.toMatch(/height:4px;background:#1769FF/);
  expect(productResidue(html)).not.toMatch(/\bGC\b|globalcontent/i);
  expect(productResidue(html)).not.toMatch(/Global Content(?! Holdings LLC)/);
}

describe("wrapHouseEmail", () => {
  it("uses the house shell with Sporty Blue as a link accent only", () => {
    const html = wrapHouseEmail(`<p style="color:${EMAIL_INK}">Inner</p>`);
    assertHouseChrome(html);
    expect(html).toContain("Inner");
    expect(html).toContain("width:48px;height:48px");
    expect(html).toMatch(/font-size:10px[\s\S]*text-transform:uppercase/);
  });

  it("keeps primary CTAs as Sporty Blue text links, not filled pills", () => {
    const html = wrapHouseEmail(housePrimaryLink("https://app.example/titles/1", "Review and resubmit"));
    expect(html).toContain(`href="https://app.example/titles/1"`);
    expect(html).toContain("Review and resubmit");
    expect(html).toContain(`style="color:${SPORTY_BLUE};text-decoration:none"`);
    expect(html).not.toMatch(/background:\s*#1769FF/i);
    expect(html).not.toMatch(/border-radius:\s*999px/);
  });
});

describe("email-logo.png", () => {
  it("is committed under public/ for app.24frame.co/email-logo.png", () => {
    expect(existsSync(LOGO_PNG)).toBe(true);
    const bytes = statSync(LOGO_PNG).size;
    expect(bytes).toBeGreaterThan(200);
    expect(bytes).toBeLessThan(40_000);
    expect(readFileSync(LOGO_PNG).subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(
      true,
    );
  });
});
