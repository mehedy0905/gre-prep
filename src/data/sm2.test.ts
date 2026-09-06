import { describe, it, expect } from 'vitest'
import { defaultReviewRecord, applyRating, sm2Schedule, isDue } from './sm2'
import type { ReviewRecord } from '../types'

const NOW = new Date('2026-01-01T12:00:00Z').getTime()
const DAY = 24 * 60 * 60 * 1000

function makeRecord(overrides: Partial<ReviewRecord> = {}): ReviewRecord {
  return {
    ...defaultReviewRecord('card-1', 'vocab', NOW),
    ...overrides,
  }
}

describe('sm2Schedule', () => {
  it('schedules a new "Good" card to 1 day', () => {
    const r = makeRecord()
    const out = sm2Schedule({ easeFactor: r.easeFactor, interval: r.interval, repetitions: r.repetitions, streak: r.streak }, 'Good', NOW)
    expect(out.interval).toBe(1)
    expect(out.nextDueDate).toBe(NOW + 1 * DAY)
    expect(out.repetitions).toBe(1)
  })

  it('second "Good" goes to 6 days', () => {
    const r = makeRecord({ repetitions: 1, interval: 1, easeFactor: 2.5 })
    const out = sm2Schedule({ easeFactor: r.easeFactor, interval: r.interval, repetitions: r.repetitions, streak: r.streak }, 'Good', NOW)
    expect(out.interval).toBe(6)
  })
})

describe('applyRating', () => {
  it('increments repetitions and streak on "Good"', () => {
    const r = applyRating(makeRecord(), 'Good', NOW)
    expect(r.repetitions).toBe(1)
    expect(r.streak).toBe(1)
    expect(r.history).toEqual(['Good'])
    expect(r.nextDueDate).toBe(NOW + 1 * DAY)
  })

  it('resets streak on "Again"', () => {
    const r = applyRating(makeRecord({ repetitions: 5, streak: 4, interval: 30 }), 'Again', NOW)
    expect(r.repetitions).toBe(0)
    expect(r.streak).toBe(0)
    expect(r.history).toEqual(['Again'])
  })

  it('reduces ease factor on "Again"', () => {
    const r = applyRating(makeRecord({ easeFactor: 2.5 }), 'Again', NOW)
    expect(r.easeFactor).toBe(2.3)
    expect(r.easeFactor).toBeGreaterThanOrEqual(1.3)
  })

  it('increases ease factor on "Easy"', () => {
    const r = applyRating(makeRecord(), 'Easy', NOW)
    expect(r.easeFactor).toBe(2.65)
    expect(r.interval).toBe(4)
  })

  it('Good card after 2 reps multiplies interval by EF', () => {
    let r = makeRecord({ repetitions: 2, interval: 6, easeFactor: 2.5 })
    r = applyRating(r, 'Good', NOW)
    expect(r.interval).toBe(15) // 6 * 2.5
    expect(r.repetitions).toBe(3)
  })

  it('ease factor never goes below 1.3', () => {
    let r = makeRecord({ easeFactor: 1.3, repetitions: 0, interval: 1 })
    for (let i = 0; i < 20; i++) {
      r = applyRating(r, 'Again', NOW)
    }
    expect(r.easeFactor).toBe(1.3)
  })

  it('Hard multiplies interval by 1.2', () => {
    const r = applyRating(makeRecord({ repetitions: 3, interval: 20, easeFactor: 2.5 }), 'Hard', NOW)
    expect(r.interval).toBe(24)
    expect(r.streak).toBe(0) // Hard resets streak
  })

  it('isDue returns true when past due', () => {
    expect(isDue(makeRecord({ nextDueDate: NOW - DAY }), NOW)).toBe(true)
    expect(isDue(makeRecord({ nextDueDate: NOW + DAY }), NOW)).toBe(false)
  })
})
