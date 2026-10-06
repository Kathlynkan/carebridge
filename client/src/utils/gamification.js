// =============================================================
// Gamification rules                          Owner: Jachin
// -------------------------------------------------------------
// Keep the rules here (pure functions, no Vue) so they are easy to
// unit test with Vitest - see utils/__tests__/
//
// TODO (Jachin):
//   [ ] earnedBadges(): return the badges a child has earned
//   [ ] levelFor(points): e.g. every 100 points = 1 level, with a progress bar
//   [ ] write tests in utils/__tests__/gamification.spec.js
// =============================================================

export const BADGES = [
  { id: 'first-quest', icon: '🌱', name: 'First Quest', rule: 'Complete your first homework' },
  { id: 'streak-3', icon: '🔥', name: 'On Fire', rule: 'Complete 3 homework in a row on time' },
  { id: 'fraction-hero', icon: '🍕', name: 'Fraction Hero', rule: 'Score 4/5 or more on Fractions' },
  { id: 'bookworm', icon: '📚', name: 'Bookworm', rule: 'Complete 5 English homework' },
  { id: 'century', icon: '💯', name: 'Century', rule: 'Earn 100 points' },
]

// eslint-disable-next-line no-unused-vars
export function earnedBadges(child, homework, sessions) {
  // TODO (Jachin): check each rule above and return the matching BADGES
  return []
}

export function levelFor(points) {
  // TODO (Jachin): replace with your own levelling rule
  return { level: Math.floor(points / 100) + 1, progress: points % 100 }
}
