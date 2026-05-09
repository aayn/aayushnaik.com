# aayushnaik.com — Essays Section

## Purpose

A new `/essays` section on aayushnaik.com for slow, honest, epistemically disclosed writing — a counterpart to (paused) Anticynical that is *anti*-Substack in three specific ways:

1. **Less performative.** Notes, drafts, and in-progress positions are first-class. A `status: notes` entry is fine; a `confidence: possible` claim is fine; a `stance: withholding` declaration is fine. None of those modes survive a newsletter format.
2. **Epistemic metacommentary attached.** Every essay declares its own `importance`, `confidence`, `status`, and `stance`. The metadata is the *point*, not chrome — it tells the reader how seriously to take what follows.
3. **Form is part of the medium.** Tufte/Gwern lineage: serif body, sidenotes in the margin, dropcaps, integrated figures, dense typography. The aesthetic does load-bearing work.

The section is for *thinking*, not *publishing*. Anticynical might return as a newsletter or lead-feed for finished pieces; this section is the workshop.

## Goals

- Provide a place to publish essays with their epistemic state visible at a glance.
- Honor the Tufte/Gwern aesthetic in a "compressed" form (denser leading, narrower body, less ceremonial whitespace) that still reads beautifully.
- Build on top of (not replace) the existing homepage. Homepage stays unchanged in v1.
- Output static HTML for CDN deployment.
- Make authoring close to plain markdown, with escape hatches for custom components.

## Non-goals (deferred to future iterations)

- **Homepage link to `/essays`.** No link from the homepage in v1. The section is accessible only by direct URL until there's content worth landing on. Once 3–5 essays exist, revisit.
- **Tags / categories / topic filters.** Index page is chronological-only in v1.
- **Search.** Easy to add later (Pagefind or similar) once content exists.
- **RSS feed.** Add when needed; trivial in Astro.
- **Per-paragraph confidence markers.** Gwern sometimes scopes confidence to specific paragraphs. Out of scope for v1; per-essay metadata is the unit.
- **Hover popups for backlinks / cross-references.** Static "Linked from" section is enough for v1.
- **Comments / reactions.** Not now, not soon.

## Information architecture

| URL | Page | Purpose |
|---|---|---|
| `/` | Homepage | Existing; unchanged in v1 |
| `/essays` | Essays index | Chronological list of all essays |
| `/essays/<slug>` | Individual essay | Full essay with metacommentary, sidenotes, TOC, backlinks |
| `/essays/glossary` | Glossary | Defines metacommentary fields, hosts the Kesselman ladder |

### Navigation

- **Top-left of essay pages and glossary:** `← essays` (links to `/essays`)
- **Top-left of essays index:** `← home` (links to `/`)
- **No top-bar nav.** No site chrome competing with content.
- **Theme toggle:** preserved as on homepage; appears on every page.

## Content model

Each essay is an MDX file in `src/content/essays/<slug>.mdx`. Frontmatter is validated by an Astro content collection schema.

### Frontmatter fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | Essay title |
| `subtitle` | string | no | Italic subtitle below title |
| `importance` | integer 0–10 | yes | Gwern's decile scale. 0 = a private note, 5 = locally interesting, 10 = world-historical |
| `confidence` | enum | yes | Kesselman ladder + special tags (see below) |
| `status` | enum | yes | `notes`, `draft`, `in progress`, `finished` |
| `stance` | enum | no | `agree`, `disagree`, `withholding`. Omitted (or `—`) for `confidence: log` entries |

### Confidence values (10 total — 8 Kesselman + 2 special)

Approximate probability ranges shown for reference; rendered on the glossary page as a visual ladder.

| Term | Approx. range |
|---|---|
| `certain` | ~100% |
| `highly likely` | 80–95% |
| `likely` | 60–80% |
| `possible` | 40–60% |
| `unlikely` | 20–40% |
| `highly unlikely` | 5–20% |
| `remote` | 1–5% |
| `impossible` | ~0% |
| `log` | not applicable — recording without claim |
| `emotional` | not applicable — felt, not endorsed |

### Status values (4)

| Value | Meaning |
|---|---|
| `notes` | Pile of links, snippets, observations |
| `draft` | Structured prose with a coherent thesis |
| `in progress` | Well-developed; not yet final |
| `finished` | Complete pending new material |

### Stance values (3 + omitted)

| Value | Meaning |
|---|---|
| `agree` | I endorse the position the essay argues for |
| `disagree` | I reject the position the essay argues against (or describes critically) |
| `withholding` | I'm not yet committed to the position |
| omitted / `—` | Stance does not apply — typically for `confidence: log` entries |

### Dates

Auto-computed at build time:

- `created` — first git commit touching the essay file
- `modified` — most recent git commit touching the essay file

Dates are rendered as small chrome under the title (one line, Space Grotesk light, dim color). They are *not* part of the meta block — the meta block is for epistemic metadata, dates are bookkeeping.

### Schema (Astro content collection)

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';

const essays = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    importance: z.number().int().min(0).max(10),
    confidence: z.enum([
      'certain', 'highly likely', 'likely', 'possible',
      'unlikely', 'highly unlikely', 'remote', 'impossible',
      'log', 'emotional',
    ]),
    status: z.enum(['notes', 'draft', 'in progress', 'finished']),
    stance: z.enum(['agree', 'disagree', 'withholding']).optional(),
  }),
});

export const collections = { essays };
```

A frontmatter typo (e.g. `confidence: hightly likely`) fails the build, not at runtime.

## Visual design system

### Palette

Dark-first, matching homepage aesthetic. Light/dark toggle preserved (using existing `useTheme` hook on the homepage).

| Token | Dark | Light |
|---|---|---|
| Background | `#0c0a08` (warm dark) | `#fbf8f1` (warm cream) |
| Body text | `rgba(216,207,191,0.88)` | `rgba(43,38,32,0.88)` |
| Title / emphasis | `#f3ead7` | `#1a1612` |
| Subtle / dim | `rgba(216,207,191,0.5)` | `rgba(43,38,32,0.55)` |
| Hairline rule | `rgba(216,207,191,0.16)` | `rgba(43,38,32,0.14)` |
| Meta accent (mono) | `rgba(216,207,191,0.78)` | `rgba(43,38,32,0.75)` |
| Stance · agree | `#cfe9b8` | `#5b8b3f` |
| Stance · disagree | `#ecb8b8` | `#a04848` |
| Status · finished | `rgba(180,222,160,0.16)` bg / `#cfe9b8` fg | `rgba(91,139,63,0.12)` bg / `#5b8b3f` fg |
| Status · in progress | `rgba(243,234,215,0.16)` bg / `#f3ead7` fg | `rgba(43,38,32,0.10)` bg / `#1a1612` fg |
| Status · draft / notes | `rgba(243,234,215,0.08)` bg / dim fg | `rgba(43,38,32,0.06)` bg / dim fg |

Background warmth (`#0c0a08` not `#000`, `#fbf8f1` not `#fff`) is intentional — pure black/white feels harsh against serif body type.

### Typography

| Role | Family | Weight | Size (desktop / mobile) | Notes |
|---|---|---|---|---|
| Body | `Iowan Old Style`, `Source Serif 4`, `Source Serif Pro`, `Palatino Linotype`, Palatino, Georgia, serif | 400 | 14.5px / 16.5px | Line-height: 1.62 / 1.70 |
| Title | same serif stack | 500 | 28px / 24px | Letter-spacing: -0.01em |
| Subtitle | same serif stack | 400 italic | 15px / 14px | Italic |
| Body emphasis | same serif italic | 400 italic | inherits | |
| Eyebrow / chrome / `← essays` | Space Grotesk | 300 | 10.5px / 10px | Uppercase, letter-spacing: 0.18em |
| Meta block (`importance`, `confidence`, etc.) | IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo | 400 | 10.5px / 10px | Tabular feel — "specification sheet" |
| Sidenote text | Space Grotesk | 300 | 10.5px / 13.5px | Sans contrast against serif body |
| TOC entries | Space Grotesk | 300 | 11.5px (active normal, inactive italic) | Hierarchical (H2 + nested H3) |
| Glossary headings | same serif stack | 500 | 22px | |
| Footer / dates | Space Grotesk | 300 | 10.5px | Dim color |

Fonts should be self-hosted (woff2 in `/public/fonts/`) with `font-display: swap`. Avoid CDN font dependencies — they're bitrot risk and add a network dependency.

#### Why mixed serif + sans + mono

- **Serif body** (Iowan / Source Serif): comfortable for long reading; honors Tufte lineage.
- **Sans chrome** (Space Grotesk): preserves continuity with the homepage.
- **Mono meta** (IBM Plex Mono): gives the metadata a "specification sheet" / datasheet feel — sharpens its function as epistemic disclosure rather than as decorative chrome. (User-validated decision: meta block in monospace was an explicit ask during brainstorming.)

## Essay page · desktop layout

### Grid

Three columns at ≥1180px. Below that, the left TOC drops to a mobile-style chip + drawer (see Mobile section); right-rail sidenotes stay until 980px, where they drop to inline-expand.

```
┌─ Page edge ────────────────────────────────────────────────────────────┐
│  60px      180px       40px   560px      40px      200px       60px    │
│                                                                        │
│           ┌──────┐    ┌─────────────────┐    ┌──────────────┐          │
│           │ TOC  │    │   Body          │    │  Sidenotes   │          │
│           │      │    │   ─────         │    │              │          │
│           │ • H2 │    │   Title         │    │  ¹ note      │          │
│           │   H3 │    │   Subtitle      │    │              │          │
│           │ • H2 │    │   Meta block    │    │  ² note      │          │
│           │ • H2 │    │   Body w/       │    │              │          │
│           │      │    │   dropcap       │    │  ³ note      │          │
│           │      │    │   …             │    │              │          │
│           │      │    │   Linked from   │    │              │          │
│           └──────┘    └─────────────────┘    └──────────────┘          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

- **Left TOC sidebar:** 180px wide. Sticky (`position: sticky; top: 60px`).
- **Body column:** ~560px. Narrower than canonical Tufte (~660px); honors "compressed" — shorter measure means easier reading.
- **Right sidenote rail:** 200px wide. Static-flow (not sticky); each sidenote anchored to its marker line.
- **Top-left "← essays" link:** lives in the page header above the TOC, not in the body column.

### Anatomy (top to bottom in body column)

1. **Title** — serif, 28px, weight 500
2. **Subtitle** — serif italic, 15px, dim color
3. **Date line** — Space Grotesk light, 10.5px, very dim. E.g. `created 2026-05-12 · modified 2026-05-18`
4. **Meta block** — IBM Plex Mono, 10.5px, hairline rules top and bottom. Four rows: `importance`, `confidence`, `status`, `stance`. Each label uppercase tracked at 9.5px; value normal-case mono. Each label is a link to `/essays/glossary#<field>`.
5. **Body** — serif, 14.5px, line-height 1.62. First paragraph gets a dropcap (CSS `::first-letter`, 44px, color `#f3ead7`).
6. **H2/H3 section headings** — serif, 19px / 16px, weight 500
7. **"Linked from" section** — only renders if backlinks exist; appears at the bottom of body before the page footer (see Backlinks section)

### Sidenote markers in body

- Marker style: superscript number (¹²³) in serif body color, slightly smaller
- Click target: just the marker (small but tappable on touch — at least 24×24 hit area enforced via padding)
- Open state: marker fills with cream background (`#f3ead7`) and dark text — easy to find on a long page

### Sidenote rail (desktop)

- Sidenotes are positioned next to the line containing their marker. Typically achieved with absolute positioning + JS measurement of marker positions, OR via CSS Grid with `align-self`. Use the simpler CSS-only approach where possible.
- Fallback if two sidenotes would collide: stack vertically with at least 8px gap; closer one wins anchor position.
- Each sidenote: small Space Grotesk light, 10.5px, dim color, 1px left border in dim color, 12px left padding.
- Numbered to match marker.

## Essay page · mobile mechanics

### Layout

Single column at <980px. No left TOC sidebar; no right sidenote rail.

- Body text: 16.5px, line-height 1.70 (larger than desktop — closer reading distance)
- Body width: viewport minus 22px gutters
- Site chrome: `← essays` becomes `←` arrow only; eyebrow shrinks
- Theme toggle preserved
- Dropcap: 46px (slightly larger relative to 16.5px body)

### TOC on mobile

A small chip sits between the meta block and the body in document flow:

```
┌──────────────────────────────────────────┐
│ ≡  Outline  · 3 sections             ▾  │
└──────────────────────────────────────────┘
```

- After the user scrolls past it, the chip becomes `position: sticky; top: 0` on the viewport. The outline is always one tap away.
- Tap: slide-down panel reveals all sections (H2 + nested H3). Active section highlighted with a 2px left border.
- Tap a section: smooth-scroll to anchor + auto-collapse panel.
- Tap ✕ in panel header (or chip arrow): collapse without navigating.
- Conditional: TOC chip only renders if essay has ≥2 H2 sections.

### Sidenote mechanic on mobile

The sidenote rail collapses; markers stay. When tapped:

1. **Insertion point:** at the *end of the sentence* containing the marker (not the next paragraph break, not mid-sentence). This keeps the note adjacent to its anchor regardless of paragraph length.
2. **Smooth-scroll on open:** so the top of the note sits ~30% down from the viewport top.
3. **Note rendering:** dimmer sans-serif block (Space Grotesk light, 13.5px) with subtle left border, inserted as a flow element between sentence-fragments. The paragraph splits at the sentence boundary; on close, paragraph re-fuses.
4. **Close affordance:**
   - **Single ✕ button.** It lives in the note's top-right corner with `position: sticky; top: 12px; right: 14px`. CSS sticky behavior:
     - Note top in view → ✕ at note's corner (in flow)
     - Note top scrolled past viewport → ✕ pinned to viewport top-right
     - Note bottom reaches viewport top → ✕ unsticks and scrolls away with the note (you've finished reading)
   - **Secondary close path:** re-tap the original marker (highlighted while open).
5. **Scroll restoration on close:** when the note collapses, scroll position adjusts so the marker is at the same viewport y-position it was when the user tapped it. The reader lands back exactly where they were.
6. **Multiple notes:** allowed simultaneously. Each independent.

### Why these mechanics matter

The mechanic was specifically validated during brainstorming with the goal of preserving "Tufte adjacency" on mobile despite the missing rail. End-of-sentence insertion preserves adjacency without breaking mid-sentence. Sticky-position close ensures the close button is always reachable without polluting the page with a separate floating button. Scroll restoration prevents the disorientation of "where the hell was I?" after closing a long note.

## Index page (`/essays`)

### Layout

Single body column, max-width ~720px, centered.

```
┌─────────────────────────────────────┐
│  ← home                             │
│                                     │
│            ESSAYS                   │  ← serif, 30px, centered
│  Beliefs and positions, weighed     │  ← italic subtitle (placeholder)
│           and dated                 │
│                                     │
├─────────────────────────────────────┤
│  On the moral weight of suffering   │
│  Why hedonic experience grounds…    │  ← serif italic subtitle
│  imp 9·10  conf highly likely  …    │  ← inline mono meta strip
├─────────────────────────────────────┤
│  On free will                       │
│  Reading Strawson against the…      │
│  imp 7·10  conf likely  status…     │
├─────────────────────────────────────┤
│  …                                  │
└─────────────────────────────────────┘
```

### Per-entry rendering

For each essay (chronological, newest first):

- **Title** — serif, 22px, weight 500
- **Subtitle** — serif italic, 14px, dim
- **Meta strip** — inline row of `key value` pairs, IBM Plex Mono 10.5px:
  - `imp 9·10` (importance numerator/denominator with mid-dot)
  - `conf highly likely`
  - `status finished` — chip with subtle color (see palette: status colors)
  - `stance agree` — colored value (green-agree, red-disagree, neutral-withholding, dim-`—`)
- Hairline rule between entries

### Page header

- "Essays" title centered, serif 30px, weight 500
- Italic subtitle below — placeholder *"Beliefs and positions, weighed and dated"* (rewriteable; final copy left to user)

### Sorting / filtering

- v1: chronological by `modified` date, newest first
- No filters, no categories, no tag UI

## Glossary page (`/essays/glossary`)

### Purpose

Single page that defines each metacommentary field. Anchored sections so the meta-block labels in essays can deep-link.

### Sections

In order:

1. **Intro paragraph** — *"Each essay declares its position via four fields. Here's what they mean."*
2. **`#importance`** — text explaining the 0–10 decile scale. Example anchors: 0 = a private note; 5 = locally interesting; 10 = world-historical.
3. **`#confidence`** — text + the **Kesselman ladder graphic** (rendered the same as the in-brainstorm visual you approved — see `confidence-ladder` reference mockup) + the two special tags (`log`, `emotional`) + a small lineage box explaining Kent → Kesselman → ICD 203.
4. **`#status`** — text + the four-step progression (`notes`, `draft`, `in progress`, `finished`) with what each means.
5. **`#stance`** — text + the three values + when `—` applies.

### Linking from essays

Each label in an essay's meta block (`importance`, `confidence`, `status`, `stance`) is rendered as `<a href="/essays/glossary#<field>">`. Hover → subtle underline. Click → navigate to the glossary anchor.

### Layout

Same chrome as essay pages: `← essays` top-left, theme toggle. Body column ~600px, centered. No TOC (it's a single page with anchored sections — could add a small in-page TOC if desired, but YAGNI for v1).

## Backlinks ("Linked from")

### Purpose

Show, on each essay page, which other essays link to it. Builds the connective tissue between essays — a reader on "On free will" sees which other essays cite it.

### Generation

Build-time process:

1. After all MDX is parsed, scan each essay's compiled HTML/AST for `<a href="/essays/<other-slug>">` (or `[link](/essays/<other-slug>)` in source).
2. Build a reverse map: `Map<slug, Array<{ fromSlug, snippet, anchor }>>`.
3. Pass each essay's incoming-link list to its layout at render time.

Snippet generation: take the sentence (or short paragraph) containing the link from the source essay; trim to ~140 characters; emphasize the linking phrase.

### Display

Below the body, before the page footer:

```
─────────────────────────────────────
LINKED FROM                                   ← Space Grotesk uppercase tracked

On the moral weight of suffering              ← serif title link
Why hedonic experience grounds ethics         ← italic subtitle dim
│ "…this is why blame in the strict sense    
│  seems incoherent — the regress shown in    ← snippet, sans, dim
│  On free will applies to the chooser of    
│  values, not just the chooser of acts…"

Notebook on grief
Six months after
│ "…Strawson's regress feels different from
│  the inside; nothing about it makes the
│  bereaved any less responsible-feeling…"
```

- Section heading: "Linked from" in Space Grotesk uppercase tracked, dim
- Each entry: linking essay's title (serif, link styled) + subtitle (italic dim) + snippet (Space Grotesk light, 12px, with 1px left rule)
- The linked phrase within the snippet is emphasized (cream color, no underline) so the reader sees what context links here
- Conditional: section only renders if at least one backlink exists. New essays don't show "Linked from (0 entries)."
- Ordering: most-recently-modified backlinking essay first.

## TOC behavior

### Desktop (≥1180px)

- Lives in the **left** sidebar (180px wide, fixed/sticky)
- Auto-generated from H2 (and optionally nested H3) headings
- Hierarchical: H2 in normal weight, H3 indented 14px and lighter
- Active section highlighted as you scroll (intersection observer); inactive entries are italic, active is normal-weight cream
- No active-state border/box (avoids API-docs feel)
- Sub-sections of inactive parents are visible but indented; active parent's H3s shown at full opacity
- Conditional: TOC sidebar hidden if essay has fewer than 2 H2 sections (short essays don't need an outline)

### Mobile and tablet (<1180px)

- TOC chip (`≡ Outline · N sections ▾`) sits in document flow between meta block and body
- Sticky to viewport top after scrolling past
- Tap to expand → slide-down panel (see Mobile section above)
- Tap section → smooth-scroll + auto-collapse

### Why left sidebar (not right rail)

Two reasons (both surfaced during brainstorming):
1. The right rail belongs to sidenotes; sharing it makes the TOC and sidenotes compete for vertical space at the top.
2. A separate left column for the TOC distinguishes it visually from the sidenote rail and feels distinctly "essay" rather than "API docs."

## Architecture

### Framework

**Astro 5+** — content-first, static-by-default, zero JS for prose.

### Why Astro (not extending current Vite + React)

Discussed and validated during brainstorming. Summary of the decisive points:

- **Zero JS on essay reads.** Readers loading "On free will" don't pull a React runtime to display words. Aligns with the minimalist hosting/loading philosophy.
- **Typed content collections.** The 10-value `confidence` enum + `stance` enum get build-time validation. A typo (`hightly likely`) fails the build, not at runtime.
- **File-based routing built-in.** No glue (`vite-plugin-pages` + `react-router`) required.
- **Existing React components keep working.** `AmbientClock` and `ThemeToggle` become `client:*` islands — same source code, just hydrated as discrete units.
- **Right shape for the next 5 years.** This is a content site under construction; Astro is purpose-built for it.
- **Migration cost bounded.** Existing site has 5 small components; the homepage refactor is ~half a day.

### Authoring

Essays are MDX files in `src/content/essays/<slug>.mdx`:

```mdx
---
title: "On free will"
subtitle: "Reading Strawson against the compatibilists"
importance: 7
confidence: likely
status: in progress
stance: withholding
---

The compatibilist move <Sidenote>Frankfurt cases sidestep the deeper issue.</Sidenote> feels like changing the subject. If we redefine "free" to mean "uncoerced," we get a notion that fits the world but leaves the original question entirely untouched.

## Strawson's regress

Strawson <Sidenote>Galen Strawson, "The Impossibility of Moral Responsibility" (1994).</Sidenote> presses harder…
```

Plain markdown for prose; MDX components for structural needs:

- `<Sidenote>` — produces a marker in body and a sidenote in the rail
- `<Figure>` — image with optional caption, supports full-bleed and inline layouts
- `<Pullquote>` — large emphasis block

### Build & deployment

- Static HTML output via `astro build` (default).
- Deploy to any CDN (CloudFlare Pages, Netlify, Vercel static, S3 + CloudFront).
- No server runtime; no SSR; no edge functions.

### Tailwind v4

Retained. `@astrojs/tailwind` integration is plug-and-play. Existing utility-class usage in homepage components transfers unchanged.

### React islands

Existing components keep their React source:

- `<AmbientClock client:idle />` — hydrates after browser idle (canvas, mouse-reactive)
- `<ThemeToggle client:load />` — hydrates immediately (theme state must be available on first paint)
- `GrainOverlay` — convert to static HTML+CSS (no JS needed; just a div with a background image)
- `Footer` — convert to static Astro component (no JS needed)
- `Content` — homepage content; convert to Astro component with CSS animations replacing the React staggered fade-in (CSS is simpler and doesn't require React)

The `useTheme` hook persists for `ThemeToggle` and any other client-side themed island. A small `<script is:inline>` in the document head sets `dark` class on `<html>` from `localStorage` before paint, matching the existing inline script pattern in `index.html`.

## File structure

After the migration, the project layout becomes:

```
aayushnaik.com/
├── astro.config.mjs              ← new; Astro config
├── content.config.ts             ← new; zod schemas for collections
├── tsconfig.json
├── tailwind.config.mjs           ← Tailwind v4 config (if needed by integration)
├── public/
│   ├── favicon.svg
│   └── fonts/                    ← new; self-hosted woff2 (Iowan, Source Serif, IBM Plex Mono)
├── src/
│   ├── content/
│   │   └── essays/               ← new; MDX files live here
│   │       ├── on-free-will.mdx
│   │       └── moral-weight-of-suffering.mdx
│   ├── pages/
│   │   ├── index.astro           ← homepage (refactored from App.tsx)
│   │   └── essays/
│   │       ├── index.astro       ← essays list
│   │       ├── glossary.astro    ← glossary page
│   │       └── [slug].astro      ← essay page (uses EssayLayout)
│   ├── layouts/
│   │   ├── BaseLayout.astro      ← shared shell: theme, fonts, grain, footer
│   │   └── EssayLayout.astro     ← Tufte essay layout: TOC + body + sidenotes + backlinks
│   ├── components/
│   │   ├── Sidenote.astro        ← marker + rail entry; mobile expand JS
│   │   ├── MetaBlock.astro       ← reads frontmatter, renders mono grid
│   │   ├── Figure.astro
│   │   ├── Pullquote.astro
│   │   ├── TOC.astro             ← left sidebar TOC + mobile chip + drawer
│   │   ├── Backlinks.astro       ← "Linked from" section
│   │   ├── KesselmanLadder.astro ← the visual ladder for the glossary page
│   │   ├── AmbientClock.tsx      ← existing React, used as island
│   │   ├── ThemeToggle.tsx       ← existing React, used as island
│   │   ├── GrainOverlay.astro    ← static (was .tsx)
│   │   └── Footer.astro          ← static (was .tsx)
│   ├── hooks/
│   │   └── useTheme.ts           ← unchanged; consumed by React islands
│   ├── lib/
│   │   ├── backlinks.ts          ← build-time scan that produces the reverse map
│   │   └── git-dates.ts          ← reads `created` and `modified` from git history
│   └── styles/
│       └── global.css            ← @font-face, palette tokens, base typography
```

## Astro feature mapping (retained from brainstorm)

This is the section that the user explicitly asked to retain — every feature designed during brainstorming, mapped to where/how Astro implements it. Keep this updated as the build progresses.

| Feature | Astro implementation |
|---|---|
| **Metacommentary block** | `MetaBlock.astro` reads frontmatter, renders the monospace grid. Plain HTML/CSS. |
| **`importance`/`confidence`/`status`/`stance`** | Validated by zod schema in `content.config.ts`. Build fails on typos. |
| **Right-rail sidenotes (desktop)** | CSS Grid in `EssayLayout.astro`. `Sidenote.astro` renders both the in-body marker and the rail entry. Pure CSS for placement. |
| **Mobile inline-expand notes** | ~1 KB vanilla JS in a `<script>` tag inside `Sidenote.astro`. No React needed. |
| **`position: sticky` close ✕** | Pure CSS on `.sidenote-mobile-expanded .close`. |
| **Scroll restoration on close** | Vanilla JS handler. ~10 lines: capture marker's `getBoundingClientRect().top` on open; on close, scroll so it returns to that y. |
| **Dropcaps** | `.essay-body p:first-of-type::first-letter { … }` in CSS. Zero JS. |
| **Glossary page** | `src/pages/essays/glossary.astro`. Just another page. |
| **Meta-block labels link to glossary** | `MetaBlock.astro` renders `<a href="/essays/glossary#confidence">` on each label. Pure HTML. |
| **Kesselman ladder graphic on glossary** | `KesselmanLadder.astro` — HTML + CSS port of the brainstorm-validated visual. |
| **Theme toggle (dark/light)** | Existing React component as `<ThemeToggle client:load />`. Hydrates only this island. |
| **Ambient clock canvas** | Existing React component as `<AmbientClock client:idle />`. Same code; islanded. |
| **Typography (Iowan, Source Serif, Plex Mono, Space Grotesk)** | Self-hosted woff2 in `/public/fonts/` + `@font-face` in `global.css`. Astro is invisible here. |
| **Tailwind v4** | `@astrojs/tailwind` integration. Plug-and-play. |
| **Left sidebar TOC (desktop)** | `TOC.astro` — generates from H2/H3 in the rendered MDX (Astro exposes `headings` from `<Content />`). CSS Grid in `EssayLayout.astro` reserves a left column. Sticky via CSS. Active state via intersection observer (~30 lines vanilla JS). |
| **Mobile TOC chip + slide-down drawer** | Same `TOC.astro`; CSS media query swaps the rendered shape. JS handler for expand/collapse. |
| **TOC conditional (≥2 H2 sections)** | Compute heading count in the layout; pass `showToc: boolean` to `TOC.astro`. |
| **Backlinks generation** | `src/lib/backlinks.ts` — runs at build time, scans all MDX files in the `essays` collection, parses out `<a href="/essays/...">` references, builds reverse map. Result passed to each essay page via `getStaticPaths`. |
| **Backlinks display** | `Backlinks.astro` — renders the "Linked from" section. Conditional on non-empty list. |
| **Dates (created / modified)** | `src/lib/git-dates.ts` — runs at build time, shells out to `git log --format=%ai --diff-filter=A` for `created` and `git log -1 --format=%ai` for `modified`, per file. |
| **Index page meta strip** | `src/pages/essays/index.astro` — uses `getCollection('essays')`, sorts by `modified` desc, renders inline meta strip. |
| **Future weird thing you want** | Drop in any HTML/CSS/JS, any React/Svelte/Vue island, any custom MDX component. Astro doesn't constrain. |

## Migration plan (high level — detailed plan to be drafted by writing-plans)

1. **Install Astro alongside existing Vite setup**, or scaffold a new Astro project and migrate. Decision left to writing-plans phase; both are workable.
2. **Convert homepage** (`src/App.tsx` + components) to Astro pages + islands. AmbientClock and ThemeToggle stay as React islands; GrainOverlay, Footer, Content become static Astro components.
3. **Set up content collection** with zod schema for essays.
4. **Build EssayLayout, MetaBlock, Sidenote, TOC, Backlinks** components.
5. **Build glossary page** + KesselmanLadder component.
6. **Self-host fonts** (Iowan/Source Serif, Space Grotesk, IBM Plex Mono — woff2).
7. **Add 1 seed essay** (placeholder content) to verify all rendering paths.
8. **Test mobile note mechanic** (insertion point, sticky close, scroll restore) against the validated brainstorm mockup.
9. **Test build** — ensure static HTML output is correct for `/`, `/essays`, `/essays/<slug>`, `/essays/glossary`.
10. **Deploy**.

## Reference mockups

All brainstormed mockups are persisted in `.superpowers/brainstorm/8370-1778347383/content/`. Source-of-truth for visual details:

| Decision | Reference file |
|---|---|
| Metacommentary fields (lean / + stance / full) | `metacommentary-fields.html` |
| Visual identity (Continuum / Reading mode / Tufte) | `visual-identity.html` |
| Essay layout (right-rail / popover) | `essay-layout.html` |
| Mobile rules (responsive overview) | `mobile-rules.html` |
| Mobile note mechanics (sticky close lifecycle) | `mobile-note-mechanics-v2.html` |
| Index page (inline strip / directory) | `index-page.html` |
| Kesselman ladder | `kesselman-ladder.html` |
| Astro vs Vite+MDX comparison | `astro-vs-vite-mdx.html` |
| Astro feature mapping proof | `astro-tufte-proof.html` |
| Homepage copy options | `homepage-copy.html` |
| TOC + backlinks layout | `toc-and-backlinks.html` |
| TOC responsive states | `toc-responsive.html` |
| TOC placement (rail vs left sidebar) | `toc-placement.html` |
| Final design summary | `design-summary.html` |

## Open questions (to settle during build)

- **Index page subtitle copy.** Placeholder is *"Beliefs and positions, weighed and dated"* — final copy left to user. Could also be left blank.
- **Whether to expose `confidence: emotional` or `confidence: log` in the index page meta strip** — both render meaningfully but the stance value should be `—` for these.
- **Exact pixel grid on tablet** (980–1180px) — TOC drops to mobile chip; sidenote rail stays. Confirm the visual feels right when rendered.
- **Self-host vs Google Fonts for Source Serif 4 / Space Grotesk.** Self-host preferred but Google Fonts is acceptable v1 if woff2 acquisition is friction.

## Success criteria for v1

The build is "done" when:

- [ ] Existing homepage renders identically to today (visual diff: zero meaningful changes)
- [ ] `/essays`, `/essays/<slug>`, `/essays/glossary` all render with correct chrome and theme support
- [ ] Frontmatter validation works — invalid `confidence` value fails `astro build`
- [ ] One seed essay renders with all features visible: title, meta, dropcap, ≥2 sidenotes, ≥3 H2 sections (so TOC appears), at least one inter-essay link (so backlinks appear on the linked-to essay)
- [ ] Mobile note mechanic works as specified — tap marker, note inserts at end of sentence, sticky ✕ behaves, scroll restores on close
- [ ] Light/dark toggle works on essay pages
- [ ] Glossary page renders Kesselman ladder graphic and all anchor sections
- [ ] Static HTML output deploys to a CDN and serves without errors
