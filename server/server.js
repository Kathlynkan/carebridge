// =============================================================
// CareBridge API server  (Express + MongoDB/Mongoose, like the IS113 / Week 5 blog-with-mongodb service)
// Run:  pnpm dev   ->  http://localhost:8000
// =============================================================
import express from 'express'
import cors from 'cors'
import { connectDb } from './utils/db.js' // also loads config.env

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
const PORT = process.env.PORT || 8000

app.use(cors({ origin: process.env.CLIENT_URL || true }))
app.use(express.json())

// Health check - handy for deployment platforms and E2E tests
app.get('/', (req, res) => {
  res.json({ status: 'ok', app: 'CareBridge API' })
})

//          URL prefix        Owner
app.use('/auth', authRoutes) // Kai Sen
app.use('/users', userRoutes) // Kai Sen / Yu Xuan
app.use('/children', childRoutes) // Kai Sen
app.use('/matchmaking', matchmakingRoutes) // Yu Xuan
app.use('/dashboard', dashboardRoutes) // Yu Xuan
app.use('/sessions', sessionRoutes) // Ning Xuan
app.use('/homework', homeworkRoutes) // Ning Xuan (assign) + Jachin (complete / rewards)
app.use('/handover', handoverRoutes) // Yuqi
app.use('/messages', messageRoutes) // Kat
app.use('/progress', progressRoutes) // Jachin

// Fallback error handler so the server never crashes on a bad request
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: 'Something went wrong on the server.' })
})

await connectDb()
app.listen(PORT, () => {
  console.log(`CareBridge API running at http://localhost:${PORT}`)
})
