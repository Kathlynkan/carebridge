// =============================================================
// /dashboard  - coordinator overview & alerts     Owner: Yu Xuan
// -------------------------------------------------------------
// TODO (Yu Xuan):
//   [ ] alerts: children with NO session in the last 7 days
//   [ ] alerts: a struggle skill that appears in 3+ of the last 5 sessions
//   [ ] alerts: homework overdue and not submitted
//   [ ] alerts: children with no volunteer assigned  -> Child.find({ volunteerIds: { $size: 0 } })
//   [ ] PUT /dashboard/follow-up/:childId  -> flag / unflag a child for follow-up
// =============================================================
import { Router } from 'express'
import { Child, User, Session, Homework } from '../models/index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth, requireRole('coordinator'))

// GET /dashboard/summary  -> numbers for the KPI cards (basic version DONE)
router.get('/summary', async (req, res) => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  // run the 4 counts at the same time
  const [totalChildren, totalVolunteers, sessionsThisWeek, homeworkPending] = await Promise.all([
    Child.countDocuments(),
    User.countDocuments({ role: 'volunteer' }),
    Session.countDocuments({ date: { $gte: weekAgo } }),
    Homework.countDocuments({ status: { $ne: 'verified' } }),
  ])

  res.json({
    totalChildren,
    totalVolunteers,
    sessionsThisWeek,
    homeworkPending,
    // TODO (Yu Xuan): add averageAccuracy, childrenNeedingFollowUp, ...
  })
})

// GET /dashboard/alerts  -> [{ childId, childName, type, message, severity }]
router.get('/alerts', async (req, res) => {
  res.status(501).json({ message: 'TODO (Yu Xuan): build alerts' })
})

export default router
