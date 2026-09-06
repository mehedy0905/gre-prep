import { useState } from 'react'
import { useReviewQueue, type ReviewFilter } from '../hooks/useReviewQueue'
import { Flashcard } from '../components/Flashcard'
import { getReviewRecord } from '../data/repo'
import { applyRating } from '../data/sm2'
import { db } from '../data/db'
import type { Rating } from '../types'
import { Link } from 'react-router-dom'

const FILTERS: { key: ReviewFilter; label: string }[] = [
  { key: 'all', label: 'Mixed' },
  { key: 'vocab', label: 'Vocab only' },
  { key: 'math', label: 'Math only' },
]

export function Review() {
  const [filter, setFilter] = useState<ReviewFilter>('all')
  const { queue, counts, loading, reload } = useReviewQueue(filter)
  const [index, setIndex] = useState(0)
  const [sessionDone, setSessionDone] = useState(false)
  const [result, setResult] = useState<{ Again: number; Hard: number; Good: number; Easy: number }>({ Again: 0, Hard: 0, Good: 0, Easy: 0 })

  async function handleRate(rating: Rating) {
    if (index >= queue.length) return
    const { entry, record } = queue[index]
    const freshRecord = (await getReviewRecord(entry.id)) ?? record
    const updated = applyRating(freshRecord, rating)
    await db.reviews.put(updated)

    setResult((r) => ({ ...r, [rating]: r[rating] + 1 }))

    const next = index + 1
    if (next >= queue.length) {
      setSessionDone(true)
      await reload()
    } else {
      setIndex(next)
    }
  }

  function restart() {
    setIndex(0)
    setSessionDone(false)
    setResult({ Again: 0, Hard: 0, Good: 0, Easy: 0 })
    reload()
  }

  if (loading) {
    return <div className="pt-6 text-center text-gray-500">Loading review queue…</div>
  }

  if (sessionDone) {
    return (
      <div className="pt-10 flex flex-col items-center gap-6 text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold">Session complete!</h1>
        <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
          <Stat label="Again" value={result.Again} color="text-red-500" />
          <Stat label="Hard" value={result.Hard} color="text-orange-500" />
          <Stat label="Good" value={result.Good} color="text-green-600" />
          <Stat label="Easy" value={result.Easy} color="text-blue-500" />
        </div>
        <button onClick={restart} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3">More Reviews</button>
        <Link to="/" className="text-sm text-indigo-500">Back to Home</Link>
      </div>
    )
  }

  if (queue.length === 0) {
    return (
      <div className="pt-10 flex flex-col items-center gap-4 text-center">
        <div className="text-5xl">🍃</div>
        <h1 className="text-2xl font-bold">All caught up!</h1>
        <p className="text-gray-500">No cards due right now.</p>
        <Link to="/add" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3">Add a word</Link>
      </div>
    )
  }

  if (index >= queue.length) {
    return <div className="pt-6 text-center">No cards…</div>
  }

  const current = queue[index]

  return (
    <div className="pt-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Review</h1>
        <div className="text-sm text-gray-500">{counts.due} due{counts.newCards > 0 ? ` · ${counts.newCards} new` : ''}</div>
      </header>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setIndex(0); setSessionDone(false); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Flashcard
        key={current.entry.id}
        entry={current.entry}
        index={index}
        total={queue.length}
        onRate={handleRate}
      />
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-gray-100 dark:bg-slate-800 p-3 flex flex-col items-center">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}
