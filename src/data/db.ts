import Dexie, { type EntityTable } from 'dexie'
import type { FlashcardEntry, ReviewRecord } from '../types'

class GreDB extends Dexie {
  entries!: EntityTable<FlashcardEntry, 'id'>
  reviews!: EntityTable<ReviewRecord, 'id'>

  constructor() {
    super('gre-prep')
    this.version(1).stores({
      entries: 'id, type, word, title, dateAdded, tags',
      reviews: 'id, cardId, cardType, nextDueDate, lastReviewedDate, easeFactor',
    })
  }
}

export const db = new GreDB()
