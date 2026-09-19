import {
  EMAIL_BODY,
  EMAIL_BODY_LINE,
  EMAIL_BODY_SIZE,
  EMAIL_HEADLINE_LINE,
  EMAIL_HEADLINE_SIZE,
  EMAIL_INK,
  housePrimaryButton,
  wrapHouseEmail,
} from "@/lib/email-house";
import { escapeEmailHtml } from "@/lib/email-auth-templates";
import { inviteEmailSubject } from "@/lib/account-invite";
import { PRODUCT_NAME } from "@/lib/product";

export function buildTeamInviteEmail(acceptUrl: string): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = inviteEmailSubject("team");
  const text =
    `You have been invited to join a team on ${PRODUCT_NAME}.\n\n` +
    `Accept the invite: ${acceptUrl}\n`;
  const html = wrapHouseEmail(
    `<p style="margin:0 0 12px;font-size:${EMAIL_HEADLINE_SIZE}px;line-height:${EMAIL_HEADLINE_LINE}px;font-weight:600;color:${EMAIL_INK}">Join a team</p>` +
      `<p style="margin:0 0 28px;font-size:${EMAIL_BODY_SIZE}px;line-height:${EMAIL_BODY_LINE}px;color:${EMAIL_BODY}">` +
      `You have been invited to join a team on ${escapeEmailHtml(PRODUCT_NAME)}.` +
      `</p>` +
      housePrimaryButton(escapeEmailHtml(acceptUrl), "Accept invite"),
  );
  return { subject, text, html };
}

export function buildHouseGrantEmail(acceptUrl: string): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = inviteEmailSubject("house_grant");
  const text =
    `You have been granted a ${PRODUCT_NAME} account.\n\n` +
    `Accept the invite: ${acceptUrl}\n`;
  const html = wrapHouseEmail(
    `<p style="margin:0 0 12px;font-size:${EMAIL_HEADLINE_SIZE}px;line-height:${EMAIL_HEADLINE_LINE}px;font-weight:600;color:${EMAIL_INK}">Your account</p>` +
      `<p style="margin:0 0 28px;font-size:${EMAIL_BODY_SIZE}px;line-height:${EMAIL_BODY_LINE}px;color:${EMAIL_BODY}">` +
      `You have been granted a ${escapeEmailHtml(PRODUCT_NAME)} account.` +
      `</p>` +
      housePrimaryButton(escapeEmailHtml(acceptUrl), "Accept invite"),
  );
  return { subject, text, html };
}
