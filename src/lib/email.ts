import "server-only";
import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EMAIL_BODY,
  EMAIL_INK,
  EMAIL_SECONDARY,
  houseOtpCode,
  housePrimaryLink,
  wrapHouseEmail,
} from "@/lib/email-house";
import { PORTAL } from "@/lib/portal";
import { PRODUCT_NAME } from "@/lib/product";
import type { Database } from "@/lib/supabase/database.types";

// Asset-related + GC-Support emails send from a dedicated identity (founder: "anything asset
// related should come from assets@globalcontent.co"). Override via ASSETS_EMAIL_FROM; defaults
// to the verified assets@ address on the globalcontent.co Resend domain (no extra setup needed).
const EMAIL_FROM = process.env.ASSETS_EMAIL_FROM ?? `${PRODUCT_NAME} <assets@globalcontent.co>`;

function escapeHtml(s: string): string {
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

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");
  const { subject, text, html } = buildOtpEmail(code);
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from: EMAIL_FROM, to, subject, text, html });
  if (error) throw new Error(`Email send failed: ${error.message}`);
}

// Dashboard login only. Mints happen in auth-magic-link.ts; this is the link-only house
// mail so web never receives the hosted dual-purpose template (link + {{ .Token }}).
export function buildMagicLinkEmail(signInUrl: string): { subject: string; text: string; html: string } {
  const subject = `Your ${PRODUCT_NAME} sign-in link`;
  const text =
    `Use this link to sign in. If you didn't request this, you can ignore this message.\n\n` +
    `Sign in to ${PRODUCT_NAME}: ${signInUrl}\n`;
  const html = wrapHouseEmail(
    `<p style="margin:0 0 12px;font-size:23px;line-height:28px;font-weight:600;color:${EMAIL_INK}">Sign in</p>` +
      `<p style="margin:0 0 24px;font-size:15px;line-height:22px;color:${EMAIL_BODY}">` +
      `Use this link to sign in. If you didn't request this, you can ignore this message.` +
      `</p>` +
      housePrimaryLink(escapeHtml(signInUrl), `Sign in to ${PRODUCT_NAME}`),
  );
  return { subject, text, html };
}

export async function sendMagicLinkEmail(to: string, signInUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");
  const { subject, text, html } = buildMagicLinkEmail(signInUrl);
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from: EMAIL_FROM, to, subject, text, html });
  if (error) throw new Error(`Email send failed: ${error.message}`);
}

// GC-Support notification email (§20). Body is the same voice-approved line shown in-app;
// this frames it with a CTA back into the dashboard and the sign-off. Copy lives in
// lib/notifications.ts (subject/CTA per kind) — this is just the template. body is escaped
// because it carries user content (title, rejection reason).
export function buildNotificationEmail(args: {
  subject: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}): { subject: string; text: string; html: string } {
  const { subject, body, ctaLabel, ctaUrl } = args;
  const text = `${body}\n\n${ctaLabel}: ${ctaUrl}\n\n${PRODUCT_NAME}`;
  const html = wrapHouseEmail(
    `<p style="margin:0 0 16px;color:${EMAIL_BODY}">${escapeHtml(body)}</p>` +
      housePrimaryLink(ctaUrl, escapeHtml(ctaLabel)),
  );
  return { subject, text, html };
}

async function sendNotificationEmail(
  to: string,
  msg: { subject: string; text: string; html: string },
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from: EMAIL_FROM, to, subject: msg.subject, text: msg.text, html: msg.html });
  if (error) throw new Error(`Email send failed: ${error.message}`);
}

// Send a GC-Support notification email to every active member of an org. Recipients come from
// the GC-gated org_notification_recipients RPC (called with the operator's JWT — no service-role
// here). Best-effort: a missing config or a failed send logs and is swallowed, so it can never
// break the GC action that triggered it (the in-app notification already committed).
export async function sendOrgNotificationEmail(
  supabase: SupabaseClient<Database>,
  orgId: string,
  msg: { subject: string; body: string; ctaLabel: string; ctaPath: string },
): Promise<void> {
  const { data: recipients, error } = await supabase.rpc("org_notification_recipients", { p_org_id: orgId });
  if (error || !recipients || recipients.length === 0) return;
  const base = process.env.PORTAL_BASE_URL?.replace(/\/+$/, "") ?? "";
  const email = buildNotificationEmail({
    subject: msg.subject,
    body: msg.body,
    ctaLabel: msg.ctaLabel,
    ctaUrl: `${base}${msg.ctaPath}`,
  });
  await Promise.all(
    recipients.map((to) =>
      sendNotificationEmail(to, email).catch((e) =>
        console.error("[notifications] email send failed", e instanceof Error ? e.message : e),
      ),
    ),
  );
}
