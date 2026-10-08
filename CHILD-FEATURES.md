# Child dashboard: "My Pirate Adventure"

A cheat sheet for explaining this feature in the presentation. Everything on this page was written to be simple, and every file has plain-English comments at the top and next to each part.

## The idea in one minute

> Every child wants to become **King of the Pirates**.
> They earn **berries** (฿, the pirate money) by finishing quests, which are their homework.
> More berries means a higher pirate rank. The last rank is King of the Pirates.

A quest earns berries in two steps, so a child can't just click "done" to get rich:

1. The **child** presses **DONE!**. The quest becomes *handed in* and waits.
2. The **volunteer** (the child's "Captain") checks it and presses **Check & pay**. Now the berries are paid.

## What the child sees

| Part of the page | What it is |
|---|---|
| WANTED poster | The child's avatar, name and berries, like a pirate bounty poster |
| Rank and goal | The current rank, and "collect ฿600 to become King of the Pirates" |
| The road to becoming King of the Pirates | The 8 ranks in a row. Each circle has an icon that says what the rank does (a crate for the Stowaway, a bucket for the Cabin Boy, tools for the Deckhand, a flag, a compass, binoculars, a medal, and a gem for the King), with the berries needed under the name. The stops the child has reached are bright, and a "YOU" label shows where they are |
| Quests | One card per quest. Each shows DONE!, WAITING (for the Captain) or PAID |
| Pirate badges | 5 medals. Locked ones show a lock and `???` |
| Bounty Board | The leaderboard: top 10 by berries, first names only |
| DONE! message | A speech panel at the top says the quest was handed in and how many berries are on the way |

## The 8 ranks

| Rank | Berries needed |
|---|---|
| Stowaway | ฿0 |
| Cabin Boy | ฿40 |
| Deckhand | ฿100 |
| Rookie Pirate | ฿180 |
| Navigator | ฿270 |
| First Mate | ฿380 |
| Captain | ฿490 |
| **King of the Pirates** | **฿600** |

## Where the code is

```
client/src/
  utils/gamification.js          the RULES: ranks, berries, badges (plain JavaScript, no Vue)
  utils/__tests__/gamification.spec.js   tests for the rules
  views/child/ChildHomeView.vue  the dashboard page
  views/child/LeaderboardView.vue  the Bounty Board page
  components/HomeworkQuestCard.vue   the plain quest card for volunteers and parents (the child page writes its own cards)
  assets/pirate.css              the pirate look (only the child pages use it)

server/routes/
  homework.js                    DONE! (submit), Check & pay (verify), and the Bounty Board (leaderboard)
  progress.js                    numbers per topic (the child page does not use it, it is kept for the charts)
```

## How the data flows

```
Child presses DONE!
   -> browser:  PUT /homework/:id/submit
   -> server:   quest status 'assigned' becomes 'submitted'        (no berries yet)

Volunteer presses "Check & pay" on the child's profile
   -> browser:  PUT /homework/:id/verify
   -> server:   status 'submitted' becomes 'verified'
                and the quest's berries are added to the child (child.points)

Child opens the dashboard
   -> browser:  GET /children/:id, then GET /homework
   -> browser works out the rank and badges with utils/gamification.js
```

## What it is built with

Only Vue, CSS and basic JavaScript (the same things we learned in class):

- **Vue:** `ref`, `computed`, `onMounted`, props, `v-for`, `v-if`, and `:class` / `:style`.
- **JavaScript:** plain functions, `for` loops, `if` statements, and `async` / `await` with axios (like the Week 5 code).
- **CSS:** colours, borders, `position: absolute`. No animations, no shadows, no tilted boxes and no clip-path.
- **Icons:** Bootstrap Icons, the same ones the nav bar uses.
- **No extra components on the child pages.** Each child page is one file written with plain HTML tags (`div`, `h2`, `button`), so everything you need to explain is in that one file.
- **Server:** Express and Mongoose with `find`, `findById` and `save`.

## Good things to say about the design

- **The rules are in one small file** (`gamification.js`) with no Vue in it. To change a rank or the berries needed, you change one number there.
- **Berries can't be paid twice.** The server only checks a quest if its status is still "handed in", so pressing the button again does nothing.
- **Children's privacy.** The Bounty Board only sends first names, avatars and numbers, never ids or surnames.
- **Only the right people can act.** A child can only hand in their own quests. Only the child's own volunteer (or a coordinator) can check a quest.
- **Works on a phone.** The road shrinks to fit, and the lettering on the wanted poster scales with the poster, so nothing spills out or scrolls sideways.
- **Kind to people who dislike motion.** If a device asks for reduced motion, the animations stop.

## Questions the teachers might ask

- *Why are berries only paid after the volunteer checks?* So a child can't earn them by just pressing a button, and the volunteer stays involved.
- *Where are the berries stored?* In the database, in `child.points`. The word "berries" is only what the child sees.
- *How do you decide the rank?* `rankFor()` in `gamification.js` loops through the ranks and picks the highest one whose berries number the child has reached.
- *What if the server says the quest was already handed in?* The page shows the reason in the speech bubble and reloads the quests.

## Running it on your computer

Use your own database name in `server/config.env`, then:

```bash
pnpm seed          # demo data (this wipes that database)
pnpm dev:server    # the API, in one terminal
pnpm dev:client    # the website, in another terminal
```

Demo logins (password `password123`): `child@carebridge.sg` is the child, and `volunteer@carebridge.sg` checks quests.

## Adding a picture to a wanted poster

A child can have an optional picture on their poster (the demo child **Luffy** uses `/photos/luffy.png`).

1. Save the picture as `client/public/photos/luffy.png`.
2. That's all. The poster and the Bounty Board show it automatically. If the file is missing, they show the child's emoji instead, so nothing breaks.

How it works: each child has an optional `photo` field (a path like `/photos/luffy.png`, set in `server/data/seed.json`). The pages show an `<img>` when there is a photo, and the emoji otherwise.

Please only use pictures of **made-up characters**. The app is designed to keep photos of real children out (see the privacy rules in the README). Picture files in `client/public/photos/` are git-ignored on purpose, so they are never pushed to the public repo.
