// Auth callback `next` allowlist (P0-1). Same-origin path-relative
// only. Reject protocol-relative, backslash, userinfo `@`, and
// schemes. Default `/`. Do not use `new URL(next, origin)` — that
// accepts `//evil`.

const DEFAULT_NEXT = "/";

function hasControlChars(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 32 || code === 127) return true;
  }
  return false;
}

function isSafePathRelative(value: string): boolean {
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.includes("\\") || value.includes("@")) return false;
  if (value.includes("://")) return false;
  if (hasControlChars(value)) return false;
  return true;
}

export function safeAuthCallbackNext(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_NEXT;
  if (!isSafePathRelative(raw)) return DEFAULT_NEXT;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return DEFAULT_NEXT;
  }
  if (decoded !== raw && !isSafePathRelative(decoded)) return DEFAULT_NEXT;
  return raw;
}
