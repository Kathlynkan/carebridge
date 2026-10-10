// =============================================================
// /homework  - homework "quests"
// Owners: Ning Xuan (volunteer assigns) [done]  +  Jachin (child hands in, berries, leaderboard)
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
import { Homework, Child, Deck } from '../models/index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { canAccessChild, visibleChildIds } from '../utils/access.js'

const router = Router()

// A child must not see the right answers, so we take them out of the quest before we send it.
function hideAnswers(quest) {
  const data = quest.toJSON()
  for (const question of data.questions || []) {
    delete question.answer
  }
  return data
}

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

  // A child gets the questions without the answers. Volunteers and coordinators get everything.
  if (req.user.role === 'child') {
    const hidden = []
    for (const quest of list) {
      hidden.push(hideAnswers(quest))
    }
    return res.json(hidden)
  }
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
// POST /homework      (Ning Xuan: assign homework, done  +  Jachin: the questions come from a deck)
//   body = { childId, dueDate, points, title, subject, details, deckId (optional) }
// With a deckId, the quest gets a COPY of the questions of the deck. The title, subject and details of the deck are used
// when the volunteer did not type their own. Without a deckId the quest has no questions.
// ---------------------------------------------------------------
router.post('/', requireRole('volunteer', 'coordinator'), async (req, res) => {
  // only volunteers and coordinators can assign homework
  try {
    const child = await Child.findById(req.body.childId)

    // check if child exists
    if (!child) {
      return res.status(404).json({
        message: 'Child not found'
      })
    }

    // check user access
    const allowedChildren = await visibleChildIds(req.user)

    if (!allowedChildren.includes(req.body.childId)) {
      return res.status(403).json({
        message: 'No access'
      })
    }

    const today = new Date().toISOString().slice(0, 10)

    // check due date exists
    if (!req.body.dueDate) {
      return res.status(400).json({
        message: 'Due date is required'
      })
    }

    // validate due date
    if (req.body.dueDate < today) {
      return res.status(400).json({
        message: 'Due date cannot be in the past'
      })
    }

    // find the deck, if the volunteer picked one
    let deck = null
    if (req.body.deckId) {
      deck = await Deck.findById(req.body.deckId)
      if (!deck) {
        return res.status(404).json({
          message: 'Deck not found'
        })
      }
    }

    // validate title (a deck gives a title when the volunteer typed none)
    let title = (req.body.title || '').trim()
    if (!title && deck) {
      title = deck.title
    }
    if (!title) {
      return res.status(400).json({
        message: 'Title is required'
      })
    }

    // validate points
    if (req.body.points < 0) {
      return res.status(400).json({
        message: 'Points cannot be negative'
      })
    }

    // copy the questions of the deck into the quest, one by one
    const questions = []
    if (deck) {
      for (const question of deck.questions) {
        questions.push({ text: question.text, answer: question.answer })
      }
    }

    // create homework
    const homework = await Homework.create({
      childId: req.body.childId,
      title,
      subject: req.body.subject || (deck ? deck.subject : undefined),
      details: (req.body.details || '').trim() || (deck ? deck.description : ''),
      dueDate: req.body.dueDate,
      points: Number(req.body.points) || 10,
      volunteerId: req.user.id,
      deckId: deck ? deck.id : undefined,
      questions
    })

    // return new homework
    return res.status(201).json(homework)
    // status 201: request succeeded and created new homework
    // default status 200: request succeeded
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to assign homework'
    })
  }
})

// ---------------------------------------------------------------
// POST /homework/:id/answers
// The CHILD sends the answers to the questions of a quest, like { answers: ['21', '28'] }.
// We answer with true or false for every question. We never send the right answers back.
// If ALL answers are right (and the quest is still to do), we remember it, so the child may now hand the quest in.
// ---------------------------------------------------------------
router.post('/:id/answers', requireRole('child'), async (req, res) => {
  const quest = await Homework.findById(req.params.id)
  if (!quest || quest.childId !== req.user.childId) {
    return res.status(404).json({ message: 'Quest not found.' })
  }

  const given = req.body.answers || [] // the answers the child typed
  const results = [] // true or false for every question
  let allCorrect = true
  for (let i = 0; i < quest.questions.length; i++) {
    // Compare without capital letters and without spaces at the ends, so "Apple " is the same as "apple".
    const typed = String(given[i] || '').trim().toLowerCase()
    const right = String(quest.questions[i].answer).trim().toLowerCase()
    results.push(typed === right)
    if (typed !== right) {
      allCorrect = false
    }
  }

  // Remember that the child got everything right (only for a quest that is still to do).
  if (allCorrect && quest.status === 'assigned') {
    quest.answersCorrect = true
    await quest.save()
  }

  res.json({ results, allCorrect })
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

  // 3b. A quest with questions can only be handed in after the child got every answer right.
  if (quest.questions.length > 0 && !quest.answersCorrect) {
    return res.status(400).json({ message: 'Answer all the questions correctly first.' })
  }

  // 4. Change the status, write down when, and save it in the database.
  quest.status = 'submitted'
  quest.completedAt = new Date().toISOString()
  await quest.save()

  res.json(hideAnswers(quest))
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
