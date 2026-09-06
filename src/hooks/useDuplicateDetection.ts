import { useEffect, useState } from 'react'
import { findDuplicateVocab, findDuplicateMath } from '../data/repo'
import type { VocabEntry, MathEntry } from '../types'

type Duplicate = VocabEntry | MathEntry | null

/**
 * Debounced duplicate detection for the quick-capture forms.
 * Returns a warning and the matching existing entry if the user
 * appears to be re-adding something already logged.
 */
export function useDuplicateDetection(type: 'vocab' | 'math', term: string) {
  const [duplicate, setDuplicate] = useState<Duplicate>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (!term || term.trim().length < 2) {
      setDuplicate(null)
      setChecking(false)
      return
    }
    let cancelled = false
    const timeout = setTimeout(async () => {
      setChecking(true)
      const found =
        type === 'vocab' ? await findDuplicateVocab(term) : await findDuplicateMath(term)
      if (!cancelled) {
        setDuplicate(found ?? null)
        setChecking(false)
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [term, type])

  return { duplicate, checking }
}
