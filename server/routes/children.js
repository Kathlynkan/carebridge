// =============================================================
// /children  - child profiles             Owner: Kai Sen
// -------------------------------------------------------------
// GET routes are DONE (everyone's pages depend on them).
//
// TODO (Kai Sen):
//   [x] POST   /children        create a child (coordinator only)
//   [ ] PUT    /children/:id    edit a child   (coordinator only)
//   [ ] DELETE /children/:id    remove a child (coordinator only)
//       -> follow the pattern in routes/auth.js (signup)
// =============================================================
import { Router } from 'express'
import { Child, User } from '../models/index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { canAccessChild, childFilterFor } from '../utils/access.js'

const router = Router()
router.use(requireAuth)

// GET /children  -> only the children this user is allowed to see
router.get('/', async (req, res) => {
  const children = await Child.find(childFilterFor(req.user)).sort({ name: 1 })
  res.json(children)
})

// GET /children/:id
router.get('/:id', async (req, res) => {
  const child = await Child.findById(req.params.id)
  if (!child) return res.status(404).json({ message: 'Child not found' })
  if (!canAccessChild(req.user, child)) {
    return res.status(403).json({ message: 'You do not have access to this child.' })
  }
  res.json(child)
})

const LEVELS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6']

// POST /children   body: { name, level, school, parentId, needs, avatar }
// Only coordinators get past requireRole('coordinator'); everyone else gets 403.
router.post('/', requireRole('coordinator'), async (req, res) => {
  const { name, level, school, parentId, needs, avatar } = req.body

  // 1. Validate. Never trust the browser: someone could send a request without using our form.
  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'Name is required.' })
  }
  if (!LEVELS.includes(level)) {
    return res.status(400).json({ message: 'Level must be P1 to P6.' })
  }
  if (needs !== undefined && !Array.isArray(needs)) {
    return res.status(400).json({ message: 'Needs must be a list.' })
  }
  // The parent is optional, but if one is given it must be a real parent account
  if (parentId) {
    const parentExists = await User.exists({ _id: parentId, role: 'parent' })
    if (!parentExists) {
      return res.status(400).json({ message: 'That parent account does not exist.' })
    }
  }

  // 2. Save to MongoDB. Mongoose fills in _id ("c_xxxx"), points: 0, followUp: false
  //    and the default avatar from models/Child.js.
  try {
    const child = await Child.create({
      name: String(name).trim(),
      level,
      school: school ? String(school).trim() : undefined,
      parentId: parentId || undefined,
      needs: needs || [],
      volunteerIds: [], // a new child starts unassigned; Yu Xuan's matchmaking assigns volunteers
      avatar: avatar || undefined,
    })
    // 3. 201 Created + the new child, so the page can add it to the table straight away
    res.status(201).json(child)
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message })
    }
    throw error // anything else goes to the 500 handler in server.js
  }
})

// PUT /children/:id
router.put('/:id', requireRole('coordinator'), async (req, res) => {
  // TODO (Kai Sen): Child.findByIdAndUpdate(id, changes, { new: true, runValidators: true })
  res.status(501).json({ message: 'TODO (Kai Sen): update child' })
})

// DELETE /children/:id
router.delete('/:id', requireRole('coordinator'), async (req, res) => {
  // TODO (Kai Sen): Child.findByIdAndDelete(id) - and decide what happens to that
  // child's sessions / homework / messages (Session.deleteMany({ childId }) ?)
  res.status(501).json({ message: 'TODO (Kai Sen): delete child' })
})

export default router