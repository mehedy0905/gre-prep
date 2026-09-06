import { useState } from 'react'
import { addEntry } from '../data/repo'
import { TagInput } from './TagInput'
import { useDuplicateDetection } from '../hooks/useDuplicateDetection'
import type { MathCategory } from '../types'
import { inputCls } from './AddWordForm'

const CATEGORIES: MathCategory[] = ['Arithmetic', 'Algebra', 'Geometry', 'Data Analysis', 'Word Problems']

export function AddMathForm({ onAdded }: { onAdded: () => void }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<MathCategory>('Arithmetic')
  const [technique, setTechnique] = useState('')
  const [workedExample, setWorkedExample] = useState('')
  const [pitfalls, setPitfalls] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const { duplicate, checking } = useDuplicateDetection('math', title)

  const canSave = title.trim() && technique.trim() && !saving

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    try {
      await addEntry({
        type: 'math',
        data: {
          title: title.trim(),
          category,
          technique: technique.trim(),
          workedExample: workedExample.trim(),
          pitfalls: pitfalls.trim(),
          tags,
        },
      })
      setSaved(true)
      setTitle(''); setTechnique(''); setWorkedExample(''); setPitfalls(''); setTags([])
      setTimeout(() => setSaved(false), 1500)
      onAdded()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label="Title / concept *">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Combined work rate" autoFocus className={inputCls} />
        {checking && <p className="text-xs text-gray-400">Checking for duplicates…</p>}
        {duplicate && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            ⚠ Already logged: <strong>{duplicate.type === 'math' ? duplicate.title : duplicate.word}</strong>.
          </p>
        )}
      </Field>

      <Field label="Category">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                category === c
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Technique / formula *">
        <textarea value={technique} onChange={(e) => setTechnique(e.target.value)} rows={4} placeholder="The approach or formula — be precise" className={inputCls} />
      </Field>

      <Field label="Worked example">
        <textarea value={workedExample} onChange={(e) => setWorkedExample(e.target.value)} rows={3} placeholder="Show the step-by-step solved example" className={inputCls} />
      </Field>

      <Field label="Common pitfalls">
        <textarea value={pitfalls} onChange={(e) => setPitfalls(e.target.value)} rows={2} placeholder="What to watch out for" className={inputCls} />
      </Field>

      <Field label="Tags">
        <TagInput value={tags} onChange={setTags} />
      </Field>

      <div className="flex gap-2 items-center">
        <button type="submit" disabled={!canSave} className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 transition-colors">
          {saving ? 'Saving…' : 'Save Concept'}
        </button>
        {saved && <span className="text-green-600 dark:text-green-400 font-medium">✓ Saved</span>}
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      {children}
    </label>
  )
}
