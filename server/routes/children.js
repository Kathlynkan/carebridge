// =============================================================
// /children  - child profiles             Owner: Kai Sen
// -------------------------------------------------------------
// GET routes are DONE (everyone's pages depend on them).
//
// TODO (Kai Sen):
//   [ ] POST   /children        create a child (coordinator only)
//   [ ] PUT    /children/:id    edit a child   (coordinator only)
//   [ ] DELETE /children/:id    remove a child (coordinator only)
//       -> follow the pattern in routes/auth.js (signup)
// =============================================================
import { Router } from 'express'
import { Child } from '../models/index.js'
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

// POST /children   body: { name, level, school, parentId, needs, avatar }
router.post('/', requireRole('coordinator'), async (req, res) => {
  // TODO (Kai Sen): validate req.body, then
  //   const child = await Child.create({ name, level, school, parentId, needs, avatar })
  //   res.status(201).json(child)
  // (catch mongoose ValidationError -> 400 with a friendly message)
  res.status(501).json({ message: 'TODO (Kai Sen): create child' })
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
