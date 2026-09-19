import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";

import * as emailHouse from "./email-house";
import {
  applyEmailCopyright,
  EMAIL_ACCENT,
  EMAIL_ADDRESS,
  EMAIL_BG,
  EMAIL_BODY,
  EMAIL_BODY_SIZE,
  EMAIL_BORDER,
  EMAIL_BUTTON_RADIUS,
  EMAIL_CARD_RADIUS,
  EMAIL_CARD_WIDTH,
  EMAIL_COPYRIGHT_YEAR_TOKEN,
  emailCopyright,
  emailCopyrightPlaceholder,
  EMAIL_FORMAT_DETECTION,
  EMAIL_GEIST_HREF,
  EMAIL_HEADLINE_SIZE,
  EMAIL_INK,
  EMAIL_LEGAL_URL,
  EMAIL_LOGO_DISPLAY,
  EMAIL_LOGO_URL,
  EMAIL_SITE_LABEL,
  EMAIL_SITE_URL,
  EMAIL_TERTIARY,
  houseOtpCode,
  housePrimaryButton,
  housePrimaryLink,
  wrapHouseEmail,
} from "./email-house";

const SPORTY_BLUE = "#1769FF";
const LOGO_PNG = resolve(__dirname, "../../public/email-mark-v2.png");

function productResidue(html: string): string {
  return html.replaceAll("Global Content Holdings LLC", "");
}

function assertFormatDetectionWellFormed(html: string) {
  const fd = html.indexOf('name="format-detection"');
  const geist = html.indexOf(EMAIL_GEIST_HREF);
  expect(fd).toBeGreaterThan(-1);
  expect(geist).toBeGreaterThan(fd);
  const between = html.slice(fd, geist);
  expect(between).toMatch(/content="[^"]+"\s*\/?>/);
  expect(html).toContain(`content="${EMAIL_FORMAT_DETECTION}">`);
}

function assertHouseChrome(html: string) {
  expect(EMAIL_ACCENT).toBe(SPORTY_BLUE);
  expect(html).toContain(EMAIL_LOGO_URL);
  expect(html).toContain('alt="24Frame"');
  expect(html).not.toContain("Built for the creator class.");
  expect(html).not.toContain("Radically different film distribution.");
  expect(html).toContain(`color:${EMAIL_TERTIARY}">${emailCopyright()}`);
  expect(EMAIL_BODY).toBe("#3F4650");
  expect(EMAIL_TERTIARY).toBe("#9AA0A9");
  expect(html).toContain(EMAIL_SITE_URL);
  expect(html).toContain(EMAIL_SITE_LABEL);
  expect(html).toContain(`color:${SPORTY_BLUE}`);
  expect(html).toContain(`background:${EMAIL_BG}`);
  expect(html).toContain(`max-width:${EMAIL_CARD_WIDTH}px`);
  expect(html).toContain(`border-radius:${EMAIL_CARD_RADIUS}`);
  expect(html).toContain(`border:1px solid ${EMAIL_BORDER}`);
  expect(html).toContain(emailCopyright());
  expect(html).not.toContain("© 2026 Global Content Holdings LLC. All rights reserved.");
  expect(html).toContain(EMAIL_ADDRESS);
  expect(html).toContain(EMAIL_LEGAL_URL);
  expect(html).toContain(EMAIL_GEIST_HREF);
  expect(html).toContain("24Frame");
  expect(html).not.toMatch(/border-radius:\s*999px/);
  expect(html).not.toMatch(/height:4px;background:#1769FF/);
  expect(html).not.toMatch(/<img[^>]*#1769FF/i);
  expect(productResidue(html)).not.toMatch(/\bGC\b|globalcontent/i);
  expect(productResidue(html)).not.toMatch(/Global Content(?! Holdings LLC)/);
  assertFormatDetectionWellFormed(html);
}

describe("emailCopyright", () => {
  it("names 24Frame as a division of the parent and uses the given year", () => {
    expect(emailCopyright(2026)).toBe(
      "© 2026 24Frame, a division of Global Content Holdings LLC. All rights reserved.",
    );
    expect(emailCopyright(2027)).toBe(
      "© 2027 24Frame, a division of Global Content Holdings LLC. All rights reserved.",
    );
    expect(emailCopyright()).toBe(
      `© ${new Date().getFullYear()} 24Frame, a division of Global Content Holdings LLC. All rights reserved.`,
    );
    expect(emailCopyright()).not.toMatch(/© \d{4} Global Content Holdings LLC\. All rights reserved\./);
    expect(emailCopyright()).not.toContain("24frame,");
  });

  it("keeps wrapHouseEmail on the live year, not a frozen literal in src", () => {
    const html = wrapHouseEmail("<p>Inner</p>");
    expect(html).toContain(emailCopyright());
    expect(html).toContain(String(new Date().getFullYear()));
    const src = readFileSync(resolve(__dirname, "./email-house.ts"), "utf8");
    expect(src).toContain("emailCopyright()");
    expect(src).not.toMatch(/© 2026/);
    expect(src).not.toContain("export const EMAIL_COPYRIGHT =");
  });
});

describe("wrapHouseEmail", () => {
  it("does not render an unapproved slogan under the mark", () => {
    const html = wrapHouseEmail("<p>Inner</p>");
    expect(html).not.toContain("Built for the creator class.");
    expect(html).not.toContain("creator class");
    expect(emailHouse).not.toHaveProperty("EMAIL_SLOGAN");
  });

  it("uses the Coinbase-scale house shell with a black frame mark and well-formed format-detection", () => {
    const html = wrapHouseEmail(`<p style="color:${EMAIL_INK}">Inner</p>`);
    assertHouseChrome(html);
    expect(html).toContain("Inner");
    expect(html).toContain(`width:${EMAIL_LOGO_DISPLAY}px;height:${EMAIL_LOGO_DISPLAY}px`);
    expect(EMAIL_LOGO_DISPLAY).toBe(88);
    expect(EMAIL_HEADLINE_SIZE).toBeGreaterThan(23);
    expect(EMAIL_BODY_SIZE).toBeGreaterThan(15);
    expect(html).not.toMatch(/font-size:11px[\s\S]*text-transform:uppercase/);
    expect(html).toContain("x-apple-disable-message-reformatting");
    expect(html).toContain("a[x-apple-data-detectors]");
    expect(EMAIL_LOGO_URL).toBe("https://app.24frame.co/email-mark-v2.png");
    expect(html).not.toMatch(/background:\s*#1769FF/i);
  });

  it("keeps notification CTAs as Sporty Blue text links, not 999px pills", () => {
    const html = wrapHouseEmail(housePrimaryLink("https://app.example/titles/1", "Review and resubmit"));
    expect(html).toContain(`href="https://app.example/titles/1"`);
    expect(html).toContain("Review and resubmit");
    expect(html).toContain(`style="color:${SPORTY_BLUE};text-decoration:none"`);
    expect(html).not.toMatch(/background:\s*#1769FF/i);
    expect(html).not.toMatch(/border-radius:\s*999px/);
  });

  it("renders the Sign in CTA as a filled Sporty Blue table button", () => {
    const html = wrapHouseEmail(housePrimaryButton("https://app.example/auth", "Sign in"));
    expect(html).toContain(`href="https://app.example/auth"`);
    expect(html).toContain(">Sign in</a>");
    expect(html).toContain(`background:${SPORTY_BLUE}`);
    expect(html).toContain(`bgcolor="${SPORTY_BLUE}"`);
    expect(html).toContain(`border-radius:${EMAIL_BUTTON_RADIUS}`);
    expect(html).not.toContain("Sign in to 24Frame");
    expect(html).not.toMatch(/border-radius:\s*999px/);
    expect(html).not.toMatch(/<img[^>]*#1769FF/i);
  });
});

describe("Auth email HTML twins", () => {
  const templatesDir = resolve(__dirname, "../../supabase/templates");

  it("stores a year placeholder and syncs it from emailCopyright()", () => {
    const raw = readFileSync(resolve(templatesDir, "magic_link.html"), "utf8");
    expect(raw).toContain(emailCopyrightPlaceholder());
    expect(raw).toContain(EMAIL_COPYRIGHT_YEAR_TOKEN);
    expect(raw).not.toMatch(/© \d{4}/);
    expect(applyEmailCopyright(raw)).toContain(emailCopyright());
    expect(applyEmailCopyright(raw, 2027)).toContain(emailCopyright(2027));
    expect(() => applyEmailCopyright("<p>no placeholder</p>")).toThrow(/placeholder/);
  });

  it("has no frozen © 2026 in email templates", () => {
    const files = readdirSync(templatesDir).filter((name) => name.endsWith(".html"));
    expect(files.length).toBeGreaterThan(0);
    for (const name of files) {
      const html = readFileSync(resolve(templatesDir, name), "utf8");
      expect(html).not.toContain("© 2026");
    }
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

describe("email-mark-v2.png", () => {
  it("is a ~15%-padded all-black Asset 11 frame mark at app.24frame.co/email-mark-v2.png", () => {
    expect(existsSync(LOGO_PNG)).toBe(true);
    const bytes = statSync(LOGO_PNG).size;
    expect(bytes).toBeGreaterThan(200);
    expect(bytes).toBeLessThan(40_000);
    const png = readFileSync(LOGO_PNG);
    expect(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true);
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    expect(width).toBe(height);
    expect(width).toBe(256);

    const decoded = decodePngRgb(png);
    const white = (p: [number, number, number]) => {
      expect(p[0]).toBeGreaterThan(240);
      expect(p[1]).toBeGreaterThan(240);
      expect(p[2]).toBeGreaterThan(240);
    };
    const nearBlack = (p: [number, number, number]) => {
      expect(Math.max(p[0], p[1], p[2])).toBeLessThan(40);
      expect(Math.abs(p[2] - p[0])).toBeLessThan(16);
      expect(Math.abs(p[1] - p[0])).toBeLessThan(16);
    };

    // White field + pad — not a filled navy/charcoal Asset 10 square.
    white(decoded.pixel(2, 2));
    white(decoded.pixel(width - 3, 2));
    white(decoded.pixel(2, height - 3));
    white(decoded.pixel(width - 3, height - 3));
    white(decoded.pixel(Math.floor(width / 2), Math.floor(height / 2)));
    white(decoded.pixel(Math.floor(width * 0.35), Math.floor(height * 0.22)));

    let ink = 0;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const [r, g, b] = decoded.pixel(x, y);
        const sporty = Math.abs(r - 0x17) + Math.abs(g - 0x69) + Math.abs(b - 0xff);
        expect(sporty).toBeGreaterThan(80);
        expect(b > r + 24 && b > g + 16).toBe(false);
        if (Math.min(r, g, b) < 240) {
          ink += 1;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          expect(Math.abs(r - g)).toBeLessThan(20);
          expect(Math.abs(g - b)).toBeLessThan(20);
        }
      }
    }

    // Numeral is near-black ink on white (not a white 24 on a dark square).
    const midX = Math.floor((minX + maxX) / 2);
    const darkestIn = (x0: number, x1: number): [number, number, number] => {
      let best: [number, number, number] = [255, 255, 255];
      let bestV = 255;
      for (let y = minY; y <= maxY; y++) {
        for (let x = x0; x <= x1; x++) {
          const p = decoded.pixel(x, y);
          const v = Math.min(p[0], p[1], p[2]);
          if (v < bestV) {
            bestV = v;
            best = p;
          }
        }
      }
      return best;
    };
    nearBlack(darkestIn(minX, midX));
    nearBlack(darkestIn(midX, maxX));

    // Line-art frame mark, not a filled rounded square (~50% dark).
    const fraction = ink / (width * height);
    expect(fraction).toBeGreaterThan(0.03);
    expect(fraction).toBeLessThan(0.3);

    // ~15% pad on every side of the ink bbox (tight-axis lock). The mark is
    // wider than tall, so vertical pad is larger; min pad stays in 0.14–0.18.
    const padL = minX / width;
    const padT = minY / height;
    const padR = (width - 1 - maxX) / width;
    const padB = (height - 1 - maxY) / height;
    expect(padL).toBeGreaterThanOrEqual(0.13);
    expect(padT).toBeGreaterThanOrEqual(0.13);
    expect(padR).toBeGreaterThanOrEqual(0.13);
    expect(padB).toBeGreaterThanOrEqual(0.13);
    const minPad = Math.min(padL, padT, padR, padB);
    expect(minPad).toBeGreaterThanOrEqual(0.14);
    expect(minPad).toBeLessThanOrEqual(0.18);

    // Asset 11: crop marks occupy the ink-bbox TL and BR; TR and BL stay open.
    // Asset 9 (24-only) inks the TR of its bbox.
    const probe = Math.max(4, Math.floor(Math.min(maxX - minX + 1, maxY - minY + 1) / 10));
    const regionInk = (x0: number, y0: number, x1: number, y1: number) => {
      let n = 0;
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          if (Math.min(...decoded.pixel(x, y)) < 240) n += 1;
        }
      }
      return n;
    };
    expect(regionInk(minX, minY, minX + probe, minY + probe)).toBeGreaterThan(0);
    expect(regionInk(maxX - probe, maxY - probe, maxX, maxY)).toBeGreaterThan(0);
    expect(regionInk(maxX - probe, minY, maxX, minY + probe)).toBe(0);
    expect(regionInk(minX, maxY - probe, minX + probe, maxY)).toBe(0);
  });
});

function decodePngRgb(png: Buffer): { pixel: (x: number, y: number) => [number, number, number] } {
  // Minimal IHDR + IDAT decoder for 8-bit RGB/RGBA (no interlace).
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const bitDepth = png[24];
  const colorType = png[25];
  expect(bitDepth).toBe(8);
  expect([2, 6]).toContain(colorType);
  const channels = colorType === 6 ? 4 : 3;
  const chunks: Buffer[] = [];
  let offset = 8;
  while (offset < png.length) {
    const len = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString("ascii");
    if (type === "IDAT") chunks.push(png.subarray(offset + 8, offset + 8 + len));
    offset += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width * channels;
  const rows: Buffer[] = [];
  let i = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[i];
    const row = Buffer.from(raw.subarray(i + 1, i + 1 + stride));
    if (filter === 1) {
      for (let x = channels; x < stride; x++) row[x] = (row[x] + row[x - channels]) & 255;
    } else if (filter === 2 && y > 0) {
      for (let x = 0; x < stride; x++) row[x] = (row[x] + rows[y - 1][x]) & 255;
    } else if (filter === 3) {
      for (let x = 0; x < stride; x++) {
        const a = x >= channels ? row[x - channels] : 0;
        const b = y > 0 ? rows[y - 1][x] : 0;
        row[x] = (row[x] + Math.floor((a + b) / 2)) & 255;
      }
    } else if (filter === 4) {
      for (let x = 0; x < stride; x++) {
        const a = x >= channels ? row[x - channels] : 0;
        const b = y > 0 ? rows[y - 1][x] : 0;
        const c = y > 0 && x >= channels ? rows[y - 1][x - channels] : 0;
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        row[x] = (row[x] + pr) & 255;
      }
    } else if (filter !== 0) {
      throw new Error(`unsupported PNG filter ${filter}`);
    }
    rows.push(row);
    i += 1 + stride;
  }
  return {
    pixel(x: number, y: number) {
      const row = rows[y];
      const o = x * channels;
      return [row[o], row[o + 1], row[o + 2]];
    },
  };
}
