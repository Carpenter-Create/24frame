import { PRODUCT_NAME } from "@/lib/product";

// House email chrome. Greyscale register matches tokens.css; Sporty Blue is
// the one accent (CTA / primary link / 4px brand bar). Auth HTML in
// supabase/templates copies these values — the email tests lock the pair.

export const EMAIL_ACCENT = "#1769FF";
export const EMAIL_BG = "#fafafb";
export const EMAIL_SURFACE = "#ffffff";
export const EMAIL_BORDER = "#ecedf0";
export const EMAIL_INK = "#14171a";
export const EMAIL_BODY = "#2b2f36";
export const EMAIL_SECONDARY = "#5e646e";
export const EMAIL_TERTIARY = "#9aa0a9";
export const EMAIL_ACCENT_CONTRAST = "#ffffff";

const FONT = "Geist,ui-sans-serif,-apple-system,system-ui,sans-serif";

export function wrapHouseEmail(innerHtml: string): string {
  return (
    `<div style="background:${EMAIL_BG};margin:0;padding:24px 0">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:${EMAIL_SURFACE};border:1px solid ${EMAIL_BORDER}">` +
    `<tr><td style="height:4px;background:${EMAIL_ACCENT};font-size:0;line-height:0">&nbsp;</td></tr>` +
    `<tr><td style="padding:24px;font-family:${FONT}">` +
    `<p style="margin:0 0 24px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_TERTIARY}">${PRODUCT_NAME}</p>` +
    innerHtml +
    `<p style="margin:32px 0 0;font-size:13px;color:${EMAIL_TERTIARY}">${PRODUCT_NAME}</p>` +
    `</td></tr></table></div>`
  );
}

export function housePrimaryLink(href: string, label: string): string {
  return `<p><a href="${href}" style="color:${EMAIL_ACCENT}">${label}</a></p>`;
}
