# Asset storage (S3) setup — run once per environment

Title objects only. Avatars are a **dedicated** private bucket on this same AWS
account — see [`avatar-storage-setup.md`](avatar-storage-setup.md). Do not write
faces under `orgs/<org>/titles/...` or into this bucket.

Prereqs: `aws` CLI authenticated to the GC AWS account; pick a region (e.g. us-east-1)
and a globally-unique bucket name (e.g. `gc-content-assets-prod`).

    export AWS_REGION=us-east-1
    export BUCKET=gc-content-assets-prod
    export APP_ORIGIN=https://your-app.vercel.app   # and http://localhost:3000 for dev

1) Create the bucket + block all public access:

    aws s3api create-bucket --bucket "$BUCKET" --region "$AWS_REGION" \
      $( [ "$AWS_REGION" = us-east-1 ] || echo --create-bucket-configuration LocationConstraint=$AWS_REGION )
    aws s3api put-public-access-block --bucket "$BUCKET" \
      --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

2) CORS (allow direct part PUTs from the app; expose ETag; allow the checksum header):

    aws s3api put-bucket-cors --bucket "$BUCKET" --cors-configuration '{
      "CORSRules": [{
        "AllowedOrigins": ["http://localhost:3000", "'"$APP_ORIGIN"'"],
        "AllowedMethods": ["PUT","GET"],
        "AllowedHeaders": ["content-type","x-amz-checksum-sha256","x-amz-sdk-checksum-algorithm"],
        "ExposeHeaders": ["ETag","x-amz-checksum-sha256"],
        "MaxAgeSeconds": 3000
      }]
    }'

3) Lifecycle: abort abandoned multipart uploads after 7 days (Glacier tiering is a later slice):

    aws s3api put-bucket-lifecycle-configuration --bucket "$BUCKET" --lifecycle-configuration '{
      "Rules": [{
        "ID": "abort-incomplete-multipart",
        "Status": "Enabled",
        "Filter": {"Prefix": ""},
        "AbortIncompleteMultipartUpload": {"DaysAfterInitiation": 7}
      }]
    }'

4) Least-privilege IAM user for the app. Founder lock 2026-09-17: **deleted title prefixes
must be purged**. `s3:DeleteObject` / `s3:DeleteObjects` + list are granted on
`orgs/*/titles/*` only — not a blanket bucket wipe. Avatars, education, social, and
finance stay on their own clients and keep their own "no DeleteObject" posture.

    aws iam create-user --user-name gc-assets-app
    aws iam put-user-policy --user-name gc-assets-app --policy-name gc-assets-s3 --policy-document '{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "TitleObjectReadWrite",
          "Effect": "Allow",
          "Action": ["s3:PutObject","s3:GetObject","s3:ListMultipartUploadParts","s3:AbortMultipartUpload"],
          "Resource": "arn:aws:s3:::'"$BUCKET"'/*"
        },
        {
          "Sid": "DeletedTitlePrefixList",
          "Effect": "Allow",
          "Action": ["s3:ListBucket"],
          "Resource": "arn:aws:s3:::'"$BUCKET"'",
          "Condition": {
            "StringLike": { "s3:prefix": ["orgs/*/titles/*"] }
          }
        },
        {
          "Sid": "DeletedTitlePrefixPurge",
          "Effect": "Allow",
          "Action": ["s3:DeleteObject","s3:DeleteObjects"],
          "Resource": "arn:aws:s3:::'"$BUCKET"'/orgs/*/titles/*"
        }
      ]
    }'
    aws iam create-access-key --user-name gc-assets-app   # capture AccessKeyId + SecretAccessKey

`s3:DeleteObjects` is the batch API the app calls; IAM evaluates it as
`s3:DeleteObject` on each key. Both names stay in the snippet so the founder lock
is readable in the policy. `ListBucket` is a bucket-level action — its Resource
is the bucket ARN, scoped by `s3:prefix`. Do not put `DeleteObject` on `$BUCKET/*`.
Keep the existing unscoped `s3:ListBucket` on `gc-assets-mediaconvert` (HeadBucket
for `headObjectMeta`); the prefix condition above is the delete-list scope, not a
replacement for that grant.

5) Set env vars (server-only) locally (`.env.local`) and in Vercel (all environments):

    AWS_REGION, S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

Hardening follow-up: replace the long-lived access key with Vercel OIDC → an AWS role
(log to docs/known-divergences.md when done).
