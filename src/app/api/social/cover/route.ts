import { NextResponse } from "next/server";

import { readSocialMediaObject } from "@/lib/s3-social-media";
import { isOwnedSocialMediaKey } from "@/lib/social-media";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

function closed(status: number) {
  return new NextResponse(null, { status, headers: NO_STORE });
}

// Owner cover bytes for reposition Save. Same-origin body — not a 302 to
// the CDN, which the browser cannot read (no CORS on the signed URL).

export async function GET(request: Request) {
  if (new URL(request.url).searchParams.has("key")) return closed(400);

  const user = await getAuthUser();
  if (!user) return closed(401);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("cover_key")
    .eq("id", user.id)
    .maybeSingle();
  const key = !error && typeof data?.cover_key === "string" ? data.cover_key.trim() : "";
  if (!key) return closed(404);
  if (!isOwnedSocialMediaKey(key, user.id, "posts") || !/\.(jpe?g|png|webp|gif)$/i.test(key)) {
    return closed(400);
  }

  const object = await readSocialMediaObject(key);
  if (!object) return closed(404);

  const copy = new ArrayBuffer(object.bytes.byteLength);
  new Uint8Array(copy).set(object.bytes);
  return new NextResponse(new Blob([copy], { type: object.contentType }), {
    status: 200,
    headers: {
      "Content-Type": object.contentType,
      "Cache-Control": "private, no-store",
      "Content-Length": String(object.bytes.byteLength),
    },
  });
}
