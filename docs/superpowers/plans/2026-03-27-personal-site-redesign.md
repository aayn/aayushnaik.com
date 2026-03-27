# aayushnaik.com Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Ghost-based Alto theme with a Vite + React + Tailwind single-page personal site featuring a mouse-driven ambient clock.

**Architecture:** Single-page React app with three main components: content (static text + links), ambient clock (canvas rendered behind content), and theme toggle (dark/light mode). The clock logic lives in a custom hook. Theme state uses React context + localStorage.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS v4, Google Fonts (Space Grotesk)

**Reference mockups:**
- Dark mode: `.superpowers/brainstorm/4278-1774650383/content/ambient-v9.html`
- Light mode: `.superpowers/brainstorm/4278-1774650383/content/light-mode-clock.html`

---

## File Structure

```
src/
  main.tsx              — React entry point
  App.tsx               — Root component: composes clock, content, footer, theme toggle
  index.css             — Tailwind directives + custom font imports + animation keyframes
  components/
    AmbientClock.tsx    — Canvas clock component (all math + rendering + mouse tracking)
    Content.tsx         — Name, heading, tagline, divider, bio, project links
    Footer.tsx          — Social icons (email, LinkedIn, X), fixed bottom-right
    ThemeToggle.tsx     — Dark/light mode toggle button, fixed top-right
    GrainOverlay.tsx    — SVG noise texture overlay
  hooks/
    useTheme.ts         — Theme context provider, localStorage persistence, system preference detection
index.html              — Vite HTML entry
tailwind.config.ts      — Tailwind config with custom fonts
```

---

### Task 1: Archive Ghost Theme + Scaffold Vite Project

**Files:**
- Move: all Ghost files (`*.hbs`, `partials/`, `assets/`, `gulpfile.js`, `package.json`, `yarn.lock`, `renovate.json`, `alto.zip`, `LICENSE`, `README.md`) → `archive/`
- Create: new Vite + React + TS project in project root

- [ ] **Step 1: Move Ghost files to archive**

```bash
cd /Users/aayn/Devel/aayushnaik.com
mkdir -p archive
mv *.hbs partials assets gulpfile.js package.json yarn.lock renovate.json alto.zip LICENSE README.md archive/
```

- [ ] **Step 2: Scaffold Vite project**

```bash
cd /Users/aayn/Devel/aayushnaik.com
npm create vite@latest . -- --template react-ts
```

If prompted about non-empty directory, confirm. This creates `package.json`, `tsconfig.json`, `vite.config.ts`, `src/`, `index.html`, etc.

- [ ] **Step 3: Install dependencies**

```bash
npm install
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 4: Configure Tailwind**

Add Tailwind plugin to `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

Replace `src/index.css` with:

```css
@import "tailwindcss";

@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300&display=swap');

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

- [ ] **Step 5: Clean up scaffolded files**

Delete `src/App.css`, `src/assets/` (Vite logo), and the default content in `src/App.tsx`. Replace `src/App.tsx` with:

```tsx
export default function App() {
  return <div>Hello</div>
}
```

Replace `src/main.tsx` with:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Update `index.html` title to `Aayush Naik`.

- [ ] **Step 6: Verify it runs**

```bash
npm run dev
```

Expected: dev server starts, browser shows "Hello" on white background.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: archive Ghost theme, scaffold Vite + React + Tailwind project"
```

---

### Task 2: Theme Hook + Provider

**Files:**
- Create: `src/hooks/useTheme.ts`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create useTheme hook**

Create `src/hooks/useTheme.ts`:

```ts
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function useThemeProvider(): ThemeContextValue {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) return stored
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light'
    return 'dark'
  })

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}
```

- [ ] **Step 2: Wire up provider in App.tsx**

Replace `src/App.tsx`:

```tsx
import { ThemeContext, useThemeProvider } from './hooks/useTheme'

export default function App() {
  const themeValue = useThemeProvider()

  return (
    <ThemeContext.Provider value={themeValue}>
      <div className="min-h-screen flex items-center justify-center bg-black text-white dark:bg-black dark:text-white">
        <p>Theme: {themeValue.theme}</p>
        <button onClick={themeValue.toggleTheme}>Toggle</button>
      </div>
    </ThemeContext.Provider>
  )
}
```

- [ ] **Step 3: Add dark mode class to index.html**

Add a script to `index.html` inside `<head>`, before any CSS loads, to prevent flash:

```html
<script>
  const t = localStorage.getItem('theme');
  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
</script>
```

- [ ] **Step 4: Verify**

```bash
npm run dev
```

Expected: page shows "Theme: dark" (or "light" if system is light). Clicking "Toggle" switches.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTheme.ts src/App.tsx index.html
git commit -m "feat: add dark/light theme hook with localStorage + system preference"
```

---

### Task 3: Content Component

**Files:**
- Create: `src/components/Content.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create Content component**

Create `src/components/Content.tsx`:

```tsx
const STAGGER_DELAYS = ['0.1s', '0.25s', '0.4s', '0.55s', '0.65s', '0.75s']

function FadeIn({ children, index }: { children: React.ReactNode; index: number }) {
  return (
    <div
      className="opacity-0 translate-y-4"
      style={{
        animation: 'enter 0.9s ease forwards',
        animationDelay: STAGGER_DELAYS[index],
      }}
    >
      {children}
    </div>
  )
}

export default function Content() {
  return (
    <div className="relative z-[2] px-[60px] py-[60px] max-w-[640px]">
      <FadeIn index={0}>
        <div className="font-['Space_Grotesk'] text-[13px] tracking-[3px] uppercase font-light mb-12 text-white/80 dark:text-white/80 text-black/60">
          Aayush Naik
        </div>
      </FadeIn>

      <FadeIn index={1}>
        <h1 className="text-[42px] font-light -tracking-[1px] leading-[1.2] mb-2 text-black dark:text-white">
          Precision in tech.
        </h1>
      </FadeIn>

      <FadeIn index={2}>
        <div className="font-[Georgia,'Times_New_Roman',serif] italic text-2xl mb-8 leading-[1.4] text-black/55 dark:text-white/70">
          Depth in ideas.
        </div>
      </FadeIn>

      <FadeIn index={3}>
        <div className="w-10 h-px bg-black/15 dark:bg-white/15 mb-7" />
      </FadeIn>

      <FadeIn index={4}>
        <p className="font-extralight text-[15px] leading-[1.9] mb-9 text-black/60 dark:text-white/75">
          Engineer, founder, thinker. I'm building a company called{' '}
          <a href="https://hypercubic.ai" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-black dark:hover:text-white transition-colors">
            Hypercubic
          </a>
          , an AI platform for maintaining legacy systems autonomously. I write a blog called{' '}
          <a href="https://anticynical.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-black dark:hover:text-white transition-colors">
            Anticynical
          </a>
          , where I'm building a psychological and philosophical operating system for a rapidly changing world.
        </p>
      </FadeIn>

      <FadeIn index={5}>
        <div className="flex gap-7">
          <a
            href="https://hypercubic.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="relative text-[13px] tracking-[2px] uppercase text-black/50 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-px after:bg-black dark:after:bg-white after:transition-[width] after:duration-300 hover:after:w-full"
          >
            Hypercubic
          </a>
          <a
            href="https://anticynical.com"
            target="_blank"
            rel="noopener noreferrer"
            className="relative text-[13px] tracking-[2px] uppercase text-black/50 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-px after:bg-black dark:after:bg-white after:transition-[width] after:duration-300 hover:after:w-full"
          >
            Anticynical
          </a>
        </div>
      </FadeIn>
    </div>
  )
}
```

- [ ] **Step 2: Update App.tsx**

Replace `src/App.tsx`:

```tsx
import { ThemeContext, useThemeProvider } from './hooks/useTheme'
import Content from './components/Content'

export default function App() {
  const themeValue = useThemeProvider()

  return (
    <ThemeContext.Provider value={themeValue}>
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <Content />
      </div>
    </ThemeContext.Provider>
  )
}
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Expected: dark background, staggered fade-in of all content elements. Name in Space Grotesk, heading in Helvetica Neue light, tagline in Georgia italic, bio in ultralight, project links uppercase.

- [ ] **Step 4: Commit**

```bash
git add src/components/Content.tsx src/App.tsx
git commit -m "feat: add Content component with typography and staggered entrance animations"
```

---

### Task 4: Footer + Theme Toggle + Grain Overlay

**Files:**
- Create: `src/components/Footer.tsx`
- Create: `src/components/ThemeToggle.tsx`
- Create: `src/components/GrainOverlay.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create Footer**

Create `src/components/Footer.tsx`:

```tsx
export default function Footer() {
  return (
    <div className="fixed bottom-0 right-0 p-7 pr-12 flex gap-5 z-[2]">
      <a
        href="mailto:hello@aayushnaik.com"
        title="Contact"
        className="text-black/25 dark:text-white/30 hover:text-black/70 dark:hover:text-white/80 transition-colors flex items-center"
      >
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
        </svg>
      </a>
      <a
        href="https://linkedin.com/in/aayushnaik"
        target="_blank"
        rel="noopener noreferrer"
        title="LinkedIn"
        className="text-black/25 dark:text-white/30 hover:text-black/70 dark:hover:text-white/80 transition-colors flex items-center"
      >
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      </a>
      <a
        href="https://x.com/aayushnaik"
        target="_blank"
        rel="noopener noreferrer"
        title="X"
        className="text-black/25 dark:text-white/30 hover:text-black/70 dark:hover:text-white/80 transition-colors flex items-center"
      >
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
    </div>
  )
}
```

- [ ] **Step 2: Create ThemeToggle**

Create `src/components/ThemeToggle.tsx`:

```tsx
import { useTheme } from '../hooks/useTheme'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-7 right-12 z-[10] text-black/30 dark:text-white/30 hover:text-black/70 dark:hover:text-white/70 transition-colors"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
        </svg>
      )}
    </button>
  )
}
```

- [ ] **Step 3: Create GrainOverlay**

Create `src/components/GrainOverlay.tsx`:

```tsx
export default function GrainOverlay() {
  return (
    <div
      className="fixed inset-0 z-[1] pointer-events-none opacity-[0.018]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }}
    />
  )
}
```

- [ ] **Step 4: Update App.tsx**

Replace `src/App.tsx`:

```tsx
import { ThemeContext, useThemeProvider } from './hooks/useTheme'
import Content from './components/Content'
import Footer from './components/Footer'
import ThemeToggle from './components/ThemeToggle'
import GrainOverlay from './components/GrainOverlay'

export default function App() {
  const themeValue = useThemeProvider()

  return (
    <ThemeContext.Provider value={themeValue}>
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <GrainOverlay />
        <Content />
        <Footer />
        <ThemeToggle />
      </div>
    </ThemeContext.Provider>
  )
}
```

- [ ] **Step 5: Verify**

```bash
npm run dev
```

Expected: full page with content, footer icons bottom-right, sun/moon toggle top-right. Clicking toggle switches between dark (black bg, white text) and light (white bg, black text). Grain overlay visible on close inspection.

- [ ] **Step 6: Commit**

```bash
git add src/components/Footer.tsx src/components/ThemeToggle.tsx src/components/GrainOverlay.tsx src/App.tsx
git commit -m "feat: add Footer icons, ThemeToggle, and GrainOverlay"
```

---

### Task 5: Ambient Clock Component

**Files:**
- Create: `src/components/AmbientClock.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create AmbientClock**

Create `src/components/AmbientClock.tsx`:

```tsx
import { useRef, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'

const PHI = (1 + Math.sqrt(5)) / 2
const TAU = Math.PI * 2

export default function AmbientClock() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number

    // Resize handler
    function resize() {
      canvas!.width = canvas!.offsetWidth * devicePixelRatio
      canvas!.height = canvas!.offsetHeight * devicePixelRatio
      ctx!.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // Mouse state
    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let mouseSpeed = 0
    let rawSpeed = 0
    let mouseInside = false

    function onMouseMove(e: MouseEvent) {
      mouseX = e.clientX
      mouseY = e.clientY
      const raw = Math.sqrt(e.movementX * e.movementX + e.movementY * e.movementY)
      rawSpeed = mouseInside ? Math.min(raw, 40) : 0
      mouseInside = true
    }

    function onMouseLeave() {
      mouseInside = false
      rawSpeed = 0
    }

    function onMouseEnter() {
      mouseInside = false
      setTimeout(() => { mouseInside = true }, 50)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mouseenter', onMouseEnter)

    // Clock state
    let rot1 = 0, rot2 = 0, rot3 = 0
    let sweepAngle = 0, minuteAngle = 0
    let opacity = 0
    let fadeTimeout: ReturnType<typeof setTimeout> | null = null
    let isActive = false

    // Get clock color based on theme
    function getC() {
      return theme === 'dark' ? '255,255,255' : '0,0,0'
    }

    function drawRing(cx: number, cy: number, r: number, alpha: number) {
      ctx!.beginPath()
      ctx!.arc(cx, cy, r, 0, TAU)
      ctx!.strokeStyle = `rgba(${getC()},${alpha})`
      ctx!.lineWidth = 1
      ctx!.stroke()
    }

    function drawDashedRing(cx: number, cy: number, r: number, alpha: number) {
      ctx!.setLineDash([4, 8])
      drawRing(cx, cy, r, alpha)
      ctx!.setLineDash([])
    }

    function drawHand(cx: number, cy: number, angle: number, length: number, alpha: number, width: number) {
      const grad = ctx!.createLinearGradient(
        cx, cy,
        cx + Math.cos(angle - Math.PI / 2) * length,
        cy + Math.sin(angle - Math.PI / 2) * length
      )
      grad.addColorStop(0, `rgba(${getC()},0)`)
      grad.addColorStop(1, `rgba(${getC()},${alpha})`)
      ctx!.beginPath()
      ctx!.moveTo(cx, cy)
      ctx!.lineTo(
        cx + Math.cos(angle - Math.PI / 2) * length,
        cy + Math.sin(angle - Math.PI / 2) * length
      )
      ctx!.strokeStyle = grad
      ctx!.lineWidth = width
      ctx!.stroke()
    }

    function draw() {
      const cw = canvas!.offsetWidth
      const ch = canvas!.offsetHeight
      ctx!.clearRect(0, 0, cw, ch)
      const cx = cw / 2, cy = ch / 2

      // Decay speed
      mouseSpeed += (rawSpeed - mouseSpeed) * 0.3
      mouseSpeed *= 0.92
      if (mouseSpeed < 0.05) mouseSpeed = 0
      rawSpeed = 0

      // Logarithmic spiral
      const dx = mouseX - cx, dy = mouseY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const maxDist = Math.sqrt(cx * cx + cy * cy)
      const norm = Math.min(dist / maxDist, 1)
      const logFactor = Math.log(1 + norm * 9) / Math.log(10)

      const inc = mouseSpeed * 0.003

      // Golden ratio rotation
      rot1 += inc * (0.3 + logFactor * 1.5) * 1
      rot2 += inc * (0.3 + logFactor * 1.5) * PHI
      rot3 += inc * (0.3 + logFactor * 1.5) * PHI * PHI
      sweepAngle += inc * (0.08 + logFactor * 0.4) * PHI
      minuteAngle += inc * (0.02 + logFactor * 0.1) * (1 / PHI)

      // Ring sizes expand with distance
      const rInner = 300 + norm * 60
      const rMid = 400 + norm * 80
      const rOuter = 550 + norm * 100

      // Fade in/out
      if (mouseSpeed > 0.5) {
        isActive = true
        if (fadeTimeout) clearTimeout(fadeTimeout)
        fadeTimeout = setTimeout(() => { isActive = false }, 1000)
      }
      opacity += ((isActive ? 1 : 0) - opacity) * 0.06

      if (opacity < 0.005) {
        animationId = requestAnimationFrame(draw)
        return
      }

      ctx!.globalAlpha = opacity

      drawRing(cx, cy, rOuter, 0.05)
      drawDashedRing(cx, cy, rInner, 0.06)
      drawRing(cx, cy, rMid, 0.08)

      drawHand(cx, cy, sweepAngle, rInner * 0.9, 0.14, 1)
      drawHand(cx, cy, minuteAngle, rInner * 0.65, 0.1, 1.5)

      // Center dot
      ctx!.beginPath()
      ctx!.arc(cx, cy, 2, 0, TAU)
      ctx!.fillStyle = `rgba(${getC()},0.18)`
      ctx!.fill()

      ctx!.globalAlpha = 1
      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('mouseenter', onMouseEnter)
      if (fadeTimeout) clearTimeout(fadeTimeout)
    }
  }, [theme])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0 pointer-events-none"
    />
  )
}
```

- [ ] **Step 2: Add to App.tsx**

Replace `src/App.tsx`:

```tsx
import { ThemeContext, useThemeProvider } from './hooks/useTheme'
import AmbientClock from './components/AmbientClock'
import Content from './components/Content'
import Footer from './components/Footer'
import ThemeToggle from './components/ThemeToggle'
import GrainOverlay from './components/GrainOverlay'

export default function App() {
  const themeValue = useThemeProvider()

  return (
    <ThemeContext.Provider value={themeValue}>
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <AmbientClock />
        <GrainOverlay />
        <Content />
        <Footer />
        <ThemeToggle />
      </div>
    </ThemeContext.Provider>
  )
}
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Expected: full site with ambient clock behind content. Move mouse to see rings + hands appear. Clock uses white elements on dark mode, black elements on light mode. Stops cleanly when mouse stops. Toggle theme to verify both modes.

- [ ] **Step 4: Commit**

```bash
git add src/components/AmbientClock.tsx src/App.tsx
git commit -m "feat: add mouse-driven ambient clock with golden ratio + logarithmic spiral"
```

---

### Task 6: Final Polish + Build Verification

**Files:**
- Modify: `index.html` (meta tags)
- Modify: `src/components/Content.tsx` (fix dark mode class ordering if needed)

- [ ] **Step 1: Add meta tags to index.html**

Update `index.html` `<head>`:

```html
<meta name="description" content="Aayush Naik — Engineer, founder, thinker. Precision in tech, depth in ideas.">
<meta property="og:title" content="Aayush Naik">
<meta property="og:description" content="Engineer, founder, thinker. Precision in tech, depth in ideas.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://aayushnaik.com">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
```

- [ ] **Step 2: Create a minimal favicon**

Create `public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">A</text></svg>
```

- [ ] **Step 3: Verify dark mode class behavior**

In `src/components/Content.tsx`, Tailwind v4 uses CSS-based dark mode by default (via `@media (prefers-color-scheme: dark)`). Since we're using a class-based toggle, add to `src/index.css`:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

This tells Tailwind v4 to use the `.dark` class on `<html>` instead of the media query.

- [ ] **Step 4: Build and verify**

```bash
npm run build
npm run preview
```

Expected: production build succeeds. Preview shows the full site working correctly — dark mode default, clock animation, theme toggle, all content styled.

- [ ] **Step 5: Commit**

```bash
git add index.html public/favicon.svg src/index.css
git commit -m "feat: add meta tags, favicon, and finalize dark mode config"
```

---

### Task 7: Add .gitignore and Clean Up

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Create .gitignore**

Create `.gitignore`:

```
node_modules
dist
.DS_Store
.superpowers
```

- [ ] **Step 2: Verify final state**

```bash
npm run build
```

Expected: clean build with no errors or warnings.

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: add .gitignore"
```
