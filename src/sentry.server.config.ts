import * as Sentry from "@sentry/nextjs";

import { sentryInitOptions } from "@/lib/sentry";

const options = sentryInitOptions("server");
if (options) {
  Sentry.init(options);
}
