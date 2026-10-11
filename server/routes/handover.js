// =============================================================
// /handover  - AI handover summary (EXTERNAL API)   Owner: Yuqi
// -------------------------------------------------------------
// The Vue page calls OUR server, and our server calls Gemini.
// This keeps the API key secret (never put API keys in Vue code!).
//
// Vue (axios) --POST /handover/:childId--> Express --axios--> Gemini API
// =============================================================
import { Router } from 'express'
import axios from 'axios'
import { Child, Session, Handover } from '../models/index.js'
import { requireAuth } from '../middleware/auth.js'
import { canAccessChild } from '../utils/access.js'

const router = Router()
router.use(requireAuth) // must be logged in for every route in this file

// Find struggles that appear 2 or more times in the last 5 sessions
export function findRecurring(sessions) {
  const counts = {} // e.g. { 'Mixed numbers': 1, 'Finding common denominators': 2 }

  // only look at the newest 5 sessions
  const lastFive = sessions.slice(0, 5)
  for (const session of lastFive) {
    for (const struggle of session.struggles) {
      if (counts[struggle]) {
        counts[struggle] = counts[struggle] + 1 // seen before -> add 1
      } else {
        counts[struggle] = 1 // first time -> start at 1
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
export function buildFallbackHandover(sessions, audience = 'volunteer') {
  // child has no sessions yet (friendlier message for parents)
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
  // child has no sessions yet (for volunteer)
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
  const last = sessions[0] // newest session (sessions are sorted newest first)

  // parents get a simple version: "6 out of 8 right", and nothing alarming   (Kat)
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

// Write the message (prompt) we send to Gemini
function buildPrompt(child, sessions, audience) {
  // 1. turn the newest 5 sessions into simple lines of text
  let notes = ''
  const lastFive = sessions.slice(0, 5)
  for (const s of lastFive) {
    const date = new Date(s.date).toDateString() // e.g. 'Fri Sep 25 2026'

    let struggles = 'none'
    if (s.struggles.length > 0) {
      struggles = s.struggles.join(', ')
    }

    let whatWorked = 'not recorded'
    if (s.whatWorked) {
      whatWorked = s.whatWorked
    }

    let nextStep = 'not recorded'
    if (s.nextStep) {
      nextStep = s.nextStep
    }

    notes = notes + `- ${date}: ${s.subject} - ${s.topic}. `
    notes = notes + `Score ${s.correct}/${s.attempted}. `
    notes = notes + `Struggled with: ${struggles}. `
    notes = notes + `What worked: ${whatWorked}. `
    notes = notes + `Next step planned: ${nextStep}.\n`
  }

  // 2. struggles that keep coming back 
  let recurringText = 'none'
  const recurring = findRecurring(sessions)
  if (recurring.length > 0) {
    recurringText = recurring.join(', ')
  }

  // 3. how to write prompt: volunteer (teaching notes) or parent (friendly update)
  let style = ''
  if (audience === 'parent') {
    style = `You are writing for the child's PARENT, not a teacher.
Write short, warm, plain sentences. No jargon or abbreviations.
Say "got 6 out of 8 right" instead of "6/8 correct". Say "a bit tricky" instead of "struggled".
Be kind and honest. Mention one thing the child did well.`
  } else {
    style = `You are writing for the NEXT VOLUNTEER, who has never met this child.
Be practical and specific, like a short note from one tutor to another.`
  }

  // 4. put it all together (whole prompt)
  return `You help student-care volunteers hand over a child's learning between sessions.
${style}

Child: ${child.name}, ${child.level}.

Recent session notes (newest first):
${notes}
Struggles that came up more than once: ${recurringText}.

Rules:
- Look at ALL the sessions above, not just the newest one.
- "continueTopic": the topic to work on next session.
- "struggle": the main difficulty. If it happened before, say so and whether it is getting better or worse.
- "whatWorked": the teaching method that helped most. Say if it worked more than once.
- "lastResult": the latest score. If there is an earlier score on the same topic, compare them (e.g. "4/6, up from 3/6").
- "nextStep": one concrete thing to do next session, using what worked before.
- Each field: one sentence, under 25 words.
- Only use facts from the notes. Do not make anything up.

Reply ONLY with JSON in exactly this shape:
{"continueTopic":"","struggle":"","whatWorked":"","lastResult":"","nextStep":""}`
}


// Send the prompt to Gemini and get the answer back as an object.
// Returns null if there is no key or the answer is not valid JSON.
async function callLLM(prompt) {
  const key = process.env.GEMINI_API_KEY // read the key from config.env
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

  // Gemini's answer text is deep inside the response
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

// -------------------------------------------------------------
// POST /handover/:childId
// body: { audience: 'volunteer' or 'parent', refresh: true or false }
// -------------------------------------------------------------
router.post('/:childId', async (req, res) => {
  // get the child from MongoDB
  const child = await Child.findById(req.params.childId)

  if (!canAccessChild(req.user, child)) {
    return res.status(403).json({ message: 'You do not have access to this child.' })
  }

  // get the child's sessions, newest first, at most 10
  const sessions = await Session.find({ childId: child.id }).sort({ date: -1 }).limit(10)

  // who is the summary for? (default: volunteer)
  let audience = 'volunteer'
  if (req.body && req.body.audience) {
    audience = req.body.audience
  }

  // did the user click the refresh button? (then always ask Gemini again)
  let refresh = false
  if (req.body && req.body.refresh === true) {
    refresh = true
  }

  // if a session is added or deleted, this changes -> the saved summary is out of date
  const ids = []
  for (const s of sessions.slice(0, 5)) {
    ids.push(s.id)
  }
  const sessionsKey = ids.join(',')

  // 1. use the saved summary if it is still up to date (no Gemini call)
  if (!refresh) {
    const saved = await Handover.findOne({ childId: child.id, audience: audience })
    if (saved && saved.sessionsKey === sessionsKey) {
      const result = saved.summary
      result.cached = true // so we can tell it came from the database
      return res.json(result)
    }
  }

  // 2. otherwise ask Gemini
  try {
    const prompt = buildPrompt(child, sessions, audience)
    const ai = await callLLM(prompt)

    if (ai) {
      // add our own fields to the AI answer
      ai.recurring = findRecurring(sessions)
      ai.source = 'ai'

      // save it for next time (update the old one, or create it if there is none yet)
      await Handover.findOneAndUpdate(
        { childId: child.id, audience: audience },
        { sessionsKey: sessionsKey, summary: ai, createdAt: new Date().toISOString() },
        { upsert: true },
      )
      return res.json(ai)
    }
  } catch (error) {
    console.error('Gemini call failed, using fallback:', error.message)
  }

  // 3. Gemini didn't work -> send the backup summary (not saved, so we try Gemini again next time)
  const fallback = buildFallbackHandover(sessions, audience)
  res.json(fallback)
})

export default router