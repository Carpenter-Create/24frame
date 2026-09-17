import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

// Artwork is served from CloudFront in production and from presigned S3 in local/preview
// (see lib/asset-url). next/image will only optimise a remote source whose host is listed
// here, so both paths need an entry or images silently fall back to unoptimised.
//
// The CloudFront host is read from env rather than hardcoded so this follows the
// distribution; the literal is a fallback for builds where the var is absent.
const cloudfrontHost = (() => {
  const raw = process.env.CLOUDFRONT_DOMAIN;
  if (!raw) return "delivery.globalcontent.co";
  try {
    return new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname;
  } catch {
    return "delivery.globalcontent.co";
  }
})();

const nextConfig: NextConfig = {
  // Next serves its dev origin as localhost; without this, hitting the app via
  // 127.0.0.1 is treated as cross-origin and dev resources (incl. client hydration)
  // are blocked — the widget/hydration then silently fails. Allow both in dev.
  allowedDevOrigins: ["127.0.0.1"],

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
    // Education staff uploads PUT server-side (avatars pattern). Cover ≤10MB,
    // lesson source ≤2GB. Default 1MB would reject a valid file before attach.
    // 3gb leaves FormData headroom over EDUCATION_VIDEO_MAX_BYTES.
    serverActions: { bodySizeLimit: "3gb" },
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: cloudfrontHost },
      // Local/preview presigned S3. Both addressing styles, dev bucket only — the prod
      // bucket is never served directly, it is CloudFront + OAC only.
      { protocol: "https", hostname: "gc-content-assets-dev.s3.us-east-1.amazonaws.com" },
      { protocol: "https", hostname: "s3.us-east-1.amazonaws.com" },
    ],
    // Artwork is photographic; AVIF first, WebP fallback.
    formats: ["image/avif", "image/webp"],
    // Match the cache to the signed-URL window (PORTAL.artworkTtlSeconds). No point
    // holding a derivative longer than its source URL stays valid.
    minimumCacheTTL: 3600,
  },

  async redirects() {
    return [
      { source: "/", destination: "/dashboard", permanent: true },
      { source: "/analytics", destination: "/reports", permanent: true },
      { source: "/analytics/:path*", destination: "/reports/:path*", permanent: true },
      { source: "/earn", destination: "/reports", permanent: true },
      { source: "/earn/:path*", destination: "/reports/:path*", permanent: true },
      { source: "/finance", destination: "/reports", permanent: true },
      { source: "/finance/:path*", destination: "/reports/:path*", permanent: true },
      { source: "/gc/education", destination: "/education", permanent: true },
      { source: "/gc/education/:slug", destination: "/education/:slug", permanent: true },
      { source: "/catalog-health", destination: "/attention", permanent: true },
      { source: "/catalog-health/:path*", destination: "/attention/:path*", permanent: true },
      { source: "/deliveries", destination: "/titles", permanent: true },
      { source: "/deliveries/:path*", destination: "/titles/:path*", permanent: true },
    ];
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
