"use client";

import { useRouter } from "next/navigation";

import { PageHeaderBackLink } from "@/components/ui/page-header";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";

export function SocialPostBack() {
  const router = useRouter();
  return (
    <PageHeaderBackLink
      href={SOCIAL_ROUTES.home}
      label={SOCIAL.profile.back}
      onClick={(event) => {
        if (typeof document === "undefined") return;
        try {
          const referrer = document.referrer;
          if (!referrer) return;
          if (new URL(referrer).origin !== window.location.origin) return;
          event.preventDefault();
          router.back();
        } catch {
          // Fall through to Home.
        }
      }}
    />
  );
}
