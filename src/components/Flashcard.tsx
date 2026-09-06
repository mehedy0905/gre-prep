import { useState } from 'react'
import type { FlashcardEntry, Rating, VocabEntry, MathEntry } from '../types'

interface FlashcardProps {
  entry: FlashcardEntry
  index: number
  total: number
  onRate: (rating: Rating) => void
}

const RATING_ORDER: { key: Rating; label: string; sub: string; cls: string }[] = [
  { key: 'Again', label: 'Again', sub: 'reset', cls: 'bg-red-500 hover:bg-red-600 text-white' },
  { key: 'Hard', label: 'Hard', sub: '1.2×', cls: 'bg-orange-500 hover:bg-orange-600 text-white' },
  { key: 'Good', label: 'Good', sub: '✓', cls: 'bg-green-600 hover:bg-green-700 text-white' },
  { key: 'Easy', label: 'Easy', sub: '1.3×', cls: 'bg-blue-500 hover:bg-blue-600 text-white' },
]

export function Flashcard({ entry, index, total, onRate }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false)
  const [justRated, setJustRated] = useState(false)

  return (
    <div className="space-y-4">
      <div className="text-center text-sm text-gray-400">
        {index + 1} / {total}
      </div>

      <div className="flashcard h-72 sm:h-80" onClick={() => setFlipped((f) => !f)}>
        <div className={`flashcard-inner ${flipped ? 'flipped' : ''} cursor-pointer`}>
          <Front entry={entry} />
          <Back entry={entry} />
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">Tap card to flip</p>

      <div className="grid grid-cols-2 gap-2">
        {RATING_ORDER.map((r) => (
          <button
            key={r.key}
            onClick={() => {
              if (justRated) return
              setJustRated(true)
              onRate(r.key)
            }}
            disabled={!flipped || justRated}
            className={`rounded-xl py-3 font-semibold transition-colors disabled:opacity-40 ${r.cls}`}
          >
            {r.label}
          </button>
        ))}
      </div>
      {!flipped && (
        <p className="text-center text-xs text-indigo-500 dark:text-indigo-400">Try to recall, then flip to rate →</p>
      )}
    </div>
  )
}

export function Front({ entry }: { entry: FlashcardEntry }) {
  return (
    <div className="flashcard-front flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-lg p-6 text-center">
      <span className="text-xs uppercase tracking-wider text-gray-400">
        {entry.type === 'vocab' ? (entry as any).partOfSpeech || 'Vocab' : (entry as any).category}
      </span>
      <div className="text-3xl font-bold break-words max-w-full">
        {entry.type === 'vocab' ? entry.word : entry.title}
      </div>
      {entry.type === 'vocab' && (entry as any).mnemonic && (
        <div className="text-sm text-gray-400 italic">💡 {(entry as any).mnemonic}</div>
      )}
    </div>
  )
}

export function Back({ entry }: { entry: FlashcardEntry }) {
  return (
    <div className="flashcard-back bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-lg p-5 overflow-y-auto text-left">
      {entry.type === 'vocab' ? <VocabBack entry={entry} /> : <MathBack entry={entry} />}
    </div>
  )
}

export function VocabBack({ entry }: { entry: VocabEntry }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-lg font-bold">{entry.word} <span className="text-xs text-gray-400 italic">{entry.partOfSpeech}</span></div>
      <div className="leading-relaxed">{entry.definition}</div>
      {entry.example && (
        <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 p-3 italic">{entry.example}</div>
      )}
      {entry.synonyms.length > 0 && (
        <div className="text-green-700 dark:text-green-400">Syn: {entry.synonyms.join(', ')}</div>
      )}
      {entry.antonyms.length > 0 && (
        <div className="text-red-600 dark:text-red-400">Ant: {entry.antonyms.join(', ')}</div>
      )}
      {entry.mnemonic && (
        <div className="text-gray-500 dark:text-gray-400 text-xs">💡 {entry.mnemonic}</div>
      )}
    </div>
  )
}

export function MathBack({ entry }: { entry: MathEntry }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-lg font-bold">{entry.title} <span className="text-xs text-gray-400 italic">{entry.category}</span></div>
      <div className="leading-relaxed">{entry.technique}</div>
      {entry.workedExample && (
        <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 p-3">
          <div className="font-semibold text-xs uppercase text-gray-400 mb-1">Worked example</div>
          <pre className="whitespace-pre-wrap font-sans text-sm">{entry.workedExample}</pre>
        </div>
      )}
      {entry.pitfalls && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-amber-700 dark:text-amber-300">
          ⚠ {entry.pitfalls}
        </div>
      )}
    </div>
  )
}
