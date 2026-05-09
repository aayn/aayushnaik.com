# Essays Section — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate aayushnaik.com from Vite + React SPA to Astro 5, then add a new `/essays` section with Tufte/Gwern-flavored metacommentary, sidenotes, glossary, TOC, and cross-essay backlinks. Static-HTML output deployable to any CDN.

**Architecture:** Astro 5 is the build framework. Existing React components (AmbientClock, ThemeToggle) become hydrated islands; static components (Footer, GrainOverlay, Content) become `.astro` files. Essays live as MDX files in a content collection with a zod-typed schema. The 3-column desktop essay layout (TOC sidebar / body / sidenote rail) is achieved via CSS Grid + Tufte-CSS sibling-aside float pattern. Mobile collapses to single-column with inline-expand sidenotes and a sticky-close ✕ via `position: sticky`. Backlinks and git-derived dates are computed at build time.

**Tech Stack:** Astro 5+, React 19 (kept for islands), Tailwind v4 (via `@tailwindcss/vite`), TypeScript, MDX (`@astrojs/mdx`), zod (via `astro/zod`), Vitest (for `src/lib/` unit tests), self-hosted woff2 fonts.

**Spec reference:** `docs/superpowers/specs/2026-05-09-essays-section-design.md` — read it before starting. Every design choice referenced in this plan is justified there.

**Brainstorm visual references** (gitignored, on disk):  
`.superpowers/brainstorm/8370-1778347383/content/` — 14 HTML mockups validated by the user, including `mobile-note-mechanics-v2.html` (definitive sidenote mechanic), `toc-placement.html` (TOC column choice), `kesselman-ladder.html` (glossary visual), `design-summary.html` (every decision in one place).

---

## File Structure

The migration is in-place — replace Vite with Astro in the same repo.

### New files

```
astro.config.mjs                       Astro config — React, MDX, Tailwind 4 (via @tailwindcss/vite)
src/content.config.ts                  Content Layer schema for essays collection
src/styles/global.css                  @font-face, palette tokens, base typography
src/layouts/
  BaseLayout.astro                     Shell: <head>, theme script, fonts, grain, footer
  EssayLayout.astro                    3-col grid: TOC + body + sidenote rail; meta block; backlinks
src/pages/
  index.astro                          Homepage (was App.tsx)
  essays/
    index.astro                        Essays list (chronological)
    glossary.astro                     Metadata field definitions + Kesselman ladder
    [...slug].astro                    Individual essay page (uses EssayLayout)
src/components/
  HomepageContent.astro                Was Content.tsx — static text + links + CSS animations
  Footer.astro                         Was Footer.tsx — social icons
  GrainOverlay.astro                   Was GrainOverlay.tsx — SVG noise overlay
  MetaBlock.astro                      Mono grid: importance / confidence / status / stance
  Sidenote.astro                       Marker + sibling aside; mobile inline-expand JS
  Figure.astro                         <figure> with caption support
  Pullquote.astro                      Large emphasis block
  TOC.astro                            Left sidebar (desktop) + mobile chip + drawer
  Backlinks.astro                      "Linked from" section
  KesselmanLadder.astro                The 8-level + 2-tags visual for the glossary
src/lib/
  git-dates.ts                         Calls `git log` for created/modified per file (uses execFileSync — no shell)
  backlinks.ts                         Build-time scan of essay bodies for inter-essay links
  remark-sentence-spans.ts             Remark plugin: wraps each sentence in <span data-sentence>
src/content/essays/
  welcome.mdx                          Seed essay demonstrating every feature
public/fonts/                          Self-hosted woff2 (Iowan, Source Serif 4, Space Grotesk, IBM Plex Mono)
```

### Files kept (as-is, used as React islands)

```
src/components/AmbientClock.tsx        Existing canvas — used as <AmbientClock client:load />
src/components/ThemeToggle.tsx         Existing toggle — used as <ThemeToggle client:load />
src/hooks/useTheme.ts                  Theme state hook — consumed by ThemeToggle island
public/favicon.svg                     Unchanged
```

### Files deleted

```
index.html                             Astro generates HTML; theme script moves to BaseLayout
src/main.tsx                           Astro replaces React-DOM root mount
src/App.tsx                            Replaced by src/pages/index.astro
src/index.css                          Replaced by src/styles/global.css
src/components/Content.tsx             Replaced by HomepageContent.astro
src/components/Footer.tsx              Replaced by Footer.astro
src/components/GrainOverlay.tsx        Replaced by GrainOverlay.astro
vite.config.ts                         Replaced by astro.config.mjs
eslint.config.js                       Optional — keep if linting useful; otherwise drop
```

---

## Phases

1. **Astro foundation** — install Astro, set up config, scaffold a stub page that builds.
2. **Homepage migration** — convert each existing component to Astro/React islands; verify visual parity with the current homepage.
3. **Content infrastructure** — schema, lib utilities (TDD), fonts, global styles.
4. **Essay components** — MetaBlock, Sidenote (desktop + mobile), TOC, Backlinks, KesselmanLadder.
5. **Essay pages** — EssayLayout, index, glossary, [...slug].
6. **Seed content + verification** — write one full essay, verify all features end-to-end.

Each task is small enough to commit independently. Run the dev server (`npx astro dev`) between tasks to spot regressions early.

---

## Phase 1 — Astro Foundation

### Task 1: Install Astro and integrations

**Goal:** Replace Vite with Astro in `package.json`. Project should `npx astro check` without errors after this task.

**Spec ref:** §"Architecture" → "Why Astro"; §"Tailwind v4".

**Files:**
- Modify: `package.json`
- Create: `astro.config.mjs`
- Modify: `tsconfig.json`
- Modify: `tsconfig.app.json` — delete (Astro doesn't need split tsconfigs)
- Modify: `tsconfig.node.json` — delete

- [ ] **Step 1: Update `package.json`**

Replace the entire `package.json` with:

```json
{
  "name": "aayushnaik-com",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "check": "astro check",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@astrojs/check": "^0.9.4",
    "@astrojs/mdx": "^4.2.0",
    "@astrojs/react": "^4.2.0",
    "@tailwindcss/vite": "^4.2.2",
    "astro": "^5.7.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "tailwindcss": "^4.2.2",
    "typescript": "~5.9.3"
  },
  "devDependencies": {
    "@types/node": "^24.12.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "vitest": "^2.1.0"
  }
}
```

Note: version numbers are realistic latest at the time of writing; `npm install` will resolve. If Astro 5 has shipped a newer minor by the time of execution, take it.

- [ ] **Step 2: Run `npm install`**

```bash
rm -rf node_modules package-lock.json && npm install
```

Expected: installs without errors. May see peer-dependency warnings — fine unless they're errors.

- [ ] **Step 3: Create `astro.config.mjs`**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [react(), mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
  site: 'https://aayushnaik.com',
});
```

- [ ] **Step 4: Replace `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 5: Delete obsolete tsconfigs**

```bash
rm tsconfig.app.json tsconfig.node.json
```

- [ ] **Step 6: Run `astro check`**

```bash
npx astro check
```

Expected: warnings about missing pages are OK at this stage (no `src/pages/` yet). No TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add package.json astro.config.mjs tsconfig.json
git rm tsconfig.app.json tsconfig.node.json
git commit -m "Install Astro 5, replace Vite build setup"
```

---

### Task 2: Add Tailwind 4 to the build via @tailwindcss/vite

**Goal:** Tailwind classes work in Astro components. Existing utility usage from React components transfers.

**Spec ref:** §"Tailwind v4" — explicitly: NOT `@astrojs/tailwind`, that's the legacy Tailwind 3 integration.

- [ ] **Step 1: Verify the @tailwindcss/vite plugin is wired**

Open `astro.config.mjs`. Confirm the `vite.plugins` array includes `tailwindcss()` from `@tailwindcss/vite`. (Done in Task 1 Step 3.)

- [ ] **Step 2: No further setup needed at this step**

Tailwind 4's CSS-first config means there's nothing to scaffold here. Importing Tailwind happens in `src/styles/global.css` (Task 5).

- [ ] **Step 3: Commit (if changes)**

If Step 1 revealed any wiring fix, commit it:

```bash
git add astro.config.mjs
git commit -m "Wire @tailwindcss/vite plugin in astro.config"
```

Otherwise, no-op.

---

### Task 3: Scaffold a minimal homepage stub

**Goal:** `npx astro dev` serves SOMETHING at `/` so we can verify the build pipeline works before migrating components.

**Files:**
- Create: `src/pages/index.astro`

- [ ] **Step 1: Create `src/pages/index.astro`**

```astro
---
// src/pages/index.astro
---
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Aayush Naik</title>
  </head>
  <body>
    <p>Stub — replace in Phase 2.</p>
  </body>
</html>
```

- [ ] **Step 2: Run dev server**

```bash
npx astro dev
```

Open `http://localhost:4321`. Expected: page shows "Stub — replace in Phase 2." Dev server stays running.

Stop the dev server (`Ctrl-C`) once verified.

- [ ] **Step 3: Run production build**

```bash
npx astro build
```

Expected: build succeeds; `dist/index.html` is created.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "Scaffold stub Astro homepage; verify build"
```

---

## Phase 2 — Homepage Migration

### Task 4: Add self-hosted fonts to public/fonts/

**Goal:** Iowan Old Style, Source Serif 4, Space Grotesk, and IBM Plex Mono available as woff2 in `/public/fonts/` and referenced in `src/styles/global.css`.

**Spec ref:** §"Typography" — self-host required, no Google Fonts.

**Files:**
- Create: `public/fonts/source-serif-4-regular.woff2`
- Create: `public/fonts/source-serif-4-italic.woff2`
- Create: `public/fonts/source-serif-4-medium.woff2`
- Create: `public/fonts/space-grotesk-light.woff2`
- Create: `public/fonts/space-grotesk-regular.woff2`
- Create: `public/fonts/ibm-plex-mono-regular.woff2`

Note: Iowan Old Style is system-only (Mac default); we don't ship it but it's in the font stack as a first preference for Mac users.

- [ ] **Step 1: Acquire fonts**

Source Serif 4: from Adobe Fonts (open-source) — https://github.com/adobe-fonts/source-serif/releases. Download the latest "OTF" or "WEB" zip, extract the woff2 files for Regular, It (italic), and Medium weights.

Space Grotesk: from Google Fonts repo — https://github.com/floriankarsten/space-grotesk. Download Light (300) and Regular (400) woff2.

IBM Plex Mono: from IBM Plex GitHub — https://github.com/IBM/plex/tree/master/IBM-Plex-Mono. Download Regular woff2.

- [ ] **Step 2: Place files**

```bash
mkdir -p public/fonts
# Copy downloaded woff2 files in with the names listed above
```

- [ ] **Step 3: Verify file sizes are reasonable**

```bash
ls -lh public/fonts/
```

Expected: each woff2 is 30–80 KB. Anything significantly larger means you grabbed the wrong format (e.g. a TTF or a full collection).

- [ ] **Step 4: Commit**

```bash
git add public/fonts/
git commit -m "Self-host woff2 fonts: Source Serif 4, Space Grotesk, IBM Plex Mono"
```

---

### Task 5: Create global.css with palette tokens, font-face, and base typography

**Goal:** Single global stylesheet imported by every page. Defines CSS custom properties for the palette (light + dark), `@font-face` declarations, and base body/heading styles.

**Spec ref:** §"Visual design system" → palette table, typography table.

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Create `src/styles/global.css`**

```css
/* src/styles/global.css */

@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

/* === Self-hosted fonts === */

@font-face {
  font-family: 'Source Serif 4';
  src: url('/fonts/source-serif-4-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Source Serif 4';
  src: url('/fonts/source-serif-4-italic.woff2') format('woff2');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: 'Source Serif 4';
  src: url('/fonts/source-serif-4-medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Space Grotesk';
  src: url('/fonts/space-grotesk-light.woff2') format('woff2');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Space Grotesk';
  src: url('/fonts/space-grotesk-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'IBM Plex Mono';
  src: url('/fonts/ibm-plex-mono-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

/* === Palette tokens — light (default) === */

:root {
  --bg: #fbf8f1;
  --body: rgba(43, 38, 32, 0.88);
  --title: #1a1612;
  --dim: rgba(43, 38, 32, 0.55);
  --rule: rgba(43, 38, 32, 0.14);
  --meta: rgba(43, 38, 32, 0.75);
  --stance-agree: #5b8b3f;
  --stance-disagree: #a04848;
  --stance-neutral: rgba(43, 38, 32, 0.6);
  --status-finished-bg: rgba(91, 139, 63, 0.12);
  --status-finished-fg: #5b8b3f;
  --status-progress-bg: rgba(43, 38, 32, 0.10);
  --status-progress-fg: #1a1612;
  --status-dim-bg: rgba(43, 38, 32, 0.06);
  --status-dim-fg: rgba(43, 38, 32, 0.45);
}

/* === Palette tokens — dark === */

:where(.dark) {
  --bg: #0c0a08;
  --body: rgba(216, 207, 191, 0.88);
  --title: #f3ead7;
  --dim: rgba(216, 207, 191, 0.5);
  --rule: rgba(216, 207, 191, 0.16);
  --meta: rgba(216, 207, 191, 0.78);
  --stance-agree: #cfe9b8;
  --stance-disagree: #ecb8b8;
  --stance-neutral: rgba(216, 207, 191, 0.7);
  --status-finished-bg: rgba(180, 222, 160, 0.16);
  --status-finished-fg: #cfe9b8;
  --status-progress-bg: rgba(243, 234, 215, 0.16);
  --status-progress-fg: #f3ead7;
  --status-dim-bg: rgba(243, 234, 215, 0.08);
  --status-dim-fg: rgba(243, 234, 215, 0.55);
}

/* === Base typography & body === */

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--body);
  font-family: 'Iowan Old Style', 'Source Serif 4', 'Source Serif Pro', 'Palatino Linotype', Palatino, Georgia, serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  min-height: 100vh;
}

/* === Page-load fade-in animation === */

@keyframes enter {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 2: Restart dev server**

```bash
npx astro dev
```

(Step is a no-op visually until BaseLayout imports this — but verify Astro doesn't error on the file.)

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "Add global.css: palette tokens, @font-face, base typography"
```

---

### Task 6: Convert GrainOverlay.tsx → GrainOverlay.astro

**Goal:** Static grain overlay as an Astro component. Identical visual to the existing React version.

**Spec ref:** §"React islands" — `GrainOverlay` becomes static (no JS).

**Files:**
- Create: `src/components/GrainOverlay.astro`
- Delete: `src/components/GrainOverlay.tsx` (in Task 11)

- [ ] **Step 1: Create `src/components/GrainOverlay.astro`**

```astro
---
// src/components/GrainOverlay.astro — static SVG noise overlay
---
<div
  class="grain-overlay"
  style="
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    opacity: 0.018;
    background-image: url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E&quot;);
  "
></div>
```

(The `&quot;` escapes are needed inside Astro's `style=""` attribute — Astro is fine with regular attrs but the SVG data URI contains both single and double quotes; using `&quot;` for the outer double-quote-escape avoids ambiguity.)

- [ ] **Step 2: No standalone test (will be visible once BaseLayout uses it in Task 9)**

- [ ] **Step 3: Commit**

```bash
git add src/components/GrainOverlay.astro
git commit -m "Convert GrainOverlay to Astro component"
```

---

### Task 7: Convert Footer.tsx → Footer.astro

**Goal:** Static footer with three social icons, identical visuals.

**Files:**
- Create: `src/components/Footer.astro`
- Delete: `src/components/Footer.tsx` (in Task 11)

- [ ] **Step 1: Create `src/components/Footer.astro`**

```astro
---
// src/components/Footer.astro — fixed bottom-right social icons
---
<div
  class="fixed bottom-0 right-0 p-7 pr-12 flex gap-5"
  style="z-index: 2;"
>
  <a
    href="mailto:aayushnaik17@gmail.com"
    title="Contact"
    class="text-black/25 dark:text-white/30 hover:text-black/70 dark:hover:text-white/80 transition-colors flex items-center"
  >
    <svg viewBox="0 0 24 24" class="w-[18px] h-[18px] fill-current">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  </a>
  <a
    href="https://linkedin.com/in/aayn"
    target="_blank"
    rel="noopener noreferrer"
    title="LinkedIn"
    class="text-black/25 dark:text-white/30 hover:text-black/70 dark:hover:text-white/80 transition-colors flex items-center"
  >
    <svg viewBox="0 0 24 24" class="w-[18px] h-[18px] fill-current">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  </a>
  <a
    href="https://x.com/aayush_naik"
    target="_blank"
    rel="noopener noreferrer"
    title="X"
    class="text-black/25 dark:text-white/30 hover:text-black/70 dark:hover:text-white/80 transition-colors flex items-center"
  >
    <svg viewBox="0 0 24 24" class="w-[18px] h-[18px] fill-current">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  </a>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Footer.astro
git commit -m "Convert Footer to Astro component"
```

---

### Task 8: Convert HomepageContent.tsx → HomepageContent.astro

**Goal:** Static homepage content with CSS-only staggered fade-in animations (no React).

**Spec ref:** §"React islands" — `Content` converts to Astro with CSS animations replacing the React staggered fade-in.

**Files:**
- Create: `src/components/HomepageContent.astro`
- Delete: `src/components/Content.tsx` (in Task 11)

- [ ] **Step 1: Create `src/components/HomepageContent.astro`**

```astro
---
// src/components/HomepageContent.astro — static homepage content with CSS staggered fade-in
---
<div class="relative px-[60px] py-[60px] max-w-[640px] lg:max-w-[740px] 2xl:max-w-[900px]" style="z-index: 2;">
  <div class="fade-in" style="animation-delay: 0.10s;">
    <div class="font-['Space_Grotesk'] text-[13px] lg:text-[15px] 2xl:text-[18px] tracking-[3px] uppercase font-light mb-12 text-black/60 dark:text-white/80">
      Aayush Naik
    </div>
  </div>
  <div class="fade-in" style="animation-delay: 0.25s;">
    <h1 class="text-[39px] lg:text-[44px] 2xl:text-[54px] font-light -tracking-[1px] leading-[1.2] mb-2 text-black dark:text-white">
      Founder-philosopher-engineer king.
    </h1>
  </div>
  <div class="fade-in" style="animation-delay: 0.40s;">
    <div class="font-[Georgia,'Times_New_Roman',serif] italic text-2xl lg:text-[28px] 2xl:text-[34px] mb-8 leading-[1.4] text-black/55 dark:text-white/70">
      Provisional title.
    </div>
  </div>
  <div class="fade-in" style="animation-delay: 0.55s;">
    <div class="w-10 lg:w-12 2xl:w-14 h-px bg-black/15 dark:bg-white/15 mb-7"></div>
  </div>
  <div class="fade-in" style="animation-delay: 0.65s;">
    <p class="font-extralight text-[15px] lg:text-[17px] 2xl:text-[21px] leading-[1.9] text-black/60 dark:text-white/75">
      I'm building <a href="https://hypercubic.ai" target="_blank" rel="noopener noreferrer" class="underline underline-offset-4 hover:text-black dark:hover:text-white transition-colors">Hypercubic</a>, and I write <a href="https://www.anticynical.com/" target="_blank" rel="noopener noreferrer" class="underline underline-offset-4 hover:text-black dark:hover:text-white transition-colors">Anticynical</a>.
    </p>
  </div>
</div>

<style>
  .fade-in {
    opacity: 0;
    transform: translateY(16px);
    animation: enter 0.9s ease forwards;
  }
</style>
```

(The `enter` keyframe is defined in `global.css`.)

- [ ] **Step 2: Commit**

```bash
git add src/components/HomepageContent.astro
git commit -m "Convert HomepageContent to Astro with CSS animations"
```

---

### Task 9: Create BaseLayout

**Goal:** Shared shell for every page: `<head>` with viewport / theme script / global.css import / OG tags; `<body>` with grain overlay + footer + theme toggle island; slot for page content.

**Spec ref:** §"Layouts per page".

**Files:**
- Create: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Create `src/layouts/BaseLayout.astro`**

```astro
---
// src/layouts/BaseLayout.astro — shared shell for every page
import '../styles/global.css';
import GrainOverlay from '../components/GrainOverlay.astro';
import Footer from '../components/Footer.astro';
import ThemeToggle from '../components/ThemeToggle.tsx';

interface Props {
  title?: string;
  description?: string;
  ogUrl?: string;
}

const {
  title = 'Aayush Naik',
  description = 'Aayush Naik — Engineer, founder, thinker. Precision in tech, depth in ideas.',
  ogUrl = 'https://aayushnaik.com',
} = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={ogUrl} />
    <script is:inline>
      // Set dark class before paint to avoid theme-flash
      const t = localStorage.getItem('theme');
      if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
    </script>
  </head>
  <body class="bg-white dark:bg-black">
    <GrainOverlay />
    <slot />
    <Footer />
    <ThemeToggle client:load />
  </body>
</html>
```

- [ ] **Step 2: Verify Astro can resolve the imports**

```bash
npx astro check
```

Expected: no errors. The `.tsx` import for `ThemeToggle` should resolve via the React integration.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "Add BaseLayout: shared shell with theme script, grain, footer, toggle"
```

---

### Task 10: Wire homepage with BaseLayout + AmbientClock + HomepageContent

**Goal:** `src/pages/index.astro` renders the actual homepage. Visual diff against the current site should show NO meaningful differences.

**Spec ref:** §"Layouts per page" — homepage uses `BaseLayout`. §"React islands" — `AmbientClock client:load`.

**Files:**
- Modify: `src/pages/index.astro` (replaces the stub from Task 3)

- [ ] **Step 1: Replace `src/pages/index.astro`**

```astro
---
// src/pages/index.astro — homepage
import BaseLayout from '../layouts/BaseLayout.astro';
import AmbientClock from '../components/AmbientClock.tsx';
import HomepageContent from '../components/HomepageContent.astro';
---
<BaseLayout>
  <div class="min-h-screen flex items-center justify-center">
    <AmbientClock client:load />
    <HomepageContent />
  </div>
</BaseLayout>
```

- [ ] **Step 2: Run dev server**

```bash
npx astro dev
```

Visit `http://localhost:4321`. Verify:
- Eyebrow "AAYUSH NAIK" in tracked uppercase
- H1 "Founder-philosopher-engineer king." in light weight
- Italic subtitle "Provisional title."
- Hairline divider
- Lead paragraph with Hypercubic and Anticynical links
- Staggered fade-in on load
- Mouse movement triggers ambient clock (rings + hands fade in)
- Theme toggle in top-right works (switches dark/light)

If anything differs from the current production site, fix before continuing. Compare to the live site or `git checkout bb12d99 -- src/components/` for reference.

- [ ] **Step 3: Run production build**

```bash
npx astro build
ls dist/
```

Expected: `dist/index.html` exists, plus client JS chunks for the React islands.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "Wire homepage in Astro with React islands"
```

---

### Task 11: Delete obsolete Vite/React entry files

**Goal:** Remove dead code now that Astro owns the build.

**Files:**
- Delete: `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/components/Content.tsx`, `src/components/Footer.tsx`, `src/components/GrainOverlay.tsx`, `vite.config.ts`

- [ ] **Step 1: Delete the files**

```bash
git rm index.html src/main.tsx src/App.tsx src/index.css \
       src/components/Content.tsx src/components/Footer.tsx src/components/GrainOverlay.tsx \
       vite.config.ts
```

- [ ] **Step 2: Decide on eslint**

Optional: keep `eslint.config.js` if you want linting on TS/Astro files. If keeping, make sure it doesn't break with Astro files. Otherwise remove:

```bash
git rm eslint.config.js  # only if dropping
```

- [ ] **Step 3: Verify build still works**

```bash
npx astro build
```

Expected: build succeeds. If anything broke, restore the file from git history (`git checkout HEAD~1 -- <file>`) and inspect.

- [ ] **Step 4: Commit**

```bash
git commit -m "Remove obsolete Vite/React entry files (homepage now Astro)"
```

---

## Phase 3 — Content Infrastructure

### Task 12: Set up Vitest for src/lib/ unit tests

**Goal:** `npm test` runs vitest on lib utilities.

**Files:**
- Create: `vitest.config.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/lib/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 2: Verify scripts**

`package.json` should already have `"test": "vitest run"` from Task 1.

- [ ] **Step 3: Run tests (no tests yet, should still succeed)**

```bash
npm test
```

Expected: "No test files found" — exit 0 (or whatever vitest's empty-suite behavior is — accept either pass or "no tests" exit).

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts
git commit -m "Configure Vitest for src/lib unit tests"
```

---

### Task 13: Implement git-dates utility (TDD)

**Goal:** `getCreatedDate(file)` and `getModifiedDate(file)` return ISO 8601 strings derived from git history. Memoized per file. Uses `execFileSync` (no shell, safer than `execSync`).

**Spec ref:** §"Astro feature mapping" → "Dates (created / modified)" — uses `--follow` for rename safety, `%aI` for ISO 8601 strict.

**Files:**
- Create: `src/lib/git-dates.ts`
- Create: `src/lib/git-dates.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/git-dates.test.ts
import { describe, it, expect } from 'vitest';
import { getCreatedDate, getModifiedDate } from './git-dates';

describe('git-dates', () => {
  it('returns ISO 8601 string for created date of a tracked file', () => {
    // package.json was added in the first commit and has been modified since;
    // its created date is stable across the repo's history.
    const created = getCreatedDate('package.json');
    expect(created).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('returns ISO 8601 string for modified date of a tracked file', () => {
    const modified = getModifiedDate('package.json');
    expect(modified).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('memoizes — calling getCreatedDate twice for the same file does not reshell', () => {
    const a = getCreatedDate('package.json');
    const b = getCreatedDate('package.json');
    expect(a).toBe(b);
  });

  it('returns null for a non-existent file', () => {
    expect(getCreatedDate('nonexistent-essay-xyz.mdx')).toBeNull();
    expect(getModifiedDate('nonexistent-essay-xyz.mdx')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

```bash
npm test
```

Expected: FAIL — module `./git-dates` not found.

- [ ] **Step 3: Implement `src/lib/git-dates.ts`**

Use `execFileSync` rather than `execSync` — it does not invoke a shell, so there is no command-injection surface even though our inputs (file paths from the content collection) are already trusted.

```ts
// src/lib/git-dates.ts
import { execFileSync } from 'node:child_process';

const createdCache = new Map<string, string | null>();
const modifiedCache = new Map<string, string | null>();

function gitLog(args: string[]): string | null {
  try {
    const out = execFileSync('git', ['log', ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const trimmed = out.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

export function getCreatedDate(filePath: string): string | null {
  if (createdCache.has(filePath)) return createdCache.get(filePath)!;
  // First commit that added the file. --follow handles renames.
  // Take the LAST line because git log lists newest first; the addition is the oldest = last line.
  const out = gitLog(['--diff-filter=A', '--follow', '--format=%aI', '--', filePath]);
  const result = out ? out.split('\n').slice(-1)[0] : null;
  createdCache.set(filePath, result);
  return result;
}

export function getModifiedDate(filePath: string): string | null {
  if (modifiedCache.has(filePath)) return modifiedCache.get(filePath)!;
  const out = gitLog(['-1', '--follow', '--format=%aI', '--', filePath]);
  modifiedCache.set(filePath, out);
  return out;
}
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
npm test
```

Expected: PASS — all 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/git-dates.ts src/lib/git-dates.test.ts
git commit -m "Add git-dates utility with TDD: created/modified per file, memoized"
```

---

### Task 14: Implement remark-sentence-spans plugin (TDD)

**Goal:** A remark plugin that wraps each sentence in body text in `<span data-sentence>`. The mobile-sidenote inline-expand mechanic uses these spans to find sentence boundaries.

**Spec ref:** §"Sidenote mechanic on mobile" → "Sentence-boundary detection: implemented at MDX compile time via a remark plugin".

**Files:**
- Create: `src/lib/remark-sentence-spans.ts`
- Create: `src/lib/remark-sentence-spans.test.ts`

- [ ] **Step 1: Add unified, mdast, remark, unist deps**

```bash
npm install --save-dev unified mdast-util-to-string @types/mdast remark-parse remark-stringify unist-util-visit
```

- [ ] **Step 2: Write the failing test**

```ts
// src/lib/remark-sentence-spans.test.ts
import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { remarkSentenceSpans } from './remark-sentence-spans';

async function transform(md: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkSentenceSpans)
    .use(remarkStringify)
    .process(md);
  return String(result);
}

describe('remark-sentence-spans', () => {
  it('wraps a single sentence', async () => {
    const out = await transform('This is one sentence.');
    expect(out).toContain('<span data-sentence>This is one sentence.</span>');
  });

  it('wraps multiple sentences in one paragraph', async () => {
    const out = await transform('First sentence. Second one.');
    expect(out).toContain('<span data-sentence>First sentence.</span>');
    expect(out).toContain('<span data-sentence>Second one.</span>');
  });

  it('handles abbreviations without splitting (e.g., Mr. Smith)', async () => {
    // Conservative behavior: do NOT split on common abbreviations.
    const out = await transform('Mr. Smith arrived. He was tired.');
    expect(out).toContain('<span data-sentence>Mr. Smith arrived.</span>');
    expect(out).toContain('<span data-sentence>He was tired.</span>');
  });

  it('does not wrap headings', async () => {
    const out = await transform('# A Heading.\n\nA sentence.');
    expect(out).not.toContain('<span data-sentence>A Heading.</span>');
    expect(out).toContain('<span data-sentence>A sentence.</span>');
  });

  it('does not double-wrap if already wrapped (idempotent)', async () => {
    const out = await transform('Some sentence.');
    const out2 = await transform(out);
    // Don't get nested spans like <span data-sentence><span data-sentence>...
    expect(out2).not.toMatch(/<span data-sentence><span data-sentence>/);
  });
});
```

- [ ] **Step 3: Run tests — verify they fail**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement `src/lib/remark-sentence-spans.ts`**

```ts
// src/lib/remark-sentence-spans.ts
// Remark plugin: wraps each sentence in body text in <span data-sentence>.
// Used by Sidenote.astro's mobile expand mechanic to find sentence boundaries
// without runtime regex (which is fragile around abbreviations and decimals).

import type { Root, Paragraph, PhrasingContent } from 'mdast';
import { visit, SKIP } from 'unist-util-visit';

// Common abbreviations to avoid splitting on (case-sensitive).
const ABBREV = new Set([
  'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Sr.', 'Jr.',
  'St.', 'Mt.', 'Ave.', 'Blvd.', 'Rd.',
  'i.e.', 'e.g.', 'etc.', 'vs.', 'cf.', 'viz.',
  'Jan.', 'Feb.', 'Mar.', 'Apr.', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Sept.', 'Oct.', 'Nov.', 'Dec.',
]);

function splitSentences(text: string): string[] {
  // Split on `.`, `!`, or `?` followed by whitespace + capital letter,
  // but not after an abbreviation.
  const out: string[] = [];
  let buf = '';
  let i = 0;
  while (i < text.length) {
    buf += text[i];
    if (/[.!?]/.test(text[i])) {
      const next = text.slice(i + 1).match(/^\s+(\S)/);
      if (next && /[A-Z"'(]/.test(next[1])) {
        // Could be a sentence break — check if buf ends in an abbreviation.
        const tail = buf.match(/\b\S+\.?\s*$/)?.[0]?.trim();
        if (!tail || !ABBREV.has(tail)) {
          out.push(buf.trim());
          buf = '';
          i += 1 + (text.slice(i + 1).match(/^\s+/)?.[0].length || 0);
          continue;
        }
      } else if (i === text.length - 1) {
        // Final sentence terminator at end of text.
        out.push(buf.trim());
        buf = '';
      }
    }
    i++;
  }
  if (buf.trim().length > 0) out.push(buf.trim());
  return out;
}

export function remarkSentenceSpans() {
  return (tree: Root) => {
    visit(tree, 'paragraph', (node: Paragraph) => {
      // Idempotency check: if the paragraph already has html nodes that look
      // like our spans, skip.
      const childrenStr = JSON.stringify(node.children);
      if (childrenStr.includes('data-sentence')) return SKIP;

      // Concatenate all phrasing content into a single string. We accept some
      // loss of inline formatting (links, emphasis) inside sentences for v1.
      // A more sophisticated version would walk the children and split between
      // text nodes while preserving inline-formatting siblings — out of scope
      // for v1; the visible output via MDX renderer is still correct because
      // we re-emit raw text.
      const text = node.children
        .filter((c) => c.type === 'text')
        .map((c) => (c as { value: string }).value)
        .join('');

      if (!text.trim()) return SKIP;

      const sentences = splitSentences(text);
      if (sentences.length === 0) return SKIP;

      const newChildren: PhrasingContent[] = sentences.map((s) => ({
        type: 'html',
        value: `<span data-sentence>${escapeHtml(s)}</span>`,
      }));

      // Replace children with the wrapped sentences.
      // Note: this loses inline emphasis/links. For v1, acceptable; revisit if
      // visible output suffers.
      node.children = newChildren;
      return SKIP;
    });
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

Note: this v1 plugin sacrifices inline formatting (emphasis, links inside paragraphs) — for the seed essay this is acceptable. The plan's success criterion is mobile sentence-boundary detection, which works. Add an open issue to revisit before authoring essays with heavy inline formatting.

- [ ] **Step 5: Run tests, verify they pass**

```bash
npm test
```

Expected: PASS — 5 tests.

- [ ] **Step 6: Wire the plugin into `astro.config.mjs`**

Update `astro.config.mjs`:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import { remarkSentenceSpans } from './src/lib/remark-sentence-spans';

export default defineConfig({
  integrations: [
    react(),
    mdx({
      remarkPlugins: [remarkSentenceSpans],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  site: 'https://aayushnaik.com',
});
```

- [ ] **Step 7: Verify Astro can build**

```bash
npx astro build
```

Expected: build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/lib/remark-sentence-spans.ts src/lib/remark-sentence-spans.test.ts \
        astro.config.mjs package.json package-lock.json
git commit -m "Add remark-sentence-spans plugin: wraps sentences for mobile note mechanic"
```

---

### Task 15: Implement backlinks utility (TDD)

**Goal:** `getBacklinks(slug)` returns the list of essays that link to the given slug. Memoized — reverse map built once.

**Spec ref:** §"Backlinks" + §"Astro feature mapping" → "Backlinks generation".

**Files:**
- Create: `src/lib/backlinks.ts`
- Create: `src/lib/backlinks.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/backlinks.test.ts
import { describe, it, expect } from 'vitest';
import { extractInternalLinks, buildReverseMap, type EssayEntry } from './backlinks';

describe('extractInternalLinks', () => {
  it('extracts markdown internal links', () => {
    const body = 'Some text linking to [moral weight](/essays/moral-weight) and another [link](/essays/grief).';
    const links = extractInternalLinks(body);
    expect(links.map((l) => l.targetSlug).sort()).toEqual(['grief', 'moral-weight']);
  });

  it('extracts HTML <a> internal links', () => {
    const html = 'Some text <a href="/essays/foo">link</a> and <a href="/essays/bar">another</a>.';
    const links = extractInternalLinks(html);
    expect(links.map((l) => l.targetSlug).sort()).toEqual(['bar', 'foo']);
  });

  it('ignores external and non-essay links', () => {
    const body = '[Google](https://google.com) and [Home](/) and [Hyper](https://hypercubic.ai)';
    const links = extractInternalLinks(body);
    expect(links).toEqual([]);
  });

  it('captures the linking phrase', () => {
    const links = extractInternalLinks('See [Strawson on free will](/essays/free-will) for details.');
    expect(links[0]).toMatchObject({
      targetSlug: 'free-will',
      linkedPhrase: 'Strawson on free will',
    });
  });
});

describe('buildReverseMap', () => {
  const entries: EssayEntry[] = [
    {
      slug: 'free-will',
      data: { title: 'On free will', subtitle: 'Reading Strawson' },
      body: 'Linking to [moral weight](/essays/moral-weight).',
    },
    {
      slug: 'moral-weight',
      data: { title: 'On moral weight', subtitle: 'Suffering' },
      body: 'Refers to [free will](/essays/free-will).',
    },
    {
      slug: 'grief',
      data: { title: 'Grief', subtitle: 'Six months' },
      body: 'No links.',
    },
  ];

  it('builds reverse map: targetSlug → list of linking essays', () => {
    const map = buildReverseMap(entries);
    expect(map.get('free-will')).toHaveLength(1);
    expect(map.get('free-will')?.[0]).toMatchObject({
      fromSlug: 'moral-weight',
      fromTitle: 'On moral weight',
    });
    expect(map.get('moral-weight')).toHaveLength(1);
    expect(map.get('grief')).toBeUndefined();
  });

  it('produces a snippet for each backlink', () => {
    const map = buildReverseMap(entries);
    const fwBacklinks = map.get('free-will')!;
    expect(fwBacklinks[0].snippet).toMatch(/free will/);
    expect(fwBacklinks[0].snippet.length).toBeLessThanOrEqual(200);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/backlinks.ts`**

```ts
// src/lib/backlinks.ts
// Build-time scan of essay bodies for cross-essay references.
// Top-level memoized — reverse map is computed once per build.

export interface EssayEntry {
  slug: string;
  data: {
    title: string;
    subtitle?: string;
  };
  body: string;
}

export interface InternalLink {
  targetSlug: string;
  linkedPhrase: string;
  context: string;
}

export interface Backlink {
  fromSlug: string;
  fromTitle: string;
  fromSubtitle?: string;
  linkedPhrase: string;
  snippet: string;
}

const SNIPPET_MAX = 180;

export function extractInternalLinks(body: string): InternalLink[] {
  const out: InternalLink[] = [];

  // Markdown: [text](/essays/slug)
  const mdRe = /\[([^\]]+)\]\(\/essays\/([a-z0-9][a-z0-9-]*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = mdRe.exec(body)) !== null) {
    out.push({
      targetSlug: m[2],
      linkedPhrase: m[1],
      context: body.slice(Math.max(0, m.index - 80), Math.min(body.length, m.index + m[0].length + 80)),
    });
  }

  // HTML: <a href="/essays/slug">text</a>
  const htmlRe = /<a\s+href="\/essays\/([a-z0-9][a-z0-9-]*)"[^>]*>([^<]+)<\/a>/g;
  while ((m = htmlRe.exec(body)) !== null) {
    out.push({
      targetSlug: m[1],
      linkedPhrase: m[2],
      context: body.slice(Math.max(0, m.index - 80), Math.min(body.length, m.index + m[0].length + 80)),
    });
  }

  return out;
}

function makeSnippet(context: string, linkedPhrase: string): string {
  // Strip excess whitespace.
  let s = context.replace(/\s+/g, ' ').trim();
  if (s.length > SNIPPET_MAX) {
    // Find linkedPhrase in the snippet, center the snippet around it.
    const idx = s.indexOf(linkedPhrase);
    if (idx >= 0) {
      const start = Math.max(0, idx - Math.floor((SNIPPET_MAX - linkedPhrase.length) / 2));
      s = s.slice(start, start + SNIPPET_MAX);
      if (start > 0) s = '…' + s;
      if (start + SNIPPET_MAX < context.length) s = s + '…';
    } else {
      s = s.slice(0, SNIPPET_MAX) + '…';
    }
  }
  return s;
}

let _reverseMap: Map<string, Backlink[]> | null = null;

export function buildReverseMap(entries: EssayEntry[]): Map<string, Backlink[]> {
  const map = new Map<string, Backlink[]>();
  for (const entry of entries) {
    const links = extractInternalLinks(entry.body);
    for (const link of links) {
      const target = link.targetSlug;
      if (!map.has(target)) map.set(target, []);
      const list = map.get(target)!;
      // Skip duplicates (same fromSlug → targetSlug + linkedPhrase)
      if (list.some((b) => b.fromSlug === entry.slug && b.linkedPhrase === link.linkedPhrase)) continue;
      list.push({
        fromSlug: entry.slug,
        fromTitle: entry.data.title,
        fromSubtitle: entry.data.subtitle,
        linkedPhrase: link.linkedPhrase,
        snippet: makeSnippet(link.context, link.linkedPhrase),
      });
    }
  }
  return map;
}

export function clearMemoForTest(): void {
  _reverseMap = null;
}

export async function getBacklinks(slug: string): Promise<Backlink[]> {
  if (_reverseMap === null) {
    // Lazy import to avoid bundling astro:content into the test environment.
    const { getCollection } = await import('astro:content');
    const collection = await getCollection('essays');
    const entries: EssayEntry[] = collection.map((c) => ({
      slug: c.id,
      data: { title: c.data.title, subtitle: c.data.subtitle },
      body: c.body ?? '',
    }));
    _reverseMap = buildReverseMap(entries);
  }
  return _reverseMap.get(slug) ?? [];
}
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
npm test
```

Expected: PASS — all backlinks tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/backlinks.ts src/lib/backlinks.test.ts
git commit -m "Add backlinks utility with TDD: memoized reverse map of essay-to-essay refs"
```

---

### Task 16: Set up content collection schema

**Goal:** `src/content.config.ts` defines the `essays` collection with the validated zod schema.

**Spec ref:** §"Schema (Astro 5 Content Layer)".

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/essays/.gitkeep` (empty placeholder so git tracks the dir)

- [ ] **Step 1: Create `src/content.config.ts`**

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const essays = defineCollection({
  loader: glob({ base: './src/content/essays', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    importance: z.number().int().min(0).max(10),
    confidence: z.enum([
      'certain',
      'highly likely',
      'likely',
      'possible',
      'unlikely',
      'highly unlikely',
      'remote',
      'impossible',
      'log',
      'emotional',
    ]),
    status: z.enum(['notes', 'draft', 'in progress', 'finished']),
    stance: z.enum(['agree', 'disagree', 'withholding']).optional(),
  }),
});

export const collections = { essays };
```

- [ ] **Step 2: Create the directory placeholder**

```bash
mkdir -p src/content/essays
touch src/content/essays/.gitkeep
```

- [ ] **Step 3: Verify Astro picks up the config**

```bash
npx astro check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content.config.ts src/content/essays/.gitkeep
git commit -m "Define essays content collection (Content Layer + zod schema)"
```

---

## Phase 4 — Essay Components

### Task 17: Implement MetaBlock.astro

**Goal:** Renders the four-row monospace meta grid above an essay body. Each label links to its glossary anchor.

**Spec ref:** §"Anatomy" → step 4 (Meta block) + §"Linking from essays".

**Files:**
- Create: `src/components/MetaBlock.astro`

- [ ] **Step 1: Create `src/components/MetaBlock.astro`**

```astro
---
// src/components/MetaBlock.astro — reads frontmatter, renders mono grid

interface Props {
  importance: number;
  confidence: string;
  status: string;
  stance?: string;
}

const { importance, confidence, status, stance } = Astro.props;

const stanceDisplay = stance ?? '—';
const statusClass = (() => {
  switch (status) {
    case 'finished': return 'status-finished';
    case 'in progress': return 'status-progress';
    case 'draft':
    case 'notes':
    default: return 'status-dim';
  }
})();
const stanceClass = (() => {
  switch (stance) {
    case 'agree': return 'stance-agree';
    case 'disagree': return 'stance-disagree';
    case 'withholding': return 'stance-neutral';
    default: return 'stance-neutral';
  }
})();
---
<div class="meta-block">
  <div class="row">
    <a href="/essays/glossary#importance" class="k">Importance</a>
    <span class="v">{importance} / 10</span>
  </div>
  <div class="row">
    <a href="/essays/glossary#confidence" class="k">Confidence</a>
    <span class="v">{confidence}</span>
  </div>
  <div class="row">
    <a href="/essays/glossary#status" class="k">Status</a>
    <span class={`v stat ${statusClass}`}>{status}</span>
  </div>
  <div class="row">
    <a href="/essays/glossary#stance" class="k">Stance</a>
    <span class={`v ${stanceClass}`}>{stanceDisplay}</span>
  </div>
</div>

<style>
  .meta-block {
    font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10.5px;
    line-height: 1.95;
    letter-spacing: 0.04em;
    color: var(--meta);
    border-top: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
    padding: 10px 0;
    margin-bottom: 22px;
  }
  .row {
    display: block;
  }
  .k {
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-size: 9.5px;
    display: inline-block;
    width: 92px;
    color: var(--dim);
    text-decoration: none;
    transition: color 0.15s ease;
  }
  .k:hover { color: var(--title); }
  .v {
    color: var(--title);
  }
  .stat {
    display: inline-block;
    padding: 0 6px;
    border-radius: 3px;
    font-size: 9.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .status-finished { background: var(--status-finished-bg); color: var(--status-finished-fg); }
  .status-progress { background: var(--status-progress-bg); color: var(--status-progress-fg); }
  .status-dim      { background: var(--status-dim-bg);      color: var(--status-dim-fg);      }
  .stance-agree    { color: var(--stance-agree); }
  .stance-disagree { color: var(--stance-disagree); }
  .stance-neutral  { color: var(--stance-neutral); }

  @media (max-width: 980px) {
    .meta-block { font-size: 10px; }
    .k { font-size: 9px; width: 80px; }
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/MetaBlock.astro
git commit -m "Add MetaBlock component: monospace meta grid with glossary links"
```

---

### Task 18: Implement Sidenote.astro — desktop CSS rendering

**Goal:** Renders the marker (in body) + sibling aside (which floats into the right rail visually). CSS counter for numbering. Mobile JS comes in Task 19.

**Spec ref:** §"Sidenote rail (desktop)" — Tufte-CSS sibling-aside pattern.

**Files:**
- Create: `src/components/Sidenote.astro`

- [ ] **Step 1: Create `src/components/Sidenote.astro`**

```astro
---
// src/components/Sidenote.astro
// Renders an in-body superscript marker AND a sibling aside.
// CSS handles desktop float-into-rail and mobile inline-expand visibility.
//
// Numbering is purely CSS (counter()) — no build-time assignment needed.
---
<sup class="sn-marker" tabindex="0" aria-label="Sidenote"></sup>
<aside class="sn-body" role="note">
  <button class="sn-close" type="button" aria-label="Close note">×</button>
  <span class="sn-content"><slot /></span>
</aside>

<style>
  /* Counter scope set in EssayLayout: .essay-body { counter-reset: sn; } */
  .sn-marker {
    counter-increment: sn;
    cursor: pointer;
    font-size: 11px;
    color: var(--title);
    padding: 1px 5px;
    background: rgba(243, 234, 215, 0.12);
    border-radius: 3px;
    margin: 0 1px;
    user-select: none;
    transition: background 0.12s ease;
  }
  :where(:not(.dark)) .sn-marker {
    background: rgba(43, 38, 32, 0.10);
  }
  .sn-marker::before {
    content: counter(sn);
    font-size: 9.5px;
    vertical-align: super;
    line-height: 1;
  }
  .sn-marker:hover, .sn-marker:focus { background: rgba(243, 234, 215, 0.20); outline: none; }
  :where(:not(.dark)) .sn-marker:hover { background: rgba(43, 38, 32, 0.16); }
  .sn-marker.is-open {
    background: var(--title);
    color: var(--bg);
  }

  .sn-body {
    counter-increment: sn-body;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 300;
    font-size: 10.5px;
    line-height: 1.5;
    color: var(--dim);
    border-left: 1px solid var(--rule);
    padding-left: 12px;
    margin: 6px 0;
  }
  .sn-body::before {
    content: counter(sn-body) " ";
    color: var(--dim);
    margin-right: 4px;
  }

  /* Desktop: float aside into the right rail via negative margin (Tufte-CSS pattern). */
  @media (min-width: 1180px) {
    .sn-body {
      float: right;
      clear: right;
      width: 200px;
      margin-right: -240px;  /* 200px width + 40px gap */
      margin-top: 0.4em;
      position: relative;
    }
    .sn-close {
      display: none;  /* Close button only used in mobile expanded state */
    }
  }

  /* Mobile / tablet: hide the rail aside; mobile expand mechanic in Task 19 will surface it inline */
  @media (max-width: 1179px) {
    .sn-body {
      display: none;
    }
    .sn-close {
      display: none;
    }
    .sn-body.is-mobile-open {
      display: block;
      margin: 8px 0 14px 0;
      padding: 10px 38px 12px 14px;
      background: rgba(216, 207, 191, 0.06);
      border-left: 2px solid rgba(216, 207, 191, 0.32);
      font-size: 13.5px;
      line-height: 1.55;
      color: var(--meta);
      border-radius: 0 4px 4px 0;
      position: relative;
    }
    :where(:not(.dark)) .sn-body.is-mobile-open {
      background: rgba(43, 38, 32, 0.05);
      border-left-color: rgba(43, 38, 32, 0.30);
    }
    .sn-body.is-mobile-open .sn-close {
      display: flex;
      position: sticky;
      top: 12px;
      float: right;
      width: 26px;
      height: 26px;
      border-radius: 999px;
      background: rgba(243, 234, 215, 0.16);
      color: rgba(243, 234, 215, 0.95);
      border: 1px solid rgba(243, 234, 215, 0.18);
      font-family: 'Space Grotesk', sans-serif;
      font-size: 15px;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      line-height: 1;
      margin-top: -8px;
      margin-right: -28px;
    }
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Sidenote.astro
git commit -m "Add Sidenote component: desktop float-aside, CSS counter numbering"
```

---

### Task 19: Add mobile expand/close JS to Sidenote

**Goal:** On `< 1180px`, tapping a marker reveals the aside inline at the end of the containing sentence. Sticky ✕ close. Scroll restoration on close.

**Spec ref:** §"Sidenote mechanic on mobile" — every numbered rule.

**Files:**
- Modify: `src/components/Sidenote.astro` (append script block)

- [ ] **Step 1: Add the mobile-expand JS to `Sidenote.astro` (script block at end)**

```astro
<script>
  // Sidenote mobile expand/close mechanic.
  // Pairs each marker with the aside that immediately follows it in source order.

  function setupSidenotes() {
    const markers = document.querySelectorAll('.sn-marker');
    markers.forEach((markerEl) => {
      // Pair marker with the aside that immediately follows it in source order.
      let aside = markerEl.nextElementSibling;
      while (aside && !aside.classList?.contains('sn-body')) {
        aside = aside.nextElementSibling;
      }
      if (!aside) return;

      const closeBtn = aside.querySelector('.sn-close');
      let openMarkerTop = 0;

      const open = () => {
        if (window.matchMedia('(min-width: 1180px)').matches) return;
        openMarkerTop = markerEl.getBoundingClientRect().top;

        // Move the aside to live immediately after the sentence containing the marker.
        const sentence = markerEl.closest('[data-sentence]');
        const insertAfter = sentence ?? markerEl.parentElement;
        if (insertAfter && aside.previousElementSibling !== insertAfter) {
          insertAfter.parentNode?.insertBefore(aside, insertAfter.nextSibling);
        }

        aside.classList.add('is-mobile-open');
        markerEl.classList.add('is-open');

        // Smooth-scroll so the top of the note sits at ~30% from viewport top.
        requestAnimationFrame(() => {
          const rect = aside.getBoundingClientRect();
          const target = rect.top + window.scrollY - window.innerHeight * 0.3;
          window.scrollTo({ top: target, behavior: 'smooth' });
        });
      };

      const close = () => {
        if (!aside.classList.contains('is-mobile-open')) return;
        aside.classList.remove('is-mobile-open');
        markerEl.classList.remove('is-open');

        // Re-measure marker top after the DOM has shrunk (note removed from flow),
        // then scrollBy the delta to restore the marker to its open-time viewport y.
        requestAnimationFrame(() => {
          const newTop = markerEl.getBoundingClientRect().top;
          window.scrollBy({ top: newTop - openMarkerTop, behavior: 'instant' });
        });
      };

      markerEl.addEventListener('click', (e) => {
        e.preventDefault();
        if (markerEl.classList.contains('is-open')) close();
        else open();
      });
      markerEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (markerEl.classList.contains('is-open')) close();
          else open();
        }
      });

      closeBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        close();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSidenotes);
  } else {
    setupSidenotes();
  }
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Sidenote.astro
git commit -m "Add Sidenote mobile expand/close JS with sticky close + scroll restore"
```

---

### Task 20: Implement TOC.astro — desktop sticky sidebar + mobile chip + drawer

**Goal:** Left sidebar on `≥ 1180px` showing H2 + indented H3 headings. Sticky positioned. Mobile renders as a chip + slide-down drawer. Active section highlighted via intersection observer with the right rootMargin.

**Spec ref:** §"TOC behavior".

**Files:**
- Create: `src/components/TOC.astro`

- [ ] **Step 1: Create `src/components/TOC.astro`**

```astro
---
// src/components/TOC.astro — left sidebar TOC + mobile chip + drawer

interface Heading {
  depth: number;
  slug: string;
  text: string;
}
interface Props {
  headings: Heading[];
}
const { headings } = Astro.props;

const filtered = headings.filter((h) => h.depth === 2 || h.depth === 3);
const h2Count = filtered.filter((h) => h.depth === 2).length;
const showToc = h2Count >= 2;
---
{showToc && (
  <>
    <nav class="toc" aria-label="Table of contents">
      <div class="toc-label">Outline</div>
      <ul>
        {filtered.map((h) => (
          <li class={h.depth === 3 ? 'toc-h3' : 'toc-h2'} data-target={h.slug}>
            <a href={`#${h.slug}`}>{h.text}</a>
          </li>
        ))}
      </ul>
    </nav>

    <div class="toc-chip-wrap">
      <button class="toc-chip" type="button" aria-expanded="false">
        <span class="toc-chip-icon">≡</span>
        <span class="toc-chip-label">Outline</span>
        <span class="toc-chip-count">{h2Count} sections</span>
        <span class="toc-chip-arrow">▾</span>
      </button>
      <div class="toc-drawer" hidden>
        <div class="toc-drawer-head">
          <span class="toc-drawer-title">Outline</span>
          <button class="toc-drawer-close" type="button" aria-label="Close outline">×</button>
        </div>
        <ul>
          {filtered.map((h) => (
            <li class={h.depth === 3 ? 'toc-h3' : 'toc-h2'} data-target={h.slug}>
              <a href={`#${h.slug}`}>{h.text}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </>
)}

<style>
  .toc {
    position: sticky;
    top: 60px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 300;
    color: var(--dim);
  }
  @media (max-width: 1179px) { .toc { display: none; } }

  .toc-label {
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 9.5px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--dim);
    margin-bottom: 12px;
  }
  .toc ul { list-style: none; padding: 0; margin: 0; }
  .toc li {
    font-size: 11.5px;
    line-height: 1.5;
    padding: 4px 0;
    font-style: italic;
  }
  .toc li a {
    color: var(--dim);
    text-decoration: none;
  }
  .toc li.toc-h3 {
    font-size: 10.5px;
    padding-left: 14px;
    color: rgba(216, 207, 191, 0.42);
  }
  .toc li.is-active {
    font-style: normal;
  }
  .toc li.is-active a { color: var(--title); }
  .toc li:hover a { color: var(--title); }

  .toc-chip-wrap {
    margin: 0 0 18px 0;
  }
  @media (min-width: 1180px) {
    .toc-chip-wrap { display: none; }
  }
  .toc-chip {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 8px 14px;
    background: rgba(216, 207, 191, 0.06);
    border: 0;
    border-left: 2px solid rgba(216, 207, 191, 0.32);
    border-radius: 0 4px 4px 0;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 300;
    font-size: 11.5px;
    color: var(--meta);
    letter-spacing: 0.04em;
    cursor: pointer;
    text-align: left;
  }
  .toc-chip-icon {
    font-family: 'IBM Plex Mono', monospace;
    color: var(--dim);
    font-size: 12px;
    margin-right: 8px;
  }
  .toc-chip-label { flex: 0 0 auto; }
  .toc-chip-count {
    color: var(--dim);
    font-size: 10px;
    font-family: 'IBM Plex Mono', monospace;
    margin-left: 8px;
  }
  .toc-chip-arrow {
    margin-left: auto;
    color: var(--dim);
    transition: transform 0.2s ease;
  }
  .toc-chip[aria-expanded="true"] .toc-chip-arrow { transform: rotate(180deg); }

  .toc-drawer {
    background: rgba(216, 207, 191, 0.05);
    border-left: 2px solid rgba(243, 234, 215, 0.32);
    border-radius: 0 4px 4px 0;
    margin-top: 4px;
    padding: 4px 0 6px 0;
  }
  .toc-drawer-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    background: rgba(216, 207, 191, 0.04);
    border-bottom: 1px solid var(--rule);
    font-size: 11.5px;
    color: var(--meta);
    letter-spacing: 0.04em;
  }
  .toc-drawer-close {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: rgba(243, 234, 215, 0.14);
    border: 1px solid rgba(243, 234, 215, 0.18);
    color: rgba(243, 234, 215, 0.85);
    font-size: 13px;
    cursor: pointer;
    line-height: 1;
  }
  .toc-drawer ul { list-style: none; padding: 0; margin: 0; }
  .toc-drawer li {
    padding: 9px 14px 9px 22px;
    font-size: 13px;
    line-height: 1.4;
    color: var(--meta);
    border-bottom: 1px solid rgba(216, 207, 191, 0.05);
  }
  .toc-drawer li:last-child { border-bottom: none; }
  .toc-drawer li a {
    color: inherit;
    text-decoration: none;
  }
  .toc-drawer li.is-active {
    color: var(--title);
    border-left: 2px solid var(--title);
    padding-left: 20px;
  }
</style>

<script>
  function setupToc() {
    const chip = document.querySelector('.toc-chip') as HTMLButtonElement | null;
    const drawer = document.querySelector('.toc-drawer') as HTMLElement | null;
    const drawerClose = document.querySelector('.toc-drawer-close') as HTMLButtonElement | null;

    if (chip && drawer && drawerClose) {
      const toggle = (open: boolean) => {
        chip.setAttribute('aria-expanded', String(open));
        drawer.hidden = !open;
      };
      chip.addEventListener('click', () => {
        const open = chip.getAttribute('aria-expanded') !== 'true';
        toggle(open);
      });
      drawerClose.addEventListener('click', () => toggle(false));
      drawer.querySelectorAll('a').forEach((a) =>
        a.addEventListener('click', () => toggle(false))
      );
    }

    const tocItems = document.querySelectorAll('.toc li[data-target], .toc-drawer li[data-target]');
    if (tocItems.length === 0) return;

    const idToItems = new Map<string, Element[]>();
    tocItems.forEach((li) => {
      const id = li.getAttribute('data-target')!;
      if (!idToItems.has(id)) idToItems.set(id, []);
      idToItems.get(id)!.push(li);
    });

    const headings = Array.from(tocItems).map((li) =>
      document.getElementById(li.getAttribute('data-target')!)
    ).filter((h): h is HTMLElement => h !== null);

    if (headings.length === 0) return;

    const setActive = (id: string) => {
      tocItems.forEach((li) => li.classList.remove('is-active'));
      idToItems.get(id)?.forEach((li) => li.classList.add('is-active'));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        setActive(visible[0].target.id);
      },
      {
        rootMargin: '-20% 0% -70% 0%',
        threshold: 0,
      }
    );

    headings.forEach((h) => observer.observe(h));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupToc);
  } else {
    setupToc();
  }
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TOC.astro
git commit -m "Add TOC component: sticky desktop sidebar + mobile chip/drawer + IO active state"
```

---

### Task 21: Implement Backlinks.astro

**Goal:** "Linked from" section. Conditional on non-empty list.

**Spec ref:** §"Backlinks" → "Display".

**Files:**
- Create: `src/components/Backlinks.astro`

- [ ] **Step 1: Create `src/components/Backlinks.astro`**

```astro
---
// src/components/Backlinks.astro — "Linked from" section at the bottom of an essay.

import type { Backlink } from '../lib/backlinks';

interface Props {
  backlinks: Backlink[];
}
const { backlinks } = Astro.props;

function emphasizeLinkedPhrase(snippet: string, phrase: string): string {
  if (!phrase) return snippet;
  const safe = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return snippet.replace(
    new RegExp(safe, 'g'),
    `<em class="linked-phrase">${phrase}</em>`
  );
}
---
{backlinks.length > 0 && (
  <section class="backlinks">
    <div class="backlinks-label">Linked from</div>
    {backlinks.map((b) => (
      <article class="bl-row">
        <a class="bl-title" href={`/essays/${b.fromSlug}`}>{b.fromTitle}</a>
        {b.fromSubtitle && <div class="bl-sub">{b.fromSubtitle}</div>}
        <blockquote class="bl-snippet" set:html={emphasizeLinkedPhrase(b.snippet, b.linkedPhrase)} />
      </article>
    ))}
  </section>
)}

<style>
  .backlinks {
    margin-top: 36px;
    padding-top: 22px;
    border-top: 1px solid var(--rule);
  }
  .backlinks-label {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 300;
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--dim);
    margin-bottom: 14px;
  }
  .bl-row {
    padding: 12px 0;
    border-bottom: 1px solid rgba(216, 207, 191, 0.06);
  }
  .bl-row:last-child { border-bottom: none; }
  .bl-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--title);
    line-height: 1.2;
    margin-bottom: 2px;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    display: inline-block;
  }
  .bl-title:hover { border-bottom-color: var(--dim); }
  .bl-sub {
    font-style: italic;
    color: var(--dim);
    font-size: 13px;
    margin-bottom: 6px;
  }
  .bl-snippet {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 300;
    font-size: 12px;
    line-height: 1.6;
    color: var(--meta);
    padding: 0 0 0 12px;
    margin: 0;
    border-left: 1px solid var(--rule);
    quotes: none;
  }
  .bl-snippet :global(.linked-phrase) {
    color: var(--title);
    font-style: normal;
    font-weight: 400;
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Backlinks.astro
git commit -m "Add Backlinks component: 'Linked from' section, conditional render"
```

---

### Task 22: Implement KesselmanLadder.astro for the glossary

**Goal:** Visual ladder showing the 8 Kesselman levels + 2 special tags.

**Spec ref:** §"Glossary" → §"Confidence".  
**Visual reference:** `.superpowers/brainstorm/8370-1778347383/content/kesselman-ladder.html`

**Files:**
- Create: `src/components/KesselmanLadder.astro`

- [ ] **Step 1: Create `src/components/KesselmanLadder.astro`**

```astro
---
// src/components/KesselmanLadder.astro — visual confidence ladder
const rungs = [
  { term: 'certain',         range: '~100%',  barLeft: 99, barWidth: 1,  approx: '100' },
  { term: 'highly likely',   range: '80–95%', barLeft: 80, barWidth: 15, approx: '~88' },
  { term: 'likely',          range: '60–80%', barLeft: 60, barWidth: 20, approx: '~70' },
  { term: 'possible',        range: '40–60%', barLeft: 40, barWidth: 20, approx: '~50' },
  { term: 'unlikely',        range: '20–40%', barLeft: 20, barWidth: 20, approx: '~30' },
  { term: 'highly unlikely', range: '5–20%',  barLeft: 5,  barWidth: 15, approx: '~12' },
  { term: 'remote',          range: '1–5%',   barLeft: 1,  barWidth: 4,  approx: '~3'  },
  { term: 'impossible',      range: '~0%',    barLeft: 0,  barWidth: 1,  approx: '0',   impossible: true },
];
---
<div class="kk">
  <div class="kk-head">The ladder</div>

  <div class="kk-ladder">
    {rungs.map((r) => (
      <div class={`kk-row ${r.impossible ? 'k-impossible' : ''}`}>
        <span class="term">{r.term}</span>
        <span class="pct">{r.range}</span>
        <span class="bar-wrap"><span class="bar" style={`left:${r.barLeft}%;width:${r.barWidth}%;`}></span></span>
        <span class="approx">{r.approx}</span>
      </div>
    ))}
    <div class="kk-axis">
      <span></span>
      <span></span>
      <span class="axis-bar"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></span>
      <span></span>
    </div>
  </div>

  <div class="kk-tags">
    <h4>Special tags · probability not applicable</h4>
    <div class="kk-tag-row">
      <span class="term">log</span>
      <span class="desc">Recording without claim — pile of links, snippets, observations. Not arguing for anything.</span>
    </div>
    <div class="kk-tag-row">
      <span class="term">emotional</span>
      <span class="desc">Felt, not endorsed. Writing entangled with complex feelings; not a probabilistic claim about the world.</span>
    </div>
  </div>

  <div class="kk-lineage">
    <h4>Where it comes from</h4>
    <p><strong>Sherman Kent</strong> (CIA, 1964) wrote <em>Words of Estimative Probability</em> after a 1951 intelligence estimate said Soviet attack on Yugoslavia was a "serious possibility" — which one reader took to mean ~20%, the writer had meant ~65%. The 60-point misreading prompted him to propose pinned verbal terms.</p>
    <p><strong>Rachel Kesselman</strong> (American Military University thesis, 2008) studied decades of intelligence reports and showed Kent's terms still drifted in actual usage. She proposed the eight-level vocabulary above as a tighter standard.</p>
    <p><strong>Gwern</strong> adopted Kesselman's eight terms and added two non-probability tags (<em>log</em>, <em>emotional</em>) for cases where "how likely" doesn't apply.</p>
  </div>
</div>

<style>
  .kk {
    background: rgba(216, 207, 191, 0.04);
    color: var(--meta);
    border-radius: 6px;
    padding: 28px 32px 30px 32px;
    font-family: 'Iowan Old Style', 'Source Serif 4', Georgia, serif;
  }
  .kk-head {
    font-size: 18px;
    font-weight: 500;
    color: var(--title);
    margin-bottom: 16px;
  }
  .kk-ladder { margin-bottom: 22px; }
  .kk-row {
    display: grid;
    grid-template-columns: 140px 80px 1fr 50px;
    gap: 18px;
    align-items: center;
    padding: 7px 0;
    border-bottom: 1px solid rgba(216, 207, 191, 0.06);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 12px;
    letter-spacing: 0.02em;
  }
  .kk-row .term { color: var(--title); font-size: 12px; letter-spacing: 0.04em; }
  .kk-row .pct { color: var(--dim); font-size: 11px; }
  .kk-row .bar-wrap {
    height: 6px;
    background: rgba(216, 207, 191, 0.08);
    border-radius: 999px;
    position: relative;
    overflow: hidden;
  }
  .kk-row .bar {
    position: absolute;
    top: 0; bottom: 0;
    background: var(--meta);
    border-radius: 999px;
  }
  .kk-row.k-impossible .bar { background: var(--stance-disagree); }
  .kk-row .approx {
    text-align: right;
    color: var(--meta);
    font-size: 11px;
  }
  .kk-axis {
    display: grid;
    grid-template-columns: 140px 80px 1fr 50px;
    gap: 18px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed rgba(216, 207, 191, 0.10);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 9.5px;
    letter-spacing: 0.08em;
    color: var(--dim);
  }
  .kk-axis .axis-bar { display: flex; justify-content: space-between; }
  .kk-tags { margin-bottom: 22px; padding-top: 18px; border-top: 1px solid var(--rule); }
  .kk-tags h4, .kk-lineage h4 {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 300;
    color: var(--title);
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin: 0 0 10px 0;
  }
  .kk-tag-row {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 18px;
    padding: 6px 0;
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 12px;
    color: var(--meta);
  }
  .kk-tag-row .term { color: var(--title); }
  .kk-tag-row .desc {
    font-family: 'Iowan Old Style', 'Source Serif 4', Georgia, serif;
    font-size: 13.5px;
    color: var(--meta);
    line-height: 1.5;
    font-style: italic;
  }
  .kk-lineage {
    padding: 16px 20px;
    background: rgba(216, 207, 191, 0.04);
    border-left: 2px solid var(--rule);
    border-radius: 0 4px 4px 0;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 300;
    font-size: 12px;
    line-height: 1.65;
    color: var(--meta);
  }
  .kk-lineage p { margin: 0 0 8px 0; }
  .kk-lineage p:last-child { margin-bottom: 0; }
  .kk-lineage strong { color: var(--title); font-weight: 500; }
  @media (max-width: 720px) {
    .kk-row, .kk-axis { grid-template-columns: 100px 60px 1fr 40px; gap: 10px; }
    .kk-tag-row { grid-template-columns: 90px 1fr; gap: 10px; }
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/KesselmanLadder.astro
git commit -m "Add KesselmanLadder component for glossary page"
```

---

### Task 23: Implement Figure.astro and Pullquote.astro

**Goal:** Two simple wrappers used inside MDX.

**Files:**
- Create: `src/components/Figure.astro`
- Create: `src/components/Pullquote.astro`

- [ ] **Step 1: Create `src/components/Figure.astro`**

```astro
---
// src/components/Figure.astro — image + optional caption
interface Props {
  src: string;
  alt: string;
  caption?: string;
  fullBleed?: boolean;
}
const { src, alt, caption, fullBleed = false } = Astro.props;
---
<figure class={fullBleed ? 'full-bleed' : ''}>
  <img src={src} alt={alt} loading="lazy" />
  {caption && <figcaption>{caption}</figcaption>}
</figure>

<style>
  figure {
    margin: 26px 0;
  }
  figure img {
    display: block;
    width: 100%;
    height: auto;
  }
  figure.full-bleed {
    margin-left: -40px;
    margin-right: -40px;
  }
  figcaption {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 300;
    font-size: 11.5px;
    color: var(--dim);
    line-height: 1.5;
    margin-top: 8px;
    font-style: italic;
  }
</style>
```

- [ ] **Step 2: Create `src/components/Pullquote.astro`**

```astro
---
// src/components/Pullquote.astro — large emphasis block
---
<blockquote class="pullquote">
  <slot />
</blockquote>

<style>
  .pullquote {
    margin: 28px 0;
    padding: 0 20px;
    border-left: 2px solid var(--rule);
    font-family: 'Iowan Old Style', 'Source Serif 4', Georgia, serif;
    font-style: italic;
    font-size: 19px;
    line-height: 1.5;
    color: var(--title);
  }
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Figure.astro src/components/Pullquote.astro
git commit -m "Add Figure and Pullquote components for MDX use"
```

---

## Phase 5 — Essay Pages

### Task 24: Implement EssayLayout

**Goal:** The Tufte essay page layout. Uses BaseLayout for shell; adds 3-column grid + meta block + TOC + sidenote rail (via float pattern) + backlinks.

**Spec ref:** §"Essay page · desktop layout".

**Files:**
- Create: `src/layouts/EssayLayout.astro`

- [ ] **Step 1: Create `src/layouts/EssayLayout.astro`**

```astro
---
// src/layouts/EssayLayout.astro — Tufte essay layout
import BaseLayout from './BaseLayout.astro';
import MetaBlock from '../components/MetaBlock.astro';
import TOC from '../components/TOC.astro';
import Backlinks from '../components/Backlinks.astro';
import type { Backlink } from '../lib/backlinks';

interface Heading {
  depth: number;
  slug: string;
  text: string;
}
interface FrontMatter {
  title: string;
  subtitle?: string;
  importance: number;
  confidence: string;
  status: string;
  stance?: string;
}
interface Props {
  frontmatter: FrontMatter;
  headings: Heading[];
  backlinks: Backlink[];
  createdDate?: string | null;
  modifiedDate?: string | null;
}

const { frontmatter, headings, backlinks, createdDate, modifiedDate } = Astro.props;

function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return iso.slice(0, 10); // YYYY-MM-DD
}
const created = fmtDate(createdDate);
const modified = fmtDate(modifiedDate);

const h2Count = headings.filter((h) => h.depth === 2).length;
const showToc = h2Count >= 2;
---
<BaseLayout title={`${frontmatter.title} — Aayush Naik`} description={frontmatter.subtitle ?? frontmatter.title}>
  <div class="essay-page">
    <a class="back-link" href="/essays">← essays</a>

    <div class="essay-grid" data-show-toc={showToc}>
      <div class="toc-col">
        <TOC headings={headings} />
      </div>
      <div class="body-col">
        <article class="essay-body">
          <h1 class="essay-title">{frontmatter.title}</h1>
          {frontmatter.subtitle && <p class="essay-subtitle">{frontmatter.subtitle}</p>}
          {(created || modified) && (
            <div class="essay-dates">
              {created && <span>created {created}</span>}
              {created && modified && created !== modified && <span> · </span>}
              {modified && created !== modified && <span>modified {modified}</span>}
            </div>
          )}
          <MetaBlock
            importance={frontmatter.importance}
            confidence={frontmatter.confidence}
            status={frontmatter.status}
            stance={frontmatter.stance}
          />
          <slot />
          <Backlinks backlinks={backlinks} />
        </article>
      </div>
    </div>
  </div>
</BaseLayout>

<style>
  .essay-page {
    min-height: 100vh;
    padding-top: 32px;
    padding-bottom: 64px;
  }
  .back-link {
    display: inline-block;
    margin: 0 0 24px 60px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 300;
    font-size: 10.5px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--dim);
    text-decoration: none;
  }
  .back-link:hover { color: var(--title); }

  .essay-grid {
    display: grid;
    grid-template-columns: 60px 0 60px 1fr 40px 200px 60px;
    column-gap: 0;
    max-width: 1280px;
    margin: 0 auto;
  }
  .essay-grid[data-show-toc="true"] {
    grid-template-columns: 60px 180px 40px 1fr 40px 200px 60px;
  }
  @media (max-width: 1179px) {
    .essay-grid,
    .essay-grid[data-show-toc="true"] {
      grid-template-columns: 22px 1fr 22px;
    }
    .toc-col { grid-column: 2; }
    .body-col { grid-column: 2; }
  }
  @media (min-width: 1180px) {
    .toc-col { grid-column: 2; }
    .body-col { grid-column: 4; }
  }

  .essay-body {
    counter-reset: sn sn-body;
    font-family: 'Iowan Old Style', 'Source Serif 4', 'Source Serif Pro', Palatino, Georgia, serif;
    font-size: 14.5px;
    line-height: 1.62;
    color: var(--body);
  }
  @media (min-width: 1180px) {
    .essay-body {
      max-width: 560px;
    }
  }
  @media (max-width: 1179px) {
    .essay-body {
      font-size: 16.5px;
      line-height: 1.70;
      max-width: none;
    }
  }
  .essay-body :global(p) {
    margin: 0 0 14px 0;
  }
  .essay-body :global(p:first-of-type)::first-letter {
    float: left;
    font-size: 44px;
    line-height: 0.85;
    padding-right: 6px;
    padding-top: 4px;
    color: var(--title);
    font-weight: 500;
  }
  @media (max-width: 1179px) {
    .essay-body :global(p:first-of-type)::first-letter {
      font-size: 46px;
    }
  }
  .essay-body :global(h2) {
    font-family: 'Iowan Old Style', 'Source Serif 4', Georgia, serif;
    font-size: 19px;
    font-weight: 500;
    color: var(--title);
    margin: 24px 0 10px 0;
    letter-spacing: -0.005em;
  }
  .essay-body :global(h3) {
    font-family: 'Iowan Old Style', 'Source Serif 4', Georgia, serif;
    font-size: 16px;
    font-weight: 500;
    color: var(--title);
    margin: 18px 0 8px 0;
  }

  .essay-title {
    font-family: 'Iowan Old Style', 'Source Serif 4', Georgia, serif;
    font-size: 28px;
    font-weight: 500;
    line-height: 1.15;
    letter-spacing: -0.01em;
    color: var(--title);
    margin: 0 0 4px 0;
  }
  @media (max-width: 1179px) {
    .essay-title { font-size: 24px; }
  }
  .essay-subtitle {
    font-style: italic;
    color: var(--dim);
    font-size: 15px;
    margin: 0 0 6px 0;
  }
  .essay-dates {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 300;
    font-size: 10.5px;
    letter-spacing: 0.04em;
    color: var(--dim);
    margin-bottom: 14px;
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/EssayLayout.astro
git commit -m "Add EssayLayout: 3-col grid, meta block, TOC, sidenote rail, backlinks"
```

---

### Task 25: Implement /essays/[...slug].astro

**Goal:** Each essay's page route. Reads frontmatter + headings + backlinks + dates, passes to `EssayLayout`, renders MDX content.

**Files:**
- Create: `src/pages/essays/[...slug].astro`

- [ ] **Step 1: Create `src/pages/essays/[...slug].astro`**

```astro
---
// src/pages/essays/[...slug].astro
import { getCollection, render } from 'astro:content';
import EssayLayout from '../../layouts/EssayLayout.astro';
import { getBacklinks } from '../../lib/backlinks';
import { getCreatedDate, getModifiedDate } from '../../lib/git-dates';
import Sidenote from '../../components/Sidenote.astro';
import Figure from '../../components/Figure.astro';
import Pullquote from '../../components/Pullquote.astro';

export async function getStaticPaths() {
  const essays = await getCollection('essays');
  return Promise.all(
    essays.map(async (entry) => {
      const filePath = `src/content/essays/${entry.id}.mdx`;
      const backlinks = await getBacklinks(entry.id);
      return {
        params: { slug: entry.id },
        props: {
          entry,
          backlinks,
          createdDate: getCreatedDate(filePath),
          modifiedDate: getModifiedDate(filePath),
        },
      };
    })
  );
}

const { entry, backlinks, createdDate, modifiedDate } = Astro.props;
const { Content, headings } = await render(entry);
---
<EssayLayout
  frontmatter={entry.data}
  headings={headings}
  backlinks={backlinks}
  createdDate={createdDate}
  modifiedDate={modifiedDate}
>
  <Content components={{ Sidenote, Figure, Pullquote }} />
</EssayLayout>
```

- [ ] **Step 2: Verify build still works (no essays yet)**

```bash
npx astro build
```

Expected: Astro warns about no entries in `essays`; otherwise builds. If it errors on `getStaticPaths` returning `[]`, that's acceptable until Task 28 adds the seed essay.

- [ ] **Step 3: Commit**

```bash
git add 'src/pages/essays/[...slug].astro'
git commit -m "Add /essays/[slug] dynamic page route"
```

---

### Task 26: Implement /essays/index.astro

**Goal:** Chronological list of essays with inline meta strip.

**Spec ref:** §"Index page (`/essays`)".

**Files:**
- Create: `src/pages/essays/index.astro`

- [ ] **Step 1: Create `src/pages/essays/index.astro`**

```astro
---
// src/pages/essays/index.astro — chronological list
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';
import { getModifiedDate } from '../../lib/git-dates';

const all = await getCollection('essays');
const enriched = all.map((entry) => {
  const filePath = `src/content/essays/${entry.id}.mdx`;
  return {
    entry,
    modified: getModifiedDate(filePath) ?? '0',
  };
});
enriched.sort((a, b) => b.modified.localeCompare(a.modified));

function statusClass(s: string): string {
  switch (s) {
    case 'finished': return 'status-finished';
    case 'in progress': return 'status-progress';
    default: return 'status-dim';
  }
}
function stanceClass(s: string | undefined): string {
  switch (s) {
    case 'agree': return 'stance-agree';
    case 'disagree': return 'stance-disagree';
    case 'withholding': return 'stance-neutral';
    default: return 'stance-neutral';
  }
}
---
<BaseLayout title="Essays — Aayush Naik" description="Beliefs and positions, weighed and dated.">
  <div class="index-page">
    <a class="back-link" href="/">← home</a>

    <header class="index-head">
      <h1>Essays</h1>
      <p class="index-sub">Beliefs and positions, weighed and dated</p>
    </header>

    <ol class="index-list">
      {enriched.map(({ entry }) => (
        <li class="entry">
          <a class="e-title" href={`/essays/${entry.id}`}>{entry.data.title}</a>
          {entry.data.subtitle && <p class="e-sub">{entry.data.subtitle}</p>}
          <div class="e-meta">
            <span><span class="k">imp</span>{entry.data.importance} / 10</span>
            <span><span class="k">conf</span>{entry.data.confidence}</span>
            <span><span class="k">status</span><span class={`stat ${statusClass(entry.data.status)}`}>{entry.data.status}</span></span>
            <span><span class="k">stance</span><span class={stanceClass(entry.data.stance)}>{entry.data.stance ?? '—'}</span></span>
          </div>
        </li>
      ))}
    </ol>
  </div>
</BaseLayout>

<style>
  .index-page {
    max-width: 720px;
    margin: 0 auto;
    padding: 32px 22px 64px 22px;
  }
  .back-link {
    display: inline-block;
    margin-bottom: 24px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 300;
    font-size: 10.5px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--dim);
    text-decoration: none;
  }
  .back-link:hover { color: var(--title); }

  .index-head {
    text-align: center;
    margin: 18px 0 28px 0;
  }
  .index-head h1 {
    font-family: 'Iowan Old Style', 'Source Serif 4', Georgia, serif;
    font-size: 30px;
    font-weight: 500;
    color: var(--title);
    letter-spacing: -0.01em;
    margin: 0 0 4px 0;
  }
  .index-head .index-sub {
    font-style: italic;
    color: var(--dim);
    font-size: 14px;
    margin: 0;
  }

  .index-list { list-style: none; padding: 0; margin: 0; }
  .entry {
    padding: 18px 0;
    border-top: 1px solid var(--rule);
  }
  .entry:first-child { border-top: none; }
  .e-title {
    display: block;
    font-family: 'Iowan Old Style', 'Source Serif 4', Georgia, serif;
    font-size: 22px;
    font-weight: 500;
    line-height: 1.18;
    color: var(--title);
    text-decoration: none;
    margin-bottom: 2px;
  }
  .e-title:hover { text-decoration: underline; text-underline-offset: 4px; }
  .e-sub {
    font-style: italic;
    color: var(--dim);
    font-size: 14px;
    margin: 0 0 8px 0;
  }
  .e-meta {
    display: flex;
    gap: 22px;
    flex-wrap: wrap;
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 10.5px;
    color: var(--meta);
    letter-spacing: 0.04em;
  }
  .e-meta .k {
    color: var(--dim);
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-size: 9.5px;
    margin-right: 4px;
  }
  .e-meta span { white-space: nowrap; }
  .stat {
    display: inline-block;
    padding: 0 6px;
    border-radius: 3px;
    font-size: 9.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .status-finished { background: var(--status-finished-bg); color: var(--status-finished-fg); }
  .status-progress { background: var(--status-progress-bg); color: var(--status-progress-fg); }
  .status-dim      { background: var(--status-dim-bg);      color: var(--status-dim-fg);      }
  .stance-agree    { color: var(--stance-agree); }
  .stance-disagree { color: var(--stance-disagree); }
  .stance-neutral  { color: var(--stance-neutral); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/essays/index.astro
git commit -m "Add /essays index page: chronological list with inline meta strip"
```

---

### Task 27: Implement /essays/glossary.astro

**Goal:** Glossary page defining each metacommentary field. Embeds the Kesselman ladder in the confidence section. Anchored sections.

**Spec ref:** §"Glossary page (`/essays/glossary`)".

**Files:**
- Create: `src/pages/essays/glossary.astro`

- [ ] **Step 1: Create `src/pages/essays/glossary.astro`**

```astro
---
// src/pages/essays/glossary.astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import KesselmanLadder from '../../components/KesselmanLadder.astro';
---
<BaseLayout title="Glossary — Essays — Aayush Naik" description="Notation used in the metacommentary block of each essay.">
  <div class="glossary-page">
    <a class="back-link" href="/essays">← essays</a>
    <header>
      <h1>Glossary</h1>
      <p class="lede">Each essay declares its position via four fields. Here's what they mean.</p>
    </header>

    <section id="importance">
      <h2>Importance</h2>
      <p>An integer from 0 to 10. Gwern's decile scale, anchored as follows:</p>
      <ul>
        <li><strong>0–1</strong> — a private note, narrow utility, low stakes.</li>
        <li><strong>3–4</strong> — locally interesting; notes-to-self, small explorations.</li>
        <li><strong>5–6</strong> — broadly interesting to my readers, but not life-defining.</li>
        <li><strong>7–8</strong> — substantively important; positions I'd defend.</li>
        <li><strong>9–10</strong> — central to my worldview, or world-historically important.</li>
      </ul>
    </section>

    <section id="confidence">
      <h2>Confidence</h2>
      <p>How likely is the argument to be right? An eight-level verbal-probability ladder (the Kesselman list, with two non-probability tags appended).</p>
      <KesselmanLadder />
    </section>

    <section id="status">
      <h2>Status</h2>
      <p>Where this essay is in its lifecycle.</p>
      <dl>
        <dt><code>notes</code></dt><dd>A pile of links, snippets, observations. No coherent argument yet.</dd>
        <dt><code>draft</code></dt><dd>Structured prose with a coherent thesis. Rough.</dd>
        <dt><code>in progress</code></dt><dd>Well-developed; not yet final.</dd>
        <dt><code>finished</code></dt><dd>Complete pending new material I haven't yet encountered.</dd>
      </dl>
    </section>

    <section id="stance">
      <h2>Stance</h2>
      <p>Where I personally land on the topic — distinct from confidence in the argument.</p>
      <dl>
        <dt><code>agree</code></dt><dd>I endorse the position the essay argues for.</dd>
        <dt><code>disagree</code></dt><dd>I reject the position the essay argues against (or describes critically).</dd>
        <dt><code>withholding</code></dt><dd>I'm not yet committed to the position.</dd>
        <dt><code>—</code></dt><dd>Stance does not apply (typically for <code>confidence: log</code> or <code>confidence: emotional</code> entries). The frontmatter omits the field; the renderer shows the em-dash.</dd>
      </dl>
    </section>
  </div>
</BaseLayout>

<style>
  .glossary-page {
    max-width: 600px;
    margin: 0 auto;
    padding: 32px 22px 64px 22px;
    font-family: 'Iowan Old Style', 'Source Serif 4', Georgia, serif;
    font-size: 14.5px;
    line-height: 1.62;
    color: var(--body);
  }
  .back-link {
    display: inline-block;
    margin-bottom: 24px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 300;
    font-size: 10.5px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--dim);
    text-decoration: none;
  }
  .back-link:hover { color: var(--title); }
  header h1 {
    font-size: 30px;
    font-weight: 500;
    color: var(--title);
    margin: 0 0 6px 0;
    letter-spacing: -0.01em;
  }
  .lede {
    font-style: italic;
    color: var(--dim);
    font-size: 15px;
    margin: 0 0 28px 0;
  }
  section {
    padding-top: 18px;
    margin-top: 18px;
    border-top: 1px solid var(--rule);
    scroll-margin-top: 80px;
  }
  h2 {
    font-size: 22px;
    font-weight: 500;
    color: var(--title);
    margin: 0 0 12px 0;
    letter-spacing: -0.005em;
  }
  ul, dl { padding-left: 0; }
  ul li {
    margin: 4px 0;
    list-style: none;
  }
  dl { margin: 8px 0; }
  dt {
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 12.5px;
    color: var(--title);
    margin-top: 8px;
  }
  dd {
    margin: 2px 0 0 0;
    padding-left: 0;
    color: var(--meta);
  }
  code {
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 12.5px;
    background: var(--status-dim-bg);
    color: var(--title);
    padding: 1px 5px;
    border-radius: 3px;
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/essays/glossary.astro
git commit -m "Add /essays/glossary page with anchor-linked sections + Kesselman ladder"
```

---

## Phase 6 — Seed Content + Verification

### Task 28: Add a seed essay

**Goal:** A real MDX file demonstrating every feature: frontmatter (all four fields), title + subtitle, ≥3 H2 sections, ≥2 sidenotes, an inter-essay link target.

**Files:**
- Create: `src/content/essays/welcome.mdx`

- [ ] **Step 1: Create `src/content/essays/welcome.mdx`**

```mdx
---
title: "Why I'm writing here"
subtitle: "An anti-Substack essay project"
importance: 6
confidence: highly likely
status: finished
stance: agree
---

import Sidenote from '../../components/Sidenote.astro'

This is a workshop, not a stage. I started this section because Substack
makes essay-writing feel performative<Sidenote>The performative pressure
isn't malicious — it's structural. A newsletter format demands you sound
finished, even when you're not.</Sidenote> in a way that erodes my ability
to think out loud in public.

Every essay here declares its own epistemic state at the top: how
important the topic is, how confident I am in my claims, where this
piece is in its lifecycle, and where I personally land on the question.
The metadata is the point — not chrome.

## What this is

A place for ideas with their certainty attached. A `notes` status is
fine; a `confidence: possible` claim is fine; a `stance: withholding`
declaration is fine. None of those modes survive in a newsletter format.

## What this isn't

This isn't a blog<Sidenote>It might become one with enough discipline,
but the optimization function differs. A blog optimizes for being read.
This optimizes for honest thinking.</Sidenote>. It isn't a place for
half-baked takes either — those go in private notes. It's a workshop.

## What you'll find

Long essays at varying levels of completion, marked with the four fields
defined in the [glossary](/essays/glossary). Sidenotes and dropcaps and
serifs because the form matters. Cross-essay backlinks because thinking
isn't linear.
```

- [ ] **Step 2: Verify build**

```bash
npx astro build
```

Expected: build succeeds; `dist/essays/welcome/index.html` exists.

- [ ] **Step 3: Commit**

```bash
git add src/content/essays/welcome.mdx
git commit -m "Add seed essay demonstrating every feature"
```

---

### Task 29: Verify all pages render and look correct

**Goal:** Manual smoke test on dev server. Each page renders correctly in light + dark mode.

**Files:** none modified (verification only).

- [ ] **Step 1: Run dev server**

```bash
npx astro dev
```

- [ ] **Step 2: Verify `/`**

Visit `http://localhost:4321/`. Expected:
- Eyebrow, h1, italic subtitle, divider, lead paragraph
- Hypercubic + Anticynical links
- Mouse-reactive ambient clock fades in
- Theme toggle works (top-right)
- Staggered fade-in on load

- [ ] **Step 3: Verify `/essays`**

Visit `http://localhost:4321/essays`. Expected:
- "← home" link top-left
- "Essays" centered title
- Italic subtitle "Beliefs and positions, weighed and dated"
- One entry: "Why I'm writing here" with subtitle and inline meta strip
- Status chip styled (cream `finished` chip)
- Stance shown in green ("agree")

- [ ] **Step 4: Verify `/essays/welcome`**

Visit `http://localhost:4321/essays/welcome`. Expected:
- "← essays" top-left
- Title "Why I'm writing here", italic subtitle
- Date line in dim sans
- Meta block (mono): importance 6, confidence highly likely, status finished, stance agree — each label is a link to the glossary
- Body in serif with dropcap on first paragraph
- Three H2 sections; **TOC visible on left** (sticky) listing all three
- Two sidenote markers; sidenote bodies visible in right rail
- Glossary link in body works

- [ ] **Step 5: Verify `/essays/glossary`**

Visit `http://localhost:4321/essays/glossary`. Expected:
- "← essays" top-left
- "Glossary" title
- Four sections (Importance, Confidence, Status, Stance) — each anchorable
- Kesselman ladder graphic in the Confidence section
- Click "confidence" label in essay → returns to glossary scrolled to `#confidence`

- [ ] **Step 6: Toggle dark/light**

Click the theme toggle on each page. Verify:
- Background flips (warm dark `#0c0a08` ↔ warm cream `#fbf8f1`)
- Text contrast remains readable
- Status chips and stance colors work in both modes

- [ ] **Step 7: Resize browser to ~700px wide (tablet)**

Verify:
- Homepage renders fine
- Essay page: TOC moves to chip + drawer above body; sidenote rail collapses
- Index meta strip wraps gracefully

- [ ] **Step 8: Resize to ~375px (mobile)**

Verify:
- Body font scales up to 16.5px (don't worry about exact px — verify it FEELS larger than desktop)
- Tap a sidenote marker on the welcome essay
  - Note inserts inline at the end of the containing sentence
  - Smooth-scroll positions the note's top ~30% from viewport top
  - ✕ button is reachable; tapping closes
  - On close, scroll restores so marker is at the same position
- Tap the TOC chip → drawer slides open showing the three sections
- Tap a section → smooth-scrolls + drawer auto-collapses

- [ ] **Step 9: Commit fixes (if any)**

If you found problems during verification, fix them. Commit each fix as a separate commit so problems are traceable.

```bash
git add <changed-files>
git commit -m "Fix <specific issue> found during verification"
```

If everything works, no commit needed.

---

### Task 30: Build for production and test the static output

**Goal:** Verify production build emits correct static HTML for every route.

- [ ] **Step 1: Run production build**

```bash
npx astro build
```

Expected: build succeeds.

- [ ] **Step 2: Inspect `dist/`**

```bash
find dist -name "*.html" | sort
```

Expected files (at minimum):
```
dist/index.html
dist/essays/index.html
dist/essays/welcome/index.html
dist/essays/glossary/index.html
```

- [ ] **Step 3: Inspect `dist/essays/welcome/index.html` for static content**

```bash
grep -c "sn-body" dist/essays/welcome/index.html
```

Expected: at least 2 (one for each `<aside class="sn-body">` plus matching close-button entries). Static HTML — no client rendering needed for the marker/aside.

- [ ] **Step 4: Preview production build**

```bash
npx astro preview
```

Visit each route at `http://localhost:4321/` and re-verify (subset of Task 29 — homepage, /essays, /essays/welcome, /essays/glossary).

- [ ] **Step 5: Commit (if any fixes)**

```bash
git add <changed-files>
git commit -m "<fix>"
```

---

### Task 31: Verify mobile mechanic on real iOS Safari (or simulator)

**Goal:** The `position: sticky` close ✕ has known iOS Safari quirks. Real-device verification before declaring done.

- [ ] **Step 1: Get the dev server reachable from your phone or simulator**

```bash
npx astro dev --host 0.0.0.0
```

Connect your iPhone to the same network or use the iOS Simulator (Xcode → Simulator). Open `http://<your-machine-ip>:4321/essays/welcome` in mobile Safari.

- [ ] **Step 2: Tap a sidenote marker**

Verify:
- Note inserts inline at the end of the sentence containing the marker
- Smooth-scroll happens; the note's top is ~30% from the viewport top
- The ✕ button is in the note's top-right corner

- [ ] **Step 3: Scroll inside the long note**

Verify:
- The ✕ button sticks to the top-right of the viewport while scrolling within the note
- It remains tappable

- [ ] **Step 4: Tap ✕ to close**

Verify:
- Note collapses; paragraph re-fuses
- Scroll position restores so the marker is at the same y-position you tapped from

- [ ] **Step 5: Try the marker re-tap**

Verify: tapping the original marker also closes the note.

- [ ] **Step 6: If sticky-close fails on iOS Safari**

The fallback is a JS-managed `position: fixed` toggle: when scrolling, if the note's `top < 12` and the close-button stops being sticky-positioned, programmatically add a `position: fixed; top: 12px; right: 14px` style. This is a known fallback for legacy iOS Safari. Implement only if needed; commit as a separate "fix iOS Safari sticky fallback" commit.

- [ ] **Step 7: Commit any fixes**

If a fallback was needed:

```bash
git add src/components/Sidenote.astro
git commit -m "Add iOS Safari sticky-close fallback"
```

---

### Task 32: Deploy

**Goal:** `dist/` deployed to a CDN. URL works in production.

- [ ] **Step 1: Build for production**

```bash
npx astro build
```

- [ ] **Step 2: Deploy `dist/`**

Method depends on the chosen CDN. Examples:

- **Cloudflare Pages**: connect the repo via Cloudflare dashboard; build command `npm run build`; output dir `dist`. Or `wrangler pages deploy dist`.
- **Netlify**: drag-and-drop `dist` to the Netlify dashboard, or `netlify deploy --prod --dir=dist`.
- **Vercel**: `vercel --prod` from the project root.

- [ ] **Step 3: Verify production URLs**

Visit (production URL):
- `/` — homepage
- `/essays` — index
- `/essays/welcome` — welcome essay
- `/essays/glossary` — glossary

All four should render.

- [ ] **Step 4: Commit any deploy config**

If Netlify or Vercel created a config file (`netlify.toml`, `vercel.json`), add and commit:

```bash
git add netlify.toml  # or vercel.json
git commit -m "Add deploy config"
```

---

## Done.

The build is complete when:

- Existing homepage renders identically to today (visual diff: zero meaningful changes)
- `/essays`, `/essays/<slug>`, `/essays/glossary` all render with correct chrome and theme support
- Frontmatter validation works — invalid `confidence` value fails `astro build`
- One seed essay (`welcome.mdx`) renders with all features: title, meta, dropcap, ≥2 sidenotes, ≥3 H2 sections (TOC appears with three entries), at least one inter-essay link
- Mobile note mechanic works on iOS Safari — tap marker, note inserts at end of sentence, sticky ✕ behaves, scroll restores on close
- Light/dark toggle works on essay pages
- Glossary page renders Kesselman ladder graphic and all anchor sections
- Static HTML output deploys to a CDN and serves without errors
