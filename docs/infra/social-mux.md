# Social Mux Video — env already present

Social **Video** and **Go live** recordings upload to Mux and play back
through Mux Player (Auto / adaptive). Stills, Stories, welcome video,
Education, and title film stay on their existing lanes.

## Env (already on Vercel 24frame)

Server-only. Already set for Production / Preview / Development. Do not
create a new Mux environment. Do not prefix `NEXT_PUBLIC_`. Do not
commit values.

```
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
```

Names are listed in `.env.example` as empty placeholders. Agents do not
set values. The secret stays in `src/lib/social-mux-server.ts` — never
the client bundle.

## Encode locks

| Path | `video_quality` | `max_resolution_tier` |
| --- | --- | --- |
| Video (default) | `basic` | `1080p` |
| Go live (~10 min recorder → normal video post) | `plus` | `1080p` |
| Video + “Upload in original quality (up to 4K)” + 4K source | `basic` | `2160p` |

No livestream backend. No Settings quality maze. New uploads use
playback policy `signed`. Playback IDs are stored on `posts.media`
next to the author-bound key. Mux Player still receives the playback
id only; this path does not issue a playback token.

## Auth / cron

No RLS, webhook, or Vercel cron change. Finalize polls Mux in the
signed-in request after the client PUT and rejects the upload unless
`new_asset_settings.passthrough` starts with the session user id.
