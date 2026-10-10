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
    // The questions the child answers for this quest. The right answer stays on the server, the child never gets it.
    deckId: String, // the deck the questions came from (the quest keeps its own copy of the questions)
    questions: [{ text: String, answer: String, _id: false }],
    // Becomes true when the child has answered ALL the questions correctly. The child can only hand the quest in after that.
    answersCorrect: { type: Boolean, default: false },
  },
  { toJSON: jsonOptions },
)

export default mongoose.model('Homework', homeworkSchema)
