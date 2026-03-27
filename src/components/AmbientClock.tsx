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

    function resize() {
      canvas!.width = canvas!.offsetWidth * devicePixelRatio
      canvas!.height = canvas!.offsetHeight * devicePixelRatio
      ctx!.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

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

    let rot1 = 0, rot2 = 0, rot3 = 0
    let sweepAngle = 0, minuteAngle = 0
    let opacity = 0
    let fadeTimeout: ReturnType<typeof setTimeout> | null = null
    let isActive = false

    const C = theme === 'dark' ? '255,255,255' : '0,0,0'

    function drawRing(cx: number, cy: number, r: number, alpha: number) {
      ctx!.beginPath()
      ctx!.arc(cx, cy, r, 0, TAU)
      ctx!.strokeStyle = `rgba(${C},${alpha})`
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
      grad.addColorStop(0, `rgba(${C},0)`)
      grad.addColorStop(1, `rgba(${C},${alpha})`)
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

      mouseSpeed += (rawSpeed - mouseSpeed) * 0.3
      mouseSpeed *= 0.92
      if (mouseSpeed < 0.05) mouseSpeed = 0
      rawSpeed = 0

      const dx = mouseX - cx, dy = mouseY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const maxDist = Math.sqrt(cx * cx + cy * cy)
      const norm = Math.min(dist / maxDist, 1)
      const logFactor = Math.log(1 + norm * 9) / Math.log(10)

      const inc = mouseSpeed * 0.003

      rot1 += inc * (0.3 + logFactor * 1.5) * 1
      rot2 += inc * (0.3 + logFactor * 1.5) * PHI
      rot3 += inc * (0.3 + logFactor * 1.5) * PHI * PHI
      sweepAngle += inc * (0.08 + logFactor * 0.4) * PHI
      minuteAngle += inc * (0.02 + logFactor * 0.1) * (1 / PHI)

      const rInner = 300 + norm * 60
      const rMid = 400 + norm * 80
      const rOuter = 550 + norm * 100

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

      ctx!.beginPath()
      ctx!.arc(cx, cy, 2, 0, TAU)
      ctx!.fillStyle = `rgba(${C},0.18)`
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
