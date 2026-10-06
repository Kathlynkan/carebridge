// Chat messages between parents and volunteers about one child.   Owner: Kat
import mongoose from 'mongoose'
import { newId, jsonOptions, nowIso } from './helpers.js'

const messageSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => newId('m') },
    childId: { type: String, required: true, index: true },
    fromId: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    sentAt: { type: String, default: nowIso },
    readBy: [String], // user ids who have read it
  },
  { toJSON: jsonOptions },
)

export default mongoose.model('Message', messageSchema)
