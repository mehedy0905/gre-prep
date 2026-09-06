import { useEffect, useState } from 'react'
import { getCardMap } from '../data/repo'
import { Flashcard } from '../components/Flashcard'
import { applyRating } from '../data/sm2'
import { db } from '../data/db'
import type { Rating, FlashcardEntry } from '../types'

interface CardData {
  entry: FlashcardEntry
  record: {
    history: Rating[]
    easeFactor: number
    repetitions: number
    streak: number
  }
}

function weaknessScore(r: CardData['record']): number {
  if (r.history.length === 0) return 0 // no data -> not weak
  // Weight: again is worse than hard. Recent agains matter more via index weight.
  let score = 0
  r.history.forEach((h, i) => {
    if (h === 'Again') score += 2 * (1 + i * 0.1)
    if (h === 'Hard') score += 1 * (1 + i * 0.1)
  })
  return score
}

export function WeakSpots() {
  const [cards, setCards] = useState<CardData[]>([])
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)

  const load = async () => {
    const map = await getCardMap()
    const list = Array.from(map.values())
      .map(({ entry, record }) => ({ entry, record: { history: record.history, easeFactor: record.easeFactor, repetitions: record.repetitions, streak: record.streak } }))
      .filter((c) => weaknessScore(c.record) > 0)
      .sort((a, b) => weaknessScore(b.record) - weaknessScore(a.record))
    setCards(list)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleRate(rating: Rating) {
    if (index >= cards.length) return
    const entry = cards[index].entry
    const record = await db.reviews.where('cardId').equals(entry.id).first()
    if (record) {
      await db.reviews.put(applyRating(record, rating))
    }
    if (index + 1 >= cards.length) {
      setDone(true)
    } else {
      setIndex(index + 1)
    }
  }

  if (loading) return <div className="pt-10 text-center text-gray-500">Loading…</div>

  if (done) {
    return (
      <div className="pt-10 flex flex-col items-center gap-4 text-center">
        <div className="text-5xl">🏆</div>
        <h1 className="text-2xl font-bold">Weak spot drill complete!</h1>
        <button onClick={() => { setDone(false); setIndex(0); load(); }} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3">Drill again</button>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="pt-10 flex flex-col items-center gap-3 text-center">
        <div className="text-5xl">💪</div>
        <h1 className="text-2xl font-bold">No weak spots right now</h1>
        <p className="text-gray-500 text-sm">Cards you rate Again/Hard will show up here for focused drilling.</p>
      </div>
    )
  }

  const current = cards[index]

  return (
    <div className="pt-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🎯 Weak Spots</h1>
        <span className="text-sm text-gray-500">{cards.length} flagged</span>
      </header>
      <p className="text-sm text-gray-500">Cards you've repeatedly rated Again/Hard, ranked by weakness.</p>
      <Flashcard
        key={current.entry.id}
        entry={current.entry}
        index={index}
        total={cards.length}
        onRate={handleRate}
      />
    </div>
  )
}
