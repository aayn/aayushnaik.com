import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

function readThemeFromDom(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/**
 * Theme hook for use inside Astro React islands.
 *
 * Each island runs its own React tree (no shared Context Provider), so
 * state synchronization happens via the document element's `dark` class
 * and localStorage. The inline `<script is:inline>` in BaseLayout sets the
 * initial class before paint; this hook reads that, lets the user toggle,
 * and observes class mutations from sibling islands so multiple consumers
 * (ThemeToggle + AmbientClock) stay in sync.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readThemeFromDom)

  // Local state → DOM + localStorage
  useEffect(() => {
    const html = document.documentElement
    html.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  // DOM (other islands) → local state
  useEffect(() => {
    const html = document.documentElement
    const observer = new MutationObserver(() => {
      const next: Theme = html.classList.contains('dark') ? 'dark' : 'light'
      setTheme((prev) => (prev === next ? prev : next))
    })
    observer.observe(html, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}
