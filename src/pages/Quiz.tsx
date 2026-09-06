import { useEffect, useMemo, useState } from 'react'
import { getAllEntries } from '../data/repo'
import type { FlashcardEntry, VocabEntry, MathEntry } from '../types'

type Mode = 'vocab' | 'math'

interface Question {
  prompt: string
  answer: string
  options?: string[] // for vocab MC
  type: 'mc' | 'text'
}

const SHUFFLE = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function Quiz() {
  const [mode, setMode] = useState<Mode>('vocab')
  const [entries, setEntries] = useState<FlashcardEntry[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [done, setDone] = useState(false)

  const load = async () => {
    const all = await getAllEntries()
    setEntries(all)
  }

  useEffect(() => { load() }, [])

  const vocabEntries = useMemo(() => entries.filter((e) => e.type === 'vocab') as VocabEntry[], [entries])
  const mathEntries = useMemo(() => entries.filter((e) => e.type === 'math') as MathEntry[], [entries])

  function start(m: Mode) {
    setMode(m)
    setIndex(0)
    setScore(0)
    setDone(false)
    setAnswered(false)
    setSelected(null)
    setTyped('')

    let qs: Question[] = []
    if (m === 'vocab') {
      const pool = vocabEntries.filter((e) => e.definition.trim())
      const q = SHUFFLE(pool).slice(0, Math.min(10, pool.length))
      qs = q.map((e) => {
        const distractors = SHUFFLE(pool.filter((x) => x.id !== e.id))
          .slice(0, 3)
          .map((x) => x.definition)
        const options = SHUFFLE([e.definition, ...distractors])
        return { prompt: e.word, answer: e.definition, options, type: 'mc' as const }
      })
    } else {
      const pool = mathEntries.filter((e) => e.title.trim())
      const q = SHUFFLE(pool).slice(0, Math.min(10, pool.length))
      qs = q.map((e) => ({
        prompt: e.title,
        answer: e.technique.trim(),
        type: 'text' as const,
      }))
    }
    setQuestions(qs)
  }

  function check() {
    const q = questions[index]
    if (!q) return
    let correct = false
    if (q.type === 'mc') {
      correct = selected === q.answer
    } else {
      correct = typed.trim().toLowerCase() === q.answer.trim().toLowerCase()
    }
    if (correct) setScore((s) => s + 1)
    setAnswered(true)
  }

  function next() {
    if (index + 1 >= questions.length) {
      setDone(true)
    } else {
      setIndex(index + 1)
      setAnswered(false)
      setSelected(null)
      setTyped('')
    }
  }

  // No data states
  if (entries.length > 0 && vocabEntries.length === 0 && mathEntries.length === 0) {
    return <Empty mode={mode} />
  }

  return (
    <div className="pt-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Quiz</h1>
        <p className="text-sm text-gray-500">Test yourself with generated questions</p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <ModeButton active={mode === 'vocab'} disabled={vocabEntries.length === 0} onClick={() => start('vocab')}>Word → Definition</ModeButton>
        <ModeButton active={mode === 'math'} disabled={mathEntries.length === 0} onClick={() => start('math')}>Math technique</ModeButton>
      </div>

      {questions.length === 0 && vocabEntries.length + mathEntries.length === 0 && (
        <p className="text-center text-gray-500 py-10">Add some cards to generate a quiz.</p>
      )}

      {questions.length > 0 && !done && (
        <>
          <div className="text-sm text-gray-400 text-center">{index + 1} / {questions.length} · Score {score}</div>
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow min-h-48">
            <div className="text-2xl font-bold text-center mb-6 break-words">{questions[index].prompt}</div>
            {questions[index].type === 'mc' ? (
              <div className="space-y-2">
                {questions[index].options!.map((opt) => {
                  const isCorrect = opt === questions[index].answer
                  const isSelected = selected === opt
                  let cls = 'border-gray-200 dark:border-slate-700'
                  if (answered && isCorrect) cls = 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                  else if (answered && isSelected && !isCorrect) cls = 'border-red-500 bg-red-50 dark:bg-red-900/30'
                  else if (!answered && isSelected) cls = 'border-indigo-500'
                  return (
                    <button
                      key={opt}
                      disabled={answered}
                      onClick={() => setSelected(opt)}
                      className={`block w-full text-left rounded-xl border-2 p-3 text-sm transition-colors ${cls} ${!answered ? 'hover:border-indigo-400' : 'cursor-default'}`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div>
                <textarea
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder="Type the technique / approach…"
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {answered && (
                  <div className="mt-3 text-sm">
                    <div className={typed.trim().toLowerCase() === questions[index].answer.trim().toLowerCase() ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-500 font-semibold'}>
                      {typed.trim().toLowerCase() === questions[index].answer.trim().toLowerCase() ? 'Correct!' : 'Not quite.'}
                    </div>
                    {typed.trim().toLowerCase() !== questions[index].answer.trim().toLowerCase() && (
                      <div className="mt-1 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{questions[index].answer}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-center">
            {!answered ? (
              <button onClick={check} disabled={questions[index].type === 'mc' ? !selected : !typed.trim()} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold px-8 py-3">
                Check
              </button>
            ) : (
              <button onClick={next} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3">
                {index + 1 >= questions.length ? 'Finish' : 'Next'}
              </button>
            )}
          </div>
        </>
      )}

      {done && (
        <div className="pt-8 flex flex-col items-center gap-4 text-center">
          <div className="text-5xl">{score / Math.max(questions.length, 1) >= 0.7 ? '🎉' : '📚'}</div>
          <h2 className="text-2xl font-bold">You scored {score}/{questions.length}</h2>
          <div className="w-full max-w-xs rounded-full bg-gray-100 dark:bg-slate-800 h-4 overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(score / Math.max(questions.length, 1)) * 100}%` }} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => start(mode)} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3">Try again</button>
            <button onClick={() => setDone(false)} className="rounded-xl bg-gray-200 dark:bg-slate-800 px-6 py-3 font-semibold">Back</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ModeButton({ active, disabled, onClick, children }: { active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`rounded-xl py-3 font-semibold transition-colors ${active ? 'bg-indigo-600 text-white' : disabled ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-300'}`}>
      {children}
    </button>
  )
}

function Empty({ mode }: { mode: Mode }) {
  return <p className="text-center text-gray-500 py-10">No {mode === 'vocab' ? 'vocab' : 'math'} cards to quiz yet.</p>
}
