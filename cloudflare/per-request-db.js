// =============================================================
// A database connection for each request (Cloudflare build only)
// -------------------------------------------------------------
// Cloudflare cannot share work between requests, so one shared connection (or a queue) makes the server hang when
// several requests arrive together, which a page load always does. Instead every request opens its own connection and
// closes it when the answer has been sent, and nothing is shared.
//
// The team's models are made with mongoose.model(...) on the one default connection. Import this file BEFORE the
// models: it replaces mongoose.model so that "User", "Child" and so on look themselves up on the CURRENT request's
// connection. The routes use the models exactly as before (User.find(...), User.create(...), new User(...)).
// =============================================================
import { AsyncLocalStorage } from 'node:async_hooks'
import mongoose from 'mongoose'

const current = new AsyncLocalStorage() // holds the connection of the request being handled
const schemas = new Map()

mongoose.model = (name, schema) => {
  schemas.set(name, schema)
  const real = () => {
    const connection = current.getStore()?.connection
    if (!connection) throw new Error('No database connection for this request.')
    return connection.models[name] || connection.model(name, schemas.get(name))
  }
  return new Proxy(function Model() {}, {
    get(_, property) {
      const model = real()
      const value = model[property]
      return typeof value === 'function' ? value.bind(model) : value
    },
    construct(_, args) {
      return new (real())(...args)
    },
  })
}

// Opens a connection, trying a second time if the first attempt does not get through (an occasional hiccup).
async function open(uri) {
  const options = { maxPoolSize: 1, serverSelectionTimeoutMS: 4000, autoIndex: false, autoCreate: false }
  // autoIndex / autoCreate off: the indexes already exist (made when the data was loaded), and rebuilding them on
  // every request would be slow.
  try {
    return await mongoose.createConnection(uri, options).asPromise()
  } catch (firstError) {
    console.error('database connection failed once, retrying:', firstError.message)
    return await mongoose.createConnection(uri, options).asPromise()
  }
}

// Express middleware: open this request's connection, run the rest of the request inside it, close it afterwards.
export function connectForRequest(getUri) {
  return (req, res, next) => {
    const uri = getUri()
    if (!uri) return res.status(503).json({ message: 'The server has no database set up yet.' })
    open(uri)
      .then((connection) => {
        const close = () => connection.close().catch(() => {})
        res.once('finish', close)
        res.once('close', close)
        current.run({ connection }, () => next())
      })
      .catch((error) => {
        console.error('database connection failed:', error.message)
        res.status(503).json({ message: 'Could not reach the database. Try again in a moment.' })
      })
  }
}
