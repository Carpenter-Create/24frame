# 24Frame Education AWS setup — founder-gated

Dedicated **Education** namespace for course covers, lesson source
video, and MediaConvert HLS. Not Social `24frame-media-*`. Not Titles
`gc-content-assets`. Not avatars. Not finance.

Do **not** create these buckets, IAM users, MediaConvert queues, or
CloudFront distributions from this repository. Names below are a
**proposal** for Adam confirm. Code runs behind env stubs and fails
closed when unset.

Do **not** apply the Education media SQL from CI. CoS merges; founder
applies.

Do **not** reuse title (`AWS_*`), finance (`FINANCE_AWS_*`), social
(`MEDIA_AWS_*`), avatar, or SES credentials.

## Proposed resources (not created)

Verified against live finance isolation in
[`finance-aws-setup.md`](finance-aws-setup.md): account `405912452061`
(E8) / region `us-west-2`. Title-asset S3 stays `us-east-1`. Social
media tests and clients also use `us-west-2`. No evidence of a second
24Frame AWS account — do not invent one.

| Item | Proposed | Notes |
| --- | --- | --- |
| Account | `405912452061` (E8) | Same account as finance / social media. Confirm. |
| Region | `us-west-2` | Same as finance / media. Titles stay `us-east-1`. |
| Prod source | `24frame-education-source-prod` | Covers + lesson source PUT. Private, AES256. |
| Prod output | `24frame-education-output-prod` | MediaConvert HLS only. Private, AES256. |
| Dev source | `24frame-education-source-dev` | Preview / local. |
| Dev output | `24frame-education-output-dev` | Preview / local. |
| Object prefix | `courses/{course_id}/cover.{ext}` and `courses/{course_id}/lessons/{lesson_id}/source.{ext}` and `courses/{course_id}/lessons/{lesson_id}/hls/` | Flat Education namespace. Never `orgs/`, `posts/`, `avatars/`, title keys. |
| App IAM user | `24frame-education-app` | `EDUCATION_AWS_*` for Next signed PUT/GET. |
| MediaConvert role | `24frame-education-mediaconvert` | Get source + Put output. Dedicated role — not the title proxy role. |
| MediaConvert queue | `24frame-education` | Dedicated queue. Confirm name. |
| CloudFront (prod HLS) | propose `24frame-education` / OAC `FrameEducationProdS3OAC` | Output bucket only. Preview leaves `EDUCATION_CLOUDFRONT_*` empty → S3 presign. |

## Env names (server-only)

Never fall back to `AWS_*` (titles), `FINANCE_AWS_*`, `MEDIA_AWS_*`
(social), or `SES_AWS_*`. Never `NEXT_PUBLIC_`. Do not commit secret
values.

```
EDUCATION_AWS_REGION=
EDUCATION_AWS_ACCESS_KEY_ID=
EDUCATION_AWS_SECRET_ACCESS_KEY=
S3_EDUCATION_SOURCE_BUCKET=
S3_EDUCATION_OUTPUT_BUCKET=
EDUCATION_MEDIACONVERT_ENDPOINT=
EDUCATION_MEDIACONVERT_ROLE_ARN=
EDUCATION_MEDIACONVERT_QUEUE_ARN=
EDUCATION_CLOUDFRONT_DOMAIN=
EDUCATION_CLOUDFRONT_KEY_PAIR_ID=
EDUCATION_CLOUDFRONT_PRIVATE_KEY=
```

Production may set `EDUCATION_CLOUDFRONT_*` against a dedicated
Education distro that fronts the **output** bucket (HLS). Preview leaves
those names empty so playback signing stays S3 presign. Covers stay on
the **source** bucket (signed GET). Names live in `.env.example`.
Agents do not set values.

## Founder steps (after Adam confirms names)

1. Create the four buckets in `us-west-2` in account `405912452061`.
   Block public access. Default encryption AES256. Tag as Education.
2. Create IAM user `24frame-education-app` with Get/Put on source and
   Get on output. Put Vercel `EDUCATION_AWS_*` + bucket names
   (Production = prod pair, Preview = dev pair).
3. Create MediaConvert role + queue. Role trusts `mediaconvert.amazonaws.com`
   and may Get source + Put output. Set the three
   `EDUCATION_MEDIACONVERT_*` names.
4. Optional Production CloudFront on the output bucket with a dedicated
   signing key. Preview stays empty.
5. Apply the Education media migration on survivor only after merge
   review. Do not prod-apply from this PR.

## App contracts already in-repo

- Staff writes go through `gc_staff` server actions + service role.
  Course RLS and `has_course_access` stay free of `is_gc_staff`
  (Mapping C).
- Members consume on Route A `/social/courses/[slug]` only.
- Education clients never import `@/lib/s3`, `@/lib/s3-social-media`,
  `@/lib/s3-finance`, `@/lib/s3-avatars`, or `@/lib/mediaconvert`.
- Cover and lesson source bytes PUT **server-side** (same pattern as
  avatars). Browser CORS on the Education source bucket is not required
  for staff uploads.
- Do not wire a browser presigned PUT for Education staff uploads. If a
  future browser path is required, apply CORS on the Education source
  bucket only — never Social / Titles / finance / avatars. Do not create
  CORS from this repository unless founder-authorized.
