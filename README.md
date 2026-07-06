# Roaming Map

A travel Q&A app for Sri Lanka. Post questions about transport, food, places to stay, and things to do—tagged by destination and category—and get answers from other travelers in one feed.

Built with Next.js, PostgreSQL (Neon), and Clerk. The home page has a collapsible ask box, server-side filters, and infinite scroll. On mobile, tapping a question opens a bottom sheet; on desktop there's also a full detail page at `/questions/[id]`.

## Why I Built This

I kept seeing the same Sri Lanka travel questions scattered across Reddit threads and Facebook groups—often with no clear answer, or buried under unrelated replies. I wanted something simpler: one feed, organized by place and topic, where replies actually stay with the question.

This project let me work through the full stack—schema design, API routes, auth, and a UI that doesn't fall apart on a phone.

## Screenshots

> 🚧 Screenshots coming soon.

<!-- Add desktop and mobile screenshots here -->

## Features

**Questions**
- Title, body, categories, optional destination (Sri Lanka cities), urgent flag
- Collapsible ask composer on the home page
- Edit/delete your own posts; mark questions as useful (one vote per user)

**Answers**
- Post from the detail page or mobile sheet
- Threaded replies (`parentId`) with collapse/expand
- Helpful votes, edit/delete own answers, sort by helpful or newest

**Feed**
- Cursor-based infinite scroll (server-side)
- Filter by search, category, destination, or "My Questions"
- Sticky search bar pins below the nav after you scroll past the ask composer
- Sidebar: popular destinations and basic community stats

**Auth**
- Clerk sign-in/sign-up; users synced to a local `users` table on first API call
- Owner-only edits and deletes

**UI**
- Mobile bottom nav (Explore, Ask, My Questions)
- Skeleton loaders, empty state when filters match nothing
- Scroll position restored when you go back to the feed from a question

## Tech Stack

**Frontend**
- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS 4, TanStack Query, Clerk components
- Lucide icons, shadcn/ui (`Button`, `Skeleton`)

**Backend**
- Next.js Route Handlers (`src/app/api/`)
- Zod validation, Clerk server auth

**Database**
- PostgreSQL on Neon, Drizzle ORM, `@neondatabase/serverless`

**Deployment**
- Vercel (`vercel.json`, `VERCEL_DEPLOY.md`)

**Dev tools**
- ESLint, Drizzle Kit, tsx (migrations/seed)

## Architecture

Single Next.js repo—the App Router serves pages and API routes.

```
src/
├── app/              # pages + api/
├── components/       # feed, forms, sheets
├── db/schema/        # Drizzle tables
├── hooks/api/        # TanStack Query
├── lib/server/       # current user sync, etc.
└── validations/      # Zod schemas
```

Main tables: `users` (synced from Clerk), `questions`, `categories` + `questions_to_categories`, `answers` (with optional `parent_id`), `question_useful`, `answer_votes`.

Feed filtering and pagination live in `GET /api/questions` (`search`, `category`, `destination`, `my`, `cursor`, `limit`).

## Getting Started

**Prerequisites:** Node 20+, Neon Postgres, Clerk app

```bash
git clone <repository-url>
cd roaming-map-frontend
npm install
```

Copy env vars into `.env.local` (see below), then:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command | Description |
|---------|-------------|
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate migrations |
| `npm run db:push` | Push schema (dev) |
| `npm run db:studio` | Drizzle Studio |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Postgres connection string (Neon) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |

For Vercel, add the same vars in project settings and whitelist your deploy URL in the Clerk dashboard.

## Roadmap

**Done**
- Q&A CRUD, categories, destinations, threaded replies
- Helpful/useful voting, server-side filters, cursor pagination
- Collapsible ask composer, sticky filter bar, mobile answer sheet
- Clerk auth + Postgres user sync, skeletons, empty states
- Vercel config

**In progress**
- Production deploy, README screenshots

**Planned**
- Custom domain
- Verified local badges (`is_verified` column exists, UI not built yet)
- Image attachments, notifications, translation

## Challenges & Learnings

**Pagination** — Started with offset-based loading; new questions kept shifting results between page loads. Switched to cursor pagination on `(createdAt, id)` and encoded the cursor in the API response.

**Clerk + Postgres** — Auth lives in Clerk, but FKs point at our `users` table. Wrapped sync in `getOrCreateCurrentUser()` so protected routes don't each reimplement "find or insert user."

**Threaded replies** — Flat `answers` rows with `parentId`; the client builds a tree and tracks collapsed threads. Sorting (helpful vs newest) runs on root answers only.

**Sticky filters** — Put the search bar *after* the ask composer in the DOM and used `position: sticky`. It only pins once you've scrolled past the ask box, which felt much better than a permanent header.

**Filter state** — Lifted search/category state to the home page so the sticky bar and feed stay in sync. `QuestionsList` still works standalone if you don't pass those props.

## Future Improvements

- Verified contributors (badge + moderation flow)
- Photo attachments on questions
- Notifications
- Sinhala/English translation
- Broader destination support beyond Sri Lanka

## License

MIT License

Copyright (c) 2026 Roaming Map

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
