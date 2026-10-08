# CareBridge — Student Care Handover & Progress Tracking

IS216 Web Application Development II — Group Project

At student care centres, a different volunteer may help the same child each day. Without a proper handover, the next volunteer doesn't know what the child learned, what they struggled with, or which teaching methods worked. CareBridge keeps each child's learning history in one place and uses an LLM API to turn past session notes into a short handover for the next volunteer.

**Core flow:** Child practises → Volunteer records session → App stores history → API summarises handover → Next volunteer continues

> 👉 **Team members: read [WORKLOAD.md](WORKLOAD.md) first.** It says who owns what. Then read [CONTRIBUTING.md](CONTRIBUTING.md) for the git workflow.

- **Deployed app:** _TODO (Kai Sen)_
- **Video:** _TODO_
- **Git repo:** _TODO (must be public)_

---

## Tech stack

| Layer | Tech (as taught in class) |
|---|---|
| Frontend | Vue 3 (`<script setup>`, Composition API), Vue Router, Pinia, Vite, pnpm |
| Styling | Bootstrap 5 + Bootstrap Icons + our own `assets/main.css` design tokens |
| HTTP | Axios (one shared instance in `src/services/api.js`) |
| Backend | Node.js + Express (REST API, same style as the Week 5 blog service) |
| Data store | MongoDB Atlas via Mongoose (models in `server/models/`). Demo data is loaded from `server/data/seed.json` with `pnpm seed`. |
| External API | Google Gemini API (LLM handover summaries), called from the server so the API key stays secret |
| Charts | Chart.js + vue-chartjs |
| Testing | Playwright (end-to-end, desktop + iPhone 6 viewport), Vitest (unit) |

---

## Set up and run (local)

**You need:** Node.js **22.12 or newer** (`node -v`) and pnpm (`npm install -g pnpm`).

Use **two terminals**: one for the API, one for the Vue app.

### Step 0 — MongoDB Atlas (one-time)

The team shares **one free Atlas cluster**, but each member uses **their own database name** for development.
That way `pnpm seed` and the E2E tests (which reset the data) don't wipe each other's work.

**Kai Sen does this once for the team:**
1. Create a free **M0** cluster at https://cloud.mongodb.com. This is the same flow as `mongodb_guide.pptx` from class.
2. **Database Access** → add a database user (username + password). One shared user for the team is fine.
3. **Network Access** → *Add IP Address* → *Allow access from anywhere* (`0.0.0.0/0`). This is needed for the deployed server on Render, and for teammates on different Wi-Fi.
4. **Connect → Drivers** → copy the connection string. Send it to the team **privately**, not in the repo.

**Everyone:** put the string in `server/config.env` as `DB=...`.
- Replace `<password>`.
- Add your own database name after `.net/`, e.g. `...mongodb.net/carebridge_yuqi?retryWrites=true&w=majority`.

MongoDB creates the database the first time you run `pnpm seed`.

### Terminal 1 — API server (http://localhost:8000)

```bash
cd server
pnpm install
cp config.env.example config.env     # Windows: copy config.env.example config.env
#  -> edit config.env and set DB=... (Step 0)
pnpm seed                            # loads the demo data into YOUR database
pnpm dev
```

You should see `Connected to MongoDB database "carebridge_<yourname>"`. Run `pnpm seed` again any time to reset the demo data.

To look at the data, use **Atlas → Browse Collections** or **MongoDB Compass**: `users`, `children`, `sessions`, `homeworks`, `messages`.

To turn on the AI handover, paste a free Gemini key into `server/config.env` (`GEMINI_API_KEY=...`, get one at https://aistudio.google.com/apikey). Without a key the app still works: it falls back to a rule-based summary.

### Terminal 2 — Vue app (http://localhost:5173)

```bash
cd client
pnpm install
pnpm dev
```

Open http://localhost:5173. The URL with `/__devtools__/` opens Vue DevTools.

### Demo accounts (password for all: `password123`)

| Role | Email | Notes |
|---|---|---|
| Volunteer | `volunteer@carebridge.sg` | Aisha — assigned to Luffy, Arjun, Chloe |
| Volunteer | `volunteer2@carebridge.sg` | Daniel — Luffy, Meera, Ryan |
| Volunteer | `volunteer3@carebridge.sg` | Priya — Arjun |
| Coordinator | `coordinator@carebridge.sg` | Sees the whole centre |
| Parent | `parent@carebridge.sg` | Grace — parent of Luffy |
| Parent | `parent2@carebridge.sg` | Ravi — parent of Meera **and** Arjun |
| Child | `child@carebridge.sg` | Luffy |
| Child | `child2@carebridge.sg` | Meera |

The demo data is built to trigger interesting cases:

- Luffy's fractions improve from 1/5 to 4/5, but "common denominators" keeps coming back.
- Chloe has had no session for 11 days.
- Sofia has no volunteer assigned.
- Chloe also has overdue homework.

---

## Testing

```bash
cd client
pnpm test:unit                         # Vitest unit tests (src/**/__tests__)
pnpm exec playwright install chromium  # first time only
pnpm test:e2e                          # Playwright E2E - starts API + Vue for you, re-seeds YOUR database
pnpm exec playwright show-report       # open the HTML report
```

The E2E tests run on two projects: **Desktop Chrome** and **iPhone 6** (responsive check). They use `data-test="..."` attributes as stable selectors.

| Spec | Covers | Owner |
|---|---|---|
| `e2e/auth.spec.js` | Landing page, login for all 4 roles, wrong password, route guards | Kai Sen |
| `e2e/volunteer.spec.js` | Assigned children only, handover + history on profile, open session form | Yuqi / Ning Xuan |
| _add yours_ | | |

---

## Project structure

```
carebridge/
├── WORKLOAD.md            <- who does what
├── CONTRIBUTING.md        <- git workflow
├── server/                <- Express API (port 8000)
│   ├── server.js          <- mounts all routes
│   ├── config.env.example <- copy to config.env (git-ignored)
│   ├── middleware/auth.js <- requireAuth, requireRole
│   ├── models/            <- Mongoose schemas: User, Child, Session, Homework, Message
│   ├── utils/db.js        <- MongoDB connection (DB= in config.env)
│   ├── utils/seed.js      <- `pnpm seed`: reset your database with the demo data
│   ├── utils/access.js    <- who can see which child (+ the same rule as a Mongo filter)
│   ├── data/seed.json     <- demo data
│   └── routes/            <- one file per feature, each with an owner + TODO list
└── client/                <- Vue 3 + Vite app (port 5173)
    ├── e2e/               <- Playwright tests
    └── src/
        ├── main.js        <- Bootstrap, Pinia, Router
        ├── App.vue        <- NavBar + <RouterView />
        ├── router/        <- all routes + role guard
        ├── stores/auth.js <- logged-in user (Pinia + localStorage)
        ├── services/api.js<- shared axios instance (adds the token)
        ├── utils/         <- format, constants, gamification (+ unit tests)
        ├── components/    <- reusable pieces (cards, charts, chat...)
        └── views/         <- one folder per role: auth, volunteer, parent, child, coordinator, shared
```

---

## API reference

All routes except `/auth/signup` and `/auth/login` need `Authorization: Bearer <token>`. The client adds it automatically.

| Method & path | What it does | Status | Owner |
|---|---|---|---|
| `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` | Accounts | ✅ done | Kai Sen |
| `GET /children`, `GET /children/:id` | Children visible to me | ✅ done | Kai Sen |
| `POST / PUT / DELETE /children` | Manage children | ⏳ TODO | Kai Sen |
| `GET /users?role=volunteer`, `GET /users/:id`, `PUT /users/:id` | Volunteers & profiles | ✅ done | Yu Xuan |
| `GET /sessions?childId=`, `GET /sessions/:id` | Session history | ✅ done | Ning Xuan |
| `POST / PUT / DELETE /sessions` | Record / edit / delete | ⏳ TODO | Ning Xuan |
| `GET /homework?childId=` | Homework list | ✅ done | Ning Xuan |
| `POST /homework` | Assign homework | ⏳ TODO | Ning Xuan |
| `PUT /homework/:id/submit`, `PUT /homework/:id/verify`, `GET /homework/leaderboard` | Gamification | ⏳ TODO | Jachin |
| `POST /handover/:childId` | Handover summary (Gemini + fallback) | 🟡 fallback done, AI TODO | Yuqi |
| `GET /messages?childId=` | Conversation | ✅ done | Kat |
| `POST /messages`, `PUT /messages/read`, `GET /messages/unread` | Chat | ⏳ TODO | Kat |
| `GET /dashboard/summary` | KPI numbers | ✅ done | Yu Xuan |
| `GET /dashboard/alerts` | Needs-attention list | ⏳ TODO | Yu Xuan |
| `GET /matchmaking/:childId`, `PUT /matchmaking/:childId/assign` | Skills-based matching | ⏳ TODO | Yu Xuan |
| `GET /progress/:childId` | Chart data | ⏳ TODO | Jachin |

---

## Third-party code & credits

Bootstrap, Bootstrap Icons, Vue, Vue Router, Pinia, Axios, Chart.js, vue-chartjs, Express, Mongoose, Playwright, Vitest (all free/open-source). Fonts: Nunito (Google Fonts); the child pages use Arial and Georgia. The child pages ("Road to Becoming King of the Pirates", berries, Bounty Board) are a fan-inspired nod to the One Piece series and use only emoji and our own CSS, no original artwork. The project skeleton was generated with AI assistance as boilerplate starter code, which the module allows. Each feature is implemented by its owner as listed in WORKLOAD.md.
