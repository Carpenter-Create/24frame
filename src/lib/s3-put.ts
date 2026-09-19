import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Title-asset PutObject on S3_BUCKET / AWS_REGION — the same client contract
// as `src/lib/s3.ts`. Extracted without `server-only` so News Lambda can
// reuse it. Do not invent NEWS_S3_* or a second bucket.

let titleS3: S3Client | undefined;

function requireTitleBucket(): { region: string; bucket: string } {
  const region = process.env.AWS_REGION?.trim();
  const bucket = process.env.S3_BUCKET?.trim();
  if (!region) throw new Error("AWS_REGION environment variable is not set");
  if (!bucket) throw new Error("S3_BUCKET environment variable is not set");
  return { region, bucket };
}

// News Lambda runs in us-west-2; AWS reserves AWS_REGION to that function
// region, so the client cannot be pointed at us-east-1 via env. The title
// bucket stays us-east-1. followRegionRedirects retries PermanentRedirect
// against x-amz-bucket-region so PutObject still succeeds.
function titleAssetsClient(region: string): S3Client {
  titleS3 ??= new S3Client({ region, followRegionRedirects: true });
  return titleS3;
}

/** House PutObject. News thumbs and any other title-bucket byte write use this. */
export async function putObjectBytes(
  key: string,
  body: Uint8Array,
  contentType: string,
  opts: { cacheControl?: string } = {},
): Promise<void> {
  const { region, bucket } = requireTitleBucket();
  await titleAssetsClient(region).send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: opts.cacheControl ?? "public, max-age=86400",
    }),
  );
}
