# Roaming Map

Roaming Map is a travel Q&A web app focused on Sri Lanka. Travelers can post destination-specific questions—about transport, food, accommodation, attractions, and similar topics—and browse answers from other users in a single feed.

The app is built as a full-stack Next.js project with a PostgreSQL backend. Authentication is handled by Clerk; questions, answers, categories, and votes are stored in Neon. The home page combines a collapsible ask composer, server-side filtering, and infinite-scroll pagination. On mobile, questions open in a bottom sheet; on larger screens, users can also navigate to a dedicated question detail page.

---

## Why I Built This

Travel advice for Sri Lanka is often scattered across forums, social media, and outdated guides. I wanted a single place where questions are organized by destination and category, where replies stay attached to the original thread, and where useful answers are easy to find again. Roaming Map is my attempt to build that structure end to end—from database schema and API routes through to a mobile-friendly UI.

---

## Screenshots

> 🚧 Screenshots coming soon.

<!-- Add desktop and mobile screenshots here -->

---

## Features

### Questions

- Post a question with a title, body, one or more categories, an optional Sri Lanka destination, and an optional urgent flag
- Collapsible ask composer on the home page (expands when tapped or when a draft exists)
- Edit and delete your own questions
- Mark questions as useful (one vote per authenticated user)
- Urgent questions are visually highlighted in the feed

### Answers

- Reply to questions from the question detail page or the mobile answer sheet
- Threaded replies via `parentId`, with collapsible reply threads
- Mark answers as helpful (per-user voting stored in `answer_votes`)
- Edit and delete your own answers
- Sort answers by helpful count or newest

### Feed and discovery

- Paginated question feed with cursor-based infinite scroll (server-side)
- Filter by search text, category, destination, or “My Questions”
- Sticky search and category bar that pins below the nav after scrolling past the ask composer
- Popular destinations sidebar (derived from question counts in the database)
- Community stats: total questions, answers, and count of users who have posted answers

### Auth and users

- Sign in and sign up via Clerk
- Clerk users are synced to a local `users` table on first authenticated API request
- Owner-only edit/delete for questions and answers

### UI

- Mobile bottom navigation (Explore, Ask, My Questions)
- Loading skeletons for the feed, question detail, and ask panel avatar
- Empty state when filters return no results, with a clear-filters action
- Scroll position restored when returning to the home feed from a question

---

## Tech Stack

### Frontend

- [Next.js 15](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [TanStack Query](https://tanstack.com/query) for data fetching and cache invalidation
- [Clerk](https://clerk.com/) React components for authentication UI
- [Lucide React](https://lucide.dev/) icons
- [shadcn/ui](https://ui.shadcn.com/) primitives (`Button`, `Skeleton`)

### Backend

- Next.js Route Handlers under `src/app/api/`
- [Zod](https://zod.dev/) request validation
- [Clerk](https://clerk.com/) server-side auth (`auth()`, `currentUser()`)

### Database

- [PostgreSQL](https://www.postgresql.org/) on [Neon](https://neon.tech/)
- [Drizzle ORM](https://orm.drizzle.team/) with typed schema and migrations
- [@neondatabase/serverless](https://github.com/neondatabase/serverless) driver

### Deployment

- [Vercel](https://vercel.com/) (see `vercel.json` and `VERCEL_DEPLOY.md`)
- Neon for hosted Postgres

### Development Tools

- [ESLint](https://eslint.org/) with `eslint-config-next`
- [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview) for migrations and schema push
- [tsx](https://github.com/privatenumber/tsx) for migration and seed scripts

---

## Architecture

The application is a single Next.js repo. The App Router serves both the UI and the API.

```
src/
├── app/                    # Pages and API routes
│   ├── page.tsx            # Home feed, ask composer, filters
│   ├── questions/[id]/     # Question detail page
│   └── api/                # REST-style route handlers
├── components/             # UI components (feed, forms, sheets)
├── db/
│   ├── schema/             # Drizzle table definitions
│   └── db.ts               # Neon connection
├── hooks/api/              # TanStack Query hooks
├── lib/server/             # Server-only helpers (e.g. current user sync)
└── validations/            # Zod schemas shared by API routes
```

**Request flow (example: creating a question)**

1. The client submits the form; TanStack Query calls `POST /api/questions`.
2. The route handler validates the body with Zod, resolves the Clerk session, and calls `getOrCreateCurrentUser()` to ensure a row exists in `users`.
3. Drizzle inserts the question and links it to categories via `questions_to_categories`.
4. The mutation invalidates the questions query cache; the feed refetches.

**Data model (simplified)**

- `users` — synced from Clerk (`clerk_id`, name, email)
- `questions` — title, body, destination, `is_urgent`, `useful_count`
- `categories` / `questions_to_categories` — many-to-many categories
- `answers` — content, `question_id`, optional `parent_id` for threads
- `question_useful` — per-user “useful” marks on questions
- `answer_votes` — per-user helpful votes on answers

Filtering and pagination for the feed are done in `GET /api/questions` using query parameters (`search`, `category`, `destination`, `my`, `cursor`, `limit`).

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech/) Postgres database
- A [Clerk](https://clerk.com/) application (publishable and secret keys)

### Installation

```bash
git clone <repository-url>
cd roaming-map-frontend
npm install
```

### Database setup

1. Copy environment variables (see below) into `.env.local`.
2. Run migrations:

```bash
npm run db:migrate
```

3. Seed categories:

```bash
npm run db:seed
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migrations from schema changes |
| `npm run db:push` | Push schema to database (dev) |
| `npm run db:studio` | Open Drizzle Studio |

---

## Environment Variables

Create a `.env.local` file in the project root:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon (or other Postgres) connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key (client) |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key (server) |

For Vercel deployment, add the same variables in the project settings. After deploying, configure your Clerk dashboard with the production URL for redirects and allowed origins.

---

## Roadmap

### ✅ Completed

- Question and answer CRUD with ownership checks
- Category tagging and Sri Lanka destination picker
- Threaded answers with collapse/expand
- Per-user helpful votes on answers and useful marks on questions
- Server-side feed filtering and cursor pagination
- Collapsible ask composer and sticky filter bar
- Mobile bottom sheet for question detail
- Clerk authentication with user sync to Postgres
- Loading skeletons and filter empty states
- Vercel deployment configuration (`vercel.json`, `VERCEL_DEPLOY.md`)

### 🚧 In Progress

- Production deployment on Vercel
- README screenshots

### 📌 Planned

- Custom domain
- Verified local badges (`is_verified` exists on answers schema but is not used in the UI yet)
- Image attachments on questions
- Notifications
- Translation support

---

## Challenges & Learnings

**Cursor pagination on the feed.** Offset pagination breaks down when the list changes between requests. I moved the feed to cursor-based pagination (`createdAt` + `id`) encoded in the API response so “load more” stays consistent as new questions are added.

**Clerk vs. application users.** Clerk handles auth, but foreign keys in Postgres point at a local `users` table. I centralized user creation in `getOrCreateCurrentUser()` so every protected route gets a stable database user id without duplicating sync logic.

**Threaded answers in the UI.** Replies use `parentId` in the database; the client builds a tree from a flat list and tracks which threads are collapsed. Sorting (helpful vs. newest) applies at the root level while keeping reply groups intact.

**Sticky layout without breaking scroll.** The search and filter bar lives after the ask composer in the document flow and uses `position: sticky` so it only pins once the ask panel has scrolled away—rather than occupying the top of the page on initial load.

**Filter state ownership.** Search and category filters are lifted to the home page so the sticky bar and the feed share one source of truth, while `QuestionsList` can still run in an uncontrolled mode when those props are omitted.

---

## Future Improvements

- Add integration or E2E tests for critical flows (post question, reply, vote)
- Use the `is_verified` flag with an admin or moderation workflow for trusted contributors
- Replace `alert()` calls in answer actions with inline toast or modal feedback
- Add rate limiting on write endpoints
- Improve accessibility (focus traps in sheets, aria labels on icon-only buttons)
- Consider real-time updates (e.g. polling or WebSockets) if live reply counts become important

---

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
