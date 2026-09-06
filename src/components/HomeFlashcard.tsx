import { useState } from 'react'
import type { FlashcardEntry } from '../types'
import { Front, Back } from './Flashcard'

interface HomeFlashcardProps {
  entry: FlashcardEntry
  index: number
  total: number
  onPrev: () => void
  onNext: () => void
  onShuffle: () => void
}

export function HomeFlashcard({ entry, index, total, onPrev, onNext, onShuffle }: HomeFlashcardProps) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="space-y-4">
      <div className="text-center text-sm text-gray-400">
        {index + 1} / {total}
      </div>

      <div className="flashcard h-64 sm:h-72" onClick={() => setFlipped((f) => !f)}>
        <div className={`flashcard-inner ${flipped ? 'flipped' : ''} cursor-pointer`}>
          <Front entry={entry} />
          <Back entry={entry} />
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">Tap card to flip</p>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onPrev}
          disabled={total <= 1}
          className="flex-1 rounded-xl py-2.5 border border-gray-200 dark:border-slate-700 font-semibold text-sm transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-40"
        >
          ← Prev
        </button>
        <button
          onClick={onShuffle}
          className="flex-1 rounded-xl py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors"
        >
          🔀 Shuffle
        </button>
        <button
          onClick={onNext}
          disabled={total <= 1}
          className="flex-1 rounded-xl py-2.5 border border-gray-200 dark:border-slate-700 font-semibold text-sm transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-40"
        >
          Next →
        </button>
      </div>

      <div className="flex justify-center gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${i === index ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-slate-700'}`}
          />
        ))}
      </div>
    </div>
  )
}