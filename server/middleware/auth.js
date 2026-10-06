// =============================================================
// Auth middleware (owner: Kai Sen)
// -------------------------------------------------------------
// Demo version: tokens are random strings kept in memory.
// Restarting the server logs everyone out (the client handles 401).
//
// TODO (Kai Sen):
//   [ ] Hash passwords with bcryptjs instead of storing plain text
//   [ ] (Optional) Replace in-memory tokens with JWT (jsonwebtoken),
//       which also survives server restarts on Render
// =============================================================
import crypto from 'node:crypto'
import { User } from '../models/index.js'

const tokens = new Map() // token -> userId

export function issueToken(userId) {
  const token = crypto.randomBytes(24).toString('hex')
  tokens.set(token, userId)
  return token
}

export function revokeToken(token) {
  tokens.delete(token)
}

// Attach req.user (a Mongoose User document) if "Authorization: Bearer <token>" is valid
export async function requireAuth(req, res, next) {
  const header = req.header('Authorization') || ''
  const token = header.replace('Bearer ', '')
  const userId = tokens.get(token)
  if (!userId) {
    return res.status(401).json({ message: 'Please log in again.' })
  }
  const user = await User.findById(userId)
  if (!user) {
    return res.status(401).json({ message: 'User no longer exists.' })
  }
  req.user = user
  req.token = token
  next()
}

// Usage: router.post('/', requireAuth, requireRole('coordinator'), handler)
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have access to this.' })
    }
    next()
  }
}
