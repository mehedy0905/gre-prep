export type CardType = 'vocab' | 'math'

export type MathCategory =
  | 'Arithmetic'
  | 'Algebra'
  | 'Geometry'
  | 'Data Analysis'
  | 'Word Problems'

export interface VocabEntry {
  id: string
  type: 'vocab'
  word: string
  partOfSpeech: string
  definition: string
  example: string
  synonyms: string[]
  antonyms: string[]
  mnemonic?: string
  tags: string[]
  dateAdded: number
}

export interface MathEntry {
  id: string
  type: 'math'
  title: string
  category: MathCategory
  technique: string
  workedExample: string
  pitfalls: string
  tags: string[]
  dateAdded: number
}

export type FlashcardEntry = VocabEntry | MathEntry

export type Rating = 'Again' | 'Hard' | 'Good' | 'Easy'

export interface ReviewRecord {
  id: string
  cardId: string
  cardType: CardType
  lastReviewedDate: number | null
  nextDueDate: number
  easeFactor: number // SM-2 EF, starts at 2.5
  interval: number // days
  repetitions: number // number of times reviewed
  streak: number // consecutive Correct ratings
  history: Rating[] // chronological pass/fail ratings
}

export interface ReviewOutcome {
  record: ReviewRecord
}

// A single review session instance (one pass through the rating)
export interface ReviewSessionEntry {
  entry: FlashcardEntry
  record: ReviewRecord
}
