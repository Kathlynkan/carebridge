# How we work together (Git workflow)

## First time

```bash
git clone https://github.com/<owner>/carebridge.git
cd carebridge
# then follow "Set up and run" in README.md
```

## Every time you start working

```bash
git checkout main
git pull                         # get everyone's latest work
git checkout -b feat/<yourname>-<feature>   # e.g. feat/ningxuan-session-form
```

Already have a branch? Bring it up to date with `main`:

```bash
git checkout feat/ningxuan-session-form
git merge main
```

## Saving and sharing your work

```bash
git add .
git commit -m "Session form: save to POST /sessions"
git push -u origin feat/ningxuan-session-form
```

Then on GitHub, open a **Pull Request** into `main`:

- Write what you built and how to test it (which demo account, which page).
- **One teammate reviews**, then **Kai Sen merges**.
- Before you ask for a merge, run `pnpm test:e2e` and `pnpm lint` in `client/`.

## Rules

1. **Never push directly to `main`.** Kai Sen: turn on branch protection under Settings → Branches.
2. **Stay in your own files** (see WORKLOAD.md). To change a shared file (`router/index.js`, `utils/constants.js`, `assets/main.css`, `server/data/seed.json`, `server/server.js`), keep it small and tell the group chat.
3. **Never commit secrets.** `config.env` and `.env` are git-ignored. Share API keys privately.
4. **Don't commit** `node_modules/` or `config.env` (both are git-ignored). Use **your own database name** in `DB=` so your `pnpm seed` doesn't reset teammates' data.
5. **Small, frequent commits** with clear messages. Your commit history is evidence of your individual contribution.
6. **Merge conflict?** Don't panic and don't delete other people's code. Open the file, keep both changes where it makes sense, and ask the owner of the other change if unsure.

## Naming

- Branches: `feat/<name>-<feature>`, `fix/<name>-<bug>`
- Vue components: `PascalCase.vue`. Pages live in `views/` (they have a URL), reusable pieces live in `components/` (Week 6 rule of thumb).
- Test hooks: `data-test="kebab-case-name"` on anything an E2E test clicks or checks.
