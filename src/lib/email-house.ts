import { PARENT_ENTITY, PRODUCT_NAME } from "@/lib/product";

// House email chrome rematched to the globalcontent-web house shell
// (`src/lib/email/shell.ts`) — not the thin #243 cousin (4px bar / filled pill).
// Auth HTML in supabase/templates copies these values; email tests lock the pair.
// Sporty Blue is the link accent only.

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
export const EMAIL_LOGO_URL = "https://app.24frame.co/email-logo.png";
export const EMAIL_SITE_URL = "https://24frame.co";
export const EMAIL_SITE_LABEL = "24frame.co";
export const EMAIL_LEGAL_URL = "https://24frame.co/legal";
export const EMAIL_SLOGAN = "Radically different film distribution.";
export const EMAIL_COPYRIGHT = `© 2026 ${PARENT_ENTITY}. All rights reserved.`;
export const EMAIL_ADDRESS = "3839 McKinney Ave, Suite 155 #2276, Dallas, TX 75204";
export const EMAIL_GEIST_HREF =
  "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap";

const FONT = "Geist,ui-sans-serif,-apple-system,system-ui,sans-serif";

function hairline(): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">` +
    `<tr><td style="height:1px;background:${EMAIL_BORDER};font-size:0;line-height:0">&nbsp;</td></tr>` +
    `</table>`
  );
}

export function housePrimaryLink(href: string, label: string): string {
  return `<p style="margin:0 0 24px;font-family:${FONT}"><a href="${href}" style="color:${EMAIL_ACCENT};text-decoration:none">${label}</a></p>`;
}

export function wrapHouseEmail(innerHtml: string): string {
  return (
    `<!DOCTYPE html>` +
    `<html lang="en">` +
    `<head>` +
    `<meta charset="utf-8" />` +
    `<meta name="viewport" content="width=device-width, initial-scale=1" />` +
    `<link rel="preconnect" href="https://fonts.googleapis.com" />` +
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />` +
    `<link href="${EMAIL_GEIST_HREF}" rel="stylesheet" />` +
    `</head>` +
    `<body style="margin:0;padding:0;background:${EMAIL_BG}">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${EMAIL_BG}">` +
    `<tr><td align="center" style="padding:32px 16px">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" width="${EMAIL_CARD_WIDTH}" style="width:${EMAIL_CARD_WIDTH}px;max-width:${EMAIL_CARD_WIDTH}px;background:${EMAIL_SURFACE};border:1px solid ${EMAIL_BORDER};border-radius:${EMAIL_CARD_RADIUS}">` +
    `<tr><td style="padding:40px 40px 32px;font-family:${FONT}">` +
    `<img src="${EMAIL_LOGO_URL}" width="48" height="48" alt="${PRODUCT_NAME}" style="display:block;border:0;width:48px;height:48px" />` +
    `<p style="margin:12px 0 0;font-size:10px;line-height:14px;letter-spacing:0.16em;text-transform:uppercase;color:${EMAIL_TERTIARY}">${EMAIL_SLOGAN}</p>` +
    `<div style="margin:24px 0">${hairline()}</div>` +
    innerHtml +
    `</td></tr>` +
    `<tr><td style="padding:0 40px 40px;font-family:${FONT}">` +
    `<p style="margin:8px 0 20px;font-size:14px"><a href="${EMAIL_SITE_URL}" style="color:${EMAIL_ACCENT};text-decoration:none">${EMAIL_SITE_LABEL}</a></p>` +
    `<div style="margin:0 0 20px">${hairline()}</div>` +
    `<p style="margin:0 0 4px;font-size:12px;line-height:18px;color:${EMAIL_TERTIARY}">${EMAIL_COPYRIGHT}</p>` +
    `<p style="margin:0 0 12px;font-size:12px;line-height:18px;color:${EMAIL_TERTIARY}">${EMAIL_ADDRESS}</p>` +
    `<p style="margin:0;font-size:12px;line-height:18px"><a href="${EMAIL_LEGAL_URL}" style="color:${EMAIL_TERTIARY};text-decoration:none">Legal</a></p>` +
    `</td></tr></table>` +
    `</td></tr></table>` +
    `</body></html>`
  );
}
