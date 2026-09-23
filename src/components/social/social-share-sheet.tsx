"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { HouseDialogFrame, useHouseDesktop } from "@/components/chrome/house-overlay";
import { SocialIcon } from "@/components/social/social-icon";
import { SOCIAL, socialProfilePublicUrl } from "@/lib/social";
import {
  SOCIAL_SHARE_SHEET_ACTION_CLASS,
  SOCIAL_SHARE_SHEET_ACTIONS_CLASS,
  SOCIAL_SHARE_SHEET_BODY_CLASS,
  SOCIAL_SHARE_SHEET_CARD_CLASS,
  SOCIAL_SHARE_SHEET_CHROME_CLASS,
  SOCIAL_SHARE_SHEET_CLOSE_CLASS,
  SOCIAL_SHARE_SHEET_HANDLE_CLASS,
  SOCIAL_SHARE_SHEET_HOST_CLASS,
  SOCIAL_SHARE_SHEET_MARK_CLASS,
  SOCIAL_SHARE_SHEET_QR_CLASS,
  SOCIAL_SHARE_SHEET_WASH_CLASS,
} from "@/lib/social-chrome";
import {
  SOCIAL_ICON_SIZE_SHARE_SHEET_ACTION,
  SOCIAL_ICON_SIZE_SHARE_SHEET_CLOSE,
} from "@/lib/social-icons";
import {
  copySocialProfileUrl,
  downloadSocialShareCard,
  shareSocialProfile,
  socialProfileQrModules,
  socialShareCardLabel,
  SOCIAL_SHARE_QR_MARK,
} from "@/lib/social-share-sheet";

function SocialShareQr({ url }: { url: string }) {
  const modules = socialProfileQrModules(url);
  const n = modules.length;
  return (
    <div data-social-share-qr="" className={SOCIAL_SHARE_SHEET_QR_CLASS}>
      <svg viewBox={`0 0 ${n} ${n}`} className="size-full text-accent" aria-hidden>
        {modules.flatMap((row, y) =>
          row.flatMap((on, x) =>
            on ? (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width={1}
                height={1}
                fill="currentColor"
              />
            ) : (
              []
            ),
          ),
        )}
      </svg>
      <span data-social-share-qr-mark="" className={SOCIAL_SHARE_SHEET_MARK_CLASS}>
        {SOCIAL_SHARE_QR_MARK}
      </span>
    </div>
  );
}

export function SocialShareSheet({
  handle,
  open,
  onClose,
}: {
  handle: string;
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const desktop = useHouseDesktop();
  const [copied, setCopied] = useState(false);
  const url = socialProfilePublicUrl(handle);

  function dismiss() {
    setCopied(false);
    onClose();
  }

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCopied(false);
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  const shareInner = (
    <>
      <div className={SOCIAL_SHARE_SHEET_WASH_CLASS} />
      <div className={SOCIAL_SHARE_SHEET_CHROME_CLASS}>
        <button
          type="button"
          data-social-share-close=""
          aria-label={SOCIAL.profile.shareClose}
          className={SOCIAL_SHARE_SHEET_CLOSE_CLASS}
          onClick={dismiss}
        >
          <SocialIcon name="x" size={SOCIAL_ICON_SIZE_SHARE_SHEET_CLOSE} />
        </button>
      </div>
      <div className={SOCIAL_SHARE_SHEET_BODY_CLASS}>
        <h2 id={titleId} className="sr-only">
          {SOCIAL.profile.shareProfile}
        </h2>
        <div data-social-share-card="" className={SOCIAL_SHARE_SHEET_CARD_CLASS}>
          <SocialShareQr url={url} />
          <p data-social-share-card-handle="" className={SOCIAL_SHARE_SHEET_HANDLE_CLASS}>
            {socialShareCardLabel(handle)}
          </p>
        </div>
        <div data-social-share-actions="" className={SOCIAL_SHARE_SHEET_ACTIONS_CLASS}>
          <button
            type="button"
            data-social-share-profile=""
            className={SOCIAL_SHARE_SHEET_ACTION_CLASS}
            onClick={async () => {
              try {
                const result = await shareSocialProfile(handle);
                if (result === "copied") {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1600);
                }
              } catch {
                // User cancelled native share — leave the sheet up.
              }
            }}
          >
            <SocialIcon name="share-network" size={SOCIAL_ICON_SIZE_SHARE_SHEET_ACTION} />
            {SOCIAL.profile.shareProfile}
          </button>
          <button
            type="button"
            data-social-share-copy=""
            className={SOCIAL_SHARE_SHEET_ACTION_CLASS}
            onClick={async () => {
              try {
                await copySocialProfileUrl(handle);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1600);
              } catch {
                setCopied(false);
              }
            }}
          >
            <SocialIcon name="link" size={SOCIAL_ICON_SIZE_SHARE_SHEET_ACTION} />
            {copied ? SOCIAL.profile.shareCopied : SOCIAL.profile.shareCopyLink}
          </button>
          <button
            type="button"
            data-social-share-download=""
            className={SOCIAL_SHARE_SHEET_ACTION_CLASS}
            onClick={async () => {
              try {
                await downloadSocialShareCard(handle);
              } catch {
                // Canvas/download unavailable — leave the sheet up.
              }
            }}
          >
            <SocialIcon name="download-simple" size={SOCIAL_ICON_SIZE_SHARE_SHEET_ACTION} />
            {SOCIAL.profile.shareDownload}
          </button>
        </div>
      </div>
    </>
  );

  const sheet = desktop ? (
    <HouseDialogFrame
      size="form"
      label={SOCIAL.profile.shareProfile}
      titleId={titleId}
      onClose={dismiss}
      closeLabel={SOCIAL.profile.shareClose}
    >
      <div data-social-share-sheet="" data-social-share-url={url} data-house-overlay-host="house-dialog">
        {shareInner}
      </div>
    </HouseDialogFrame>
  ) : (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-social-share-sheet=""
      data-social-share-url={url}
      data-house-overlay-host="app-sheet"
      className={SOCIAL_SHARE_SHEET_HOST_CLASS}
    >
      {shareInner}
    </div>
  );

  return typeof document !== "undefined" ? createPortal(sheet, document.body) : sheet;
}
