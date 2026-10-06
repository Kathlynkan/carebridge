// =============================================================
// /auth  - Sign up, log in, log out        Owner: Kai Sen
// -------------------------------------------------------------
// This file is COMPLETE and doubles as the reference pattern for
// everyone else's routes:  validate -> Model.create / find -> res.json
//
// TODO (Kai Sen):
//   [ ] Hash passwords with bcryptjs (pnpm add bcryptjs)
//   [ ] Stronger validation (email format, password length)
//   [ ] Parent sign-up: link to a child using a "child code" from the centre
// =============================================================
import { Router } from 'express'
import { User } from '../models/index.js'
import { issueToken, revokeToken, requireAuth } from '../middleware/auth.js'

const router = Router()
const SIGNUP_ROLES = ['volunteer', 'parent'] // coordinators & child accounts are created by the centre

// POST /auth/signup   body: { name, email, password, role }
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password and role are required.' })
  }
  if (!SIGNUP_ROLES.includes(role)) {
    return res.status(400).json({ message: 'You can only sign up as a volunteer or parent.' })
  }

  const exists = await User.exists({ email: email.toLowerCase() })
  if (exists) {
    return res.status(409).json({ message: 'An account with this email already exists.' })
  }

  // Mongoose fills in _id and createdAt using the defaults in models/User.js
  const user = await User.create({
    name,
    email,
    password, // TODO (Kai Sen): store a bcrypt hash instead
    role,
  })

  const token = issueToken(user.id)
  res.status(201).json({ token, user }) // password is removed by toJSON (models/helpers.js)
})

// POST /auth/login   body: { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const user = await User.findOne({ email: String(email).toLowerCase() })

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Incorrect email or password.' })
  }
  const token = issueToken(user.id)
  res.json({ token, user })
})

// GET /auth/me  -> who am I? (used to check a saved token is still valid)
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user)
})

// POST /auth/logout
router.post('/logout', requireAuth, (req, res) => {
  revokeToken(req.token)
  res.json({ message: 'Logged out' })
})

export default router
