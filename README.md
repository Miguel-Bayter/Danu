# Danu — Project Management for Teams

[![CI](https://github.com/tu-usuario/danu/actions/workflows/ci.yml/badge.svg)](https://github.com/tu-usuario/danu/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)](https://www.typescriptlang.org)

A full-stack SaaS project management app with Kanban drag & drop, Gantt timeline, real-time notifications, team health score, command palette, and PDF reports — built entirely on the free tier ($0/month).

---

## Features

- **Kanban board** — drag & drop tasks across columns with `@dnd-kit`, optimistic updates + real-time sync via Supabase
- **Timeline / Gantt** — CSS Grid–based chart with 1M / 3M / 6M / All presets, mobile horizontal scroll
- **Team Health Score** — algorithm combining completion rate and overdue penalty, visualized with progress bar
- **Real-time notifications** — `TASK_ASSIGNED`, deadline reminders (Vercel Cron), overdue alerts
- **Command Palette** — `Cmd+K` / `Ctrl+K` global search across workspaces and projects
- **PDF weekly reports** — exported with `jsPDF`, includes metrics, health score, completed and overdue tasks
- **Dark mode** — full system/light/dark toggle via `next-themes`, WCAG AA contrast throughout
- **Workspace invitations** — invite by GitHub username, tokenized link (7-day expiry)
- **Responsive** — tested at 375 / 768 / 1280px; collapsible sidebar, mobile drawer
- **i18n** — `next-intl` for all UI strings (English / Spanish)
- **Full auth** — GitHub OAuth via Auth.js v5, JWT sessions, role system (OWNER → ADMIN → MEMBER → VIEWER)

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
├── api/cron/           ← Vercel Cron Jobs (due-soon, overdue)
├── dashboard/[slug]/   ← Workspace pages
└── invite/[token]/     ← Invitation acceptance

components/             ← React components
├── layout/             ← Shell, sidebar, notifications, theme
├── project/            ← Project cards, forms
├── task/               ← Kanban board, task sheet
└── workspace/          ← Gantt, health score, weekly report

server/                 ← Server-side only (never imported in client components)
├── actions/            ← Next.js Server Actions (entry points, auth guard)
├── services/           ← Business logic (pure functions, no HTTP)
└── repositories/       ← Prisma queries (single DB access layer)

lib/                    ← Shared infrastructure
├── auth.ts             ← requireAuth() helper
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
git clone https://github.com/tu-usuario/danu
cd danu

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Fill in the variables (see table below)

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
| `DATABASE_URL` | Supabase connection string with `?pgbouncer=true` |
| `DIRECT_URL` | Supabase direct connection (for `prisma db push`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `AUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `AUTH_GITHUB_ID` | GitHub OAuth App client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App client secret |
| `NEXT_PUBLIC_APP_URL` | App URL (e.g. `http://localhost:3000`) |
| `CRON_SECRET` | Secret for cron route authorization |

---

## Deploy to Vercel

1. Push repo to GitHub
2. Import in [Vercel](https://vercel.com) — select the repo, framework preset: **Next.js**
3. Add all environment variables from the table above
4. Deploy

Cron jobs are configured in `vercel.json` and run automatically on Vercel Hobby:
- `9:00 UTC` — deadline reminders (tasks due in 24h)
- `8:00 UTC` — overdue alerts

> **Keep Supabase active:** Set up [UptimeRobot](https://uptimerobot.com) (free) to ping `https://your-app.vercel.app/api/health` every 5 minutes. This prevents Supabase from pausing after 7 days of inactivity.

---

## Testing

```bash
# Run all tests (92 tests across 9 files)
npm run test:run

# Watch mode (development)
npm test
```

**Test coverage:**

| File | Tests | What it covers |
|---|---|---|
| `health-score.test.ts` | 21 | Score algorithm, `classifyScore`, `healthScoreLabel` |
| `workspace-service.test.ts` | 19 | `slugify`, `validateWorkspaceName`, role hierarchy |
| `gantt-range.test.ts` | 14 | `computeRange`, `applyPreset`, `getBarBounds` clamping |
| `constants.test.ts` | 8 | `getGradientClass`, priority colors, status order |
| `date-validation.test.ts` | 5 | `getMinDate`, `isDueDateValid` |
| `gantt-calculations.test.ts` | 5 | `toPct`, `getBarBounds` positioning |
| `project-card.test.tsx` | 10 | Name, counts, dates, links, context menu, delete confirm |
| `gantt-chart.test.tsx` | 5 | Empty state, back link, workspace name, dated projects |
| `dashboard-shell.test.tsx` | 3 | Render, hamburger, mobile overlay |

CI runs on every push: `typecheck → lint → test → build`

---

## Key Technical Decisions

| Decision | Why |
|---|---|
| Auth.js v5 instead of Clerk | Open source, no account required, no credit card |
| JWT sessions instead of database sessions | Edge runtime compatibility (`proxy.ts`) |
| Vercel Cron Jobs instead of Inngest | No extra account, included in Hobby plan |
| Supabase Storage instead of Uploadthing | Already included, no extra account |
| CSS Grid for Gantt | `gantt-task-react` is incompatible with React 19 |
| Prisma 7 + `prisma.config.ts` | Breaking change: `url`/`directUrl` moved out of schema |
| Layered architecture in `server/` | Separation of concerns: actions → services → repositories |

---

## License

MIT
