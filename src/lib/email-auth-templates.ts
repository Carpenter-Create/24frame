import {
  EMAIL_BODY,
  EMAIL_BODY_LINE,
  EMAIL_BODY_SIZE,
  EMAIL_HEADLINE_LINE,
  EMAIL_HEADLINE_SIZE,
  EMAIL_INK,
  EMAIL_SECONDARY,
  houseOtpCode,
  housePrimaryButton,
  wrapHouseEmail,
} from "@/lib/email-house";
import { PORTAL } from "@/lib/portal";
import { PRODUCT_NAME } from "@/lib/product";

// House Auth templates (magic link / OTP / verification). Transport is SES
// via auth-ses.ts; this module has no secrets and no send. email.ts re-exports
// these builders so existing callers and tests stay on the same names.

export function escapeEmailHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildOtpEmail(code: string): { subject: string; text: string; html: string } {
  const subject = `Your ${PRODUCT_NAME} access code`;
  const text =
    `Your verification code is ${code}.\n\n` +
    `It expires in ${PORTAL.otpTtlMinutes} minutes. If you didn't request this, you can ignore this message.`;
  const html = wrapHouseEmail(
    `<p style="margin:0 0 12px;color:${EMAIL_BODY}">Your verification code is</p>` +
      `<div style="margin:0 0 16px">${houseOtpCode(code)}</div>` +
      `<p style="margin:0;color:${EMAIL_SECONDARY}">It expires in ${PORTAL.otpTtlMinutes} minutes. If you didn't request this, you can ignore this message.</p>`,
  );
  return { subject, text, html };
}

// Web dashboard login. Mints happen in auth-magic-link.ts; this is the link-only house
// mail so web never receives a dual-purpose (link + code) body.
export function buildMagicLinkEmail(signInUrl: string): { subject: string; text: string; html: string } {
  const subject = `Your ${PRODUCT_NAME} sign-in link`;
  const text =
    `Use this link to sign in. If you didn't request this, you can ignore this message.\n\n` +
    `Sign in to ${PRODUCT_NAME}: ${signInUrl}\n`;
  const html = wrapHouseEmail(
    `<p style="margin:0 0 12px;font-size:${EMAIL_HEADLINE_SIZE}px;line-height:${EMAIL_HEADLINE_LINE}px;font-weight:600;color:${EMAIL_INK}">Sign in</p>` +
      `<p style="margin:0 0 28px;font-size:${EMAIL_BODY_SIZE}px;line-height:${EMAIL_BODY_LINE}px;color:${EMAIL_BODY}">` +
      `Use this link to sign in. If you didn't request this, you can ignore this message.` +
      `</p>` +
      housePrimaryButton(escapeEmailHtml(signInUrl), "Sign in"),
  );
  return { subject, text, html };
}

// Mobile sign-in: same subject + house shell as web, plus the enterable OTP (anti–iOS
// linkify defenses live in email-house). Hosted Auth magic_link is not the send path.
export function buildSignInWithCodeEmail(
  signInUrl: string,
  code: string,
): { subject: string; text: string; html: string } {
  const subject = `Your ${PRODUCT_NAME} sign-in link`;
  const text =
    `Use this link to sign in. If you didn't request this, you can ignore this message.\n\n` +
    `Sign in to ${PRODUCT_NAME}: ${signInUrl}\n\n` +
    `Or enter this code: ${code}\n`;
  const html = wrapHouseEmail(
    `<p style="margin:0 0 12px;font-size:${EMAIL_HEADLINE_SIZE}px;line-height:${EMAIL_HEADLINE_LINE}px;font-weight:600;color:${EMAIL_INK}">Sign in</p>` +
      `<p style="margin:0 0 28px;font-size:${EMAIL_BODY_SIZE}px;line-height:${EMAIL_BODY_LINE}px;color:${EMAIL_BODY}">` +
      `Use this link to sign in. If you didn't request this, you can ignore this message.` +
      `</p>` +
      housePrimaryButton(escapeEmailHtml(signInUrl), "Sign in") +
      `<p style="margin:0 0 8px;font-size:${EMAIL_BODY_SIZE}px;line-height:${EMAIL_BODY_LINE}px;color:${EMAIL_BODY}">Or enter this code:</p>` +
      `<div style="margin:0">${houseOtpCode(code)}</div>`,
  );
  return { subject, text, html };
}
