// Finds the MongoDB connection string among the Worker's secrets. It is normally the secret named DB, but any secret
// whose value is a mongodb:// or mongodb+srv:// address works, and a pasted "DB=" in front is ignored.
const clean = (value) => String(value ?? '').trim().replace(/^DB=/, '').replace(/^["']|["']$/g, '')
const looksRight = (value) => /^mongodb(\+srv)?:\/\//.test(value)

export function dbString() {
  const named = clean(process.env.DB)
  if (looksRight(named)) return named
  for (const value of Object.values(process.env)) {
    const candidate = clean(value)
    if (looksRight(candidate)) return candidate
  }
  return ''
}
