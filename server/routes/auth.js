// =============================================================
// /auth  - Sign up, log in, log out        Owner: Kai Sen
// -------------------------------------------------------------
// This file is COMPLETE and doubles as the reference pattern for
// everyone else's routes:  validate -> Model.create / find -> res.json
//
// TODO (Kai Sen):
//   [ ] Hash passwords with bcryptjs (pnpm add bcryptjs)
//   [x] Stronger validation (email format, password length)
// =============================================================
import { Router } from 'express'
import { User } from '../models/index.js'
import { issueToken, revokeToken, requireAuth } from '../middleware/auth.js'

const router = Router()
const SIGNUP_ROLES = ['volunteer', 'parent'] // coordinators & child accounts are created by the centre
const MIN_PASSWORD_LENGTH = 8 // same rule as client/src/utils/validation.js
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // something@something.something, no spaces

// Tidy an email the same way everywhere, so " Ann@X.com " and "ann@x.com" count as the same account.
// String(...) also stops a crash if someone sends a number instead of text.
const cleanEmail = (email) =>
  String(email ?? '')
    .trim()
    .toLowerCase()

// The only skills and days a volunteer can pick.
// Must match SKILL_OPTIONS and DAYS in client/src/utils/constants.js (the server can't import client files).
const SKILL_OPTIONS = [
  'Primary Math',
  'Fractions',
  'Problem Sums',
  'English Comprehension',
  'Composition',
  'Spelling',
  'Science',
  'Mother Tongue',
]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

// true if `list` is an array with at least one item, and every item is in `allowed`
const isPickedFrom = (list, allowed) =>
  Array.isArray(list) && list.length > 0 && list.every((item) => allowed.includes(item))

// POST /auth/signup   body: { name, email, password, role, skills?, availability? }
// skills and availability are only for volunteers.
router.post('/signup', async (req, res) => {
  const { password, role } = req.body
  const name = String(req.body.name ?? '').trim()
  const email = cleanEmail(req.body.email)

  // 1. Validate (the page checks too, but never trust only the browser)
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password and role are required.' })
  }
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email.' })
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return res
      .status(400)
      .json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` })
  }
  if (!SIGNUP_ROLES.includes(role)) {
    return res.status(400).json({ message: 'You can only sign up as a volunteer or parent.' })
  }
  if (role === 'volunteer') {
    if (!isPickedFrom(req.body.skills, SKILL_OPTIONS)) {
      return res.status(400).json({ message: 'Pick at least one skill from the list.' })
    }
    if (!isPickedFrom(req.body.availability, DAYS)) {
      return res.status(400).json({ message: 'Pick at least one day from the list.' })
    }
  }

  // 2. Is the email already used?
  const exists = await User.exists({ email })
  if (exists) {
    return res.status(409).json({ message: 'An account with this email already exists.' })
  }

  // 3. Save. Mongoose fills in _id and createdAt using the defaults in models/User.js
  try {
    const user = await User.create({
      name,
      email,
      password, // TODO (Kai Sen): store a bcrypt hash instead
      role,
      // new Set(...) removes duplicates; parents get empty lists
      skills: role === 'volunteer' ? [...new Set(req.body.skills)] : [],
      availability: role === 'volunteer' ? [...new Set(req.body.availability)] : [],
    })
    const token = issueToken(user.id)
    res.status(201).json({ token, user }) // password is removed by toJSON (models/helpers.js)
  } catch (error) {
    // 11000 = MongoDB's "duplicate key" error: two sign-ups with the same email at the same moment
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }
    throw error // anything else goes to the 500 handler in server.js
  }
})

// POST /auth/login   body: { email, password }
router.post('/login', async (req, res) => {
  const { password } = req.body
  const user = await User.findOne({ email: cleanEmail(req.body.email) })

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