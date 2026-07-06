# The Write Board

A tiny corkboard app: type your name and a message, pin it, and see everyone
else's notes. Built with Next.js and Upstash Redis, made to deploy on Vercel.

## What's inside

- `app/page.js` — the board UI (composer + sticky notes)
- `app/api/messages/route.js` — API that reads/writes messages to Redis
- `app/layout.js` — page shell and fonts

## 1. Run it locally (optional but recommended first)

You'll need [Node.js 18+](https://nodejs.org) installed.

```bash
npm install
```

Create a free Redis database at https://console.upstash.com (takes ~1 minute,
no credit card). Copy the REST URL and REST token it gives you into a new
file called `.env.local`:

```
UPSTASH_REDIS_REST_URL=your-url-here
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

Then run:

```bash
npm run dev
```

Open http://localhost:3000 — you should see the board.

## 2. Deploy to Vercel

**Option A — via GitHub (recommended)**

1. Create a new GitHub repo and push this folder to it:
   ```bash
   git init
   git add .
   git commit -m "Write board"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/write-board.git
   git push -u origin main
   ```
2. Go to https://vercel.com/new and import that repo.
3. Click "Deploy" (no build settings needed, Next.js is auto-detected).
4. After the first deploy, go to your project → **Storage** tab → **Create
   Database** → choose **Upstash** → **Redis**. Connect it to your project.
   This automatically sets the `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN` environment variables for you.
5. Go to **Deployments** → click the three dots on the latest deployment →
   **Redeploy**, so the new environment variables take effect.
6. Visit your `*.vercel.app` URL — the board is live.

**Option B — via Vercel CLI (no GitHub needed)**

```bash
npm install -g vercel
vercel
```

Follow the prompts to link/create a project, then in the Vercel dashboard
add the Upstash Redis storage as in step 4 above, and run `vercel --prod`
again to pick up the new environment variables.

## Inviting people with a QR code

Click **"Invite others to scan & post"** at the top of the board. It shows a
QR code that links straight to your board's URL — anyone who scans it lands
on the page and can pin their own note right away. There's also a "Copy
link" button if you'd rather share it as text.

The QR code is generated in the browser from whatever URL the page is
running on, so it automatically points to the right place whether you're
testing on `localhost` or viewing the live `*.vercel.app` site — no setup
needed.

## Notes

- The board keeps the most recent 300 messages.
- Names are capped at 40 characters, messages at 500 — feel free to adjust
  the limits in `app/api/messages/route.js`.
- There's no login system — "key" here just means the name someone signs
  their note with, not an account. If you want real accounts or moderation
  (e.g. deleting notes, banning names), let me know and I can add it.
