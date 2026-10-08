// =============================================================
// /progress  - numbers about how a child is doing          Owner: Jachin
// =============================================================
// GET /progress/:childId  sends back, for one child:
//
//   byTopic:  one entry per topic, for example
//             { topic: 'Fractions', subject: 'Math', sessions: 4, attempted: 20, correct: 10, accuracy: 0.5 }
//   timeline: one entry per session: { date, topic, accuracy }   (good for a chart)
//
// NUMBERS ONLY. It never sends the volunteer's notes, struggles or moods,
// so it is safe for the child to receive it. The pirate dashboard uses it for the "Fraction Fruit" badge.
//
// TODO (Jachin):
//   [ ] a "recurring struggles" list (needs the struggle text, so only for volunteers and parents)
//   [ ] GET /progress/overview  -> numbers for the whole centre (for Yu Xuan's dashboard)
// =============================================================
import { Router } from 'express'
import { Child, Session } from '../models/index.js'
import { requireAuth } from '../middleware/auth.js'
import { canAccessChild } from '../utils/access.js'

const router = Router()

// Everything in this file needs a logged-in user.
router.use(requireAuth)

// accuracy = how many answers were right, as a number from 0 to 1 (0.5 means half right)
function accuracyOf(attempted, correct) {
  if (attempted > 0) {
    return correct / attempted
  }
  return 0 // nothing attempted, so avoid dividing by zero
}

router.get('/:childId', async (req, res) => {
  // 1. Find the child. If it is not this user's child, say "not found" (same answer as for a child that does not exist).
  const child = await Child.findById(req.params.childId)
  if (!canAccessChild(req.user, child)) {
    return res.status(404).json({ message: 'Child not found.' })
  }

  // 2. Get all the sessions of this child, oldest first.
  const sessions = await Session.find({ childId: child.id }).sort({ date: 1 })

  // 3. Add the sessions up per topic.
  const byTopic = []
  for (const session of sessions) {
    // Did we already start an entry for this topic?
    let entry = null
    for (const item of byTopic) {
      if (item.topic === session.topic) {
        entry = item
      }
    }
    // If not, make a new empty entry and add it to the list.
    if (entry === null) {
      entry = { topic: session.topic, subject: session.subject, sessions: 0, attempted: 0, correct: 0, accuracy: 0 }
      byTopic.push(entry)
    }
    // Add this session's numbers to the topic.
    entry.sessions = entry.sessions + 1
    entry.attempted = entry.attempted + session.attempted
    entry.correct = entry.correct + session.correct
  }

  // 4. Now that the totals are done, work out each topic's accuracy.
  for (const entry of byTopic) {
    entry.accuracy = accuracyOf(entry.attempted, entry.correct)
  }

  // 5. The timeline: one entry per session.
  const timeline = []
  for (const session of sessions) {
    timeline.push({
      date: session.date,
      topic: session.topic,
      accuracy: accuracyOf(session.attempted, session.correct),
    })
  }

  res.json({ byTopic, timeline })
})

export default router
