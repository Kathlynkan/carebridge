// =============================================================
// CareBridge API as a Cloudflare Worker (Express + Mongoose, the same routes as server/server.js)
// -------------------------------------------------------------
// Differences from running on your own computer:
//   - the database string comes from a Worker secret (named DB; set once with: npx wrangler secret put DB --name carebridge-api)
//   - Cloudflare cannot share one database connection between requests, so each request opens its own connection and
//     closes it afterwards, one request at a time per copy of the Worker
//   - logins use signed tokens (see auth.stateless.js) because memory does not last
// =============================================================
import { httpServerHandler } from 'cloudflare:node'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { dbString } from './db-string.js'

import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import childRoutes from './routes/children.js'
import sessionRoutes from './routes/sessions.js'
import homeworkRoutes from './routes/homework.js'
import messageRoutes from './routes/messages.js'
import handoverRoutes from './routes/handover.js'
import dashboardRoutes from './routes/dashboard.js'
import progressRoutes from './routes/progress.js'
import matchmakingRoutes from './routes/matchmaking.js'

const app = express()
app.use(cors())
app.use(express.json())

// One request at a time: connect, handle it, wait until the answer is sent, disconnect.
let line = Promise.resolve()
app.use((req, res, next) => {
  line = line.catch(() => {}).then(async () => {
    const uri = dbString()
    if (!uri) return res.status(503).json({ message: 'The server has no database set up yet.' })
    try {
      await mongoose.connect(uri, { maxPoolSize: 1, serverSelectionTimeoutMS: 10000 })
    } catch (error) {
      console.error('database connection failed:', error.message)
      return res.status(503).json({ message: 'Could not reach the database. Try again in a moment.' })
    }
    await new Promise((done) => {
      res.once('finish', done)
      res.once('close', done)
      setTimeout(done, 25000) // never let one stuck request block the line
      next()
    })
    await mongoose.disconnect().catch(() => {})
  })
})

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
