import { describe, it, expect } from 'vitest'
import { earnedBadges, levelFor, BADGES } from '../gamification'

const child0 = { points: 0 }
const child100 = { points: 100 }

const verifiedHw = (overrides = {}) => ({
  id: 'h_test',
  status: 'verified',
  subject: 'Math',
  dueDate: '2026-10-10',
  completedAt: '2026-10-08',
  points: 10,
  ...overrides,
})

const session = (overrides = {}) => ({
  topic: 'Fractions',
  attempted: 5,
  correct: 4,
  ...overrides,
})

describe('levelFor', () => {
  it('starts at level 1 with 0 points', () => {
    expect(levelFor(0)).toEqual({ level: 1, progress: 0 })
  })

  it('reaches level 2 at 100 points', () => {
    expect(levelFor(100)).toEqual({ level: 2, progress: 0 })
  })

  it('tracks progress within a level', () => {
    expect(levelFor(150)).toEqual({ level: 2, progress: 50 })
  })
})

describe('earnedBadges', () => {
  it('returns no badges for a new child', () => {
    expect(earnedBadges(child0, [], [])).toHaveLength(0)
  })

  it('awards first-quest after one verified homework', () => {
    const result = earnedBadges(child0, [verifiedHw()], [])
    expect(result.map((b) => b.id)).toContain('first-quest')
  })

  it('awards century at 100 points', () => {
    const result = earnedBadges(child100, [], [])
    expect(result.map((b) => b.id)).toContain('century')
  })

  it('does not award century below 100 points', () => {
    const result = earnedBadges({ points: 99 }, [], [])
    expect(result.map((b) => b.id)).not.toContain('century')
  })

  it('awards fraction-hero when session has 80%+ on Fractions', () => {
    const result = earnedBadges(child0, [], [session({ correct: 4, attempted: 5 })])
    expect(result.map((b) => b.id)).toContain('fraction-hero')
  })

  it('does not award fraction-hero on a non-fraction topic', () => {
    const result = earnedBadges(child0, [], [session({ topic: 'Spelling', correct: 5, attempted: 5 })])
    expect(result.map((b) => b.id)).not.toContain('fraction-hero')
  })

  it('awards streak-3 for 3 consecutive on-time submissions', () => {
    const hw = [
      verifiedHw({ id: 'h1', completedAt: '2026-10-01', dueDate: '2026-10-02' }),
      verifiedHw({ id: 'h2', completedAt: '2026-10-03', dueDate: '2026-10-04' }),
      verifiedHw({ id: 'h3', completedAt: '2026-10-05', dueDate: '2026-10-06' }),
    ]
    const result = earnedBadges(child0, hw, [])
    expect(result.map((b) => b.id)).toContain('streak-3')
  })

  it('does not award streak-3 when a late submission breaks the chain', () => {
    const hw = [
      verifiedHw({ id: 'h1', completedAt: '2026-10-01', dueDate: '2026-10-02' }),
      verifiedHw({ id: 'h2', completedAt: '2026-10-05', dueDate: '2026-10-03' }), // late
      verifiedHw({ id: 'h3', completedAt: '2026-10-06', dueDate: '2026-10-07' }),
    ]
    const result = earnedBadges(child0, hw, [])
    expect(result.map((b) => b.id)).not.toContain('streak-3')
  })

  it('awards bookworm after 5 verified English homework', () => {
    const hw = Array.from({ length: 5 }, (_, i) => verifiedHw({ id: `h${i}`, subject: 'English' }))
    const result = earnedBadges(child0, hw, [])
    expect(result.map((b) => b.id)).toContain('bookworm')
  })

  it('result contains only BADGE objects from the BADGES list', () => {
    const result = earnedBadges(child100, [verifiedHw()], [session()])
    const badgeIds = BADGES.map((b) => b.id)
    result.forEach((b) => expect(badgeIds).toContain(b.id))
  })
})
