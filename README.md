# aayushnaik.com

Personal website and essays, built with Astro, React, and Tailwind CSS.

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

## Validation

```sh
npm audit
npm run check
npm test
npm run build
```

Astro uses the unified Markdown processor so the sentence-span remark plugin
runs for MDX essays and supports mobile sidenote expansion.
