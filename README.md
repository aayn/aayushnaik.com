# aayushnaik.com

Personal website and thoughts, built with Astro, React, and Tailwind CSS.

## Development

Use Node.js 26.11.1 (pinned in `.nvmrc`) and npm 12.2.0:

```sh
nvm install
nvm use
npm install --global npm@12.2.0
npm ci
npm run dev
```

Node.js 26 is the current stable release. TypeScript stays on 6.0.3, the newest
release supported by `@astrojs/check`; its current release does not support
TypeScript 7 yet.

## Writing

`/thoughts` is the new writing section. It uses its own content collection;
existing essays are not included.

Add a Markdown or MDX file to `src/content/thoughts/` when ready to publish a piece.
Only `title` is required; `subtitle` is optional:

```md
---
title: Your title
---

Your piece goes here.
```

A file named `your-slug.mdx` appears at `/thoughts/your-slug` and is listed on
`/thoughts`. No importance, confidence, status, or stance fields are required.

The original essays remain in `src/content/essays/` and are served at
`/archive/essays`. Legacy `/essays` URLs redirect to the corresponding archive
URLs. `public/_redirects` supplies HTTP 301 redirects on Cloudflare Pages; Astro
also generates redirect pages for local previews and other static hosts.

## Feature flags

Epistemic metadata is hidden by default. Writing lists and individual pieces
omit importance, confidence, status, and stance. The archived epistemic glossary
redirects to `/archive/essays`, and the epistemic tagline is hidden. Existing essay
frontmatter remains available when the feature is enabled. Thoughts can optionally
use the same fields; pieces without them keep the simpler view.

To restore these features during development or in a production build:

```sh
ENABLE_EPISTEMIC_METADATA=true npm run dev
ENABLE_EPISTEMIC_METADATA=true npm run build
```

The flag is read at build time. Restart the development server or rebuild the site
after changing it. You can also copy `.env.example` to `.env.local` and edit the
flag there. Leaving it unset or setting it to `false` keeps the simpler view.

### Cloudflare Pages

In the Cloudflare dashboard, open **Workers & Pages**, select your Pages project,
then open **Environment variables** in **Settings**. Add `ENABLE_EPISTEMIC_METADATA` with the
value `true` to restore metadata, or leave it unset/set it to `false` for the
simpler writing pages.

Production and Preview deployments can have separate values. For example, keep
Production disabled and enable Preview to inspect the metadata view. Trigger a
new build/deployment after changing the variable; existing deployments retain
the setting they were built with. Keep the usual build command (`npm run build`)
and output directory (`dist`).

See [Cloudflare's build configuration documentation](https://developers.cloudflare.com/pages/configuration/build-configuration/#environment-variables).

## Validation

```sh
npm audit
npm run check
npm test
npm run build
```

Astro uses the unified Markdown processor so the sentence-span remark plugin
runs for MDX essays and supports mobile sidenote expansion.
