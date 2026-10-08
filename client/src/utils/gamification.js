// =============================================================
// THE PIRATE RULES                                   Owner: Jachin
// =============================================================
// What is this file?
//   It holds the "rules of the game" for the child's pirate adventure.
//   There is NO Vue in this file, only plain JavaScript functions.
//   That makes the rules easy to read, easy to change, and easy to test
//   (see utils/__tests__/gamification.spec.js).
//
// The story:
//   Every child wants to become the KING OF THE PIRATES.
//   A child earns BERRIES (the pirate money, written ฿) by finishing quests (homework).
//   More berries = a higher pirate rank. The top rank is King of the Pirates.
//   The berries are saved in the database as child.points.
// =============================================================

// The berry sign. We put it in front of every amount, like ฿20.
export const BERRY = '฿'

// ---------- RANKS ----------
// RANKS is a list (an array). Each rank is an object with 5 things:
//   id    - a short name we use inside the code
//   icon  - which Bootstrap Icon to show (the same icon library the nav bar uses), for example 'bi-flag-fill'
//   name  - the name the child sees
//   at    - how many berries the child needs to reach this rank
//   motto - a sentence shown under the rank
// Each icon says something about the job of the rank:
//   Stowaway = a crate to hide in,  Cabin Boy = a bucket to scrub the deck,  Deckhand = tools to fix the ship,
//   Rookie Pirate = a pirate flag,  Navigator = a compass,  First Mate = binoculars (the lookout),
//   Captain = the captain's medal,  King of the Pirates = the treasure gem.
export const RANKS = [
  { id: 'stowaway', icon: 'bi-box-seam', name: 'Stowaway', at: 0, motto: 'You snuck aboard. Time to prove yourself!' },
  { id: 'cabin-boy', icon: 'bi-bucket', name: 'Cabin Boy', at: 40, motto: 'You have a job on the ship now.' },
  { id: 'deckhand', icon: 'bi-tools', name: 'Deckhand', at: 100, motto: 'The crew is starting to trust you.' },
  { id: 'rookie-pirate', icon: 'bi-flag-fill', name: 'Rookie Pirate', at: 180, motto: 'Your own Jolly Roger flies high.' },
  { id: 'navigator', icon: 'bi-compass', name: 'Navigator', at: 270, motto: 'You can find the way across any sea.' },
  { id: 'first-mate', icon: 'bi-binoculars-fill', name: 'First Mate', at: 380, motto: "The captain's right hand." },
  { id: 'captain', icon: 'bi-award-fill', name: 'Captain', at: 490, motto: 'Your own ship and your own crew!' },
  { id: 'pirate-king', icon: 'bi-gem', name: 'King of the Pirates', at: 600, motto: 'You found the One Piece! You are KING!' },
]

// The last rank in the list is the goal. KING_AT is the number of berries it needs (600).
export const KING_AT = RANKS[RANKS.length - 1].at

// ---------- berries() ----------
// Turns a number into text with the berry sign: berries(20) gives "฿20".
// If the number is missing or negative we show ฿0 instead.
export function berries(amount) {
  let total = Number(amount)
  if (isNaN(total) || total < 0) {
    total = 0
  }
  return BERRY + Math.round(total)
}

// ---------- rankFor() ----------
// Works out where a child is on the Road to Becoming King of the Pirates.
// Give it the child's berries, and it gives back an object with:
//   index         - the rank number, starting at 0 (0 = Stowaway)
//   rank          - the whole rank object (name, icon, motto...)
//   next          - the next rank to reach (or null if the child is already King)
//   isKing        - true when the child has reached the top
//   berries       - the berries (cleaned up into a number)
//   toNext        - how many berries are still needed for the next rank
//   percentToNext - how far (0 to 100) the child is between this rank and the next
//   fractionToNext - the same as percentToNext but from 0 to 1 (the map uses this one)
//   percentToKing - how far (0 to 100) the child is along the whole road
export function rankFor(amount) {
  // 1. Clean up the number.
  let total = Number(amount)
  if (isNaN(total) || total < 0) {
    total = 0
  }
  total = Math.round(total)

  // 2. Find the highest rank whose berries number we have reached.
  //    We look at every rank from the bottom up. Each time we have enough berries, we remember it.
  let index = 0
  for (let i = 0; i < RANKS.length; i++) {
    if (total >= RANKS[i].at) {
      index = i
    }
  }
  const rank = RANKS[index]

  // 3. Find the next rank. If we are already at the last one, there is no next rank.
  let next = null
  if (index < RANKS.length - 1) {
    next = RANKS[index + 1]
  }

  // 4. Work out the distance to the next rank.
  let toNext = 0
  let percentToNext = 100
  if (next !== null) {
    toNext = next.at - total
    percentToNext = Math.round(((total - rank.at) / (next.at - rank.at)) * 100)
  }

  // 5. Work out how far along the whole road the child is (never more than 100).
  let percentToKing = Math.round((total / KING_AT) * 100)
  if (percentToKing > 100) {
    percentToKing = 100
  }

  return {
    index,
    rank,
    next,
    isKing: next === null,
    berries: total,
    toNext,
    percentToNext,
    fractionToNext: percentToNext / 100,
    percentToKing,
  }
}

// ---------- levelFor() ----------
// Kept from the original starter code, in case an older page still asks for a "level".
// The level is simply the rank number (starting at 1).
export function levelFor(points) {
  const road = rankFor(points)
  return { level: road.index + 1, progress: road.percentToNext }
}

// ---------- BADGES ----------
// Badges are small rewards for special things. Each badge has an id, an icon, a name, and a rule written in words.
// The code that checks the rules is further down, in earnedBadges().
export const BADGES = [
  { id: 'first-quest', icon: 'bi-flag-fill', name: 'Set Sail', rule: 'Hand in your first quest' },
  { id: 'streak-3', icon: 'bi-wind', name: 'Tailwind', rule: 'Hand in 3 quests in a row on time' },
  { id: 'bookworm', icon: 'bi-journal-text', name: 'Poneglyph Reader', rule: 'Hand in 5 English quests' },
  { id: 'century', icon: 'bi-coin', name: 'Treasure Hunter', rule: 'Collect 100 berries' },
  { id: 'pirate-king', icon: 'bi-gem', name: 'Pirate King', rule: 'Reach the top of the Road: 600 berries' },
]

// ---------- small helper functions used by the badge rules ----------

// A quest is "handed in" when its status is not 'assigned' any more.
// (The statuses are: 'assigned' = still to do, 'submitted' = handed in, 'verified' = checked by the volunteer.)
// This returns a new list with only the handed-in quests.
function handedInQuests(homework) {
  const result = []
  for (const quest of homework) {
    if (quest.status !== 'assigned') {
      result.push(quest)
    }
  }
  return result
}

// Cuts the time off a full date: "2026-10-05T11:00:00.000Z" becomes "2026-10-05".
function dayOf(text) {
  return String(text || '').slice(0, 10)
}

// A quest was handed in "on time" if it was done on or before its due date.
// Both dates are text like "2026-10-05", and comparing that kind of text works like comparing dates.
function isOnTime(quest) {
  if (!quest.completedAt) {
    return false
  }
  return dayOf(quest.completedAt) <= quest.dueDate
}

// Looks at the handed-in quests and finds the longest run of on-time ones.
// The list must be in the order the quests were due. (The server already sends them like that.)
// Example: on time, on time, LATE, on time  ->  the longest run is 2.
export function longestOnTimeStreak(homework) {
  const quests = handedInQuests(homework)

  let longest = 0
  let current = 0
  for (const quest of quests) {
    if (isOnTime(quest)) {
      current = current + 1 // the run keeps going
    } else {
      current = 0 // a late quest breaks the run
    }
    if (current > longest) {
      longest = current
    }
  }
  return longest
}

// Counts the handed-in quests that are about a subject, for example 'English'.
function countBySubject(homework, subject) {
  let count = 0
  for (const quest of handedInQuests(homework)) {
    if (quest.subject === subject) {
      count = count + 1
    }
  }
  return count
}

// ---------- earnedBadges() ----------
// Checks every badge and returns a list of the ones this child has earned.
//   child    - the child (we only need child.points)
//   homework - the child's quests
export function earnedBadges(child, homework) {
  const quests = homework || []
  let points = 0
  if (child) {
    points = Number(child.points) || 0
  }

  const earned = []
  for (const badge of BADGES) {
    let hasIt = false

    // One rule per badge:
    if (badge.id === 'first-quest') {
      hasIt = handedInQuests(quests).length >= 1
    } else if (badge.id === 'streak-3') {
      hasIt = longestOnTimeStreak(quests) >= 3
    } else if (badge.id === 'bookworm') {
      hasIt = countBySubject(quests, 'English') >= 5
    } else if (badge.id === 'century') {
      hasIt = points >= 100
    } else if (badge.id === 'pirate-king') {
      hasIt = points >= KING_AT
    }

    if (hasIt) {
      earned.push(badge)
    }
  }
  return earned
}
