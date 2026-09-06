import { useState } from 'react'
import { addEntry } from '../data/repo'
import { TagInput } from './TagInput'
import { useDuplicateDetection } from '../hooks/useDuplicateDetection'

export function AddWordForm({ onAdded }: { onAdded: () => void }) {
  const [word, setWord] = useState('')
  const [partOfSpeech, setPartOfSpeech] = useState('')
  const [definition, setDefinition] = useState('')
  const [example, setExample] = useState('')
  const [synonyms, setSynonyms] = useState('')
  const [antonyms, setAntonyms] = useState('')
  const [mnemonic, setMnemonic] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const { duplicate, checking } = useDuplicateDetection('vocab', word)

  const canSave = word.trim() && definition.trim() && !saving

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    try {
      await addEntry({
        type: 'vocab',
        data: {
          word: word.trim(),
          partOfSpeech: partOfSpeech.trim(),
          definition: definition.trim(),
          example: example.trim(),
          synonyms: synonyms.split(',').map((s) => s.trim()).filter(Boolean),
          antonyms: antonyms.split(',').map((s) => s.trim()).filter(Boolean),
          mnemonic: mnemonic.trim() || undefined,
          tags,
        },
      })
      setSaved(true)
      setWord(''); setPartOfSpeech(''); setDefinition(''); setExample('')
      setSynonyms(''); setAntonyms(''); setMnemonic(''); setTags([])
      setTimeout(() => setSaved(false), 1500)
      onAdded()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Field label="Word *">
          <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="e.g. ephemeral" autoFocus className={inputCls} />
          {checking && <p className="text-xs text-gray-400">Checking for duplicates…</p>}
          {duplicate && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              ⚠ Already logged: <strong>{duplicate.type === 'vocab' ? duplicate.word : duplicate.title}</strong>. You can still add if this is a new sense.
            </p>
          )}
        </Field>
        <Field label="Part of speech">
          <select value={partOfSpeech} onChange={(e) => setPartOfSpeech(e.target.value)} className={inputCls}>
            <option value="">—</option>
            {['n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'idiom'].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Definition *">
        <textarea value={definition} onChange={(e) => setDefinition(e.target.value)} rows={3} placeholder="Concise definition" className={inputCls} />
      </Field>

      <Field label="My example sentence">
        <textarea value={example} onChange={(e) => setExample(e.target.value)} rows={2} placeholder="Use the word in a sentence of your own" className={inputCls} />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Synonyms">
          <input value={synonyms} onChange={(e) => setSynonyms(e.target.value)} placeholder="comma separated" className={inputCls} />
        </Field>
        <Field label="Antonyms">
          <input value={antonyms} onChange={(e) => setAntonyms(e.target.value)} placeholder="comma separated" className={inputCls} />
        </Field>
      </div>

      <Field label="Mnemonic / memory hook (optional)">
        <input value={mnemonic} onChange={(e) => setMnemonic(e.target.value)} placeholder="A hook to remember it" className={inputCls} />
      </Field>

      <Field label="Tags">
        <TagInput value={tags} onChange={setTags} />
      </Field>

      <div className="flex gap-2 items-center">
        <button type="submit" disabled={!canSave} className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 transition-colors">
          {saving ? 'Saving…' : 'Save Word'}
        </button>
        {saved && <span className="text-green-600 dark:text-green-400 font-medium">✓ Saved</span>}
      </div>
    </form>
  )
}

export const inputCls =
  'w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      {children}
    </label>
  )
}
