# Shubham's Thoughts

A minimal stream of short thoughts. Astro renders the newest 50 thoughts on the
homepage, with older entries on paginated pages. The public site ships no
client-side JavaScript.

## How thoughts are stored

Thoughts live in `thoughts/YYYY-MM.ndjson` — one JSON object per line, one file
per month:

```json
{"id":"…","publishedAt":"2026-08-04T21:47:00.000Z","source":"text","text":"…"}
```

The repository is the database. Publishing appends a line and commits it; the
site reads those files from GitHub at request time, so a new thought is live as
soon as the commit lands — no rebuild, and no cache to wait out. Feed pages send
`Cache-Control: no-store` deliberately: a shared cache would make a just-published
thought invisible for the length of its lifetime.

Thought text is stored raw and escaped at render time. It is displayed as plain
text with paragraph breaks, not Markdown.

Dates are currently displayed in `America/Los_Angeles`; change the `timeZone`
in `src/components/Thought.astro` if the author's home timezone changes.

## Write a thought by hand

Append a line to the current month's file and push it. Local development reads
the working copy directly when `GITHUB_TOKEN` is unset, so uncommitted thoughts
show up at `localhost:4321` immediately.

## Publish from the web

Open `/write` on the deployed site. Enter the personal publishing key on the
first successful post; that browser keeps it locally until **Forget key** is
selected. Typed thoughts are published exactly as entered.

The publishing page calls one authenticated server endpoint. That endpoint
appends the thought to the current month's file through GitHub's API. If two
thoughts are published at once, GitHub rejects the second write as stale and
the endpoint retries against the newer file rather than overwriting it.

## Publish by voice

The iPhone flow uses Apple Dictation, then sends only the transcript to the
same endpoint. A small AI pass removes fillers and false starts and adds
punctuation without summarizing or rewriting the idea. If AI cleanup is
unavailable, the raw dictation is published so the thought is not lost. Audio
is never uploaded or stored.

Follow [`docs/ios-shortcut.md`](docs/ios-shortcut.md) to install the Shortcut
as a Home Screen icon and assign it to the iPhone Action Button.

## Commands

- `npm run dev` — start the local development server
- `npm run check` — validate Astro and TypeScript
- `npm test` — run the feed-ordering and pagination tests
- `npm run build` — generate the production site in `dist/`
- `npm run preview` — preview the generated site locally

## Deployment

Connect this repository to Vercel. The feed pages and `POST /api/thoughts` both
run as Vercel Functions. Rendering a feed page costs two GitHub API calls, which
is far inside the 5,000/hour authenticated rate limit at personal-site traffic.
There is no database — see "How thoughts are stored".

`GITHUB_TOKEN` is required for the site to render, not just to publish: without
it, deployed feed pages have nothing to read.

Copy the values from `.env.example` into the Vercel project's environment
variables:

- `PUBLISH_TOKEN` — generate with `openssl rand -hex 32`; use the same value in
  `/write` and the iPhone Shortcut
- `GITHUB_TOKEN` — a fine-grained personal access token restricted to
  `ShubhamPatilsd/stream-of-consciousness` with **Contents: Read and write**
  permission
- `OPENAI_API_KEY` — optional but required for voice cleanup
- `OPENAI_CLEANUP_MODEL` — optional; defaults to `gpt-5.4-nano`

Do not prefix these names with `PUBLIC_`. Redeploy after changing environment
variables. If the publishing key is exposed, rotate `PUBLISH_TOKEN` in Vercel,
redeploy, use **Forget key** in each browser, and update the iPhone Shortcut.

The endpoint only writes files under `thoughts/`. GitHub's
Contents permission applies repository-wide, so keep that token server-side;
it does not need Actions or Workflows permission. Publishing commits to
`main`, so Vercel must be configured to deploy that branch.
