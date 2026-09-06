import { useCallback, useEffect, useRef, useState } from 'react'
import { getAllReviewRecords } from '../data/repo'
import { isDue } from '../data/sm2'

const STORAGE_KEY = 'gre-reminder-enabled'
const CHECK_INTERVAL = 5 * 60 * 1000 // minutes

/**
 * Daily review reminder:
 * - If enabled and permission granted, checks periodically whether there
 *   are cards due; emails a browser notification once per day if the user
 *   hasn't reviewed yet.
 */
export function Reminder() {
  const [enabled, setEnabled] = useState<boolean>(() => localStorage.getItem(STORAGE_KEY) === '1')
  const lastNotifiedDay = useRef<string | null>(null)

  const maybeNotify = useCallback(async () => {
    if (!enabled) return
    if (Notification.permission !== 'granted') return

    const records = await getAllReviewRecords()
    const now = Date.now()
    const due = Object.values(records).filter((r) => isDue(r, now)).length
    if (due === 0) return

    const today = new Date().toDateString()
    // Don't notify multiple times on the same day
    if (lastNotifiedDay.current === today) return

    const hasReviewedToday = Object.values(records).some((r) => {
      if (!r.lastReviewedDate) return false
      const d = new Date(r.lastReviewedDate)
      return d.toDateString() === today && d.getMonth() === new Date().getMonth()
    })
    if (hasReviewedToday) return

    new Notification('GRE Prep — daily review', {
      body: `You have ${due} card${due === 1 ? '' : 's'} due. Tap to review.`,
      tag: 'daily-review',
      icon: '/pwa-192.png',
    })
    lastNotifiedDay.current = today
  }, [enabled])

  useEffect(() => {
    if (enabled) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
      const id = setInterval(maybeNotify, CHECK_INTERVAL)
      return () => clearInterval(id)
    }
  }, [enabled, maybeNotify])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0')
  }, [enabled])

  const supported = 'Notification' in window

  if (!supported) return null

  return (
    <div className="fixed top-16 right-4 z-20 w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow flex items-center justify-center" title={enabled ? 'Daily reminder on' : 'Daily reminder off'}>
      <button
        onClick={() => setEnabled((e) => !e)}
        aria-label="Toggle review reminder"
        className={`text-lg ${enabled ? 'opacity-100' : 'opacity-40'}`}
      >
        {enabled ? '🔔' : '🔕'}
      </button>
    </div>
  )
}
