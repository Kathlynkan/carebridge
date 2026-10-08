// =============================================================
// /homework  - homework "quests"
// Owners: Ning Xuan (volunteer assigns)  +  Jachin (child hands in, berries, leaderboard)
// =============================================================
// How a quest travels (its "status" changes step by step):
//
//   'assigned'   the volunteer gave the quest to the child
//        |  the child presses DONE!        -> PUT /homework/:id/submit
//        v
//   'submitted'  the child handed it in, now it waits for the volunteer (the "Captain")
//        |  the volunteer checks it         -> PUT /homework/:id/verify
//        v
//   'verified'   checked! The child is paid the berries now.
//
// Berries (the pirate money) are saved on the child as child.points.
// The ranks and badges are worked out in the browser: client/src/utils/gamification.js
// =============================================================
import { Router } from 'express'
import { Homework, Child } from '../models/index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { canAccessChild, visibleChildIds } from '../utils/access.js'

const router = Router()

// Everything in this file needs a logged-in user.
router.use(requireAuth)

// ---------------------------------------------------------------
// GET /homework?childId=c_1
// Returns the quests of a child (or of all the children this user may see).
// ---------------------------------------------------------------
router.get('/', async (req, res) => {
  const visible = await visibleChildIds(req.user) // the ids of the children this user is allowed to see
  const { childId } = req.query

  // Asking about a child you may not see? You get an empty list.
  if (childId && !visible.includes(childId)) {
    return res.json([])
  }

  const filter = { childId: childId || { $in: visible } }
  const list = await Homework.find(filter).sort({ dueDate: 1 }) // earliest due date first
  res.json(list)
})

// ---------------------------------------------------------------
// GET /homework/leaderboard
// The "Bounty Board": the 10 children with the most berries, and where "I" am.
// PRIVACY: we only send the FIRST NAME, the avatar, the berries and the place.
// We never send ids, surnames or schools.
// (This route is written before any '/:id' route so the word "leaderboard" is not mistaken for an id.)
// ---------------------------------------------------------------
router.get('/leaderboard', async (req, res) => {
  // If the person asking is a child, remember which child they are, so we can highlight them.
  let myChildId = null
  if (req.user.role === 'child') {
    myChildId = req.user.childId
  }

  // Get ALL the children, the one with the most berries first. (-1 means biggest first.)
  const allChildren = await Child.find().sort({ points: -1, name: 1 })

  // Go through the children one by one. Place number 1 is the first child in the list, 2 is the next, and so on.
  const top = [] // the first 10 children
  let me = null // my own row
  for (let i = 0; i < allChildren.length; i++) {
    const child = allChildren[i]

    // Make the row we will send. Only first name, avatar, berries and place.
    const row = {
      rank: i + 1,
      name: child.name.split(' ')[0], // "Luffy Wong" becomes "Luffy"
      avatar: child.avatar,
      photo: child.photo, // the path of the picture for the poster ('' if there is none)
      points: child.points,
      isMe: child.id === myChildId,
    }

    // Only the first 10 go on the board.
    if (i < 10) {
      top.push(row)
    }

    // Remember my own row, even if I am not in the first 10.
    if (row.isMe) {
      me = row
    }
  }

  res.json({ top, me })
})

// ---------------------------------------------------------------
// POST /homework      (Ning Xuan)
// A volunteer gives a new quest to a child. Not built yet.
// ---------------------------------------------------------------
router.post('/', requireRole('volunteer', 'coordinator'), async (req, res) => {
  // TODO (Ning Xuan): check the data, then Homework.create({ ...fields, volunteerId: req.user.id })
  res.status(501).json({ message: 'TODO (Ning Xuan): assign homework' })
})

// ---------------------------------------------------------------
// PUT /homework/:id/submit
// The CHILD presses DONE!  The quest goes from 'assigned' to 'submitted'.
// No berries yet: they are only paid when the volunteer checks the quest.
// ---------------------------------------------------------------
router.put('/:id/submit', requireRole('child'), async (req, res) => {
  // 1. Find the quest.
  const quest = await Homework.findById(req.params.id)

  // 2. It must exist, and it must belong to THIS child. (A child cannot hand in someone else's quest.)
  if (!quest || quest.childId !== req.user.childId) {
    return res.status(404).json({ message: 'Quest not found.' })
  }

  // 3. It must still be waiting to be done. (If it was already handed in, pressing the button again does nothing.)
  if (quest.status !== 'assigned') {
    return res.status(409).json({ message: 'You already handed this quest in.' })
  }

  // 4. Change the status, write down when, and save it in the database.
  quest.status = 'submitted'
  quest.completedAt = new Date().toISOString()
  await quest.save()

  res.json(quest)
})

// ---------------------------------------------------------------
// PUT /homework/:id/verify
// The VOLUNTEER (the Captain) checks a handed-in quest. The status goes to 'verified'
// and the child is PAID the berries of the quest.
// ---------------------------------------------------------------
router.put('/:id/verify', requireRole('volunteer', 'coordinator'), async (req, res) => {
  // 1. Find the quest, and the child it belongs to.
  const quest = await Homework.findById(req.params.id)
  let child = null
  if (quest) {
    child = await Child.findById(quest.childId)
  }

  // 2. Only the child's own volunteers (or a coordinator) may check the quest.
  //    Anyone else gets the same answer as for a quest that does not exist.
  if (!quest || !canAccessChild(req.user, child)) {
    return res.status(404).json({ message: 'Quest not found.' })
  }

  // 3. Only a quest that was handed in can be checked.
  //    A quest that is already 'verified' is refused, so pressing the button again does not pay again.
  if (quest.status !== 'submitted') {
    return res.status(409).json({ message: 'This quest has not been handed in, or was already checked.' })
  }

  // 4. Mark the quest as checked.
  quest.status = 'verified'
  await quest.save()

  // 5. Pay the child: add the quest's berries to the child's points, and save.
  child.points = child.points + quest.points
  await child.save()

  res.json({ homework: quest, points: child.points })
})

export default router
