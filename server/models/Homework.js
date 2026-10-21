// Homework "quests".   Owners: Ning Xuan (assign), Jachin (submit / verify / points)
import mongoose from 'mongoose'
import { newId, jsonOptions } from './helpers.js'

const homeworkSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => newId('h') },
    childId: { type: String, required: true, index: true },
    volunteerId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    subject: String,
    details: String,
    dueDate: { type: String, required: true }, // "YYYY-MM-DD"
    points: { type: Number, default: 10 },
    status: { type: String, enum: ['assigned', 'submitted', 'verified'], default: 'assigned' },
    completedAt: { type: String, default: null },
    deckId: String, // the deck the questions came from (the quest keeps its own copy of the questions)
    // The questions copied from the deck. The right answer stays on the server, the child never gets it.
    questions: [{ text: String, answer: String, _id: false }],
  },
  { toJSON: jsonOptions },
)

export default mongoose.model('Homework', homeworkSchema)
