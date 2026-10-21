// =============================================================
// /matchmaking  - suggest + assign volunteers    Owner: Yu Xuan
// =============================================================
import { Router } from 'express'
import { Child, User } from '../models/index.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { rankVolunteers } from '../utils/matchmaking.js'

const router = Router()
router.use(requireAuth, requireRole('teacher')) // every matchmaking route is coordinator-only

// Mongoose keeps the id in _id. This gives the same { id, ... } shape the client and
// seed.json use, which is what the pure scoring functions expect.
const toPlain = (doc) => ({ ...doc.toJSON(), id: doc.id })

// GET /matchmaking/:childId -> { child, suggestions: [...ranked volunteers] }
router.get('/:childId', async (req, res) => {
  const [child, volunteers, allChildren] = await Promise.all([
    Child.findById(req.params.childId),
    User.find({ role: 'volunteer' }),
    Child.find(),
  ])
  if (!child) return res.status(404).json({ message: 'Child not found' })

  const suggestions = rankVolunteers(toPlain(child), volunteers.map(toPlain), allChildren.map(toPlain))
  res.json({ child, suggestions })
})

// PUT /matchmaking/:childId/assign
//   assign:   { action: 'assign',   volunteerId, day }
//   unassign: { action: 'unassign', volunteerId }
router.put('/:childId/assign', async (req, res) => {
  const { volunteerId, day, action = 'assign' } = req.body

  if (!['assign', 'unassign'].includes(action)) {
    return res.status(400).json({ message: 'Action must be "assign" or "unassign".' })
  }
  if (!volunteerId) return res.status(400).json({ message: 'Choose a volunteer.' })

  const child = await Child.findById(req.params.childId)
  if (!child) return res.status(404).json({ message: 'Child not found' })

  if (action === 'unassign') {
    // Remove the volunteer AND all their schedule slots for this child.
    child.volunteerIds = child.volunteerIds.filter((id) => id !== volunteerId)
    child.schedule = child.schedule.filter((slot) => slot.volunteerId !== volunteerId)
  } else {
    const volunteer = await User.findOne({ _id: volunteerId, role: 'volunteer' })
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' })
    if (!day) return res.status(400).json({ message: 'Pick a day for the session.' })

    // Never trust the browser: re-check the day is one the volunteer is actually free.
    if (!(volunteer.availability || []).includes(day)) {
      return res.status(400).json({ message: `${volunteer.name} isn't available on ${day}.` })
    }

    if (!child.volunteerIds.includes(volunteerId)) child.volunteerIds.push(volunteerId)

    const alreadyBooked = child.schedule.some((s) => s.volunteerId === volunteerId && s.day === day)
    if (!alreadyBooked) child.schedule.push({ volunteerId, day })
  }

  await child.save()
  res.json(child)
})

export default router