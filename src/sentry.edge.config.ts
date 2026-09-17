import * as Sentry from "@sentry/nextjs";

import { sentryInitOptions } from "@/lib/sentry";

const options = sentryInitOptions("edge");
if (options) {
  Sentry.init(options);
}
