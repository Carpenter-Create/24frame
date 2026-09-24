import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

import { imageRemotePatterns } from "./src/lib/image-remote-hosts";
import { SERVER_ACTION_BODY_SIZE_LIMIT_BYTES } from "./src/lib/server-action-body-limit";

// Artwork + Social faces/media are served from CloudFront in production and
// from presigned S3 in local/preview. next/image only optimises hosts listed
// here — title CF, FrameMediaDelivery, and the existing S3 addressing styles.

const nextConfig: NextConfig = {
  // `next dev`/`next build` otherwise inject a managed "nextjs-agent-rules" block into
  // the tracked, governance-budgeted AGENTS.md (and CLAUDE.md) on every run, dirtying the
  // working tree and threatening the `pnpm governance` AGENTS.md word/byte budget. This
  // repo's agent governance is authored by hand, so opt out of the generated block.
  agentRules: false,

  // Next serves its dev origin as localhost; without this, hitting the app via
  // 127.0.0.1 is treated as cross-origin and dev resources (incl. client hydration)
  // are blocked — the widget/hydration then silently fails. Allow both in dev.
  allowedDevOrigins: ["127.0.0.1"],
  transpilePackages: ["@mux/mux-player", "@mux/mux-player-react"],

  experimental: {
    // Next 16 defaults staleTimes.dynamic to 0, so a page you visited ten seconds ago is
    // refetched IN FULL on the way back. That is why back-and-forth navigation never felt
    // instant no matter how fast the render got: the render was never the issue, the
    // refetch was. 30s means a revisit inside that window is served from the client cache
    // with NO server call.
    //
    // Only `dynamic` is set. `static` (default 5 min) is what router.prefetch() uses for
    // hover-warmed routes, and lowering it would undo that.
    //
    // SAFE HERE because mutations already invalidate the client cache: 10 action files call
    // revalidatePath and 14 components call router.refresh(). Without that, a user could add
    // a title, navigate away and back, and see the old list for 30 seconds.
    //
    // CAVEAT, stated plainly: Next still labels staleTimes experimental and says it is not
    // recommended for production. It has carried that label since 14.2 and is widely used,
    // but this is a Tier 3 app — if anything looks stale after a write, this flag is the
    // first thing to remove.
    staleTimes: { dynamic: 30 },
    // Lets instrumentation-client.ts export onRouterTransitionStart so Sentry
    // can attach client navigation spans. Off by default in Next 16.3.
    instrumentationClientRouterTransitionEvents: true,
    // One limit for every server action. Next has no per-action bodySizeLimit.
    // `"3gb"` is 3GiB. The ceiling is the largest house file cap a server
    // action accepts, plus 20KB multipart overhead.
    serverActions: { bodySizeLimit: SERVER_ACTION_BODY_SIZE_LIMIT_BYTES },
  },

  images: {
    remotePatterns: imageRemotePatterns(),
    // Photographic artwork + Social stills; AVIF first, WebP fallback.
    formats: ["image/avif", "image/webp"],
    // Match the cache to the signed-URL window (PORTAL.artworkTtlSeconds).
    // Social GET signatures now use the same stable window, so a derivative
    // can be reused across navigations instead of re-fetching the original.
    minimumCacheTTL: 3600,
  },
};

// Org/project slugs are public identifiers for the existing Sentry project.
// DSN stays env-only. Source maps are off — no auth token, no CLI upload.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG ?? "e8-holdings-llc",
  project: process.env.SENTRY_PROJECT ?? "24frame",
  silent: !process.env.CI,
  telemetry: false,
  sourcemaps: { disable: true },
  tunnelRoute: "/sentry-tunnel",
});
