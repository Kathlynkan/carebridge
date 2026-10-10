// =============================================================
// /homework  - homework "quests"
// Owners: Ning Xuan (volunteer assigns)  +  Jachin (child completes, points & badges)
// =============================================================
import { Router } from 'express'
import { Homework, Child } from '../models/index.js'
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

// GET /homework/leaderboard                     (Jachin)
// ?period=week  -> stars earned this week (points from verified homework completed in the last 7 days)
// default       -> all-time (total child points, top 10)
router.get('/leaderboard', async (req, res) => {
  if (req.query.period === 'week') {
    // Use YYYY-MM-DD string comparison — works for both date-only and ISO strings
    const sevenDaysAgoStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)

    const recentVerified = await Homework.find({
      status: 'verified',
      completedAt: { $gte: sevenDaysAgoStr },
    })

    // Sum points earned per child this week
    const weekPoints = {}
    for (const hw of recentVerified) {
      weekPoints[hw.childId] = (weekPoints[hw.childId] || 0) + hw.points
    }

    if (Object.keys(weekPoints).length === 0) return res.json([])

    const children = await Child.find({ _id: { $in: Object.keys(weekPoints) } }).select(
      'name points avatar',
    )
    const entries = children
      .map((c) => ({
        childId: c.id,
        name: c.name,
        avatar: c.avatar,
        points: weekPoints[c.id] || 0,
      }))
      .sort((a, b) => b.points - a.points)

    return res.json(entries)
  }

  // Default: all-time by total points
  const children = await Child.find({}).sort({ points: -1 }).limit(10).select('name points avatar')
  res.json(
    children.map((c) => ({ childId: c.id, name: c.name, avatar: c.avatar, points: c.points })),
  )
})

// POST /homework   (Ning Xuan)  body: { childId, title, subject, details, dueDate, points }
router.post('/', requireRole('volunteer', 'coordinator'), async (req, res) => {
  // TODO (Ning Xuan): validate, then Homework.create({ ...fields, volunteerId: req.user.id })
  res.status(501).json({ message: 'TODO (Ning Xuan): assign homework' })
})

// PUT /homework/:id/submit  (Jachin) -> child marks homework as done
router.put('/:id/submit', requireRole('child'), async (req, res) => {
  const hw = await Homework.findById(req.params.id)
  if (!hw) return res.status(404).json({ message: 'Homework not found.' })
  if (hw.childId !== req.user.childId) {
    return res.status(403).json({ message: 'This is not your homework.' })
  }
  if (hw.status !== 'assigned') {
    return res.status(400).json({ message: 'Homework is already submitted or verified.' })
  }
  hw.status = 'submitted'
  hw.completedAt = new Date().toISOString().slice(0, 10)
  await hw.save()
  res.json(hw)
})

// PUT /homework/:id/verify  (Jachin) -> volunteer confirms, child earns points
// findOneAndUpdate with status condition makes the submitted→verified transition atomic,
// preventing double-award if two requests race on the same homework.
router.put('/:id/verify', requireRole('volunteer', 'coordinator'), async (req, res) => {
  const hw = await Homework.findOneAndUpdate(
    { _id: req.params.id, status: 'submitted' },
    { $set: { status: 'verified' } },
    { new: true },
  )
  if (!hw) {
    const exists = await Homework.exists({ _id: req.params.id })
    if (!exists) return res.status(404).json({ message: 'Homework not found.' })
    return res.status(400).json({ message: 'Homework must be submitted before it can be verified.' })
  }
  const child = await Child.findByIdAndUpdate(
    hw.childId,
    { $inc: { points: hw.points } },
    { new: true },
  )
  res.json({ homework: hw, points: child.points })
})

export default router
