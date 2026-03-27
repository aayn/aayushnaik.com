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
