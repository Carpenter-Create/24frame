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
import {
  inviteEmailSubject,
  resolveTeamInviteOrgName,
  teamInviteBody,
  teamInviteHeadline,
} from "@/lib/account-invite";
import { PRODUCT_NAME } from "@/lib/product";

export function buildTeamInviteEmail(
  acceptUrl: string,
  orgName: string,
  roleLabel: string,
): {
  subject: string;
  text: string;
  html: string;
} {
  const name = resolveTeamInviteOrgName(orgName);
  const role = roleLabel.trim();
  if (!name) {
    throw new Error("Team invite requires an organization name");
  }
  if (!role) {
    throw new Error("Team invite requires a role label");
  }
  const subject = inviteEmailSubject("team", name);
  const body = teamInviteBody(name, role);
  const text = `${body}\n\nAccept the invite: ${acceptUrl}\n`;
  const html = wrapHouseEmail(
    `<p style="margin:0 0 12px;font-size:${EMAIL_HEADLINE_SIZE}px;line-height:${EMAIL_HEADLINE_LINE}px;font-weight:600;color:${EMAIL_INK}">${escapeEmailHtml(teamInviteHeadline(name))}</p>` +
      `<p style="margin:0 0 28px;font-size:${EMAIL_BODY_SIZE}px;line-height:${EMAIL_BODY_LINE}px;color:${EMAIL_BODY}">` +
      `${escapeEmailHtml(body)}` +
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
