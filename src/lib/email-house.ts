import { PARENT_ENTITY, PRODUCT_NAME } from "@/lib/product";

// House email chrome — Coinbase-scale type and air (Adam lock 2026-09-13).
// Light-only. White card on #FAFAFB. Auth HTML in supabase/templates copies
// these values; email tests lock the pair.
// One-accent lock (Adam 2026-09-13): Sporty Blue is the Sign in button fill
// and the 24frame.co footer link only. The mark is the Asset 11 frame mark
// (crop-mark corners + 24) — all-black ink on a white field, with ~15%
// white pad on every side of the ink bbox (tight-axis lock; the mark is
// wider than tall so vertical pad is larger). Display at 88px so the 24
// stays readable in Mail. Never put Sporty Blue on the numeral.
// Cache-busted path: /email-mark-v2.png — Apple Mail cached /email-mark.png
// from #253.

export const EMAIL_ACCENT = "#1769FF";
export const EMAIL_BG = "#FAFAFB";
export const EMAIL_SURFACE = "#ffffff";
export const EMAIL_BORDER = "#E6E8EB";
export const EMAIL_INK = "#14171A";
export const EMAIL_BODY = "#3F4650";
export const EMAIL_SECONDARY = "#3F4650";
export const EMAIL_TERTIARY = "#9AA0A9";
export const EMAIL_CARD_WIDTH = 600;
export const EMAIL_CARD_RADIUS = "14px";
export const EMAIL_LOGO_URL = "https://app.24frame.co/email-mark-v2.png";
export const EMAIL_LOGO_DISPLAY = 88;
export const EMAIL_HEADLINE_SIZE = 28;
export const EMAIL_HEADLINE_LINE = 34;
export const EMAIL_BODY_SIZE = 17;
export const EMAIL_BODY_LINE = 26;
export const EMAIL_BUTTON_RADIUS = "8px";
export const EMAIL_SITE_URL = "https://24frame.co";
export const EMAIL_SITE_LABEL = "24frame.co";
export const EMAIL_LEGAL_URL = "https://24frame.co/legal";
export const EMAIL_SLOGAN = "Radically different film distribution.";
export const EMAIL_COPYRIGHT = `© 2026 ${PARENT_ENTITY}. All rights reserved.`;
export const EMAIL_ADDRESS = "3839 McKinney Ave, Suite 155 #2276, Dallas, TX 75204";
export const EMAIL_GEIST_HREF =
  "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap";
export const EMAIL_FORMAT_DETECTION = "telephone=no, date=no, address=no, email=no";

const FONT = "Geist,ui-sans-serif,-apple-system,system-ui,sans-serif";
const ZWSP = "&#8203;";

// Apple Mail still wraps bare digit runs (OTP / portal codes) as tel: links
// even when the ink is already #14171A. Meta + detector CSS + ZWSP bookends
// keep the code near-black and un-underlined. Sporty Blue stays off the OTP.
const APPLE_DETECTOR_STYLE =
  `<style type="text/css">` +
  `a[x-apple-data-detectors],a[x-apple-data-detectors]:hover,a[x-apple-data-detectors]:focus,` +
  `a[x-apple-data-detectors]:visited,a[x-apple-data-detectors]:active` +
  `{color:inherit!important;text-decoration:none!important;font-size:inherit!important;` +
    `font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}` +
  `.otp::before,.otp::after{content:"\\200B"}` +
  `</style>`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function houseOtpCode(code: string): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse">` +
    `<tr><td x-apple-data-detectors="false" style="font-size:24px;font-weight:600;letter-spacing:2px;color:${EMAIL_INK};text-decoration:none">` +
    `<span class="otp" x-apple-data-detectors="false" style="color:${EMAIL_INK};text-decoration:none;font-weight:600;font-size:24px;letter-spacing:2px">${ZWSP}${escapeHtml(code)}${ZWSP}</span>` +
    `</td></tr></table>`
  );
}

function hairline(): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">` +
    `<tr><td style="height:1px;background:${EMAIL_BORDER};font-size:0;line-height:0">&nbsp;</td></tr>` +
    `</table>`
  );
}

export function housePrimaryLink(href: string, label: string): string {
  return `<p style="margin:0 0 28px;font-family:${FONT}"><a href="${href}" style="color:${EMAIL_ACCENT};text-decoration:none">${label}</a></p>`;
}

// Outlook-safe filled button. Label is caller-supplied; sign-in mail uses "Sign in".
export function housePrimaryButton(href: string, label: string): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 28px">` +
    `<tr><td bgcolor="${EMAIL_ACCENT}" style="background:${EMAIL_ACCENT};border-radius:${EMAIL_BUTTON_RADIUS}">` +
    `<a href="${href}" style="display:inline-block;padding:16px 32px;font-family:${FONT};font-size:16px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:${EMAIL_BUTTON_RADIUS}">${label}</a>` +
    `</td></tr></table>`
  );
}

function formatDetectionMeta(): string {
  // Explicit `>` — a missing close before the Geist <link> was a production bug.
  return `<meta name="format-detection" content="${EMAIL_FORMAT_DETECTION}">`;
}

export function wrapHouseEmail(innerHtml: string): string {
  return (
    `<!DOCTYPE html>` +
    `<html lang="en">` +
    `<head>` +
    `<meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    formatDetectionMeta() +
    `<meta name="x-apple-disable-message-reformatting">` +
    `<link rel="preconnect" href="https://fonts.googleapis.com">` +
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` +
    `<link href="${EMAIL_GEIST_HREF}" rel="stylesheet">` +
    APPLE_DETECTOR_STYLE +
    `</head>` +
    `<body style="margin:0;padding:0;background:${EMAIL_BG}">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${EMAIL_BG}">` +
    `<tr><td align="center" style="padding:40px 20px">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" width="${EMAIL_CARD_WIDTH}" style="width:${EMAIL_CARD_WIDTH}px;max-width:${EMAIL_CARD_WIDTH}px;background:${EMAIL_SURFACE};border:1px solid ${EMAIL_BORDER};border-radius:${EMAIL_CARD_RADIUS}">` +
    `<tr><td style="padding:48px 48px 40px;font-family:${FONT}">` +
    `<img src="${EMAIL_LOGO_URL}" width="${EMAIL_LOGO_DISPLAY}" height="${EMAIL_LOGO_DISPLAY}" alt="${PRODUCT_NAME}" style="display:block;border:0;width:${EMAIL_LOGO_DISPLAY}px;height:${EMAIL_LOGO_DISPLAY}px" />` +
    `<p style="margin:16px 0 0;font-size:11px;line-height:16px;letter-spacing:0.16em;text-transform:uppercase;color:${EMAIL_TERTIARY}">${EMAIL_SLOGAN}</p>` +
    `<div style="margin:32px 0">${hairline()}</div>` +
    innerHtml +
    `</td></tr>` +
    `<tr><td style="padding:0 48px 48px;font-family:${FONT}">` +
    `<p style="margin:8px 0 24px;font-size:15px"><a href="${EMAIL_SITE_URL}" style="color:${EMAIL_ACCENT};text-decoration:none">${EMAIL_SITE_LABEL}</a></p>` +
    `<div style="margin:0 0 24px">${hairline()}</div>` +
    `<p style="margin:0 0 6px;font-size:13px;line-height:20px;color:${EMAIL_TERTIARY}">${EMAIL_COPYRIGHT}</p>` +
    `<p style="margin:0 0 16px;font-size:13px;line-height:20px;color:${EMAIL_TERTIARY}">${EMAIL_ADDRESS}</p>` +
    `<p style="margin:0;font-size:13px;line-height:20px"><a href="${EMAIL_LEGAL_URL}" style="color:${EMAIL_TERTIARY};text-decoration:none">Legal</a></p>` +
    `</td></tr></table>` +
    `</td></tr></table>` +
    `</body></html>`
  );
}
