// =============================================================
// /matchmaking  - skills-based volunteer matching     Owner: Yu Xuan
// -------------------------------------------------------------
// Idea: each child has `needs` (e.g. ['P4 Math', 'Fractions']),
// each volunteer has `skills` + `availability` (e.g. ['Mon', 'Wed']).
// Score every volunteer for a child and suggest the best matches.
//
// TODO (Yu Xuan):
//   [ ] GET /matchmaking/:childId -> [{ volunteerId, name, score, matchedSkills, load }]
//       score idea: +2 per matched skill, +1 per shared available day,
//                   -1 per child already assigned (spread the load)
//   [ ] PUT /matchmaking/:childId/assign  body: { volunteerIds: [...] }
//       -> updates child.volunteerIds (coordinator only)
// =============================================================
import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth, requireRole('coordinator'))

router.get('/:childId', async (req, res) => {
  res.status(501).json({ message: 'TODO (Yu Xuan): suggest volunteers' })
})

router.put('/:childId/assign', async (req, res) => {
  res.status(501).json({ message: 'TODO (Yu Xuan): assign volunteers' })
})

export default router
