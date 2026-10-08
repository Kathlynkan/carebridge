// Unit tests for the "Road to Pirate King" rules (Vitest). Run:  pnpm test:unit
import { describe, it, expect } from 'vitest'
import { RANKS, KING_AT, berries, rankFor, levelFor, longestOnTimeStreak, earnedBadges } from '../gamification'

// A handed-in quest. Unless a test says otherwise it was finished on its due date, so it counts as on time.
const quest = (over = {}) => {
  const dueDate = over.dueDate ?? '2026-10-10'
  return { subject: 'Math', dueDate, status: 'verified', completedAt: `${dueDate}T10:00:00.000Z`, ...over }
}

describe('berries', () => {
  it('puts the berry sign in front and never shows a negative or odd number', () => {
    expect(berries(20)).toBe('฿20')
    expect(berries(0)).toBe('฿0')
    expect(berries(-5)).toBe('฿0')
    expect(berries(undefined)).toBe('฿0')
  })
})

describe('rankFor', () => {
  it('starts as a Stowaway with nothing', () => {
    const r = rankFor(0)
    expect(r.rank.name).toBe('Stowaway')
    expect(r.isKing).toBe(false)
    expect(r.next.name).toBe('Cabin Boy')
    expect(r.toNext).toBe(40)
  })

  it('moves up exactly when the berries reach the next rank', () => {
    expect(rankFor(39).rank.name).toBe('Stowaway')
    expect(rankFor(40).rank.name).toBe('Cabin Boy')
    expect(rankFor(120).rank.name).toBe('Deckhand') // Luffy in the demo data
    expect(rankFor(210).rank.name).toBe('Rookie Pirate') // Meera in the demo data
  })

  it('works out the progress towards the next rank', () => {
    // Deckhand is 100, Rookie Pirate is 180: 140 berries is halfway
    const r = rankFor(140)
    expect(r.percentToNext).toBe(50)
    expect(r.toNext).toBe(40)
  })

  it('makes the child King of the Pirates at the top, with nothing left to chase', () => {
    const r = rankFor(KING_AT)
    expect(r.isKing).toBe(true)
    expect(r.rank.name).toBe('King of the Pirates')
    expect(r.next).toBeNull()
    expect(r.toNext).toBe(0)
    expect(r.percentToKing).toBe(100)
    expect(rankFor(KING_AT + 500).percentToKing).toBe(100)
  })

  it('has ranks in increasing order, starting at zero and ending with the king', () => {
    expect(RANKS[0].at).toBe(0)
    for (let i = 1; i < RANKS.length; i++) expect(RANKS[i].at).toBeGreaterThan(RANKS[i - 1].at)
    expect(RANKS.at(-1).id).toBe('pirate-king')
  })
})

describe('levelFor (kept for older code)', () => {
  it('is the rank number and the progress to the next one', () => {
    expect(levelFor(0)).toEqual({ level: 1, progress: 0 })
    expect(levelFor(140).level).toBe(3)
  })
})

describe('longestOnTimeStreak', () => {
  it('counts quests handed in on or before the due date, in due-date order', () => {
    const list = [
      quest({ dueDate: '2026-10-01', completedAt: '2026-10-01T09:00:00.000Z' }),
      quest({ dueDate: '2026-10-03', completedAt: '2026-10-02T09:00:00.000Z' }),
      quest({ dueDate: '2026-10-05', completedAt: '2026-10-05T23:00:00.000Z' }),
    ]
    expect(longestOnTimeStreak(list)).toBe(3)
  })

  it('breaks the streak on a late quest and ignores quests not handed in yet', () => {
    const list = [
      quest({ dueDate: '2026-10-01' }),
      quest({ dueDate: '2026-10-02', completedAt: '2026-10-04T09:00:00.000Z' }), // late
      quest({ dueDate: '2026-10-03' }),
      quest({ dueDate: '2026-10-04', status: 'assigned', completedAt: null }),
    ]
    expect(longestOnTimeStreak(list)).toBe(1)
  })
})

describe('earnedBadges', () => {
  const ids = (badges) => badges.map((b) => b.id)

  it('earns nothing with no quests and no berries', () => {
    expect(earnedBadges({ points: 0 }, [])).toEqual([])
  })

  it('Set Sail: handing in a first quest (even one still waiting to be checked)', () => {
    expect(ids(earnedBadges({ points: 0 }, [quest({ status: 'submitted' })]))).toEqual(['first-quest'])
    expect(ids(earnedBadges({ points: 0 }, [quest({ status: 'assigned', completedAt: null })]))).toEqual([])
  })

  it('Tailwind: three on-time quests in a row', () => {
    const three = [quest({ dueDate: '2026-10-01' }), quest({ dueDate: '2026-10-02' }), quest({ dueDate: '2026-10-03' })]
    expect(ids(earnedBadges({ points: 0 }, three))).toContain('streak-3')
    expect(ids(earnedBadges({ points: 0 }, three.slice(0, 2)))).not.toContain('streak-3')
  })

  it('Poneglyph Reader: five English quests', () => {
    const english = Array.from({ length: 5 }, (_, i) => quest({ subject: 'English', dueDate: `2026-10-0${i + 1}` }))
    expect(ids(earnedBadges({ points: 0 }, english))).toContain('bookworm')
    expect(ids(earnedBadges({ points: 0 }, english.slice(0, 4)))).not.toContain('bookworm')
  })

  it('Treasure Hunter at 100 berries, Pirate King at the top', () => {
    expect(ids(earnedBadges({ points: 99 }, []))).not.toContain('century')
    expect(ids(earnedBadges({ points: 100 }, []))).toContain('century')
    expect(ids(earnedBadges({ points: KING_AT }, []))).toContain('pirate-king')
  })
})

describe('rank icons', () => {
  it('gives every rank its own Bootstrap icon', () => {
    for (const rank of RANKS) {
      expect(rank.icon.startsWith('bi-')).toBe(true)
    }
    const icons = RANKS.map((rank) => rank.icon)
    expect(new Set(icons).size).toBe(RANKS.length)
  })
})
