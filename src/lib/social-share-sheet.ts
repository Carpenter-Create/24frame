import QRCode from "qrcode";

import { BRAND_MARK_FILL } from "@/lib/brand";
import { PRODUCT_NAME } from "@/lib/product";
import { bareHandle, displayHandle, socialProfilePublicUrl } from "@/lib/social";

// Profile share sheet — Figma 155:194 / 155:372.
// Canonical URL is https://24frame.co/@{handle}. QR is Sporty Blue on
// house air. Center mark is the 24. Download is the card, not a cousin.

export const SOCIAL_SHARE_QR_MARK = "24";
export const SOCIAL_SHARE_QR_SIZE = 240;
export const SOCIAL_SHARE_QR_MARK_SIZE = 48;
export const SOCIAL_SHARE_CARD_WIDTH = 360;
export const SOCIAL_SHARE_CARD_HEIGHT = 420;

// Confirmed Sporty Blue — same value as --accent / BRAND_MARK_FILL.
export const SOCIAL_SHARE_QR_INK = BRAND_MARK_FILL;
export const SOCIAL_SHARE_CARD_SURFACE = "#ffffff";

export function socialShareCardLabel(handle: string): string {
  return displayHandle(handle).toUpperCase();
}

export function socialSharePayload(handle: string): ShareData {
  return {
    title: displayHandle(handle),
    url: socialProfilePublicUrl(handle),
  };
}

export function socialShareCardFilename(handle: string): string {
  const bare = bareHandle(handle);
  return `${PRODUCT_NAME}-@${bare}.png`;
}

export function socialProfileQrModules(url: string): boolean[][] {
  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const size = qr.modules.size;
  const rows: boolean[][] = [];
  for (let y = 0; y < size; y += 1) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x += 1) {
      row.push(Boolean(qr.modules.get(y, x)));
    }
    rows.push(row);
  }
  return rows;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function copySocialProfileUrl(handle: string): Promise<void> {
  await navigator.clipboard.writeText(socialProfilePublicUrl(handle));
}

export async function shareSocialProfile(handle: string): Promise<"shared" | "copied"> {
  const payload = socialSharePayload(handle);
  if (typeof navigator.share === "function") {
    try {
      await navigator.share(payload);
      return "shared";
    } catch (error) {
      if (isAbortError(error)) throw error;
    }
  }
  await copySocialProfileUrl(handle);
  return "copied";
}

function roundedRect(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function drawSocialShareCard(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  handle: string,
): void {
  const url = socialProfilePublicUrl(handle);
  const modules = socialProfileQrModules(url);
  const n = modules.length;
  const width = SOCIAL_SHARE_CARD_WIDTH;
  const height = SOCIAL_SHARE_CARD_HEIGHT;
  const padX = 24;
  const padY = 32;
  const qrSize = SOCIAL_SHARE_QR_SIZE;
  const qrX = (width - qrSize) / 2;
  const qrY = padY;
  const cell = qrSize / n;
  const mark = SOCIAL_SHARE_QR_MARK_SIZE;

  ctx.fillStyle = SOCIAL_SHARE_CARD_SURFACE;
  roundedRect(ctx, 0, 0, width, height, 24);
  ctx.fill();

  ctx.fillStyle = SOCIAL_SHARE_QR_INK;
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      if (!modules[y]?.[x]) continue;
      ctx.fillRect(qrX + x * cell, qrY + y * cell, cell, cell);
    }
  }

  const markX = qrX + (qrSize - mark) / 2;
  const markY = qrY + (qrSize - mark) / 2;
  ctx.fillStyle = SOCIAL_SHARE_CARD_SURFACE;
  roundedRect(ctx, markX, markY, mark, mark, 12);
  ctx.fill();
  ctx.strokeStyle = SOCIAL_SHARE_QR_INK;
  ctx.lineWidth = 2;
  roundedRect(ctx, markX, markY, mark, mark, 12);
  ctx.stroke();
  ctx.fillStyle = SOCIAL_SHARE_QR_INK;
  ctx.font = "600 16px Geist, ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(SOCIAL_SHARE_QR_MARK, markX + mark / 2, markY + mark / 2);

  ctx.font = "600 15px Geist, ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(socialShareCardLabel(handle), width / 2, qrY + qrSize + padX);
}

export async function socialShareCardPngBlob(handle: string): Promise<Blob> {
  const scale = 2;
  const width = SOCIAL_SHARE_CARD_WIDTH;
  const height = SOCIAL_SHARE_CARD_HEIGHT;
  if (typeof OffscreenCanvas === "function") {
    const canvas = new OffscreenCanvas(width * scale, height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Share card canvas is unavailable.");
    ctx.scale(scale, scale);
    drawSocialShareCard(ctx, handle);
    return canvas.convertToBlob({ type: "image/png" });
  }
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Share card canvas is unavailable.");
  ctx.scale(scale, scale);
  drawSocialShareCard(ctx, handle);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((next) => resolve(next), "image/png");
  });
  if (!blob) throw new Error("Share card canvas is unavailable.");
  return blob;
}

export async function downloadSocialShareCard(handle: string): Promise<void> {
  const blob = await socialShareCardPngBlob(handle);
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = socialShareCardFilename(handle);
  anchor.click();
  URL.revokeObjectURL(href);
}
