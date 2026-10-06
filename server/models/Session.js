// One tutoring session record - the core of the app.   Owner: Ning Xuan
import mongoose from 'mongoose'
import { newId, jsonOptions } from './helpers.js'

const sessionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => newId('s') },
    childId: { type: String, required: true, index: true },
    volunteerId: { type: String, required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    subject: { type: String, required: true },
    topic: { type: String, required: true, trim: true },
    attempted: { type: Number, default: 0, min: 0 },
    correct: { type: Number, default: 0, min: 0 },
    struggles: [String],
    whatWorked: String,
    nextStep: String,
    mood: { type: String, enum: ['happy', 'okay', 'tired', 'frustrated'], default: 'okay' },
    notes: String,
  },
  { toJSON: jsonOptions },
)

// TODO (Ning Xuan): also check correct <= attempted (custom validator or in the route)

export default mongoose.model('Session', sessionSchema)
