// =============================================================
// /progress  - data for the charts          Owner: Jachin
// -------------------------------------------------------------
// You can compute chart data on the client from GET /sessions, OR do it
// here so every page gets the same numbers. Suggested shape:
//
// GET /progress/:childId ->
// {
//   byTopic:  [{ topic: 'Fractions', accuracy: 0.6, sessions: 3, trend: 'improving' }],
//   timeline: [{ date: '2026-09-01', topic: 'Fractions', accuracy: 0.4 }],
//   struggles:[{ skill: 'Common denominators', count: 3, lastSeen: '2026-09-20' }]
// }
//
// TODO (Jachin):
//   [ ] implement the aggregation (group sessions by topic, accuracy = correct/attempted)
//   [ ] decide "improving / steady / needs help" using the last 3 sessions of a topic
//   [ ] GET /progress/overview  -> centre-wide data for Yu Xuan's dashboard chart
// =============================================================
import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/:childId', async (req, res) => {
  res.status(501).json({ message: 'TODO (Jachin): progress aggregation' })
})

export default router
