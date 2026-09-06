import { useCallback, useEffect, useState } from 'react'
import { deleteEntry, getCardMap, updateEntry, exportJson } from '../data/repo'
import type { FlashcardEntry, ReviewRecord, VocabEntry, MathEntry } from '../types'
import { format } from 'date-fns'

type SortKey = 'date' | 'alpha' | 'weakest' | 'due'
type TypeFilter = 'all' | 'vocab' | 'math'

interface Card {
  entry: FlashcardEntry
  record: ReviewRecord
}

export function Library() {
  const [cards, setCards] = useState<Card[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [sort, setSort] = useState<SortKey>('date')
  const [editing, setEditing] = useState<FlashcardEntry | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const map = await getCardMap()
    setCards(Array.from(map.values()))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = cards
    .filter((c) => {
      if (typeFilter !== 'all' && c.entry.type !== typeFilter) return false
      const q = search.trim().toLowerCase()
      if (!q) return true
      const hay = JSON.stringify(c.entry).toLowerCase()
      return hay.includes(q)
    })
    .sort((a, b) => {
      switch (sort) {
        case 'alpha':
          return name(a.entry).localeCompare(name(b.entry))
        case 'weakest':
          return successRate(a.record) - successRate(b.record)
        case 'due':
          return a.record.nextDueDate - b.record.nextDueDate
        default:
          return b.entry.dateAdded - a.entry.dateAdded
      }
    })

  async function handleDelete(id: string) {
    if (!confirm('Delete this card and its review history?')) return
    await deleteEntry(id)
    await load()
  }

  return (
    <div className="pt-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Library</h1>
        <button onClick={async () => {
          const json = await exportJson()
          const blob = new Blob([json], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'gre-export.json'
          a.click()
          URL.revokeObjectURL(url)
        }} className="text-xs text-indigo-500 hover:underline">Export</button>
      </header>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search words, concepts, tags…"
        className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <div className="flex flex-wrap gap-2">
        <Pill active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>All</Pill>
        <Pill active={typeFilter === 'vocab'} onClick={() => setTypeFilter('vocab')}>Vocab</Pill>
        <Pill active={typeFilter === 'math'} onClick={() => setTypeFilter('math')}>Math</Pill>
        <span className="flex-1" />
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm">
          <option value="date">Date added</option>
          <option value="alpha">Alphabetical</option>
          <option value="weakest">Weakest</option>
          <option value="due">Due soonest</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-10">No cards found.</div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => (
            <CardRow key={c.entry.id} card={c} onEdit={() => setEditing(c.entry)} onDelete={() => handleDelete(c.entry.id)} />
          ))}
        </ul>
      )}

      {editing && <EditModal entry={editing} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  )
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${active ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'}`}>
      {children}
    </button>
  )
}

function CardRow({ card, onEdit, onDelete }: { card: Card; onEdit: () => void; onDelete: () => void }) {
  const { entry, record } = card
  const rate = successRate(record)
  const weak = rate < 0.6
  return (
    <li className="rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${entry.type === 'vocab' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'}`}>
            {entry.type}
          </span>
          {weak && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-semibold">weak</span>}
        </div>
        <div className="font-semibold mt-1 truncate">{name(entry)}</div>
        <div className="text-xs text-gray-500 truncate">{subtitle(entry)}</div>
        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
          <span>Due {format(record.nextDueDate, 'MMM d')}</span>
          <span>{record.repetitions} reviews</span>
          <span>EF {record.easeFactor.toFixed(2)}</span>
          <span>✓ {Math.round(rate * 100)}%</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <button onClick={onEdit} className="text-xs text-indigo-500 hover:underline">Edit</button>
        <button onClick={onDelete} className="text-xs text-red-500 hover:underline">Delete</button>
      </div>
    </li>
  )
}

function successRate(record: ReviewRecord): number {
  if (record.history.length === 0) return 1
  const pass = record.history.filter((h) => h === 'Good' || h === 'Easy').length
  return pass / record.history.length
}

function name(entry: FlashcardEntry): string {
  return entry.type === 'vocab' ? entry.word : entry.title
}

function subtitle(entry: FlashcardEntry): string {
  if (entry.type === 'vocab') {
    return `${entry.partOfSpeech ? entry.partOfSpeech + ' — ' : ''}${entry.definition}`
  }
  return `${entry.category} — ${entry.technique}`
}

function EditModal({ entry, onClose, onSaved }: { entry: FlashcardEntry; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<FlashcardEntry>(entry)

  const setVocab = (patch: Partial<VocabEntry>) =>
    setForm((f) => ({ ...f, ...patch }) as FlashcardEntry)
  const setMath = (patch: Partial<MathEntry>) =>
    setForm((f) => ({ ...f, ...patch }) as FlashcardEntry)

  async function save() {
    await updateEntry(form)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-30 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-lg mb-4">{entry.type === 'vocab' ? 'Edit Word' : 'Edit Concept'}</h2>
        {entry.type === 'vocab' ? (
          <VocabEditFields form={form as VocabEntry} setForm={setVocab} />
        ) : (
          <MathEditFields form={form as MathEntry} setForm={setMath} />
        )}
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-sm">Cancel</button>
          <button onClick={save} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">Save</button>
        </div>
      </div>
    </div>
  )
}

function VocabEditFields({ form, setForm }: { form: VocabEntry; setForm: (p: Partial<VocabEntry>) => void }) {
  return (
    <>
      <EditField label="Word">
        <input value={form.word} onChange={(e) => setForm({ word: e.target.value })} className={fieldCls} />
      </EditField>
      <EditField label="Definition">
        <textarea value={form.definition} onChange={(e) => setForm({ definition: e.target.value })} rows={3} className={fieldCls} />
      </EditField>
      <EditField label="Part of speech">
        <input value={form.partOfSpeech} onChange={(e) => setForm({ partOfSpeech: e.target.value })} className={fieldCls} />
      </EditField>
      <EditField label="Example">
        <input value={form.example} onChange={(e) => setForm({ example: e.target.value })} className={fieldCls} />
      </EditField>
      <EditField label="Synonyms (comma separated)">
        <input value={form.synonyms.join(', ')} onChange={(e) => setForm({ synonyms: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} className={fieldCls} />
      </EditField>
      <EditField label="Antonyms (comma separated)">
        <input value={form.antonyms.join(', ')} onChange={(e) => setForm({ antonyms: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} className={fieldCls} />
      </EditField>
      <EditField label="Mnemonic">
        <input value={form.mnemonic ?? ''} onChange={(e) => setForm({ mnemonic: e.target.value })} className={fieldCls} />
      </EditField>
    </>
  )
}

function MathEditFields({ form, setForm }: { form: MathEntry; setForm: (p: Partial<MathEntry>) => void }) {
  return (
    <>
      <EditField label="Title">
        <input value={form.title} onChange={(e) => setForm({ title: e.target.value })} className={fieldCls} />
      </EditField>
      <EditField label="Technique">
        <textarea value={form.technique} onChange={(e) => setForm({ technique: e.target.value })} rows={4} className={fieldCls} />
      </EditField>
      <EditField label="Worked example">
        <textarea value={form.workedExample} onChange={(e) => setForm({ workedExample: e.target.value })} rows={3} className={fieldCls} />
      </EditField>
      <EditField label="Pitfalls">
        <textarea value={form.pitfalls} onChange={(e) => setForm({ pitfalls: e.target.value })} rows={2} className={fieldCls} />
      </EditField>
    </>
  )
}

const fieldCls = 'w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 mb-3">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {children}
    </label>
  )
}
