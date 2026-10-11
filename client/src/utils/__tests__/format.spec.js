// Example unit test (Vitest). Run:  pnpm test:unit
// Copy this file to test your own helper functions.
import { describe, it, expect } from 'vitest'
import { accuracy, daysSince, relativeDay, firstName } from '../format'

describe('accuracy', () => {
  it('returns the percentage of correct answers', () => {
    expect(accuracy({ attempted: 5, correct: 3 })).toBe(60)
  })

  it('returns 0 when nothing was attempted', () => {
    expect(accuracy({ attempted: 0, correct: 0 })).toBe(0)
  })
})

describe('daysSince / relativeDay', () => {
  const today = new Date('2026-10-06T10:00:00Z')

  it('counts whole days', () => {
    expect(daysSince('2026-10-01', today)).toBe(5)
  })

  it('uses friendly words for today and yesterday', () => {
    expect(relativeDay('2026-10-06', today)).toBe('Today')
    expect(relativeDay('2026-10-05', today)).toBe('Yesterday')
  })
})

describe('firstName', () => {
  it('keeps only the first name (child privacy on leaderboards)', () => {
    expect(firstName('Ethan Wong')).toBe('Ethan')
  })

  it('keeps a title with the first name', () => {
    expect(firstName('Ms Grace Wong')).toBe('Ms Grace')
  })
})
