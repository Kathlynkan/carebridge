# CareBridge — Workload Split (6 members)

> **One-line pitch:** CareBridge is a continuity and handover system for student-care volunteers. It is **not** an online learning platform.
> The question books stay. CareBridge makes sure that when the helper changes, what we know about the child is not lost.
>
> **Core flow:** Child practises → Volunteer records session → App stores history → API summarises handover → Next volunteer continues

Each member owns **one vertical slice**: their screens (Vue views + components), their backend routes (Express), and their tests.
Owning the whole slice end to end means:

- Everyone writes frontend **and** backend code. The brief requires every member to code.
- Everyone can explain their own feature from button to database in the individual Q&A (20% of the final grade).
- Nobody is blocked waiting for someone else. The skeleton already has working `GET` routes and demo data for every feature.

---

## 1. Who does what (summary)

| # | Member | Module | Screens (views) they own | Backend they own | "Wow" feature for the demo |
|---|--------|--------|--------------------------|------------------|-----------------------------|
| 1 | **Yuqi** | Volunteer A: briefing & AI handover | My Children, Child Profile (pre-session briefing) | `routes/handover.js` | **External LLM API (Gemini)** writes the handover. This covers the required external API. |
| 2 | **Ning Xuan** | Volunteer B: session logging & homework | Record/Edit Session form, Session history, Give Homework form | `routes/sessions.js`, `POST /homework` | The full CRUD that feeds the whole app |
| 3 | **Kat** | Parent portal & messaging | Parent Home, Messages (shared by volunteers, parents and coordinators) | `routes/messages.js` | Parent sees "today at student care" + chats with the volunteer |
| 4 | **Kai Sen** | Coordinator A: accounts, children & platform lead | Landing, Login, Sign up, NavBar, Manage Children | `routes/auth.js`, `routes/children.js`, `middleware/auth.js` | Role-based access (4 roles) + **deployment & integration lead** |
| 5 | **Yu Xuan** | Coordinator B: dashboard & matchmaking | Coordinator Dashboard, Volunteers, Matchmaking | `routes/dashboard.js`, `routes/matchmaking.js`, `routes/users.js` | "Needs attention" alerts + skills-based volunteer matching |
| 6 | **Jachin** | Data visualisation & child gamification | Charts (used on 3 pages), Child "My Quests", Leaderboard | `routes/progress.js`, homework submit/verify/leaderboard | Chart.js progress charts + stars, levels and badges |

**What changed from your first split, and why**

- **Kat** keeps **Parent** and also gets **Messaging**. Parents and volunteers talking is one feature, so one person owns both ends.
- The **Child** screen moves from Kat to **Jachin**. The child page is mostly visual progress (stars, levels, badges), which fits data viz. Data viz alone was the lightest role.
- The two **volunteer** people split by *before the session* (Yuqi: read and brief) and *after the session* (Ning Xuan: record).
- The two **coordinator** people split by *setting up the centre* (Kai Sen: accounts and children) and *watching the centre* (Yu Xuan: dashboard and matching).
- **Kai Sen** is also the **integration lead**: he merges pull requests, keeps `main` working and deploys. He has a lighter feature list so he has time for this.

---

## 2. Detailed scope per member

Each section uses three priority levels:

- **Must (by Progress Pitch).** Something working end to end. The pitch rubric gives 25% to *"a functioning task – backend service / API call / CRUD"*.
- **Should (by final).** The full feature.
- **Stretch.** Only after everything else works.

Every page in the running app shows a yellow **"Owner / to build"** panel (`<TodoPanel>`) listing these items. **Delete all `<TodoPanel>` before submission.**

### 1) Yuqi — Volunteer A: Pre-session briefing & AI handover

**Files:** `views/volunteer/VolunteerHomeView.vue`, `views/volunteer/ChildProfileView.vue`, `components/ChildCard.vue`, `components/HandoverCard.vue`, `server/routes/handover.js`

| Priority | Task |
|---|---|
| Must | Gemini API call in `callLLM()` (server-side, key in `config.env`). Show the AI handover in `HandoverCard` with the "AI summary" badge. |
| Must | Safe fallback: if the API fails or there is no key, use `buildFallbackHandover()` (already written). |
| Should | Prompt design: last 5 sessions → JSON `{continueTopic, struggle, whatWorked, lastResult, nextStep}`. Parse safely. |
| Should | `audience: 'parent'` version in friendly, non-jargon wording (Kat uses this). |
| Should | Cache the summary per child until a new session is added. This saves quota, since graders test about 5–6 times a day. |
| Should | "At a glance" cards on the profile: recent topics, **recurring struggles**, best teaching methods. |
| Should | My Children: search, filter by level, sort by "longest since last session". |
| Stretch | "Today" strip showing who you are seeing today, based on volunteer availability. |

**Tests:** E2E `e2e/volunteer.spec.js` (already started: handover shows, history shows). Unit: test the fallback/recurring-struggle logic.
**Q&A angle:** why the API is called from the server (key secrecy), async/await + try/catch, prompt design, fallback strategy.

### 2) Ning Xuan — Volunteer B: Session logging & homework

**Files:** `views/volunteer/SessionFormView.vue`, `views/volunteer/HomeworkAssignView.vue`, `components/SessionCard.vue`, `server/routes/sessions.js`, `POST /homework` in `server/routes/homework.js`

| Priority | Task |
|---|---|
| Must | `POST /sessions` + submit the form (fields are already bound with `v-model`). After saving, go back to the child profile. The new session should appear and the handover should update. |
| Should | Edit mode: `GET /sessions/:id` → pre-fill → `PUT /sessions/:id`. Delete with a confirm modal → `DELETE /sessions/:id`. |
| Should | Validation on client **and** server: topic required, `correct ≤ attempted`, date not in the future. Use Bootstrap `.is-invalid`. |
| Should | "Struggles" as tags: type + Enter to add, × to remove (the Week 5 list exercise). Quick-pick chips from the child's previous struggles. |
| Should | `POST /homework` + Give Homework form (validation, due date). |
| Stretch | Pre-fill the homework title from the latest session's "next step". |

**Tests:** E2E: record a session → it appears in history. Edit → changes. Delete → removed. Assign homework → it appears on the child's page. Unit: validation function.
**Q&A angle:** v-model modifiers (`.number`, `.trim`), computed validation, REST CRUD verbs, who is allowed to edit (server-side checks).

### 3) Kat — Parent portal & messaging

**Files:** `views/parent/ParentHomeView.vue`, `views/shared/MessagesView.vue`, `components/ChatThread.vue`, `server/routes/messages.js`

| Priority | Task |
|---|---|
| Must | `POST /messages` + send from `ChatThread` (emit `send` → parent view posts → message appears). |
| Should | Parent home: child switcher (the demo parent Ravi Kumar has 2 kids), "Today at student care" card (reuse `HandoverCard` with `audience: 'parent'`), recent session timeline, homework status. |
| Should | Mark as read (`PUT /messages/read`) + unread counts (`GET /messages/unread`). Give the counts to Kai Sen for the navbar badge. |
| Should | Polling every 10 s with `setInterval`, cleared in `onUnmounted`. Auto-scroll to the newest message. |
| Should | Mobile: show the child list **or** the chat, with a back button. |
| Stretch | Quick replies ("Thank you!", "Will remind them"), day separators ("Today", "Yesterday"). |

**Tests:** E2E: parent logs in → sees the latest session. Parent sends a message → volunteer sees it. Unit: group-messages-by-day helper.
**Q&A angle:** props/emit between `ChatThread` and the page, watchers on route params, polling vs. real-time trade-offs, privacy (children cannot see the chat).

### 4) Kai Sen — Accounts, children & platform lead

**Files:** `views/HomeView.vue`, `views/auth/*`, `components/NavBar.vue`, `views/coordinator/ManageChildrenView.vue`, `router/index.js`, `stores/auth.js`, `server/routes/auth.js`, `server/routes/children.js`, `server/middleware/auth.js`, `server/models/User.js`, `server/models/Child.js`, `server/utils/db.js`

| Priority | Task |
|---|---|
| Must | `POST /children` + "Add child" Bootstrap modal on Manage Children. |
| Should | `PUT` / `DELETE /children/:id` (decide what happens to that child's sessions). |
| Should | Hash passwords with `bcryptjs`. Better validation on sign up (email format, password ≥ 8, confirm password). |
| Should | Sign up extras: volunteers pick skills + days, parents enter a **child code** from the centre to link their child. |
| Should | Navbar unread-message badge (using Kat's endpoint). Landing page polish. Remove the demo-account box before submission (keep the accounts in the README). |
| Must | **MongoDB Atlas setup** for the team: one free cluster, one database user, Network Access `0.0.0.0/0`. Share the connection string privately. Everyone uses their own database name for development (see README, Step 0). |
| Should | **Deployment:** API on Render (or similar) with `DB=` pointing at the shared `carebridge` database + Vue on Netlify/Vercel with `VITE_API_URL`. |
| Should | **Integration lead:** review/merge PRs, keep `main` green (run all tests before merging), final README. |
| Stretch | Swap the in-memory tokens for JWT, so logins survive server restarts on Render. |

**Tests:** E2E `e2e/auth.spec.js` (already started: each role lands on the right page, guards). Add: sign up, add child. Unit: auth store.
**Q&A angle:** route guards with `meta.roles`, Pinia store + localStorage, Authorization header, why passwords are hashed, server-side role checks, Mongoose schemas + connection.

### 5) Yu Xuan — Coordinator dashboard & skills-based matchmaking

**Files:** `views/coordinator/CoordinatorDashboardView.vue`, `views/coordinator/ManageVolunteersView.vue`, `views/coordinator/MatchmakingView.vue`, `components/StatCard.vue`, `server/routes/dashboard.js`, `server/routes/matchmaking.js`, `server/routes/users.js`

| Priority | Task |
|---|---|
| Must | `GET /dashboard/alerts`: **no session in 7 days** (Chloe in the demo data) and **unassigned child** (Sofia). Show them in a "Needs attention" table. |
| Should | More alert rules: the same struggle in 3+ of the last 5 sessions (Luffytaro: common denominators), overdue homework. Severity colours + filter by type. Click a row to open the child. |
| Should | "Flag for follow-up" toggle per child (`child.followUp`). |
| Should | Matchmaking: `GET /matchmaking/:childId` → volunteers ranked by score (+2 per matched skill, +1 per shared day, −1 per child already assigned). Show *why* each one matches. `PUT …/assign` to assign or unassign. |
| Should | Volunteers page: edit skills/days with checkboxes → `PUT /users/:id`. Show each volunteer's workload. |
| Stretch | Recent-activity feed across the centre. Export the alert list (CSV). |

**Tests:** E2E: coordinator sees Chloe + Sofia in alerts. Assign a volunteer to Sofia → she disappears from the "unassigned" alerts. Unit: the scoring function + each alert rule (pure functions are easy to test).
**Q&A angle:** turning a business rule into code, computed filters, why scoring is on the server, how the coordinator's actions change what volunteers see.

### 6) Jachin — Data visualisation & child gamification

**Files:** `components/charts/SkillProgressChart.vue`, `components/charts/TopicSummaryChart.vue`, `views/child/ChildHomeView.vue`, `views/child/LeaderboardView.vue`, `components/HomeworkQuestCard.vue`, `utils/gamification.js`, `server/routes/progress.js`, homework submit/verify/leaderboard in `server/routes/homework.js`

| Priority | Task |
|---|---|
| Must | Replace the placeholder in `SkillProgressChart` with a **Chart.js line chart** (`vue-chartjs` is already installed). It appears automatically on the Child Profile and Parent pages. |
| Should | `TopicSummaryChart` as a bar chart coloured by status (needs help / steady / strong). It is used on the profile and on the coordinator dashboard. |
| Should | `GET /progress/:childId`: per-topic accuracy, trend (improving/steady/needs help), recurring struggles. `GET /progress/overview` for Yu Xuan's dashboard. |
| Should | Child "My Quests": "I'm done!" → `PUT /homework/:id/submit`. Volunteer "Verify" → `PUT /homework/:id/verify` awards points. |
| Should | Levels + progress bar (`levelFor`), badge shelf (`earnedBadges`) with locked badges greyed out, celebration animation. |
| Stretch | Leaderboard (first names only). Consider "most improved" so it is fair for weaker students. |

**Tests:** E2E: child marks homework done → status changes. Volunteer verifies → points go up. Unit: `earnedBadges`, `levelFor`, the progress aggregation.
**Q&A angle:** computed properties to reshape data for charts, component props contract (`sessions` in → chart out), responsive charts, motivation design for kids.

---

## 3. Shared rules (everyone)

1. **Your own tests.** At least 2 Playwright E2E tests for your journey + 1 Vitest unit test. Use `data-test="..."` selectors, which the rubric calls "stable selectors". Testing is 10% of the grade.
2. **Your own responsive styling.** Check your pages at iPhone 6 (375 px) and Bootstrap XL in Chrome DevTools. Graders test exactly this range. Use the shared classes and colours in `assets/main.css` (`cb-card`, `badge-soft`, `--cb-primary`) so the app looks like one product.
3. **Loading / error / empty states** on every page that loads data: `<StateMessage>`.
4. **Don't break shared contracts.** These props are used by other people's pages:
   - `SkillProgressChart` / `TopicSummaryChart` take a `sessions` array.
   - `HandoverCard` takes a `handover` object.
   - `ChatThread` emits `send`.

   You may change the inside of a component, but not its props or emits without telling the group.
5. **Shared files** (`router/index.js`, `utils/constants.js`, `assets/main.css`, `server/data/seed.json`, `server/server.js`, `server/models/*`): keep the changes small and say in the group chat when you touch them.
6. **Individual write-up.** Each member writes up their own contribution. The panel uses it for Q&A.
7. **Video (≤ 12 min).** About 1.5 min per person demoing **their** slice in the order of the core flow: Kai Sen (log in, roles) → Yuqi (briefing + AI handover) → Ning Xuan (record session) → Jachin (charts + child quests) → Kat (parent + chat) → Yu Xuan (dashboard + matching). Then about 2 min on tech stack, API, data store and testing.

---

## 4. Timeline

| When | Milestone |
|---|---|
| **This week** | Everyone clones, runs the skeleton, logs in with each demo account and reads their own TodoPanels. Create your feature branch. |
| **Before Week 8 Sunday 22:00** | Every **Must** item works end to end on your branch and is merged into `main`. Progress report submitted. |
| **Week 9 Monday** | Progress Pitch. Each person demos their **Must** item. Rubric: problem/features, design/tech stack, task delegation (this document), a functioning task. |
| **Week 9–10** | **Should** items + your E2E/unit tests. |
| **Week 11** | Feature freeze mid-week. Styling/responsive pass, remove TodoPanels, deploy, full test run, record the video. |
| **Week 12 Friday 09:00** | Submit (zip: slides with video + app links, README, individual write-ups). **No extensions.** Aim to submit Thursday night. |

---

## 5. How the pieces depend on each other

```
Kai Sen (login, roles, children) ─┬─► everyone (you need to log in to see anything)
                                  └─► Yu Xuan (children + volunteers to match)
Ning Xuan (sessions) ─────────────┬─► Yuqi (handover is built from sessions)
                                  ├─► Jachin (charts are built from sessions)
                                  ├─► Kat (parent sees sessions)
                                  └─► Yu Xuan (alerts are built from sessions)
Ning Xuan (assign homework) ──────► Jachin (child completes) ──► Kat (parent sees status)
Yuqi (handover API) ──────────────► Kat (parent-friendly summary)
Jachin (chart components) ────────► Yuqi, Kat, Yu Xuan (drop-in on their pages)
Kat (unread counts) ──────────────► Kai Sen (navbar badge)
```

**Each member owns the Mongoose model their feature writes to.** Ning Xuan owns `Session` and `Homework` (with Jachin), Kat owns `Message`, and Kai Sen owns `User` and `Child`. Adding a field to a model is fine. Renaming or removing one needs a heads-up in the chat.

**Nobody needs to wait.** The demo data in `server/data/seed.json` (loaded into MongoDB with `pnpm seed`) already has 19 sessions, 7 homework, and messages across 6 children. The `GET` endpoints work, and the handover has a working non-AI fallback. Build against the demo data now and connect to each other's `POST` endpoints when they are ready.
