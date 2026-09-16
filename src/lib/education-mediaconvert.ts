import "server-only";

import {
  CreateJobCommand,
  GetJobCommand,
  MediaConvertClient,
  type JobSettings,
} from "@aws-sdk/client-mediaconvert";

import {
  EDUCATION_AWS_ENV,
  EDUCATION_MEDIACONVERT_ENV,
  mapMediaConvertJobStatus,
  type CourseEncodeStatus,
} from "@/lib/education";
import { buildEducationHlsJobSettings } from "@/lib/education-mediaconvert-settings";
import { educationOutputBucket, educationSourceBucket } from "@/lib/s3-education";

// Isolated Education MediaConvert client. EDUCATION_AWS_* +
// EDUCATION_MEDIACONVERT_* only. Never import @/lib/mediaconvert or
// title AWS_* / MEDIA_AWS_* / FINANCE_AWS_*.

function requireEducationEnv(
  name: (typeof EDUCATION_AWS_ENV)[number] | (typeof EDUCATION_MEDIACONVERT_ENV)[number],
): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is not set`);
  return value;
}

export function isEducationMediaconvertConfigured(): boolean {
  return [...EDUCATION_AWS_ENV, ...EDUCATION_MEDIACONVERT_ENV].every((name) => !!process.env[name]);
}

function educationMediaconvertClient(): MediaConvertClient {
  return new MediaConvertClient({
    region: requireEducationEnv("EDUCATION_AWS_REGION"),
    endpoint: requireEducationEnv("EDUCATION_MEDIACONVERT_ENDPOINT"),
    credentials: {
      accessKeyId: requireEducationEnv("EDUCATION_AWS_ACCESS_KEY_ID"),
      secretAccessKey: requireEducationEnv("EDUCATION_AWS_SECRET_ACCESS_KEY"),
    },
    requestHandler: {
      connectionTimeout: 3_000,
      requestTimeout: 6_000,
      throwOnRequestTimeout: true,
    },
    maxAttempts: 2,
  });
}

export async function submitEducationHlsJob(input: {
  sourceKey: string;
  destinationPrefix: string;
}): Promise<{ externalJobId: string }> {
  const settings = buildEducationHlsJobSettings({
    sourceKey: input.sourceKey,
    sourceBucket: educationSourceBucket(),
    outputBucket: educationOutputBucket(),
    destinationPrefix: input.destinationPrefix,
  });
  const out = await educationMediaconvertClient().send(
    new CreateJobCommand({
      Role: requireEducationEnv("EDUCATION_MEDIACONVERT_ROLE_ARN"),
      Queue: requireEducationEnv("EDUCATION_MEDIACONVERT_QUEUE_ARN"),
      Settings: settings as unknown as JobSettings,
    }),
  );
  if (!out.Job?.Id) throw new Error("MediaConvert did not return a job id");
  return { externalJobId: out.Job.Id };
}

export async function getEducationEncodeJob(externalJobId: string): Promise<{
  status: CourseEncodeStatus | null;
  rawStatus: string;
  errorMessage: string | null;
}> {
  const out = await educationMediaconvertClient().send(new GetJobCommand({ Id: externalJobId }));
  if (!out.Job?.Status) throw new Error("MediaConvert did not return a job status");
  return {
    status: mapMediaConvertJobStatus(out.Job.Status),
    rawStatus: out.Job.Status,
    errorMessage: out.Job.ErrorMessage ?? null,
  };
}
