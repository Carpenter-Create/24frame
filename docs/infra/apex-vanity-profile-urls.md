# Apex vanity profile URLs

Adam lock: the public canonical is `https://24frame.co/@{handle}`. Preview and share strings already emit that from #267. The product host stays `app.24frame.co`. This repo does not move the dashboard off `app.` and does not take over marketing paths.

In-app destination: `/social/u/@{handle}`. This slice only rewrites `/@{handle}` to that route. Bare `/{handle}` is not mapped, so `/legal`, `/login`, and other apex pages stay untouched.

Reserved vanity names (`admin`, `api`, `www`, `login`, `legal`, plus `auth` / `app` / `portal` / `social`) are not rewritten. Claiming rules for the handle field stay on main (#267) — this slice does not change them.

## What this repo does

- Next.js rewrite + middleware: `/@handle` → `/social/u/@handle`. The URL bar can stay `24frame.co/@handle` when **this** Vercel project serves the request.
- `/@handle` still requires a session (same as the in-app profile). It is not added to the public-path list.

## Manual steps (CoS / Adam) — founder-executed

A Vercel domain is all-or-nothing. Attaching `24frame.co` to project **24frame** sends **every** apex path here, including `/` and `/legal`. Do not do that unless marketing is proxied away first.

### Preferred: keep apex on the marketing project

If `24frame.co` already serves the marketing site (separate Vercel project / `globalcontent-web`):

1. Leave GoDaddy DNS pointing at that project. Do **not** add `24frame.co` to Vercel project `24frame`.
2. On the **marketing** project, add a rewrite (proxy, not redirect) so the bar can stay `24frame.co/@handle`:

```json
{
  "rewrites": [
    {
      "source": "/@:handle",
      "destination": "https://app.24frame.co/@:handle"
    }
  ]
}
```

3. Confirm `/`, `/legal`, and other marketing paths still resolve on the marketing project.

### Only if apex should be served by this project

1. Vercel → project **24frame** → Settings → Domains → add `24frame.co` (and `www.24frame.co` if used). Use the records Vercel shows; they win over any remembered IP.
2. Typical GoDaddy records when Vercel owns the zone target:
   - Apex `A` `@` → `76.76.21.21`
   - `www` `CNAME` → `cname.vercel-dns.com` (or the host Vercel prints)
3. Then add a **fallback rewrite on this project** for every non-`/@` path to the live marketing deployment URL. Without that, `/` and `/legal` 404 or render the dashboard. Do not migrate the marketing site into this repo.

Session cookies are issued on `app.24frame.co`. An apex rewrite keeps the URL only when the browser already has a cookie this host can read. Cross-subdomain cookie domain is a separate founder auth change — not in this slice.

Production domain add, DNS, and any marketing-project rewrite stay founder-executed.
