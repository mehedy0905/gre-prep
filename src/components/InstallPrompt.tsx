import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Shows a small install-to-home-screen prompt when the PWA
 * becomes installable, and when dismissed, hides permanently
 * within this browser session.
 */
export function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!prompt || dismissed) return null

  async function install() {
    if (!prompt) return
    prompt.prompt()
    const choice = await prompt.userChoice
    setDismissed(true)
    if (choice.outcome !== 'accepted') setPrompt(null)
  }

  return (
    <div className="fixed bottom-16 inset-x-0 z-20 px-4">
      <div className="mx-auto max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-gray-200 dark:border-slate-700 p-4 flex items-center gap-3">
        <div className="text-2xl">📲</div>
        <div className="flex-1 text-sm">
          <div className="font-semibold">Install GRE Prep</div>
          <div className="text-gray-500 dark:text-gray-400 text-xs">Use it like an app, and review everywhere.</div>
        </div>
        <button onClick={install} className="rounded-lg bg-indigo-600 text-white text-sm px-3 py-2">Install</button>
        <button onClick={() => setDismissed(true)} className="text-gray-400 text-xl px-1">×</button>
      </div>
    </div>
  )
}
