import * as Sentry from "@sentry/nextjs";

import { sentryInitOptions } from "@/lib/sentry";

const options = sentryInitOptions("client");
if (options) {
  Sentry.init(options);
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
