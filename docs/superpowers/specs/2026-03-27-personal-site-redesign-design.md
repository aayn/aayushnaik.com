# aayushnaik.com — Personal Site Redesign

## Purpose

Personal index page — the "Start here" for everything Aayush Naik. Links out to projects (Hypercubic, Anticynical) and social profiles. Replaces the current Ghost-based Alto theme with a modern custom build.

## Tech Stack

- **Framework:** Vite + React
- **Styling:** Tailwind CSS
- **UI primitives:** shadcn/ui + Radix (available for future use, not required for initial build)
- **Language:** TypeScript
- **Deployment:** Static site build (`vite build`), host-agnostic

## Page Structure

Single page, vertically centered content. No routing needed for v1.

### Content (top to bottom)

1. **Name label** — "AAYUSH NAIK"
2. **Heading** — "Precision in tech."
3. **Tagline** — "Depth in ideas."
4. **Divider** — 40px horizontal line
5. **Bio** — Short paragraph describing role, Hypercubic, and Anticynical with inline links
6. **Project links** — "HYPERCUBIC" and "ANTICYNICAL" as styled outbound links
7. **Footer** — Icon-only (email, LinkedIn, X), fixed bottom-right

### Content Text

Bio text (current):
> Engineer, founder, thinker. I'm building a company called Hypercubic, an AI platform for maintaining legacy systems autonomously. I write a blog called Anticynical, where I'm building a psychological and philosophical operating system for a rapidly changing world.

## Typography

| Element | Font | Weight | Size | Color | Notes |
|---------|------|--------|------|-------|-------|
| Name label | Space Grotesk | 300 | 13px | rgba(255,255,255,0.8) | uppercase, letter-spacing: 3px |
| Heading | Helvetica Neue | 300 | 42px | #fff | letter-spacing: -1px |
| Tagline | Georgia | 400 (italic) | 24px | rgba(255,255,255,0.7) | serif, italic |
| Bio | Helvetica Neue | 200 (ultralight) | 15px | rgba(255,255,255,0.75) | line-height: 1.9 |
| Project links | Helvetica Neue | 400 | 13px | rgba(255,255,255,0.6) | uppercase, letter-spacing: 2px, underline on hover |
| Footer icons | — | — | 18px | rgba(255,255,255,0.3) | hover: 0.8 opacity |

Google Fonts import: Space Grotesk (weight 300).

## Color Scheme

### Dark Mode (default)

- Background: `#000000`
- Primary text: `#ffffff`
- Secondary text: `rgba(255,255,255,0.75)`
- Muted text: `rgba(255,255,255,0.6)`
- Subtle text: `rgba(255,255,255,0.3)`
- Divider: `rgba(255,255,255,0.15)`

### Light Mode

- Background: `#ffffff`
- Primary text: `#000000`
- Secondary text: `rgba(0,0,0,0.6)`
- Muted text: `rgba(0,0,0,0.5)`
- Subtle text: `rgba(0,0,0,0.25)`
- Divider: `rgba(0,0,0,0.15)`
- Name label: `rgba(0,0,0,0.6)`
- Tagline: `rgba(0,0,0,0.55)`
- Clock elements: invert white to black at matching opacities

### Mode Behavior

1. On first visit, respect `prefers-color-scheme` system preference
2. Provide a manual toggle (location TBD — likely top-right)
3. Persist user choice in `localStorage`
4. User's manual choice overrides system preference on subsequent visits

## Animations

### Entrance

Staggered fade-in on page load:
- Each content element fades in and translates up 16px
- Duration: 0.9s ease
- Stagger delay: ~0.15s between elements (0.1s, 0.25s, 0.4s, 0.55s, 0.65s, 0.75s)

### Grain Overlay

Fixed full-screen SVG noise texture at 0.018 opacity. Purely cosmetic — adds analog warmth.

## Ambient Clock (Canvas)

Full-viewport `<canvas>` element behind all content. Mouse-interactive.

### Elements

- **3 concentric rings** (no tick marks):
  - Outer: solid, `rgba(255,255,255,0.05)`, base radius 550px + expansion
  - Middle: solid, `rgba(255,255,255,0.08)`, base radius 400px + expansion
  - Inner: dashed, `rgba(255,255,255,0.06)`, base radius 300px + expansion
- **Sweep hand**: 1px, gradient from transparent to `rgba(255,255,255,0.14)`, length ~270px
- **Minute hand**: 1.5px, gradient from transparent to `rgba(255,255,255,0.1)`, length ~195px
- **Center dot**: 4px diameter, `rgba(255,255,255,0.18)`

### Mathematical Behavior

Two combined properties:

1. **Golden Ratio Rotation** — Each ring rotates at phi (1.618...) times the rate of the previous. The hands also follow phi-scaled rates. This creates a harmonious, never-repeating pattern.

2. **Logarithmic Spiral** — Mouse cursor distance from the viewport center scales the rotation speed logarithmically: `log(1 + norm * 9) / log(10)` where `norm` is the normalized distance (0 at center, 1 at corner). Ring sizes also subtly expand with distance (adding 60-100px).

### Mouse Interaction

- **Rotation driven by mouse movement speed** — `mouseSpeed * 0.003` base increment
- **Speed clamped** at 40px to prevent spikes
- **Strong damping** — speed decays by `0.92x` per frame, with `rawSpeed` reset to 0 each frame so rotation stops cleanly when mouse stops
- **Dead zone threshold** — speed below 0.05 snaps to 0
- **Edge protection** — `mouseleave` zeros speed; `mouseenter` has 50ms dead zone to prevent re-entry spikes

### Visibility

- **Hidden by default** (opacity 0)
- **Fades in** when mouse moves (opacity eases toward 1 at rate 0.06/frame)
- **Fades out** after ~1s of no movement (opacity eases toward 0 at rate 0.06/frame)
- Skip rendering entirely when opacity < 0.005

## Responsive Behavior

- Content max-width: 640px, centered
- Clock canvas: full viewport, scales naturally
- Ring sizes should scale down on smaller viewports (consider using vw-based sizing or capping)
- Footer icons reposition appropriately on mobile
- On touch devices: clock could respond to touch/drag instead of mouse, or be disabled

## Reference Mockup

The validated mockup is at `.superpowers/brainstorm/4278-1774650383/content/ambient-v9.html`. This is the source of truth for visual details not fully captured in this spec.

## Future Considerations (out of scope for v1)

- Additional pages/routes (about, projects, etc.)
- Blog integration
- More social links / GitHub
- "Now" section
- Contact form
- Analytics
