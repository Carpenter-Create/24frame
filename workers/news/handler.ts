// 24Frame News ingest Lambda. EventBridge rule 24frame-news-ingest.
// NEWS_AWS_REGION + NEWS_DDB_TABLE required. Static NEWS_AWS_* keys are
// optional when the Lambda execution role is attached.
// Never AWS_* / FINANCE_AWS_* / MEDIA_AWS_* / SES_AWS_* / EDUCATION_AWS_*.
// Founder-applied — see docs/infra/news-aws-setup.md. Do not create AWS from CI.

import { ingestNewsFeeds } from "../../src/lib/news-ingest";
import { createNewsIngestStore } from "../../src/lib/news-store";

export async function handler(): Promise<{
  fetched: number;
  inserted: number;
  failed: number;
  skipped: number;
}> {
  const summary = await ingestNewsFeeds({ persist: createNewsIngestStore() });
  console.log(JSON.stringify({ msg: "news ingest done", ...summary, results: undefined }));
  if (summary.failed > 0 && summary.failed === summary.sources - summary.skipped) {
    throw new Error(`news ingest failed every live source (${summary.failed})`);
  }
  return {
    fetched: summary.fetched,
    inserted: summary.inserted,
    failed: summary.failed,
    skipped: summary.skipped,
  };
}

function isDirectRun(): boolean {
  const entry = process.argv[1] ?? "";
  return entry.endsWith("workers/news/handler.ts") || entry.endsWith("workers/news/handler.js");
}

if (isDirectRun()) {
  handler()
    .then((summary) => {
      console.log(JSON.stringify(summary));
      process.exit(summary.failed === 0 ? 0 : 2);
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
