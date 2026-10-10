// =============================================================
// THE PIRATE RULES                                   Owner: Jachin
// =============================================================
// This file holds the "rules of the game": the ranks, the berries and the badges.
// It has NO Vue in it, only plain JavaScript.
//
// The story: a child earns BERRIES (pirate money, written ฿) by finishing quests (homework).
// More berries = a higher rank. The top rank is King of the Pirates.
// The berries are saved in the database as child.points.
// =============================================================

// ---------- RANKS ----------
// A list of 8 ranks. Each rank has:
//   id    - a short name used inside the code
//   icon  - a Bootstrap Icon
//   name  - the name the child sees
//   at    - how many berries are needed to reach this rank
//   motto - a sentence shown under the rank
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

// The berries needed for the last rank (600).
export const KING_AT = RANKS[RANKS.length - 1].at

// ---------- berries() ----------
// Puts the berry sign in front of a number: berries(20) gives "฿20".
// If the number is missing or negative we show ฿0.
export function berries(amount) {
  let total = Number(amount)
  if (isNaN(total) || total < 0) {
    total = 0
  }
  return '฿' + Math.round(total)
}

// ---------- rankFor() ----------
// Works out where a child is on the road. Give it the child's berries, and it gives back:
//   index  - the rank number, starting at 0 (0 = Stowaway)
//   rank   - the whole rank object (name, icon, motto...)
//   next   - the next rank (or null if the child is already King)
//   isKing - true at the top
//   toNext - berries still needed for the next rank
export function rankFor(amount) {
  // Look at every rank. Each time the child has enough berries, remember that rank.
  let index = 0
  for (let i = 0; i < RANKS.length; i++) {
    if (amount >= RANKS[i].at) {
      index = i
    }
  }

  // The next rank is the one after this one. The King has no next rank.
  let next = null
  let toNext = 0
  if (index < RANKS.length - 1) {
    next = RANKS[index + 1]
    toNext = next.at - amount
  }

  return { index, rank: RANKS[index], next, isKing: next === null, toNext }
}

// ---------- levelFor() ----------
// The child's level is the rank number starting at 1 (Stowaway = level 1, Cabin Boy = level 2...).
//   level    - the level number
//   progress - how far the child is towards the next rank, from 0 to 100 (the King is always 100)
export function levelFor(points) {
  const road = rankFor(points)
  let progress = 100
  if (road.next !== null) {
    progress = Math.round(((points - road.rank.at) / (road.next.at - road.rank.at)) * 100)
  }
  return { level: road.index + 1, progress }
}

// ---------- BADGES ----------
// Each badge has an id, an icon, a name, and its rule written in words.
export const BADGES = [
  { id: 'first-quest', icon: 'bi-flag-fill', name: 'Set Sail', rule: 'Hand in your first quest' },
  { id: 'streak-3', icon: 'bi-compass', name: 'Navigator', rule: 'Hand in 3 quests in a row on time' },
  { id: 'bookworm', icon: 'bi-journal-text', name: 'Poneglyph Reader', rule: 'Hand in 5 English quests' },
  { id: 'century', icon: 'bi-coin', name: 'Treasure Hunter', rule: 'Collect 100 berries' },
  { id: 'pirate-king', icon: 'bi-gem', name: 'Pirate King', rule: 'Reach the top of the Road: 600 berries' },
]

// ---------- countProgress() ----------
// Goes through the quests once and counts the things the badges need.
//   handedIn   - quests handed in (the status is not 'assigned')
//   english    - handed-in English quests
//   longestRun - the longest run of quests handed in on time
function countProgress(homework) {
  let handedIn = 0
  let english = 0
  let run = 0 // the current run of quests handed in on time
  let longestRun = 0 // the longest run so far
  for (const quest of homework) {
    if (quest.status !== 'assigned') {
      handedIn = handedIn + 1
      if (quest.subject === 'English') {
        english = english + 1
      }
      // On time means done on or before the due date. Both are text like "2026-10-05".
      if (quest.completedAt && quest.completedAt.slice(0, 10) <= quest.dueDate) {
        run = run + 1
      } else {
        run = 0
      }
      if (run > longestRun) {
        longestRun = run
      }
    }
  }
  return { handedIn, english, longestRun }
}

// ---------- earnedBadges() ----------
// Gives back a list with the ids of the badges the child has earned.
//   child    - the child (we only need child.points)
//   homework - the child's quests, in the order they are due
export function earnedBadges(child, homework) {
  const { handedIn, english, longestRun } = countProgress(homework)

  // Check the rule of each badge.
  const earned = []
  if (handedIn >= 1) earned.push('first-quest')
  if (longestRun >= 3) earned.push('streak-3')
  if (english >= 5) earned.push('bookworm')
  if (child.points >= 100) earned.push('century')
  if (child.points >= KING_AT) earned.push('pirate-king')
  return earned
}

// ---------- badgeStory() ----------
// A sentence that tells the child what they did to earn a badge.
// The page only shows it for a badge the child has earned. A locked badge shows no story, so the child finds out when they earn it.
export function badgeStory(badgeId, child, homework) {
  const { handedIn, english, longestRun } = countProgress(homework)

  if (badgeId === 'first-quest') {
    return 'You handed in ' + handedIn + ' quest(s). The first one set you sailing!'
  }
  if (badgeId === 'streak-3') {
    return 'Your longest run is ' + longestRun + ' quests in a row, all handed in on time.'
  }
  if (badgeId === 'bookworm') {
    return 'You handed in ' + english + ' English quests.'
  }
  if (badgeId === 'century') {
    return 'You collected ' + berries(child.points) + '.'
  }
  // the last badge: pirate-king
  return 'You collected ' + berries(child.points) + '. You are the King of the Pirates!'
}

// ---------- groupQuestsByMilestone() ----------
// Puts every quest at the milestone (rank) it belongs to, so the road can show the tasks of each milestone.
//   points   - the child's berries
//   homework - the child's quests, in the order they are due
// Gives back a list of 8 lists, one for each rank.
//   A quest that was checked (verified) belongs to the rank the child had when it was paid.
//   A quest that is not checked yet belongs to the child's current rank.
export function groupQuestsByMilestone(points, homework) {
  // 8 empty lists, one for each rank.
  const groups = []
  for (let i = 0; i < RANKS.length; i++) {
    groups.push([])
  }

  // Add up the berries of the checked quests.
  let paid = 0
  for (const quest of homework) {
    if (quest.status === 'verified') {
      paid = paid + quest.points
    }
  }

  // The berries the child had before the first checked quest. (They came from somewhere else, like the demo data.)
  let total = points - paid
  if (total < 0) {
    total = 0
  }

  const current = rankFor(points).index
  for (const quest of homework) {
    if (quest.status === 'verified') {
      // This quest was paid when the child had "total" berries, so it belongs to that rank.
      let index = rankFor(total).index
      if (index > current) {
        index = current
      }
      groups[index].push(quest)
      total = total + quest.points
    } else {
      groups[current].push(quest)
    }
  }
  return groups
}
