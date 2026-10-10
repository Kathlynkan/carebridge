// =============================================================
// CareBridge API as a Cloudflare Worker (Express + Mongoose, the same routes as server/server.js)
// -------------------------------------------------------------
// Differences from running on your own computer:
//   - the database string comes from a Worker secret (named DB; set once with: npx wrangler secret put DB --name carebridge-api)
//   - every request opens its own database connection and closes it afterwards (per-request-db.js)
//   - logins use signed tokens (see auth.stateless.js) because memory does not last
// =============================================================
import { httpServerHandler } from 'cloudflare:node'
import { connectForRequest } from './per-request-db.js' // keep this first: it must load before the models
import express from 'express'
import cors from 'cors'
import { dbString } from './db-string.js'

import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import childRoutes from './routes/children.js'
import sessionRoutes from './routes/sessions.js'
import homeworkRoutes from './routes/homework.js'
import deckRoutes from './routes/decks.js'
import messageRoutes from './routes/messages.js'
import handoverRoutes from './routes/handover.js'
import dashboardRoutes from './routes/dashboard.js'
import progressRoutes from './routes/progress.js'
import matchmakingRoutes from './routes/matchmaking.js'

const app = express()
app.use(cors())
app.use(express.json())

// Every request gets its own database connection (see per-request-db.js).
app.use(connectForRequest(dbString))

app.get('/', (req, res) => {
  res.json({ status: 'ok', app: 'CareBridge API' })
})

app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/children', childRoutes)
app.use('/matchmaking', matchmakingRoutes)
app.use('/dashboard', dashboardRoutes)
app.use('/sessions', sessionRoutes)
app.use('/homework', homeworkRoutes)
app.use('/decks', deckRoutes)
app.use('/handover', handoverRoutes)
app.use('/messages', messageRoutes)
app.use('/progress', progressRoutes)

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: 'Something went wrong on the server.' })
})

app.listen(8000)
export default httpServerHandler({ port: 8000 })
