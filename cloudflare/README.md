# Deploying CareBridge on Cloudflare

This folder puts the whole app on one web link (`https://carebridge-wad2g4.pages.dev`) without any other host. It only adds files: nothing in `server/` or `client/` is changed.

## How it fits together

```
browser -> carebridge-wad2g4.pages.dev
             |- the website (client/dist)
             |- /api/...  -> Worker "carebridge-api"  -> MongoDB Atlas
```

- `worker.js` runs the same Express routes as `server/server.js` inside a Cloudflare Worker.
- `auth.stateless.js` replaces `server/middleware/auth.js` **in the Cloudflare build only**. The normal server remembers logins in memory, which does not work on Cloudflare (many short-lived copies of the server), so here the login token carries the user id and an expiry, signed with a key made from the database string. Tokens last 7 days; logging out only clears the browser.
- Cloudflare cannot share one database connection between requests, so each request opens its own and closes it afterwards, one at a time. Fine for a demo; a bit slower than running locally.
- `pages/site-worker.js` is the front door: `/api/...` goes to the API Worker (with `/api` removed), everything else is the website.

## First-time setup

1. `npx wrangler login`
2. In MongoDB Atlas, Network Access: allow `0.0.0.0/0` (Cloudflare's addresses change).
3. Give the API Worker its database (use a deployed database name such as `carebridge`, not your own dev database):
   ```bash
   npx wrangler secret put DB --name carebridge-api   # any secret name works if its value is a mongodb:// address
   ```
4. Load the demo data once from your own computer (this wipes that database): put the same string in `server/config.env` and run `pnpm seed`.
5. Create the web link once: `npx wrangler pages project create carebridge-wad2g4 --production-branch main` (if wrangler says to use `--force`, add it, and run it from a folder that has no `wrangler.toml`).

## Deploying (and redeploying)

From the repo root:

```bash
node cloudflare/build.mjs                                   # copies the server code to server/.cf and builds the website
cd server && npx wrangler deploy -c wrangler.cloudflare.toml
cd ../cloudflare/pages && npx wrangler pages deploy site --project-name carebridge-wad2g4 --branch main
```

Never put the database string in a file in this repo. It lives only in the Worker secret (and in your own `server/config.env`, which is git-ignored).
