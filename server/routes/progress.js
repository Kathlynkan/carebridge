// =============================================================
// /progress  - chart data aggregated from sessions    Owner: Jachin
// =============================================================
import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { Session, Child } from '../models/index.js'
import { canAccessChild } from '../utils/access.js'

const router = Router()
router.use(requireAuth)

// GET /progress/overview  -> centre-wide data for Yu Xuan's dashboard (coordinators + volunteers only)
router.get('/overview', requireRole('coordinator', 'volunteer'), async (req, res) => {
  const sessions = await Session.find({})
  res.json(aggregate(sessions))
})

// GET /progress/:childId
router.get('/:childId', async (req, res) => {
  const child = await Child.findById(req.params.childId)
  if (!child || !canAccessChild(req.user, child)) {
    return res.status(403).json({ message: 'Access denied.' })
  }
  const sessions = await Session.find({ childId: req.params.childId }).sort({ date: 1 })
  res.json(aggregate(sessions))
})

function aggregate(sessions) {
  const topicMap = {}
  for (const s of sessions) {
    topicMap[s.topic] ??= []
    topicMap[s.topic].push(s)
  }

  const byTopic = Object.entries(topicMap).map(([topic, list]) => {
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date))
    const totalAttempted = list.reduce((sum, s) => sum + s.attempted, 0)
    const totalCorrect = list.reduce((sum, s) => sum + s.correct, 0)
    const accuracy = totalAttempted ? Math.round((totalCorrect / totalAttempted) * 100) : 0
    return { topic, accuracy, sessions: list.length, trend: trend(sorted) }
  })

  const timeline = [...sessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({
      date: s.date,
      topic: s.topic,
      accuracy: s.attempted ? Math.round((s.correct / s.attempted) * 100) : 0,
    }))

  const struggleMap = {}
  for (const s of sessions) {
    for (const skill of s.struggles || []) {
      struggleMap[skill] ??= { skill, count: 0, lastSeen: s.date }
      struggleMap[skill].count++
      if (s.date > struggleMap[skill].lastSeen) struggleMap[skill].lastSeen = s.date
    }
  }
  const struggles = Object.values(struggleMap).sort((a, b) => b.count - a.count)

  return { byTopic, timeline, struggles }
}

function trend(sorted) {
  if (sorted.length < 2) return 'steady'
  const earlier = sorted.slice(0, -3)
  const last3 = sorted.slice(-3)
  if (earlier.length === 0) return 'not enough data yet'
  const avg = (list) => list.reduce((s, x) => s + (x.attempted ? x.correct / x.attempted : 0), 0) / list.length
  const diff = avg(last3) - avg(earlier)
  if (diff > 0.1) return 'improving'
  if (diff < -0.1) return 'needs help'
  return 'steady'
}

export default router
