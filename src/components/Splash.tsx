import { useEffect, useState } from 'react'

const SPLASH_DURATION = 5000

/**
 * Full-screen launch splash shown for 5 seconds on app start.
 * Displays the app logo, name, and author credits.
 */
export function Splash() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), SPLASH_DURATION - 500)
    const hideTimer = setTimeout(() => setVisible(false), SPLASH_DURATION)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white transition-opacity duration-500 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/95 shadow-2xl">
        <span className="text-5xl font-extrabold text-indigo-600">G</span>
      </div>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">GRE Prep</h1>
      <p className="mt-1 text-sm font-medium text-indigo-200">Built with love for the GRE</p>

      <div className="mt-16 text-center">
        <p className="text-sm font-semibold">Mehedy Hasan</p>
        <p className="mt-1 text-xs text-indigo-200">Research Assistant · ARCED Foundation</p>
      </div>

      <div className="absolute bottom-10 text-xs text-indigo-200 opacity-70">Preparing your study session…</div>
    </div>
  )
}
