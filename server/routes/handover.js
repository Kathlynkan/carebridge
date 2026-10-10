// =============================================================
// /handover  - AI handover summary (EXTERNAL API requirement)   Owner: Yuqi
// -------------------------------------------------------------
// The Vue page calls OUR server, and our server calls Gemini.
// This keeps the API key secret (never put API keys in Vue code!).
//
//   Vue (axios) --POST /handover/:childId--> Express --axios--> Gemini API
//
// TODO (Yuqi):
//   [x] Call Gemini in callLLM() with axios
//   [x] Ask for JSON output and parse it safely (try/catch -> fallback)
//   [ ] Improve the prompt in buildPrompt()
//   [ ] Cache the summary per child until a new session is added (save API quota)
//   [x] audience = 'parent' -> friendly wording for Kat's parent page
// =============================================================
import { Router } from 'express'
import axios from 'axios'
import { Child, Session } from '../models/index.js'
import { requireAuth } from '../middleware/auth.js'
import { canAccessChild } from '../utils/access.js'

const router = Router()
router.use(requireAuth) // must be logged in for every route in this file

// Find struggles that appear 2 or more times in the last 5 sessions
export function findRecurring(sessions) {
  const counts = {} // e.g. { 'Mixed numbers': 1, 'Finding common denominators': 2 }
  const lastFive = sessions.slice(0, 5)

  for (const session of lastFive) {
    for (const struggle of session.struggles) {
      if (counts[struggle]) {
        counts[struggle] = counts[struggle] + 1 
      } else {
        counts[struggle] = 1 
      }
    }
  }

  // keep the ones that appeared more than once
  const recurring = []
  for (const struggle in counts) {
    if (counts[struggle] > 1) {
      recurring.push(struggle)
    }
  }
  return recurring
}

// Backup summary: used when there is no API key or Gemini fails.
// It just copies from the newest session.
// audience 'parent' = plain, friendly words (no "struggle", no "3/5 correct")
export function buildFallbackHandover(sessions, audience = 'volunteer') {
  // child has no sessions yet
  if (sessions.length === 0 && audience === 'parent') {
    return {
      continueTopic: 'No sessions yet',
      struggle: '-',
      whatWorked: '-',
      lastResult: '-',
      nextStep: 'The volunteer will meet your child soon and find out what they enjoy and need help with.',
      recurring: [],
      source: 'fallback',
    }
  }
  if (sessions.length === 0) {
    return {
      continueTopic: 'No sessions yet',
      struggle: '-',
      whatWorked: '-',
      lastResult: '-',
      nextStep: 'Get to know the child and find out what they are working on.',
      recurring: [],
      source: 'fallback',
    }
  }

  const last = sessions[0]

  // parents get a simple version: "6 out of 8 right", and nothing alarming
  if (audience === 'parent') {
    let tricky = 'Nothing in particular - it went smoothly.'
    if (last.struggles.length > 0) {
      tricky = last.struggles.join(', ')
    }
    let helped = 'The volunteer is still finding out what works best.'
    if (last.whatWorked) {
      helped = last.whatWorked
    }
    let comingUp = 'The volunteer will decide next time.'
    if (last.nextStep) {
      comingUp = last.nextStep
    }
    return {
      continueTopic: `${last.subject}: ${last.topic}`,
      struggle: tricky,
      whatWorked: helped,
      lastResult: `Got ${last.correct} out of ${last.attempted} right`,
      nextStep: comingUp,
      recurring: findRecurring(sessions),
      source: 'fallback',
    }
  }

  let struggle = 'None noted'
  if (last.struggles.length > 0) {
    struggle = last.struggles.join(', ') 
  }

  let whatWorked = 'Not recorded'
  if (last.whatWorked) {
    whatWorked = last.whatWorked
  }

  let nextStep = 'Not recorded'
  if (last.nextStep) {
    nextStep = last.nextStep
  }

  return {
    continueTopic: `${last.subject}: ${last.topic}`,
    struggle: struggle,
    whatWorked: whatWorked,
    lastResult: `${last.correct}/${last.attempted} correct`,
    nextStep: nextStep,
    recurring: findRecurring(sessions),
    source: 'fallback',
  }
}

// Write the message (prompt) to send to Gemini
function buildPrompt(child, sessions, audience) {
  // turn the newest 5 sessions into simple lines of text
  let notes = ''
  const lastFive = sessions.slice(0, 5)
  for (const s of lastFive) {
    notes = notes + `- ${s.date}: ${s.subject} - ${s.topic}. `
    notes = notes + `Score ${s.correct}/${s.attempted}. `
    notes = notes + `Struggled with: ${s.struggles.join(', ')}. `
    notes = notes + `What worked: ${s.whatWorked}. `
    notes = notes + `Next step: ${s.nextStep}\n`
  }

  // for a parent: warm, short, simple words, no teaching jargon, and nothing that sounds like blame
  let wording = ''
  if (audience === 'parent') {
    wording = `
  The reader is the child's PARENT, not a teacher. Write short, warm, plain sentences. No jargon or abbreviations.
  Say "got 6 out of 8 right" instead of "6/8 correct". Say "a bit tricky" instead of "struggled". Be kind and honest.`
  }

  return `You are helping student-care volunteers hand over a child's learning between sessions.
  Audience: ${audience}.${wording}
  Child: ${child.name}, ${child.level}.
  Recent session notes (newest first):
  ${notes}
  Reply ONLY with JSON: {"continueTopic":"","struggle":"","whatWorked":"","lastResult":"","nextStep":""}`
}

// Send the prompt to Gemini and get the answer back as an object.
// Returns null if there is no key or the answer is not valid JSON.
async function callLLM(prompt) {
  // read the key from config.env
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    return null // no key -> router uses the fallback
  }

  let model = 'gemini-3.5-flash-lite'
  if (process.env.GEMINI_MODEL) {
    model = process.env.GEMINI_MODEL
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

  // what we send to Gemini (this shape is required by Google)
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }, // ask for JSON back
  }

  // the key goes in a header (like "Authorization: Bearer token" in our Vue pages)
  const config = {
    headers: { 'x-goog-api-key': key },
  }

  const response = await axios.post(url, body, config)

  // get Gemini's answer text in the response
  let text = response.data.candidates[0].content.parts[0].text

  // sometimes the AI wraps the JSON in ```json ... ``` -> remove it
  text = text.replaceAll('```json', '')
  text = text.replaceAll('```', '')
  text = text.trim()

  // turn the text into an object. If the text is broken, use the fallback.
  try {
    const result = JSON.parse(text)
    return result
  } catch (err) {
    console.error('Gemini did not return valid JSON:', text)
    return null
  }
}


// POST /handover/:childId     body: { audience: 'volunteer' or 'parent' }
router.post('/:childId', async (req, res) => {
  // get the child from MongoDB
  const child = await Child.findById(req.params.childId)

  // check if this user allowed to see this child
  if (!canAccessChild(req.user, child)) {
    return res.status(403).json({ message: 'You do not have access to this child.' })
  }

  // else get the child's sessions, newest first, at most 10
  const sessions = await Session.find({ childId: child.id }).sort({ date: -1 }).limit(10)

  // who is the summary for? (default: volunteer)
  let audience = 'volunteer'
  if (req.body && req.body.audience) {
    audience = req.body.audience
  }

  // 5. try Gemini first
  try {
    const prompt = buildPrompt(child, sessions, audience)
    const ai = await callLLM(prompt)

    if (ai) {
      // add our own fields to the AI answer
      ai.recurring = findRecurring(sessions)
      ai.source = 'ai'
      return res.json(ai)
    }
  } catch (error) {
    console.error('Gemini call failed, using fallback:', error.message)
  }

  // if Gemini didn't work -> send the backup summary
  const fallback = buildFallbackHandover(sessions, audience)
  res.json(fallback)
})

export default router