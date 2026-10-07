// Builds everything the Cloudflare deploy needs, without touching the team's own files:
//   server/.cf/        a copy of the server's routes, models and utils, with the Cloudflare login file swapped in
//   cloudflare/pages/site/   the website (client/dist built for the web link) plus the front-door worker
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const server = join(root, 'server')
const out = join(server, '.cf')

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
for (const folder of ['routes', 'middleware', 'models', 'utils']) cpSync(join(server, folder), join(out, folder), { recursive: true })
cpSync(join(here, 'auth.stateless.js'), join(out, 'middleware', 'auth.js'))
cpSync(join(here, 'worker.js'), join(out, 'worker.js'))
cpSync(join(here, 'db-string.js'), join(out, 'db-string.js'))
cpSync(join(here, 'per-request-db.js'), join(out, 'per-request-db.js'))
console.log('API copy ready in server/.cf')

// The website talks to "/api" on its own address; the front door forwards that to the API.
execFileSync('pnpm', ['exec', 'vite', 'build'], { cwd: join(root, 'client'), stdio: 'inherit', shell: true, env: { ...process.env, VITE_API_URL: '/api' } })
const site = join(here, 'pages', 'site')
rmSync(site, { recursive: true, force: true })
cpSync(join(root, 'client', 'dist'), site, { recursive: true })
writeFileSync(join(site, '_worker.js'), readFileSync(join(here, 'pages', 'site-worker.js')))
console.log('website ready in cloudflare/pages/site')
