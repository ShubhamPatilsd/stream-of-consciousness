# Shubham's Thoughts

A minimal, statically generated stream of short thoughts. Astro renders the
newest 50 thoughts into the homepage HTML, with older entries available on
prebuilt paginated pages. The public site ships no client-side JavaScript.

## Write a thought

Create a Markdown file in `src/content/thoughts/`. The filename is only an
identifier, so using the date and a short description keeps the directory
readable:

```md
---
publishedAt: 2026-08-04T14:47:00-07:00
---

Write the thought here. Markdown links and basic formatting work.
```

`publishedAt` must include a timezone offset. An optional `title` field is
supported, but untitled thoughts are the default. Commit and push the file to
publish it through the connected deployment provider.

Dates are currently displayed in `America/Los_Angeles`; change the `timeZone`
in `src/components/Thought.astro` if the author's home timezone changes.

## Publish from the web

Open `/write` on the deployed site. Enter the personal publishing key on the
first successful post; that browser keeps it locally until **Forget key** is
selected. Typed thoughts are published exactly as entered.

The publishing page calls one authenticated server endpoint. That endpoint
creates a Markdown file through GitHub's API, which triggers a fresh static
Vercel deployment. The thought appears after that deployment completes rather
than immediately after the form succeeds.

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

Connect this repository to Vercel. Astro prerenders the public feed, while only
`POST /api/thoughts` runs as a Vercel Function. There is no database.

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

The endpoint only creates files under the thought content directory. GitHub's
Contents permission applies repository-wide, so keep that token server-side;
it does not need Actions or Workflows permission. Publishing commits to
`main`, so Vercel must be configured to deploy that branch.
