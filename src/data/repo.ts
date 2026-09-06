import { db } from './db'
import { defaultReviewRecord } from './sm2'
import type { FlashcardEntry, ReviewRecord, VocabEntry, MathEntry, CardType } from '../types'

export interface AddEntryInput {
  type: CardType
  data: Omit<VocabEntry, 'id' | 'type' | 'dateAdded'> | Omit<MathEntry, 'id' | 'type' | 'dateAdded'>
}

/**
 * Storing entry:
 * - creates a new Entry
 * - creates a corresponding default ReviewRecord scheduled as due now
 */
export async function addEntry(input: AddEntryInput): Promise<{ entry: FlashcardEntry; record: ReviewRecord }> {
  const now = Date.now()
  const id = crypto.randomUUID()

  const entry: FlashcardEntry = {
    ...(input.data as object),
    id,
    type: input.type,
    dateAdded: now,
  } as FlashcardEntry

  const record = defaultReviewRecord(id, input.type, now)

  await db.transaction('rw', db.entries, db.reviews, async () => {
    await db.entries.add(entry)
    await db.reviews.add(record)
  })

  return { entry, record }
}

export async function updateEntry(entry: FlashcardEntry): Promise<void> {
  await db.entries.put(entry)
}

export async function deleteEntry(id: string): Promise<void> {
  await db.transaction('rw', db.entries, db.reviews, async () => {
    await db.entries.delete(id)
    await db.reviews.where('cardId').equals(id).delete()
  })
}

export async function getEntry(id: string): Promise<FlashcardEntry | undefined> {
  return db.entries.get(id)
}

export async function getAllEntries(): Promise<FlashcardEntry[]> {
  return db.entries.orderBy('dateAdded').reverse().toArray()
}

export async function getReviewRecord(cardId: string): Promise<ReviewRecord | undefined> {
  return db.reviews.where('cardId').equals(cardId).first()
}

export async function getAllReviewRecords(): Promise<Record<string, ReviewRecord>> {
  const records = await db.reviews.toArray()
  const map: Record<string, ReviewRecord> = {}
  for (const r of records) map[r.cardId] = r
  return map
}

/** Join entries + review records into a map keyed by card id */
export async function getCardMap(): Promise<Map<string, { entry: FlashcardEntry; record: ReviewRecord }>> {
  const entries = await db.entries.toArray()
  const records = await db.reviews.toArray()
  const recByCard = new Map(records.map((r) => [r.cardId, r]))
  const map = new Map<string, { entry: FlashcardEntry; record: ReviewRecord }>()
  for (const e of entries) {
    const record = recByCard.get(e.id)
    if (record) map.set(e.id, { entry: e, record })
    else {
      const rec = defaultReviewRecord(e.id, e.type)
      await db.reviews.add(rec)
      map.set(e.id, { entry: e, record: rec })
    }
  }
  return map
}

/** Duplicate detection: word exists loosely (case-insensitive, trimmed) */
export async function findDuplicateVocab(word: string): Promise<VocabEntry | undefined> {
  const entries = await db.entries.where('type').equals('vocab').toArray()
  const normalized = word.trim().toLowerCase()
  return entries.filter((e) => e.type === 'vocab').find((e) => (e as VocabEntry).word.trim().toLowerCase() === normalized) as VocabEntry | undefined
}

/** Duplicate detection: math title exists loosely */
export async function findDuplicateMath(title: string): Promise<MathEntry | undefined> {
  const entries = await db.entries.where('type').equals('math').toArray()
  const normalized = title.trim().toLowerCase()
  return entries.filter((e) => e.type === 'math').find((e) => (e as MathEntry).title.trim().toLowerCase() === normalized) as MathEntry | undefined
}

export async function getEntriesReviewedToday(): Promise<FlashcardEntry[]> {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const todayRecords = await db.reviews.where('lastReviewedDate').aboveOrEqual(startOfToday).toArray()
  if (todayRecords.length === 0) return []
  const cardIds = todayRecords.map((r) => r.cardId)
  const entries = await db.entries.where('id').anyOf(cardIds).toArray()
  return entries
}

export async function exportJson(): Promise<string> {
  const entries = await db.entries.toArray()
  const reviews = await db.reviews.toArray()
  return JSON.stringify({ entries, reviews, exportedAt: Date.now() }, null, 2)
}
