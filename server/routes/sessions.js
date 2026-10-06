// =============================================================
// /sessions  - session records (the core of the app)   Owner: Ning Xuan
// -------------------------------------------------------------
// Fields: see models/Session.js
// GET is DONE so that Yuqi / Kat / Jachin / Yu Xuan can build on it.
//
// TODO (Ning Xuan):
//   [ ] POST   /sessions        volunteer records a session
//   [ ] PUT    /sessions/:id    edit (only the volunteer who wrote it, or a coordinator)
//   [ ] DELETE /sessions/:id    delete (same rule)
//   [ ] Validate: correct <= attempted, date not in the future, topic required
// =============================================================
import { Router } from 'express'
import { Child, Session, User } from '../models/index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { canAccessChild, visibleChildIds } from '../utils/access.js'

const router = Router()
router.use(requireAuth)

// GET /sessions?childId=c_1   -> newest first
router.get('/', async (req, res) => {
  const { childId } = req.query
  const filter = {}

  if (childId) {
    const child = await Child.findById(childId)
    if (!canAccessChild(req.user, child)) {
      return res.status(403).json({ message: 'You do not have access to this child.' })
    }
    filter.childId = childId
  } else if (req.user.role !== 'coordinator') {
    // non-coordinators may only list sessions of children they can see
    filter.childId = { $in: await visibleChildIds(req.user) }
  }

  const sessions = await Session.find(filter).sort({ date: -1 })

  // attach the volunteer's name so the UI can show "Recorded by ..."
  const volunteerIds = [...new Set(sessions.map((s) => s.volunteerId))]
  const volunteers = await User.find({ _id: { $in: volunteerIds } }).select('name')
  const nameOf = Object.fromEntries(volunteers.map((v) => [v.id, v.name]))

  res.json(sessions.map((s) => ({ ...s.toJSON(), volunteerName: nameOf[s.volunteerId] || 'Unknown' })))
})

// GET /sessions/:id
router.get('/:id', async (req, res) => {
  const session = await Session.findById(req.params.id)
  if (!session) return res.status(404).json({ message: 'Session not found' })
  const child = await Child.findById(session.childId)
  if (!canAccessChild(req.user, child)) return res.status(403).json({ message: 'No access' })
  res.json(session)
})

// POST /sessions
router.post('/', requireRole('volunteer', 'coordinator'), async (req, res) => {
  // TODO (Ning Xuan): check the volunteer can access req.body.childId, validate, then
  //   const session = await Session.create({ ...fields, volunteerId: req.user.id })
  //   res.status(201).json(session)
  res.status(501).json({ message: 'TODO (Ning Xuan): create session' })
})

// PUT /sessions/:id
router.put('/:id', requireRole('volunteer', 'coordinator'), async (req, res) => {
  // TODO (Ning Xuan): findById -> check owner -> change fields -> await session.save()
  res.status(501).json({ message: 'TODO (Ning Xuan): update session' })
})

// DELETE /sessions/:id
router.delete('/:id', requireRole('volunteer', 'coordinator'), async (req, res) => {
  // TODO (Ning Xuan): findById -> check owner -> await session.deleteOne()
  res.status(501).json({ message: 'TODO (Ning Xuan): delete session' })
})

export default router
