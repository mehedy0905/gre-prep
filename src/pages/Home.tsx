import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllEntries, getAllReviewRecords, getEntriesReviewedToday } from '../data/repo'
import { HomeFlashcard } from '../components/HomeFlashcard'
import type { FlashcardEntry, ReviewRecord } from '../types'

interface HomeData {
  addedToday: FlashcardEntry[]
  reviewedToday: FlashcardEntry[]
  overall: FlashcardEntry[]
  streak: number
}

export function Home() {
  const [data, setData] = useState<HomeData | null>(null)
  const [todayTab, setTodayTab] = useState<'added' | 'reviewed'>('added')

  useEffect(() => {
    async function load() {
      const [allEntries, reviewedToday, records] = await Promise.all([
        getAllEntries(),
        getEntriesReviewedToday(),
        getAllReviewRecords(),
      ])
      const now = Date.now()
      const addedToday = allEntries.filter((e) => isSameDay(e.dateAdded, now))
      const streak = computeStreak(records, now)
      setData({ addedToday, reviewedToday, overall: allEntries, streak })
    }
    load()
  }, [])

  if (!data) return <div className="pt-10 text-center text-gray-500">Loading…</div>

  const emptyLibrary = data.overall.length === 0

  return (
    <div className="pt-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">GRE Prep</h1>
          <p className="text-sm text-gray-500">Keep your edge sharp</p>
        </div>
        {data.streak > 0 && (
          <div className="text-right">
            <div className="text-3xl font-bold text-orange-500">🔥 {data.streak}</div>
            <div className="text-xs text-gray-500">day streak</div>
          </div>
        )}
      </header>

      {/* Learn Today */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Learn Today</h2>
          {data.addedToday.length > 0 && (
            <span className="text-xs text-gray-400">{data.addedToday.length} added</span>
          )}
        </div>
        <div className="flex gap-2 mb-4">
          <TabBtn active={todayTab === 'added'} onClick={() => setTodayTab('added')}>
            Added today
          </TabBtn>
          <TabBtn active={todayTab === 'reviewed'} onClick={() => setTodayTab('reviewed')}>
            Reviewed today
          </TabBtn>
        </div>
        {emptyLibrary ? (
          <EmptyState
            text="Your library is empty — add some words first"
            href="/add"
            action="Quick add"
          />
        ) : todayTab === 'added' ? (
          data.addedToday.length > 0 ? (
            <FlashcardSection entries={data.addedToday} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">
              No cards added today yet.
            </p>
          )
        ) : data.reviewedToday.length > 0 ? (
          <FlashcardSection entries={data.reviewedToday} />
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">
            No cards reviewed today. Head to the Review tab to start.
          </p>
        )}
      </section>

      {/* Learn Overall */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Learn Overall</h2>
          {data.overall.length > 0 && (
            <span className="text-xs text-gray-400">{data.overall.length} cards</span>
          )}
        </div>
        {emptyLibrary ? (
          <EmptyState
            text="No words to revise yet"
            href="/add"
            action="Add words"
          />
        ) : (
          <FlashcardSection entries={data.overall} />
        )}
      </section>
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
        active
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  )
}

function EmptyState({ text, href, action }: { text: string; href: string; action: string }) {
  return (
    <div className="text-center py-8 space-y-3">
      <p className="text-sm text-gray-400">{text}</p>
      <Link
        to={href}
        className="inline-block rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-semibold transition-colors"
      >
        {action}
      </Link>
    </div>
  )
}

function FlashcardSection({ entries }: { entries: FlashcardEntry[] }) {
  const [index, setIndex] = useState(0)
  const [order, setOrder] = useState<number[]>(() => shuffleOrder(entries.length))

  const current = order[index] ?? 0

  return (
    <HomeFlashcard
      entry={entries[current]}
      index={index}
      total={entries.length}
      onPrev={() => setIndex((i) => (i - 1 + entries.length) % entries.length)}
      onNext={() => setIndex((i) => (i + 1) % entries.length)}
      onShuffle={() => setOrder(shuffleOrder(entries.length))}
    />
  )
}

function isSameDay(a: number, b: number): boolean {
  const da = new Date(a)
  const db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function computeStreak(records: Record<string, ReviewRecord>, now: number): number {
  // Count consecutive days (ending today or yesterday) with at least one reviewed card
  const days = new Set<string>()
  for (const r of Object.values(records)) {
    if (r.lastReviewedDate) days.add(dayKey(r.lastReviewedDate))
  }
  const today = new Date(now)
  let streak = 0
  const cursor = new Date(today)
  // If today not reviewed yet, start from yesterday
  if (!days.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1)
  while (days.has(dayKey(cursor.getTime()))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function shuffleOrder(len: number): number[] {
  const arr = Array.from({ length: len }, (_, i) => i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}