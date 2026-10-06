// =============================================================
// Login tokens for the Cloudflare build ONLY (the normal server keeps middleware/auth.js).
// -------------------------------------------------------------
// The normal server remembers logins in memory. Cloudflare runs many short-lived copies of the server, so a memory
// list would forget people at random. Here the token itself proves who you are: it holds the user id and an expiry,
// signed with a key made from the database string (which only the server knows). Same exports as middleware/auth.js.
// =============================================================
import crypto from 'node:crypto'
import { User } from '../models/index.js'
import { dbString } from '../db-string.js'

const WEEK = 7 * 24 * 60 * 60 * 1000

const key = () => crypto.createHash('sha256').update('carebridge-token-key:' + dbString()).digest()
const sign = (payload) => crypto.createHmac('sha256', key()).update(payload).digest('base64url')

export function issueToken(userId) {
  const payload = Buffer.from(JSON.stringify({ u: String(userId), e: Date.now() + WEEK })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

// Tokens cannot be taken back; logging out just makes the browser forget it.
export function revokeToken() {}

function userIdFromToken(token) {
  const [payload, signature] = String(token).split('.')
  if (!payload || !signature) return null
  const expected = Buffer.from(sign(payload))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null
  try {
    const { u, e } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return e > Date.now() ? u : null
  } catch {
    return null
  }
}

export async function requireAuth(req, res, next) {
  const header = req.header('Authorization') || ''
  const token = header.replace('Bearer ', '')
  const userId = userIdFromToken(token)
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

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have access to this.' })
    }
    next()
  }
}
