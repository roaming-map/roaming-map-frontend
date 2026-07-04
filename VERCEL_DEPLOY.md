# Deploy to Vercel (before adding a custom domain)

## Option A: Vercel Dashboard (recommended)

1. **Push your code to GitHub** (if you haven’t already).
   ```bash
   git add -A && git commit -m "Prepare for Vercel deploy" && git push
   ```

2. **Import the project on Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
   - Click **Add New…** → **Project**.
   - Import the `roaming-map-frontend` repo (or the repo that contains this app).
   - Leave **Framework Preset** as Next.js and **Root Directory** as `.` unless you use a monorepo.

3. **Add environment variables** (same names as in `.env.local`, values from your own env):
   - `DATABASE_URL` – your Neon (or other) Postgres connection string.
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` – Clerk publishable key.
   - `CLERK_SECRET_KEY` – Clerk secret key.

4. Click **Deploy**. Vercel will build and deploy. You’ll get a URL like `https://roaming-map-frontend-xxx.vercel.app`.

5. **Clerk (optional)**  
   In the [Clerk Dashboard](https://dashboard.clerk.com), add your Vercel URL to **Allowed redirect URLs** and **Allowed origins** so sign-in/sign-up work in production.

---

## Option B: Vercel CLI

1. Install and log in:
   ```bash
   npx vercel login
   ```

2. From the project root:
   ```bash
   npx vercel
   ```
   Follow the prompts (link to existing project or create new one). For production:
   ```bash
   npx vercel --prod
   ```

3. Add env vars in the Vercel dashboard (**Project → Settings → Environment Variables**) or via CLI:
   ```bash
   vercel env add DATABASE_URL
   vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   vercel env add CLERK_SECRET_KEY
   ```

---

**Note:** The project uses `next build` (no Turbopack) on Vercel for compatibility. If you prefer Turbopack locally, keep `next build --turbopack` in `package.json` and override with `buildCommand` in `vercel.json` (already set to `next build`).
