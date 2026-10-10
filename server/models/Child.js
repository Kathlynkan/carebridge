// A child enrolled at the centre.   Owner: Kai Sen (CRUD), Yu Xuan (followUp, volunteerIds)
import mongoose from 'mongoose'
import { newId, jsonOptions } from './helpers.js'

const childSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => newId('c') },
    name: { type: String, required: true, trim: true },
    level: { type: String, required: true }, // P1 - P6
    school: String,
    parentId: String, // -> User (role parent)
    volunteerIds: [String], // -> Users (role volunteer) assigned to this child
    needs: [String], // skills the child needs help with (matchmaking)
    points: { type: Number, default: 0 }, // gamification (Jachin)
    avatar: { type: String, default: '🙂' },
    followUp: { type: Boolean, default: false }, // flagged by coordinator (Yu Xuan)
  },
  { toJSON: jsonOptions },
)

export default mongoose.model('Child', childSchema)
