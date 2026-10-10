// Unit tests for the pirate rules (Vitest). Run:  pnpm test:unit
import { describe, it, expect } from 'vitest'
import { RANKS, KING_AT, berries, rankFor, levelFor, earnedBadges, badgeStory, groupQuestsByMilestone } from '../gamification'

// A handed-in quest. Unless a test says otherwise it was finished on its due date, so it was on time.
function quest(changes = {}) {
  const dueDate = changes.dueDate || '2026-10-10'
  return { subject: 'Math', dueDate, status: 'verified', completedAt: dueDate + 'T10:00:00.000Z', ...changes }
}

describe('berries', () => {
  it('puts the berry sign in front and never shows a negative or odd number', () => {
    expect(berries(20)).toBe('฿20')
    expect(berries(-5)).toBe('฿0')
    expect(berries(undefined)).toBe('฿0')
  })
})

describe('rankFor', () => {
  it('starts as a Stowaway with nothing', () => {
    const r = rankFor(0)
    expect(r.rank.name).toBe('Stowaway')
    expect(r.next.name).toBe('Cabin Boy')
    expect(r.toNext).toBe(40)
  })

  it('moves up exactly when the berries reach the next rank', () => {
    expect(rankFor(39).rank.name).toBe('Stowaway')
    expect(rankFor(40).rank.name).toBe('Cabin Boy')
    expect(rankFor(120).rank.name).toBe('Deckhand')
  })

  it('makes the child King of the Pirates at the top, with nothing left to chase', () => {
    const r = rankFor(KING_AT)
    expect(r.isKing).toBe(true)
    expect(r.next).toBeNull()
    expect(r.toNext).toBe(0)
  })

  it('gives every rank its own Bootstrap icon', () => {
    const icons = RANKS.map((rank) => rank.icon)
    expect(new Set(icons).size).toBe(RANKS.length)
  })
})

describe('earnedBadges', () => {
  it('earns nothing with no quests and no berries', () => {
    expect(earnedBadges({ points: 0 }, [])).toEqual([])
  })

  it('Set Sail: handing in a first quest', () => {
    expect(earnedBadges({ points: 0 }, [quest({ status: 'submitted' })])).toEqual(['first-quest'])
    expect(earnedBadges({ points: 0 }, [quest({ status: 'assigned', completedAt: null })])).toEqual([])
  })

  it('Navigator: three on-time quests in a row, and a late quest breaks the run', () => {
    const three = [quest({ dueDate: '2026-10-01' }), quest({ dueDate: '2026-10-02' }), quest({ dueDate: '2026-10-03' })]
    expect(earnedBadges({ points: 0 }, three)).toContain('streak-3')
    const late = [three[0], quest({ dueDate: '2026-10-02', completedAt: '2026-10-04T09:00:00.000Z' }), three[2]]
    expect(earnedBadges({ points: 0 }, late)).not.toContain('streak-3')
  })

  it('Poneglyph Reader: five English quests', () => {
    const english = []
    for (let i = 1; i <= 5; i++) {
      english.push(quest({ subject: 'English', dueDate: '2026-10-0' + i }))
    }
    expect(earnedBadges({ points: 0 }, english)).toContain('bookworm')
    expect(earnedBadges({ points: 0 }, english.slice(0, 4))).not.toContain('bookworm')
  })

  it('Treasure Hunter at 100 berries, Pirate King at the top', () => {
    expect(earnedBadges({ points: 99 }, [])).not.toContain('century')
    expect(earnedBadges({ points: 100 }, [])).toContain('century')
    expect(earnedBadges({ points: KING_AT }, [])).toContain('pirate-king')
  })
})

describe('groupQuestsByMilestone', () => {
  it('gives one list for each rank', () => {
    const groups = groupQuestsByMilestone(0, [])
    expect(groups.length).toBe(RANKS.length)
    expect(groups[0]).toEqual([])
  })

  it('puts checked quests at the rank the child had when they were paid', () => {
    // The child has 120 berries. The two checked quests (10 + 20) were paid at 90 (Cabin Boy) and at 100 (Deckhand).
    const first = quest({ id: 'a', points: 10 })
    const second = quest({ id: 'b', points: 20 })
    const groups = groupQuestsByMilestone(120, [first, second])
    expect(groups[1]).toEqual([first])
    expect(groups[2]).toEqual([second])
  })

  it('puts quests that are not checked yet at the current rank', () => {
    const todo = quest({ id: 'c', status: 'assigned', completedAt: null, points: 10 })
    const waiting = quest({ id: 'd', status: 'submitted', points: 10 })
    const groups = groupQuestsByMilestone(120, [todo, waiting])
    expect(groups[2]).toEqual([todo, waiting])
  })
})

describe('badgeStory', () => {
  it('tells the child what they did to earn a badge', () => {
    expect(badgeStory('century', { points: 120 }, [])).toBe('You collected ฿120.')
    expect(badgeStory('bookworm', { points: 0 }, [quest({ subject: 'English' })])).toBe('You handed in 1 English quests.')
  })
})

describe('levelFor', () => {
  it('is the rank number starting at 1, with the progress to the next rank', () => {
    expect(levelFor(0)).toEqual({ level: 1, progress: 0 })
    expect(levelFor(140)).toEqual({ level: 3, progress: 50 }) // halfway between Deckhand (100) and Rookie Pirate (180)
    expect(levelFor(KING_AT).progress).toBe(100)
  })
})
