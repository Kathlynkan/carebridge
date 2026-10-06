// =============================================================
// /handover  - AI handover summary (EXTERNAL API requirement)   Owner: Yuqi
// -------------------------------------------------------------
// The client calls OUR server, and our server calls the LLM API.
// This keeps the API key secret (never put API keys in Vue code!).
//
//   Vue (axios) --POST /handover/:childId--> Express --axios--> Gemini API
//
// The fallback summary below already works without any API key, so the
// rest of the team can build their pages while Yuqi works on the AI part.
//
// TODO (Yuqi):
//   [ ] Write the prompt in buildPrompt() (role, format, last N sessions)
//   [ ] Call Gemini in callLLM() with axios (docs: https://ai.google.dev/api)
//   [ ] Ask for JSON output and parse it safely (try/catch -> fallback)
//   [ ] Cache the summary per child until a new session is added (save API quota)
//   [ ] audience = 'parent' -> friendly wording for Kat's parent page
// =============================================================
import { Router } from 'express'
import axios from 'axios'
import { Child, Session } from '../models/index.js'
import { requireAuth } from '../middleware/auth.js'
import { canAccessChild } from '../utils/access.js'

const router = Router()
router.use(requireAuth)

// Works with no API key: builds the handover from the latest session(s)
export function buildFallbackHandover(sessions) {
  if (sessions.length === 0) {
    return {
      continueTopic: 'No sessions yet',
      struggle: '-',
      whatWorked: '-',
      lastResult: '-',
      nextStep: 'Get to know the child and find out what they are working on.',
      source: 'fallback',
    }
  }
  const last = sessions[0]
  // skills that appear in more than one recent session = recurring difficulty
  const counts = {}
  sessions.slice(0, 5).forEach((s) => s.struggles.forEach((k) => (counts[k] = (counts[k] || 0) + 1)))
  const recurring = Object.keys(counts).filter((k) => counts[k] > 1)

  return {
    continueTopic: `${last.subject}: ${last.topic}`,
    struggle: last.struggles.join(', ') || 'None noted',
    whatWorked: last.whatWorked || 'Not recorded',
    lastResult: `${last.correct}/${last.attempted} correct`,
    nextStep: last.nextStep || 'Not recorded',
    recurring,
    source: 'fallback',
  }
}

function buildPrompt(child, sessions, audience) {
  // TODO (Yuqi): improve this prompt
  return `You are helping student-care volunteers hand over a child's learning between sessions.
Audience: ${audience}.
Child: ${child.name}, ${child.level}.
Recent session notes (newest first): ${JSON.stringify(sessions.slice(0, 5).map((s) => s.toJSON()))}
Reply ONLY with JSON: {"continueTopic":"","struggle":"","whatWorked":"","lastResult":"","nextStep":""}`
}

// eslint-disable-next-line no-unused-vars
async function callLLM(prompt) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null // no key -> caller uses the fallback

  // TODO (Yuqi): uncomment + finish. Gemini generateContent REST call:
  // const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  // const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  // const response = await axios.post(
  //   url,
  //   { contents: [{ parts: [{ text: prompt }] }] },
  //   { headers: { 'x-goog-api-key': key } },
  // )
  // const text = response.data.candidates[0].content.parts[0].text
  // return JSON.parse(text)   // <- make this safe!
  void axios
  return null
}

// POST /handover/:childId   body: { audience: 'volunteer' | 'parent' }
router.post('/:childId', async (req, res) => {
  const child = await Child.findById(req.params.childId)
  if (!canAccessChild(req.user, child)) {
    return res.status(403).json({ message: 'You do not have access to this child.' })
  }
  const sessions = await Session.find({ childId: child.id }).sort({ date: -1 }).limit(10)
  const audience = req.body?.audience || 'volunteer'

  try {
    const ai = await callLLM(buildPrompt(child, sessions, audience))
    if (ai) return res.json({ ...ai, source: 'ai' })
  } catch (error) {
    console.error('LLM call failed, using fallback:', error.message)
  }
  res.json(buildFallbackHandover(sessions))
})

export default router
