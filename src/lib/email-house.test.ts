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
  EMAIL_FORMAT_DETECTION,
  EMAIL_GEIST_HREF,
  EMAIL_INK,
  EMAIL_LEGAL_URL,
  EMAIL_LOGO_URL,
  EMAIL_SITE_LABEL,
  EMAIL_SITE_URL,
  EMAIL_SLOGAN,
  houseOtpCode,
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
  expect(html.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, "")).not.toMatch(/#1769FF/i);
}

describe("wrapHouseEmail", () => {
  it("uses the house shell with Sporty Blue as a link accent only", () => {
    const html = wrapHouseEmail(`<p style="color:${EMAIL_INK}">Inner</p>`);
    assertHouseChrome(html);
    expect(html).toContain("Inner");
    expect(html).toContain("width:48px;height:48px");
    expect(html).toMatch(/font-size:10px[\s\S]*text-transform:uppercase/);
    expect(html).toContain(`content="${EMAIL_FORMAT_DETECTION}"`);
    expect(html).toContain("x-apple-disable-message-reformatting");
    expect(html).toContain("a[x-apple-data-detectors]");
    expect(EMAIL_LOGO_URL).toBe("https://app.24frame.co/email-logo.png");
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

describe("houseOtpCode", () => {
  it("keeps the code near-black, un-underlined, and shielded from data detectors", () => {
    const html = houseOtpCode("012345");
    expect(html).toContain("012345");
    expect(html).toContain(`color:${EMAIL_INK}`);
    expect(html).toContain("text-decoration:none");
    expect(html).toContain('x-apple-data-detectors="false"');
    expect(html).toContain('class="otp"');
    expect(html).toContain("&#8203;");
    expect(html).not.toMatch(/color:\s*#1769FF/i);
    expect(html).not.toMatch(/text-decoration:\s*underline/);
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
    const png = readFileSync(LOGO_PNG);
    expect(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true);
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    expect(width).toBe(height);
    expect(width).toBe(128);
  });
});
