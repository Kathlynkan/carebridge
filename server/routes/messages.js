// =============================================================
// /messages  - volunteer <-> parent chat about a child      Owner: Kat
// -------------------------------------------------------------
// Fields: see models/Message.js
// One "conversation" per child, shared by the parent, the child's
// assigned volunteers and the coordinator.
// =============================================================
import { Router } from 'express'
import { Child, Message, User } from '../models/index.js'
import { requireAuth } from '../middleware/auth.js'
import { canAccessChild } from '../utils/access.js'

const router = Router()
router.use(requireAuth)

// GET /messages?childId=c_1   (DONE) -> oldest first, with sender name
router.get('/', async (req, res) => {
  const child = await Child.findById(req.query.childId)
  if (!canAccessChild(req.user, child) || req.user.role === 'child') {
    return res.status(403).json({ message: 'You do not have access to this conversation.' })
  }
  const messages = await Message.find({ childId: child.id }).sort({ sentAt: 1 })

  const senderIds = [...new Set(messages.map((m) => m.fromId))]
  const senders = await User.find({ _id: { $in: senderIds } }).select('name role')
  const byId = Object.fromEntries(senders.map((u) => [u.id, u]))

  res.json(
    messages.map((m) => ({
      ...m.toJSON(),
      fromName: byId[m.fromId]?.name || 'Unknown',
      fromRole: byId[m.fromId]?.role,
    })),
  )
})

// GET /messages/unread  -> { [childId]: count }  (for the navbar badge)
router.get('/unread', async (req, res) => {
  // TODO (Kat): Message.find({ childId: { $in: visibleChildIds }, readBy: { $ne: req.user.id } })
  res.status(501).json({ message: 'TODO (Kat): unread counts' })
})

// POST /messages   body: { childId, text }
router.post('/', async (req, res) => {
  // TODO (Kat): check access (same as GET), reject empty text, then
  //   const message = await Message.create({ childId, fromId: req.user.id, text, readBy: [req.user.id] })
  res.status(501).json({ message: 'TODO (Kat): send message' })
})

// PUT /messages/read   body: { childId }  -> mark all as read by me
router.put('/read', async (req, res) => {
  // TODO (Kat): Message.updateMany({ childId }, { $addToSet: { readBy: req.user.id } })
  res.status(501).json({ message: 'TODO (Kat): mark as read' })
})

export default router
