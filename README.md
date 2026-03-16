# Danu — Project Management for Teams

[![CI](https://github.com/Miguel-Bayter/Danu/actions/workflows/ci.yml/badge.svg)](https://github.com/Miguel-Bayter/Danu/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/Tests-92%20passing-brightgreen)](#testing)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org)

> A full-stack SaaS project management app built entirely on the **free tier ($0/month)**.
> Kanban drag & drop · Gantt timeline · Real-time notifications · Team Health Score · Command Palette · PDF reports.

**[🚀 Live Demo](https://danu-eight.vercel.app)** · **[📋 Try it without an account →](https://danu-eight.vercel.app/sign-in)**

---

## Table of Contents

- [Why Danu?](#why-danu)
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Local Setup](#local-setup)
- [Deploy to Vercel](#deploy-to-vercel)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Key Technical Decisions](#key-technical-decisions)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Why Danu?

Most project management tutorials stop at a CRUD app with a simple database. Danu goes further:

- **Real-time collaboration** — two users can drag Kanban cards simultaneously and both see the update instantly, without a page refresh, using Supabase Realtime WebSockets.
- **Production architecture on $0/month** — the entire stack (database, auth, hosting, crons, realtime) runs on free tiers with zero credit card required, proving that production-grade infrastructure doesn't require budget.
- **Layered server architecture** — instead of dumping logic in route handlers, every feature follows a strict `Server Action → Service → Repository → Prisma` chain, making it testable, maintainable, and easy to reason about.

Built as a full-stack portfolio project demonstrating React 19, Next.js 16 App Router, and modern TypeScript best practices in a real product context.

---

## Features

- **Kanban board** — drag & drop tasks across columns with `@dnd-kit`, optimistic updates + real-time sync
- **Timeline / Gantt** — CSS Grid–based chart with 1M / 3M / 6M / All presets, tooltip flip, mobile scroll
- **Team Health Score** — algorithm combining completion rate and overdue penalty, with label and progress bar
- **Real-time notifications** — `TASK_ASSIGNED`, deadline reminders and overdue alerts via Supabase Realtime
- **Command Palette** — `Cmd+K` / `Ctrl+K` global search across all workspaces and projects
- **PDF weekly reports** — export with `jsPDF`, includes metrics, health score and completed/overdue tasks
- **Dark mode** — full system/light/dark toggle via `next-themes`, WCAG AA contrast throughout
- **Workspace invitations** — invite by email, tokenized link with 7-day expiry
- **Demo mode** — click "Try Demo" on sign-in: get an isolated workspace with realistic data, deleted on logout
- **Responsive** — tested at 375 / 768 / 1280px; collapsible sidebar, mobile drawer, auto-close on navigate
- **i18n ready** — `next-intl` for all UI strings (English / Spanish)
- **Full auth** — GitHub OAuth via Auth.js v5, JWT sessions, role system (OWNER → ADMIN → MEMBER → VIEWER)

---

## Screenshots

> **[👉 See it live — no account required](https://danu-eight.vercel.app/sign-in)**
> Click "Probar demo sin cuenta" to get a fully loaded workspace in seconds.

| Kanban Board | Gantt Timeline |
|---|---|
| *Drag & drop tasks across 4 columns with real-time sync* | *CSS Grid Gantt with preset windows and tooltips* |

| Health Score Dashboard | Command Palette |
|---|---|
| *Workspace metrics + team health algorithm* | *Cmd+K global search across workspaces* |

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS v4 + shadcn/ui | 4.x |
| Auth | Auth.js v5 (GitHub OAuth) | 5.x |
| ORM | Prisma | 7.x |
| Database | Supabase (PostgreSQL) | — |
| Realtime | Supabase Realtime | — |
| Drag & Drop | @dnd-kit | latest |
| PDF | jsPDF | latest |
| i18n | next-intl | latest |
| Testing | Vitest + React Testing Library | latest |
| CI/CD | GitHub Actions | — |
| Deploy | Vercel Hobby | — |

---

## Architecture

```
app/                    ← Next.js App Router (pages + API routes)
├── (auth)/sign-in/     ← Sign-in page with GitHub OAuth + demo mode
├── api/cron/           ← Vercel Cron Jobs (due-soon, overdue + demo cleanup)
├── dashboard/[slug]/   ← Workspace pages (Kanban, Timeline, Settings)
└── invite/[token]/     ← Invitation acceptance flow

components/             ← React components (client + server)
├── layout/             ← Shell, sidebar, notifications, theme, command palette
├── project/            ← Project cards, forms
├── task/               ← Kanban board, task sheet, subtasks
└── workspace/          ← Gantt, health score, weekly report

server/                 ← Server-side only — never imported in client components
├── actions/            ← Next.js Server Actions (entry points, auth guard)
├── services/           ← Business logic (pure functions, no HTTP)
└── repositories/       ← Prisma queries (single DB access layer)

lib/                    ← Shared infrastructure
├── auth.ts             ← NextAuth config + demo Credentials provider
├── prisma.ts           ← Prisma client singleton
├── supabase.ts         ← Supabase browser client (Realtime)
└── constants.ts        ← COLOR_OPTIONS, PRIORITY_COLORS, STATUS_ORDER

hooks/                  ← Custom React hooks
├── use-realtime-tasks.ts
└── use-realtime-notifications.ts
```

**Data flow:** `Server Action → Service → Repository → Prisma → Supabase`

---

## Local Setup

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier)
- A [GitHub OAuth App](https://github.com/settings/developers)

### Steps

```bash
# 1. Clone
git clone https://github.com/Miguel-Bayter/Danu.git
cd Danu

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Fill in all variables (see table below)

# 4. Push schema to Supabase
npx prisma db push

# 5. Enable Supabase Realtime (run in Supabase SQL Editor)
ALTER PUBLICATION supabase_realtime ADD TABLE "Task";
ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";

# 6. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase pooler URL + `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Supabase direct URL (for `prisma db push`) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `AUTH_SECRET` | Random secret — `openssl rand -base64 32` |
| `AUTH_GITHUB_ID` | GitHub OAuth App client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App client secret |
| `NEXT_PUBLIC_APP_URL` | App URL (e.g. `http://localhost:3000`) |
| `CRON_SECRET` | Any long random string |

---

## Deploy to Vercel

1. Push repo to GitHub
2. Import in [Vercel](https://vercel.com) → framework preset: **Next.js**
3. Add all 9 environment variables (update `NEXT_PUBLIC_APP_URL` to your Vercel domain)
4. Deploy
5. Update GitHub OAuth App callback URL to `https://your-app.vercel.app/api/auth/callback/github`

Cron jobs are configured in `vercel.json` and run automatically on Vercel Hobby:
- `9:00 UTC` — deadline reminders (tasks due in 24h)
- `8:00 UTC` — overdue alerts + demo user cleanup

> **Keep Supabase active:** Set up [UptimeRobot](https://uptimerobot.com) (free) to ping `https://your-app.vercel.app/api/health` every 5 minutes. Prevents Supabase from pausing after 7 days of inactivity on the free tier.

---

## Testing

```bash
# Run all tests
npm run test:run

# Watch mode (development)
npm test
```

**92 tests · 9 files · 100% passing**

| File | Tests | What it covers |
|---|---|---|
| `health-score.test.ts` | 21 | Score algorithm, `classifyScore`, `healthScoreLabel` |
| `workspace-service.test.ts` | 19 | `slugify`, `validateWorkspaceName`, role hierarchy |
| `gantt-range.test.ts` | 14 | `computeRange`, `applyPreset`, `getBarBounds` clamping |
| `constants.test.ts` | 8 | `getGradientClass`, priority colors, status order |
| `project-card.test.tsx` | 10 | Name, counts, dates, links, context menu, delete confirm |
| `gantt-chart.test.tsx` | 5 | Empty state, back link, workspace name, dated projects |
| `gantt-calculations.test.ts` | 5 | `toPct`, `getBarBounds` positioning math |
| `date-validation.test.ts` | 5 | `getMinDate`, `isDueDateValid` |
| `dashboard-shell.test.tsx` | 5 | Render, hamburger, mobile overlay |

CI runs on every push: `typecheck → lint → test → build`

---

## Troubleshooting

**`prisma db push` fails with connection error**
- Make sure `DIRECT_URL` points to the direct connection (port `5432`), not the pooler
- `DATABASE_URL` uses port `6543` with `?pgbouncer=true` — only for the app, not migrations

**Supabase connection times out in production**
- Verify `DATABASE_URL` includes `?pgbouncer=true&connection_limit=1`
- Set up UptimeRobot to ping `/api/health` every 5 min to prevent Supabase from pausing

**GitHub OAuth callback error**
- Check that the callback URL in GitHub matches exactly: `https://your-domain/api/auth/callback/github`
- Trailing slash matters — no slash at the end

**Real-time not working**
- Run the SQL to add tables to the Realtime publication (see setup step 5)
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

**Demo button redirects to sign-in again**
- The Credentials provider requires `AUTH_SECRET` to be set
- Check Vercel logs for `[auth] error` messages

---

## Key Technical Decisions

| Decision | Why |
|---|---|
| Auth.js v5 instead of Clerk | Open source, no account required, no credit card |
| GitHub OAuth instead of Google | Simpler for developer portfolio audience |
| JWT sessions instead of database sessions | Edge runtime compatibility (`proxy.ts`) |
| Vercel Cron Jobs instead of Inngest | No extra account, included in Hobby plan |
| Supabase Storage instead of Uploadthing | Already included in Supabase, no extra account |
| CSS Grid for Gantt | `gantt-task-react` is incompatible with React 19 |
| Prisma 7 + `prisma.config.ts` | Breaking change: `url`/`directUrl` moved out of schema |
| Layered `server/` architecture | Separation of concerns: actions → services → repositories |
| Ephemeral demo users | Each visitor gets an isolated workspace, deleted on logout — no shared state |

---

## Roadmap

- [ ] Mobile app (React Native + Expo)
- [ ] Slack / GitHub integrations
- [ ] AI-powered task suggestions
- [ ] Time tracking per task
- [ ] Advanced analytics and burndown charts
- [ ] Email notifications (Resend integration ready)
- [ ] Public project boards (shareable read-only links)

---

## Contributing

This is a portfolio project, but contributions, bug reports and suggestions are welcome.

1. Fork the repo
2. Create your branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push and open a Pull Request

Please make sure `npm run test:run` and `npm run typecheck` pass before opening a PR.

---

## License

MIT © [Miguel Bayter](https://github.com/Miguel-Bayter)
