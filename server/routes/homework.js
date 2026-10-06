// =============================================================
// /homework  - homework "quests"
// Owners: Ning Xuan (volunteer assigns)  +  Jachin (child completes, points & badges)
// -------------------------------------------------------------
// Fields: see models/Homework.js
// Flow:  volunteer assigns ('assigned')  ->  child marks done ('submitted')
//        ->  volunteer verifies at next session ('verified') -> child gets points
// =============================================================
import { Router } from 'express'
import { Homework } from '../models/index.js'
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

// POST /homework   (Ning Xuan)  body: { childId, title, subject, details, dueDate, points }
router.post('/', requireRole('volunteer', 'coordinator'), async (req, res) => {
  // TODO (Ning Xuan): validate, then Homework.create({ ...fields, volunteerId: req.user.id })
  res.status(501).json({ message: 'TODO (Ning Xuan): assign homework' })
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
