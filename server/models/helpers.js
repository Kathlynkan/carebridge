// Shared bits for every Mongoose model.
import crypto from 'node:crypto'

// Short readable ids like "s_3f9a1c2b" instead of Mongo's default ObjectId.
// This keeps the demo ids from seed.json (c_1, u_vol1, ...) working in the
// Vue app and the E2E tests (e.g. /children/c_1).
export function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(4).toString('hex')}`
}

// What the client receives when a document is sent with res.json(doc):
//   _id  -> id        (the Vue code uses `.id` everywhere)
//   __v and password are removed
export const jsonOptions = {
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret._id
    delete ret._id
    delete ret.password
    return ret
  },
}

// Dates are stored as ISO strings ("2026-10-06" or "2026-10-06T09:40:00.000Z")
// so they sort correctly and look the same as before in the client.
export const nowIso = () => new Date().toISOString()
