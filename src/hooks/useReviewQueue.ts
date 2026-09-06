import { useCallback, useEffect, useState } from 'react'
import { getCardMap } from '../data/repo'
import { isDue } from '../data/sm2'
import type { CardType, FlashcardEntry, ReviewSessionEntry } from '../types'

export type ReviewFilter = 'all' | 'vocab' | 'math'

export interface ReviewQueueInfo {
  due: number
  newCards: number
  total: number
}

/**
 * Loads the joined entry+record card map and the queue of due cards.
 * The queue is rebuilt whenever the filter changes or a review completes.
 */
export function useReviewQueue(filter: ReviewFilter) {
  const [queue, setQueue] = useState<ReviewSessionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState<ReviewQueueInfo>({ due: 0, newCards: 0, total: 0 })

  const build = useCallback(async () => {
    setLoading(true)
    const map = await getCardMap()
    const now = Date.now()
    const all = Array.from(map.entries())

    const filtered =
      filter === 'all' ? all : all.filter(([, { entry }]) => entry.type === filter)

    const dueCards = filtered
      .filter(([, { record }]) => isDue(record, now))
      .sort((a, b) => a[1].record.nextDueDate - b[1].record.nextDueDate)
      .map(([, { entry, record }]) => ({ entry, record }))

    const due = dueCards.length
    const newCards = filtered.filter(([, { record }]) => record.repetitions === 0 && isDue(record, now)).length
    setCounts({ due, newCards, total: filtered.length })
    setQueue(dueCards)
    setLoading(false)
  }, [filter])

  useEffect(() => {
    build()
  }, [build])

  return { queue, counts, loading, reload: build }
}

export function entryDisplayName(entry: FlashcardEntry): string {
  return entry.type === 'vocab' ? entry.word : entry.title
}

export function cardTypeLabel(type: CardType): string {
  return type === 'vocab' ? 'Vocab' : 'Math'
}
