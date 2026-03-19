'use client'

import { useState, useMemo } from 'react'
import type { CSSProperties } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, CalendarDays, CalendarOff, Layers, ListTodo, CheckCircle2, AlertCircle, PauseCircle, Info, X } from 'lucide-react'
import Link from 'next/link'
import { APP_LOCALE } from '@/lib/constants'

/* ─────────────────────── Interfaces ─────────────────────── */

interface GanttProject {
  id: string
  name: string
  color: string
  status: string
  startDate: string | null
  endDate: string | null
}

interface GanttTask {
  id: string
  title: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'
  startDate: string | null
  createdAt: string
  dueDate: string | null
  completedAt: string | null
  subtaskCount: number
  projectId: string
  projectName: string
  projectColor: string
  assignee: { id: string; name: string | null; image: string | null } | null
}

export interface GanttChartProps {
  projects: GanttProject[]
  tasks: GanttTask[]
  slug: string
  workspaceName: string
}

type ViewMode = 'projects' | 'tasks'
type RangePreset = '1m' | '3m' | '6m' | 'all'

/* ─────────────────────── Static maps ─────────────────────── */

const PRIORITY_COLOR: Record<string, string> = {
  URGENT: '#ef4444',
  HIGH:   '#f97316',
  MEDIUM: '#6366f1',
  LOW:    '#64748b',
}

/* Tailwind class maps — used where a static class suffices */
const PRIORITY_BG: Record<string, string> = {
  URGENT: 'bg-red-500',
  HIGH:   'bg-orange-500',
  MEDIUM: 'bg-indigo-500',
  LOW:    'bg-slate-500',
}
const PRIORITY_BADGE: Record<string, string> = {
  URGENT: 'bg-red-500/[0.12] text-red-500',
  HIGH:   'bg-orange-500/[0.12] text-orange-500',
  MEDIUM: 'bg-indigo-500/[0.12] text-indigo-500',
  LOW:    'bg-slate-500/[0.12] text-slate-500',
}

const PRIORITY_LABEL: Record<string, string> = {
  URGENT: 'Urgente',
  HIGH:   'Alta',
  MEDIUM: 'Media',
  LOW:    'Baja',
}

const STATUS_LABEL: Record<string, string> = {
  TODO:        'Por hacer',
  IN_PROGRESS: 'En progreso',
  IN_REVIEW:   'En revisión',
  DONE:        'Completado',
}

/* ─────────────────────── Pure helpers ─────────────────────── */

function datePct(d: Date, start: Date, totalMs: number) {
  // Round to 3 decimals to avoid SSR/client hydration mismatch from float precision
  return Math.round(((d.getTime() - start.getTime()) / totalMs) * 100 * 1000) / 1000
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString(APP_LOCALE, { day: 'numeric', month: 'short' })
}

function getDays(start: string, end: string) {
  return Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000))
}

function getProgress(startDate: string, endDate: string, today: Date) {
  const s = new Date(startDate).getTime()
  const e = new Date(endDate).getTime()
  const n = today.getTime()
  if (n <= s) return 0
  if (n >= e) return 100
  return Math.round(((n - s) / (e - s)) * 100)
}

function getStatus(p: GanttProject, today: Date) {
  if (p.status === 'ON_HOLD')
    return { label: 'En pausa', cls: 'bg-slate-500/15 text-slate-500 dark:text-slate-400', pulse: false }
  if (p.status === 'COMPLETED')
    return { label: 'Completado', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', pulse: false }
  if (!p.startDate || !p.endDate)
    return { label: '—', cls: 'bg-muted/50 text-muted-foreground', pulse: false }
  const n = today.getTime()
  const s = new Date(p.startDate).getTime()
  const e = new Date(p.endDate).getTime()
  if (n < s) return { label: 'Próximo',    cls: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',        pulse: false }
  if (n > e) return { label: 'Finalizado', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', pulse: false }
  return       { label: 'En curso',   cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',     pulse: true  }
}

function getBarBounds(start: Date, end: Date, rangeStart: Date, totalMs: number) {
  const left  = Math.max(0, datePct(start, rangeStart, totalMs))
  const right = Math.max(0, 100 - Math.min(100, datePct(end, rangeStart, totalMs)))
  const w     = 100 - left - right
  if (w <= 0) return null
  return { left, width: w }
}

function getInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

/* ─────────────────────── Auto date range ─────────────────────── */

function computeRange(projects: GanttProject[], tasks: GanttTask[], today: Date) {
  const ms: number[] = [today.getTime()]
  for (const p of projects) {
    if (p.startDate) ms.push(new Date(p.startDate).getTime())
    if (p.endDate)   ms.push(new Date(p.endDate).getTime())
  }
  for (const t of tasks) {
    if (t.dueDate) ms.push(new Date(t.dueDate).getTime())
    // Use startDate if available, otherwise createdAt — but cap createdAt lookback
    const barStart = t.startDate ?? t.createdAt
    ms.push(new Date(barStart).getTime())
  }

  const minMs = Math.min(...ms)
  const maxMs = Math.max(...ms)

  // Guard: if somehow we get Infinity/-Infinity
  if (!isFinite(minMs) || !isFinite(maxMs)) {
    const fallback = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const fallbackEnd = new Date(today.getFullYear(), today.getMonth() + 3, 0)
    return { start: fallback, end: fallbackEnd }
  }

  const minD = new Date(minMs)
  const maxD = new Date(maxMs)

  // Pad one month before and two months after — handle year boundaries correctly
  const startY = minD.getFullYear()
  const startM = minD.getMonth() - 1  // can be -1 (Dec of prev year) — Date handles this
  const endY   = maxD.getFullYear()
  const endM   = maxD.getMonth() + 2

  const start = new Date(startY, startM, 1)
  const end   = new Date(endY, endM, 0)  // day 0 = last day of previous month = correct

  // Ensure at least 4 months visible
  const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth()
  if (diffMonths < 4) {
    return { start, end: new Date(start.getFullYear(), start.getMonth() + 4, 0) }
  }

  return { start, end }
}

function applyPreset(preset: RangePreset, today: Date, fullStart: Date, fullEnd: Date) {
  if (preset === 'all') return { start: fullStart, end: fullEnd }
  const months = preset === '1m' ? 1 : preset === '3m' ? 3 : 6
  const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const end   = new Date(today.getFullYear(), today.getMonth() + months, 0)
  return { start, end }
}

/* Tiny inline separator for the detail strip */
function Sep() {
  return <div className="w-px h-3 bg-border/50 shrink-0" />
}

/* ─────────────────────── Component ─────────────────────────── */

export function GanttChart({ projects, tasks, slug, workspaceName }: GanttChartProps) {
  const t = useTranslations('timeline')
  const [hoveredBar, setHoveredBar] = useState<string | null>(null)
  const [tappedBar,  setTappedBar]  = useState<string | null>(null)
  const [viewMode,   setViewMode]   = useState<ViewMode>('projects')
  const [rangePreset, setRangePreset] = useState<RangePreset>('1m')

  const today = useMemo(() => new Date(), [])

  const { start: fullStart, end: fullEnd } = useMemo(
    () => computeRange(projects, tasks, today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects, tasks],
  )

  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => applyPreset(rangePreset, today, fullStart, fullEnd),
    [rangePreset, today, fullStart, fullEnd],
  )

  const totalMs  = rangeEnd.getTime() - rangeStart.getTime()
  const toPct    = (d: Date) => datePct(d, rangeStart, totalMs)
  const todayPct = toPct(today)
  const showToday = todayPct >= 0 && todayPct <= 100

  /* Month descriptors */
  const months = useMemo(() => {
    const result: { label: string; leftPct: number; widthPct: number; even: boolean }[] = []
    let cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1)
    let i = 0
    while (cur <= rangeEnd) {
      const mEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0)
      const l = Math.max(0, toPct(cur))
      const r = Math.min(100, toPct(new Date(mEnd.getTime() + 86400000)))
      const raw = cur.toLocaleDateString(APP_LOCALE, { month: 'long', year: 'numeric' })
      result.push({
        label:    raw.charAt(0).toUpperCase() + raw.slice(1),
        leftPct:  l,
        widthPct: r - l,
        even:     i % 2 === 0,
      })
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
      i++
    }
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart.getTime(), rangeEnd.getTime(), totalMs])

  /* Week marks — every Monday */
  const weekMarks = useMemo(() => {
    const marks: { pct: number; day: string }[] = []
    const c = new Date(rangeStart)
    const dow = c.getDay()
    c.setDate(c.getDate() + (dow === 1 ? 0 : dow === 0 ? 1 : 8 - dow))
    while (c <= rangeEnd) {
      const p = toPct(c)
      if (p > 0 && p < 100)
        marks.push({ pct: p, day: c.toLocaleDateString(APP_LOCALE, { day: 'numeric' }) })
      c.setDate(c.getDate() + 7)
    }
    return marks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart.getTime(), rangeEnd.getTime(), totalMs])

  const datedProjects   = projects.filter((p) => p.startDate && p.endDate)
  const undatedProjects = projects.filter((p) => !p.startDate || !p.endDate)
  const datedTasks      = tasks.filter((t) => t.dueDate)

  const tasksByProject = datedTasks.reduce<Record<string, GanttTask[]>>((acc, task) => {
    if (!acc[task.projectId]) acc[task.projectId] = []
    acc[task.projectId].push(task)
    return acc
  }, {})

  const projectsWithTasks = projects.filter((p) => tasksByProject[p.id]?.length > 0)
  const isEmpty = viewMode === 'projects' ? datedProjects.length === 0 : datedTasks.length === 0

  // Only show priorities that actually exist in current tasks
  const activePriorities = useMemo(() => {
    const seen = new Set(datedTasks.map((t) => t.priority))
    return (['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const).filter((p) => seen.has(p))
  }, [datedTasks])

  const rangeLabel = (() => {
    const s = rangeStart.toLocaleDateString(APP_LOCALE, { month: 'short', year: 'numeric' })
    const e = rangeEnd.toLocaleDateString(APP_LOCALE, { month: 'short', year: 'numeric' })
    return `${s} — ${e}`
  })()

  /* ── Column width: 140px on mobile, 224px on sm+ ── */
  const COL_CLASS = 'w-[110px] sm:w-56 shrink-0 sticky left-0 z-10 gantt-sticky-col'

  /* ── Grid background — inline %s are unavoidable for runtime date math ── */
  function GridBg() {
    return (
      <>
        {/* Month alternating bands */}
        {months.map((m, i) => (
          <div
            key={i}
            className={`absolute inset-y-0 pointer-events-none
                        ${i > 0 ? 'border-l border-border/50' : ''}
                        ${m.even ? 'bg-muted/[0.15]' : ''}`}
            style={{ left: `${m.leftPct}%`, width: `${m.widthPct}%` }}
          />
        ))}
        {/* Week dividers — hidden on mobile, visible sm+ */}
        <div className="hidden sm:contents">
          {weekMarks.map((wm, i) => (
            <div
              key={i}
              className="absolute inset-y-0 border-l border-dashed border-border/40 pointer-events-none"
              style={{ left: `${wm.pct}%` }}
            />
          ))}
        </div>
        {/* Today: tinted column + hard line */}
        {showToday && (
          <>
            <div
              className="absolute inset-y-0 pointer-events-none bg-primary/[0.08]"
              style={{ left: `calc(${todayPct}% - 12px)`, width: '24px' }}
            />
            <div
              className="absolute inset-y-0 w-[2px] pointer-events-none bg-primary z-10"
              style={{ left: `${todayPct}%` }}
            />
          </>
        )}
      </>
    )
  }

  /* ── Date header ── */
  function DateHeader() {
    const nowMonth = today.getMonth()
    const nowYear  = today.getFullYear()
    return (
      <div className="flex border-b border-border/70 shrink-0 bg-muted/[0.04] shadow-[0_1px_0_0_hsl(var(--border)/0.6)]">
        {/* Column label cell */}
        <div className={`${COL_CLASS} border-r border-border/50 flex items-center px-3 sm:px-4 h-[48px] sm:h-[68px] bg-muted/[0.04]`}>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] sm:text-[10px] font-black text-foreground/70 uppercase tracking-[0.18em]">
              {viewMode === 'projects' ? t('projectColumn') : t('taskColumn')}
            </span>
            <span className="hidden sm:block text-[9px] text-muted-foreground/35 font-medium">
              {rangeLabel}
            </span>
          </div>
        </div>

        {/* Date columns */}
        <div className="flex-1 relative overflow-hidden h-[48px] sm:h-[68px]">
          {/* Month name row */}
          {months.map((m, i) => {
            const d = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + i, 1)
            const isCurrentMonth = d.getMonth() === nowMonth && d.getFullYear() === nowYear
            return (
              <div
                key={i}
                className={`absolute top-0 h-[48px] sm:h-[44px] flex items-center gap-1.5
                            ${i > 0 ? 'border-l border-border/40' : ''}
                            ${isCurrentMonth ? 'bg-primary/[0.05]' : m.even ? 'bg-muted/[0.04]' : ''}`}
                style={{ left: `${m.leftPct}%`, width: `${m.widthPct}%` }}
              >
                {isCurrentMonth && (
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary rounded-b-sm" />
                )}
                <span className={`truncate px-3
                                  ${isCurrentMonth
                                    ? 'text-[11.5px] font-extrabold text-primary'
                                    : 'text-[11.5px] font-bold text-foreground/65'}`}>
                  {m.label}
                </span>
              </div>
            )
          })}

          {/* Week numbers row — hidden on mobile */}
          <div className="hidden sm:block absolute inset-x-0 bottom-0 h-[24px] border-t border-border/40 bg-muted/[0.03]">
            {weekMarks.map((wm, i) => (
              <div
                key={i}
                className="absolute top-0 h-full flex items-center border-l border-border/25"
                style={{ left: `${wm.pct}%` }}
              >
                <span className="text-[9px] text-foreground/40 font-semibold pl-1.5 tabular-nums select-none">
                  {wm.day}
                </span>
              </div>
            ))}
          </div>

          {/* Today marker in header */}
          {showToday && (
            <div
              className="absolute top-0 bottom-0 w-[2px] z-20 pointer-events-none bg-primary"
              style={{ left: `${todayPct}%` }}
            >
              <span className="absolute -top-px left-1/2 -translate-x-1/2
                               px-2.5 py-[4px] rounded-b-lg text-[9px] font-black
                               text-primary-foreground tracking-widest whitespace-nowrap
                               bg-primary shadow-[0_2px_8px_rgba(99,102,241,0.5)]">
                HOY
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ════════════════════════════════════════════════════════════ */

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Top nav bar ── */}
      <div className="px-4 md:px-6 pt-4 pb-3 shrink-0">
        <div className="glass rounded-2xl overflow-hidden shadow-card">
          <div className="gradient-brand-gold h-[3px]" />
          {/* Row 1: back link + title */}
          <div className="px-4 sm:px-5 pt-3 pb-2 flex items-center gap-2 sm:gap-3">
            <Link
              href={`/dashboard/${slug}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border
                         text-[12px] font-semibold text-muted-foreground shrink-0
                         hover:text-foreground hover:bg-accent hover:border-primary/30 transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[100px] sm:max-w-[120px]">{workspaceName}</span>
            </Link>

            <div className="w-px h-5 bg-border shrink-0" />

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg gradient-brand flex items-center justify-center shrink-0 shadow-glow-sm">
                <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-[0.8125rem] sm:text-[0.875rem] tracking-tight">{t('title')}</h1>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground/60 tabular-nums hidden sm:block">{rangeLabel}</p>
              </div>
            </div>
          </div>

          {/* Row 2: controls */}
          <div className="px-4 sm:px-5 pb-3 flex items-center gap-2">
            {/* Range preset selector */}
            <div className="flex items-center rounded-lg border border-border overflow-hidden shrink-0">
              {(['1m', '3m', '6m', 'all'] as RangePreset[]).map((preset, i) => (
                <button
                  key={preset}
                  onClick={() => setRangePreset(preset)}
                  className={`px-2 sm:px-2.5 py-1.5 sm:py-2 text-[11px] font-semibold transition-colors
                              ${i > 0 ? 'border-l border-border' : ''}
                              ${rangePreset === preset
                                ? 'bg-primary/[0.08] text-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                >
                  {preset === 'all' ? 'Todo' : preset === '1m' ? '1M' : preset === '3m' ? '3M' : '6M'}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-border shrink-0" />

            {/* View mode toggle */}
            <div className="flex items-center rounded-lg border border-border overflow-hidden shrink-0">
              <button
                onClick={() => setViewMode('projects')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-[11.5px] font-semibold
                            transition-colors border-r border-border
                            ${viewMode === 'projects'
                              ? 'bg-primary text-white'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
              >
                <Layers className="w-3.5 h-3.5" />
                {t('modeProjects')}
              </button>
              <button
                onClick={() => setViewMode('tasks')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-[11.5px] font-semibold
                            transition-colors
                            ${viewMode === 'tasks'
                              ? 'bg-primary text-white'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
              >
                <ListTodo className="w-3.5 h-3.5" />
                {t('modeTasks')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Grid area — overflow-x-auto on mobile so users can horizontal-scroll the chart ── */}
      <div className="flex-1 overflow-x-auto md:overflow-hidden px-4 md:px-6 flex flex-col min-h-0">
        {isEmpty ? (
          <div className="flex-1 rounded-xl border border-border/70 bg-card shadow-card
                          flex flex-col items-center justify-center gap-4 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 bg-primary rounded-full opacity-[0.03] blur-3xl" />
            </div>
            <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center shadow-glow-sm">
              <CalendarOff className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-1.5 max-w-xs text-center">
              <p className="text-sm font-bold">
                {viewMode === 'projects' ? t('noProjects') : t('noTasksDated')}
              </p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {viewMode === 'projects' ? t('noProjectsDescription') : t('noTasksDatedDesc')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0 sm:min-w-[640px] md:min-w-0 rounded-xl border border-border bg-card shadow-card
                          overflow-hidden flex flex-col min-h-0">

            <DateHeader />

            {/* Rows — the ONLY scroll container */}
            <div
              className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col"
              onClick={() => setTappedBar(null)}
            >

              {/* ══ PROJECTS MODE ══ */}
              {viewMode === 'projects' && datedProjects.map((project, idx) => {
                const bounds   = getBarBounds(
                  new Date(project.startDate!), new Date(project.endDate!), rangeStart, totalMs,
                )
                const progress = getProgress(project.startDate!, project.endDate!, today)
                const status   = getStatus(project, today)
                const days     = getDays(project.startDate!, project.endDate!)
                const isHover  = hoveredBar === project.id
                const isTappedP = tappedBar === project.id
                const showTooltipP = isHover || isTappedP
                const isOnHold = project.status === 'ON_HOLD'

                // Smart positioning for project tooltip
                const nextProject = datedProjects[idx + 1]
                const nextProjectBounds = nextProject?.startDate && nextProject.endDate ? getBarBounds(
                  new Date(nextProject.startDate), new Date(nextProject.endDate), rangeStart, totalMs,
                ) : null
                const projectHasOverlapBelow = bounds && nextProjectBounds && (
                  bounds.left < (nextProjectBounds.left + nextProjectBounds.width) &&
                  (bounds.left + bounds.width) > nextProjectBounds.left
                )
                const projectTooltipPos = projectHasOverlapBelow
                  ? `top-1/2 -translate-y-1/2 ${bounds && (bounds.left + bounds.width) < 60 ? 'left-[calc(100%+4px)]' : 'right-[calc(100%+4px)]'}`
                  : `top-[calc(100%+6px)] ${bounds && bounds.left > 50 ? 'right-0' : 'left-0'}`
                const todayOnBar = (() => {
                  if (!project.startDate || !project.endDate) return null
                  const s = new Date(project.startDate).getTime()
                  const e = new Date(project.endDate).getTime()
                  const n = today.getTime()
                  if (n < s || n > e) return null
                  return Math.round(((n - s) / (e - s)) * 100 * 10000) / 10000
                })()

                return (
                  <div
                    key={project.id}
                    className={`group flex h-14 border-b border-border/30 last:border-0 relative
                                transition-colors duration-75
                                ${idx % 2 !== 0 ? 'bg-muted/[0.03]' : 'bg-card'}
                                ${isHover ? '!bg-primary/[0.05]' : 'hover:bg-muted/[0.04]'}
                                ${isOnHold ? 'opacity-60' : ''}`}
                    style={{ '--pc': project.color } as CSSProperties}
                  >
                    {/* Name column */}
                    <div className={`${COL_CLASS} border-r border-border/40 flex items-center relative overflow-hidden h-14`}>
                      <div
                        className={`gantt-pc-bg absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-sm transition-opacity ${isHover ? 'opacity-100' : 'opacity-50'}`}
                      />
                      <div className="pl-5 pr-3 flex items-center gap-2.5 w-full min-w-0">
                        <div
                          className="gantt-pc-bg w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center text-[12px] font-black text-white select-none relative"
                        >
                          {project.name.charAt(0).toUpperCase()}
                          {status.pulse && (
                            <span className="gantt-pc-bg absolute inset-0 rounded-lg animate-ping opacity-25" />
                          )}
                          {isOnHold && (
                            <span className="absolute -top-1 -right-1 bg-card rounded-full">
                              <PauseCircle className="w-3 h-3 text-slate-500" />
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[12.5px] font-bold truncate" title={project.name}>
                              {project.name}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground/50 tabular-nums mt-0.5 truncate">
                            {fmtShort(project.startDate!)} – {fmtShort(project.endDate!)} · {days}d
                          </p>
                          {progress > 0 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className="flex-1 h-[4px] rounded-full bg-border/50 overflow-hidden">
                                <div className="gantt-pc-bg h-full rounded-full opacity-70" style={{ width: `${progress}%` }} />
                              </div>
                              <span className="gantt-pc-text text-[9px] font-bold shrink-0 tabular-nums opacity-75">
                                {progress}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bar area */}
                    <div className="flex-1 relative h-14 overflow-visible">
                      <GridBg />
                      {bounds && (
                        <div
                          className="absolute z-10 h-[28px] top-[13px] min-w-12"
                          style={{ left: `${bounds.left}%`, width: `${bounds.width}%` }}
                          onMouseEnter={() => setHoveredBar(project.id)}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          <div
                            className={`gantt-pc-bar absolute inset-0 rounded-[6px] overflow-hidden gantt-shimmer ${isOnHold ? 'opacity-50' : ''}`}
                          >
                            {progress > 0 && progress < 100 && (
                              <div
                                className="gantt-bar-progress absolute top-0 left-0 h-full"
                                style={{ width: `${progress}%` }}
                              />
                            )}
                          </div>
                          <div className="absolute inset-0 flex items-center px-2 gap-1 z-10 overflow-hidden rounded-[6px]">
                            <span className="text-[11px] font-bold text-white truncate flex-1 drop-shadow-[0_1px_3px_rgba(0,0,0,.5)] leading-none">
                              {project.name}
                            </span>
                            {/* Date — desktop only */}
                            {project.endDate && (
                              <span className="hidden sm:inline text-[9px] font-medium text-white/70 shrink-0 whitespace-nowrap leading-none">
                                {fmtShort(project.endDate)}
                              </span>
                            )}
                            {/* Info button — mobile only */}
                            <button
                              className="sm:hidden w-[18px] h-[18px] rounded-full flex items-center justify-center bg-white/25 hover:bg-white/40 transition-colors shrink-0"
                              onClick={(e) => { e.stopPropagation(); setTappedBar(isTappedP ? null : project.id) }}
                              aria-label="Ver detalles"
                            >
                              {isTappedP
                                ? <X className="w-2.5 h-2.5 text-white" />
                                : <Info className="w-2.5 h-2.5 text-white" />
                              }
                            </button>
                          </div>
                          {todayOnBar !== null && (
                            <div
                              className="absolute top-[3px] bottom-[3px] w-[2px] rounded-full z-20 pointer-events-none bg-white/90 shadow-sm"
                              style={{ left: `${todayOnBar}%` }}
                              suppressHydrationWarning
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* ══ TASKS MODE ══ */}
              {viewMode === 'tasks' && projectsWithTasks.map((project) => {
                const projectTasks = tasksByProject[project.id] ?? []
                return (
                  <div key={project.id}>
                    {/* Project group header */}
                    <div
                      className="flex h-9 gantt-group-header"
                      style={{ '--pc': project.color } as CSSProperties}
                    >
                      <div className={`${COL_CLASS} border-r border-border/35 flex items-center gap-1.5 px-3 sm:px-4`}>
                        <div className="gantt-pc-bg w-2 h-2 rounded-sm shrink-0" />
                        <span className="gantt-pc-text text-[10.5px] sm:text-[11px] font-bold truncate">
                          {project.name}
                        </span>
                        <span className="text-[9px] font-semibold text-muted-foreground/50 ml-auto shrink-0">
                          {projectTasks.length} tarea{projectTasks.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="gantt-group-bar-area flex-1" />
                    </div>

                    {/* Task rows */}
                    {projectTasks.map((task, tIdx) => {
                      if (!task.dueDate) return null

                      // Fix: use startDate if explicitly set, fall back to createdAt
                      const barStartDate = task.startDate
                        ? new Date(task.startDate)
                        : new Date(task.createdAt)
                      const usedCreatedAt = !task.startDate  // flag to show dashed style
                      const taskEnd   = new Date(task.dueDate)
                      const bounds    = getBarBounds(barStartDate, taskEnd, rangeStart, totalMs)
                      const isOverdue = taskEnd < today && task.status !== 'DONE'
                      const isDone    = task.status === 'DONE'
                      const isHover   = hoveredBar === task.id

                      // Bar color: done=green, overdue=red, else priority color
                      const barColor  = isDone ? '#22c55e' : isOverdue ? '#ef4444' : PRIORITY_COLOR[task.priority] ?? project.color
                      const avatarBg  = task.assignee
                        ? `hsl(${task.assignee.id.charCodeAt(0) * 137 % 360},55%,50%)`
                        : '#64748b'

                      // Task duration label
                      const durationDays = getDays(barStartDate.toISOString(), task.dueDate)

                      // Smart tooltip positioning: check if next task bar overlaps horizontally
                      const nextTask = projectTasks[tIdx + 1]
                      const nextBounds = nextTask?.dueDate ? getBarBounds(
                        nextTask.startDate ? new Date(nextTask.startDate) : new Date(nextTask.createdAt),
                        new Date(nextTask.dueDate), rangeStart, totalMs,
                      ) : null
                      const hasOverlapBelow = bounds && nextBounds && (
                        bounds.left < (nextBounds.left + nextBounds.width) &&
                        (bounds.left + bounds.width) > nextBounds.left
                      )

                      const isTapped    = tappedBar === task.id
                      const showTooltip = isHover || isTapped

                      // Tooltip position classes
                      const tooltipPos = hasOverlapBelow
                        ? `top-1/2 -translate-y-1/2 ${bounds && (bounds.left + bounds.width) < 60 ? 'left-[calc(100%+4px)]' : 'right-[calc(100%+4px)]'}`
                        : `top-[calc(100%+6px)] ${bounds && bounds.left > 50 ? 'right-0' : 'left-0'}`

                      return (
                        <div
                          key={task.id}
                          className={`group flex h-11 border-b border-border/25 last:border-0 relative
                                      transition-colors duration-75
                                      ${tIdx % 2 !== 0 ? 'bg-muted/[0.03]' : 'bg-card'}
                                      ${isHover ? '!bg-primary/[0.04]' : 'hover:bg-muted/[0.04]'}`}
                          style={{ '--bc': barColor, '--av': avatarBg } as CSSProperties}
                        >
                          {/* Name column */}
                          <div className={`${COL_CLASS} border-r border-border/35 flex items-center pl-5 sm:pl-7 pr-2 sm:pr-3 relative h-11`}>
                            <div
                              className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full ${PRIORITY_BG[task.priority] ?? 'bg-indigo-500'}`}
                            />

                            {/* Desktop: avatar + full info */}
                            <div className="hidden sm:flex items-center gap-2 w-full min-w-0">
                              <div
                                className="w-[26px] h-[26px] rounded-full shrink-0 flex items-center justify-center text-[9px] font-black text-white overflow-hidden bg-[var(--av)]"
                              >
                                {task.assignee?.image
                                  // eslint-disable-next-line @next/next/no-img-element
                                  ? <img src={task.assignee.image} alt="" className="w-full h-full object-cover" />
                                  : getInitials(task.assignee?.name ?? null)
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 min-w-0">
                                  {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                                  {isOverdue && <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />}
                                  <span
                                    className={`text-[12px] font-medium truncate block ${isDone ? 'line-through text-muted-foreground/50' : ''}`}
                                    title={task.title}
                                  >
                                    {task.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {task.subtaskCount > 0 && (
                                    <span className="text-[8.5px] font-semibold text-muted-foreground/50 bg-muted/60 px-1 py-[1px] rounded">
                                      {task.subtaskCount} sub
                                    </span>
                                  )}
                                  <span className="text-[9px] text-muted-foreground/45 truncate">
                                    {task.assignee?.name ?? t('unassigned')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Mobile: just the title */}
                            <div className="sm:hidden flex-1 min-w-0 flex items-center gap-1">
                              {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                              {isOverdue && <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />}
                              <span
                                className={`text-[11px] font-medium truncate ${isDone ? 'line-through text-muted-foreground/50' : ''}`}
                                title={task.title}
                              >
                                {task.title}
                              </span>
                            </div>
                          </div>

                          {/* Bar area */}
                          <div className="flex-1 relative h-11 overflow-visible">
                            <GridBg />
                            {bounds && (
                              <div
                                className="absolute z-10 h-[22px] top-[11px] min-w-12"
                                style={{ left: `${bounds.left}%`, width: `${bounds.width}%` }}
                                onMouseEnter={() => setHoveredBar(task.id)}
                                onMouseLeave={() => setHoveredBar(null)}
                              >
                                <div
                                  className={`gantt-bc-bar absolute inset-0 rounded-[5px] overflow-hidden ${isDone ? 'opacity-70' : ''} ${usedCreatedAt ? 'gantt-bc-approx' : ''}`}
                                />
                                <div className="absolute inset-0 flex items-center pl-2 pr-6 z-10 overflow-hidden rounded-[5px]">
                                  <span className="text-[9.5px] font-semibold text-white truncate flex-1 drop-shadow-[0_1px_2px_rgba(0,0,0,.5)] leading-none">
                                    {task.title}
                                  </span>
                                </div>
                                {/* Avatar — desktop only, inside bar */}
                                <div
                                  className="absolute top-1/2 -translate-y-1/2 right-1 z-20 w-[18px] h-[18px] rounded-full hidden sm:flex items-center justify-center text-[7px] font-black text-white overflow-hidden ring-[1.5px] ring-card shadow-sm bg-[var(--av)]"
                                >
                                  {task.assignee?.image
                                    // eslint-disable-next-line @next/next/no-img-element
                                    ? <img src={task.assignee.image} alt="" className="w-full h-full object-cover" />
                                    : getInitials(task.assignee?.name ?? null)
                                  }
                                </div>
                                {/* Info button — mobile only */}
                                <button
                                  className="absolute top-1/2 -translate-y-1/2 right-1 z-20 w-[18px] h-[18px] rounded-full sm:hidden flex items-center justify-center bg-white/25 hover:bg-white/40 transition-colors"
                                  onClick={(e) => { e.stopPropagation(); setTappedBar(isTapped ? null : task.id) }}
                                  aria-label="Ver detalles"
                                >
                                  {isTapped
                                    ? <X className="w-2.5 h-2.5 text-white" />
                                    : <Info className="w-2.5 h-2.5 text-white" />
                                  }
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              {/* Empty space filler */}
              <div className="flex-1 flex relative min-h-[48px]">
                <div className={`${COL_CLASS} border-r border-border/30 shrink-0`} />
                <div className="flex-1 relative overflow-hidden">
                  <GridBg />
                </div>
              </div>

            </div>

            {/* ── Detail strip — fixed at bottom of Gantt card, never overlaps bars ── */}
            {(() => {
              const activeId = hoveredBar ?? tappedBar
              if (!activeId) return null

              const activeTask = tasks.find(t => t.id === activeId)
              if (activeTask) {
                const bs = activeTask.startDate ? new Date(activeTask.startDate) : new Date(activeTask.createdAt)
                const approx = !activeTask.startDate
                const dur = getDays(bs.toISOString(), activeTask.dueDate!)
                const col = activeTask.status === 'DONE' ? '#22c55e'
                  : new Date(activeTask.dueDate!) < today && activeTask.status !== 'DONE' ? '#ef4444'
                  : PRIORITY_COLOR[activeTask.priority] ?? '#6366f1'
                return (
                  <div className="border-t border-border/50 bg-card/95 backdrop-blur-sm px-4 py-2
                                  flex items-center gap-2 overflow-x-auto shrink-0
                                  animate-in fade-in slide-in-from-bottom-1 duration-150">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: col }} />
                    <span className="text-[11.5px] font-semibold text-foreground truncate max-w-[200px] shrink-0">{activeTask.title}</span>
                    <Sep /><span className="text-[10.5px] text-muted-foreground shrink-0">{dur}d</span>
                    {activeTask.subtaskCount > 0 && (<><Sep /><span className="text-[10.5px] text-muted-foreground shrink-0">{activeTask.subtaskCount} sub</span></>)}
                    <Sep /><span className="text-[10.5px] text-muted-foreground shrink-0">{activeTask.assignee?.name ?? t('unassigned')}</span>
                    <Sep /><span className="text-[10.5px] text-muted-foreground tabular-nums shrink-0">{fmtShort(activeTask.dueDate!)}</span>
                    {STATUS_LABEL[activeTask.status] && (
                      <><Sep /><span className="text-[10.5px] font-medium shrink-0" style={{ color: col }}>{STATUS_LABEL[activeTask.status]}</span></>
                    )}
                    {approx && (<><Sep /><span className="text-[10px] text-muted-foreground/55 italic shrink-0">inicio aprox.</span></>)}
                  </div>
                )
              }

              const activeProject = projects.find(p => p.id === activeId)
              if (activeProject?.startDate && activeProject.endDate) {
                const days = getDays(activeProject.startDate, activeProject.endDate)
                const prog = getProgress(activeProject.startDate, activeProject.endDate, today)
                return (
                  <div className="border-t border-border/50 bg-card/95 backdrop-blur-sm px-4 py-2
                                  flex items-center gap-2 overflow-x-auto shrink-0
                                  animate-in fade-in slide-in-from-bottom-1 duration-150"
                       style={{ '--pc': activeProject.color } as CSSProperties}>
                    <div className="gantt-pc-bg w-2 h-2 rounded-sm shrink-0" />
                    <span className="gantt-pc-text text-[11.5px] font-semibold shrink-0">{activeProject.name}</span>
                    <Sep /><span className="text-[10.5px] text-muted-foreground shrink-0">{fmtShort(activeProject.startDate)} – {fmtShort(activeProject.endDate)}</span>
                    <Sep /><span className="text-[10.5px] text-muted-foreground shrink-0">{days}d</span>
                    {prog > 0 && (<><Sep /><span className="gantt-pc-text text-[10.5px] font-bold shrink-0">{prog}%</span></>)}
                  </div>
                )
              }

              return null
            })()}

          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <div className="px-4 md:px-6 py-2.5 shrink-0 border-t border-border/40">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {showToday && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/[0.08] border border-primary/30 text-[11px] text-primary font-medium">
                <div className="w-[2px] h-3 rounded-full bg-primary" />
                <span>{t('todayLegend')}</span>
              </div>
            )}
            {viewMode === 'tasks' && activePriorities.length > 0 && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/60 border border-border/70">
                {activePriorities.map((p) => (
                  <div key={p} className="flex items-center gap-1">
                    <div className={`w-2.5 h-2.5 rounded-[3px] ${PRIORITY_BG[p]}`} />
                    <span className="text-[9.5px] font-medium text-muted-foreground">{PRIORITY_LABEL[p]}</span>
                  </div>
                ))}
              </div>
            )}
            {viewMode === 'tasks' && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/60 border border-border/70">
                <div className="flex items-center gap-1">
                  <div className="w-8 h-2.5 rounded-[3px] border border-dashed border-muted-foreground/40" />
                  <span className="text-[9.5px] text-muted-foreground/60">inicio aprox.</span>
                </div>
              </div>
            )}
            {viewMode === 'projects' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border/70">
                <span className="text-[9px] font-bold px-2 py-[3px] rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">Próximo</span>
                <div className="w-px h-3 bg-border/60" />
                <span className="text-[9px] font-bold px-2 py-[3px] rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">En curso</span>
                <div className="w-px h-3 bg-border/60" />
                <span className="text-[9px] font-bold px-2 py-[3px] rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Finalizado</span>
                <div className="w-px h-3 bg-border/60" />
                <span className="text-[9px] font-bold px-2 py-[3px] rounded-full bg-slate-500/15 text-slate-600 dark:text-slate-400">En pausa</span>
              </div>
            )}
          </div>

          {viewMode === 'projects' && undatedProjects.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.14em] shrink-0">
                {t('undatedProjects')}:
              </span>
              {undatedProjects.map((p) => (
                <span
                  key={p.id}
                  className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg
                             border border-border/70 bg-muted/40 text-muted-foreground
                             hover:border-primary/30 hover:text-foreground transition-all"
                  style={{ '--pc': p.color } as CSSProperties}
                >
                  <span className="gantt-pc-bg w-2 h-2 rounded-[2px] shrink-0" />
                  {p.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
