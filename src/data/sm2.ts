import type { Rating, ReviewRecord } from '../types'

const DAY_IN_MS = 24 * 60 * 60 * 1000

export interface Sm2Result {
  nextDueDate: number
  easeFactor: number
  interval: number
  repetitions: number
}

/**
 * Classic SM-2 spaced-repetition scheduling as used in Anki/SuperMemo.
 *
 * Ratings:
 *  - Again (0): reset learning, interval = 1 day (or <1), EF penalty
 *  - Hard (1): interval ~ 1.2x, small EF penalty
 *  - Good (3): nominal correct answer
 *  - Easy (4): interval 1.3x, EF boost
 *
 * Default schedule for Good:
 *   rep 0 (first time)  -> 1 day
 *   rep 1                -> 6 days
 *   rep 2+               -> interval * EF
 *
 * We treat "Again" and "Hard" as failed/lapses that break the streak.
 */
export function sm2Schedule(
  current: Pick<ReviewRecord, 'easeFactor' | 'interval' | 'repetitions' | 'streak'>,
  rating: Rating,
  now: number = Date.now(),
): Sm2Result {
  let ef = current.easeFactor
  let interval = current.interval
  let reps = current.repetitions

  switch (rating) {
    case 'Again':
      reps = 0
      interval = 1
      ef = Math.max(1.3, ef - 0.2)
      break
    case 'Hard':
      reps = Math.max(reps, 1)
      interval = Math.max(Math.round(interval * 1.2), 1)
      ef = Math.max(1.3, ef - 0.15)
      break
    case 'Good': {
      reps += 1
      if (reps === 1) interval = 1
      else if (reps === 2) interval = 6
      else interval = Math.round(interval * ef)
      break
    }
    case 'Easy': {
      reps += 1
      if (reps === 1) interval = 4
      else if (reps === 2) interval = 10
      else interval = Math.round(interval * ef * 1.3)
      ef += 0.15
      break
    }
  }

  ef = round2(ef)

  return {
    nextDueDate: now + interval * DAY_IN_MS,
    easeFactor: ef,
    interval,
    repetitions: reps,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Apply a rating to a ReviewRecord, producing the updated record
 * plus the updated streak (consecutive passing grades: Good/Easy).
 */
export function applyRating(
  record: ReviewRecord,
  rating: Rating,
  now: number = Date.now(),
): ReviewRecord {
  const scheduled = sm2Schedule(record, rating, now)

  const passed = rating === 'Good' || rating === 'Easy'
  // Correct (Good/Easy) increment streak; Again/Hard reset to 0.

  const history = [...record.history, rating]

  return {
    ...record,
    lastReviewedDate: now,
    nextDueDate: scheduled.nextDueDate,
    easeFactor: scheduled.easeFactor,
    interval: scheduled.interval,
    repetitions: scheduled.repetitions,
    streak: passed ? record.streak + 1 : 0,
    history,
  }
}

export function defaultReviewRecord(cardId: string, cardType: 'vocab' | 'math', now: number = Date.now()): ReviewRecord {
  return {
    id: crypto.randomUUID(),
    cardId,
    cardType,
    lastReviewedDate: null,
    nextDueDate: now,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    streak: 0,
    history: [],
  }
}

export function isDue(record: ReviewRecord, now: number = Date.now()): boolean {
  return record.nextDueDate <= now
}
