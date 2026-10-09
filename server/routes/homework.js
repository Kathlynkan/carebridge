// =============================================================
// /homework  - homework "quests"
// Owners: Ning Xuan (volunteer assigns) [done]  +  Jachin (child completes, points & badges)
// -------------------------------------------------------------
// Fields: see models/Homework.js
// Flow:  volunteer assigns ('assigned')  ->  child marks done ('submitted')
//        ->  volunteer verifies at next session ('verified') -> child gets points
// =============================================================
import { Router } from 'express'
import { Child, Homework } from '../models/index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { visibleChildIds } from '../utils/access.js'

const router = Router()
router.use(requireAuth)

// GET /homework?childId=c_1   (DONE)
router.get('/', async (req, res) => {
  const visible = await visibleChildIds(req.user)
  const { childId } = req.query
  if (childId && !visible.includes(childId)) return res.json([])

  const filter = { childId: childId || { $in: visible } }
  const list = await Homework.find(filter).sort({ dueDate: 1 })
  res.json(list)
})

// GET /homework/leaderboard   (Jachin)  -> [{ childId, name, points }] sorted, first names only
// (defined before any '/:id' routes so 'leaderboard' is not treated as an id)
router.get('/leaderboard', async (req, res) => {
  // TODO (Jachin): Child.find().sort({ points: -1 }).limit(10).select('name points avatar')
  // and only send first names (child privacy)
  res.status(501).json({ message: 'TODO (Jachin): leaderboard' })
})

// POST /homework
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
    
    // validate title
    if (!req.body.title) {
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

    // create homework
    const homework = await Homework.create({
      childId: req.body.childId,
      title: req.body.title,
      subject: req.body.subject,
      details: req.body.details,
      dueDate: req.body.dueDate,
      points: req.body.points,
      volunteerId: req.user.id
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

// PUT /homework/:id/submit   (Jachin)  -> child marks homework as done
router.put('/:id/submit', requireRole('child'), async (req, res) => {
  // TODO (Jachin): check homework.childId === req.user.childId,
  // set status 'submitted' + completedAt, await homework.save()
  res.status(501).json({ message: 'TODO (Jachin): submit homework' })
})

// PUT /homework/:id/verify   (Jachin)  -> volunteer confirms, child earns points
router.put('/:id/verify', requireRole('volunteer', 'coordinator'), async (req, res) => {
  // TODO (Jachin): set status 'verified', then add points to the child:
  //   await Child.findByIdAndUpdate(homework.childId, { $inc: { points: homework.points } })
  // and check badge rules (client/src/utils/gamification.js)
  res.status(501).json({ message: 'TODO (Jachin): verify homework + award points' })
})

export default router
