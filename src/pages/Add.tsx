import { useState } from 'react'
import { AddWordForm } from '../components/AddWordForm'
import { AddMathForm } from '../components/AddMathForm'
import { format } from 'date-fns'

type Tab = 'word' | 'math'

export function Add() {
  const [tab, setTab] = useState<Tab>('word')
  const [lastAdded, setLastAdded] = useState<{ kind: string; time: number } | null>(null)

  return (
    <div className="pt-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Quick Add</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(), 'EEEE, MMM d')}</p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <TabButton active={tab === 'word'} onClick={() => setTab('word')}>＋ Word</TabButton>
        <TabButton active={tab === 'math'} onClick={() => setTab('math')}>▤ Math Concept</TabButton>
      </div>

      {lastAdded && <p className="text-xs text-green-600 dark:text-green-400">Added {lastAdded.kind} at {format(lastAdded.time, 'HH:mm')}</p>}

      {tab === 'word' ? (
        <AddWordForm onAdded={() => setLastAdded({ kind: 'word', time: Date.now() })} />
      ) : (
        <AddMathForm onAdded={() => setLastAdded({ kind: 'concept', time: Date.now() })} />
      )}
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl py-3 font-semibold transition-colors ${
        active
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'
      }`}
    >
      {children}
    </button>
  )
}
