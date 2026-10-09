// =============================================================
// Gamification rules                          Owner: Jachin
// =============================================================

export const BADGES = [
  { id: 'first-quest', icon: '🌱', name: 'First Quest', rule: 'Complete your first homework' },
  { id: 'streak-3', icon: '🔥', name: 'On Fire', rule: 'Complete 3 homework in a row on time' },
  { id: 'fraction-hero', icon: '🍕', name: 'Fraction Hero', rule: 'Score 4/5 or more on Fractions' },
  { id: 'bookworm', icon: '📚', name: 'Bookworm', rule: 'Complete 5 English homework' },
  { id: 'century', icon: '💯', name: 'Century', rule: 'Earn 100 points' },
]

export function earnedBadges(child, homework, sessions) {
  const verified = homework.filter((h) => h.status === 'verified')

  return BADGES.filter((badge) => {
    switch (badge.id) {
      case 'first-quest':
        return verified.length >= 1

      case 'streak-3': {
        const sorted = [...verified]
          .filter((h) => h.completedAt)
          .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
        let streak = 0
        for (const h of sorted) {
          if (h.completedAt <= h.dueDate) {
            streak++
            if (streak >= 3) return true
          } else {
            streak = 0
          }
        }
        return false
      }

      case 'fraction-hero':
        return sessions.some(
          (s) =>
            s.topic.toLowerCase().includes('fraction') &&
            s.attempted > 0 &&
            s.correct / s.attempted >= 0.8,
        )

      case 'bookworm':
        return verified.filter((h) => h.subject === 'English').length >= 5

      case 'century':
        return (child.points || 0) >= 100

      default:
        return false
    }
  })
}

export function levelFor(points) {
  return { level: Math.floor(points / 100) + 1, progress: points % 100 }
}
