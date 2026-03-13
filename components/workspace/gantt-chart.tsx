'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { APP_LOCALE } from '@/lib/constants'

interface GanttProject {
  id: string
  name: string
  color: string
  startDate: string | null
  endDate: string | null
}

interface GanttChartProps {
  projects: GanttProject[]
}

const MONTHS_IN_VIEW = 3

export function GanttChart({ projects }: GanttChartProps) {
  const t = useTranslations('timeline')
  const [offset, setOffset] = useState(0)

  const today = new Date()
  const rangeStart = new Date(today.getFullYear(), today.getMonth() + offset - 1, 1)
  const rangeEnd = new Date(today.getFullYear(), today.getMonth() + offset + MONTHS_IN_VIEW - 1, 0)
  const totalMs = rangeEnd.getTime() - rangeStart.getTime()

  function toPct(date: Date): number {
    return ((date.getTime() - rangeStart.getTime()) / totalMs) * 100
  }

  const todayPct = toPct(today)
  const showTodayLine = todayPct >= 0 && todayPct <= 100

  const months = Array.from({ length: MONTHS_IN_VIEW }, (_, i) => {
    const mStart = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + i, 1)
    const mEnd = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + i + 1, 0)
    return {
      label: mStart.toLocaleDateString(APP_LOCALE, { month: 'long', year: 'numeric' }),
      leftPct: Math.max(0, toPct(mStart)),
      widthPct: Math.min(100, toPct(new Date(mEnd.getTime() + 86400000))) - Math.max(0, toPct(mStart)),
    }
  })

  const datedProjects = projects.filter((p) => p.startDate && p.endDate)
  const undatedProjects = projects.filter((p) => !p.startDate || !p.endDate)

  function getBarStyle(p: GanttProject) {
    if (!p.startDate || !p.endDate) return null
    const left = Math.max(0, toPct(new Date(p.startDate)))
    const right = Math.max(0, 100 - Math.min(100, toPct(new Date(p.endDate))))
    const width = 100 - left - right
    if (width <= 0) return null
    return { left: `${left}%`, width: `${width}%` }
  }

  return (
    <div className="space-y-6">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {t('title')}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="p-1 rounded hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setOffset(0)}
            className="px-2 py-0.5 text-xs rounded border hover:bg-accent transition-colors"
          >
            {t('today')}
          </button>
          <button
            onClick={() => setOffset((o) => o + 1)}
            className="p-1 rounded hover:bg-accent transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {datedProjects.length === 0 ? (
        <div className="border-2 border-dashed rounded-xl p-16 text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">{t('noProjects')}</p>
          <p className="text-sm">{t('noProjectsDescription')}</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card">
          {/* Month header */}
          <div className="flex border-b bg-muted/30">
            <div className="w-40 shrink-0 px-3 py-2 border-r">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('projectColumn')}
              </span>
            </div>
            <div className="flex-1 relative h-8">
              {months.map((m, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full flex items-center border-l border-border/40"
                  style={{ left: `${m.leftPct}%`, width: `${m.widthPct}%` }}
                >
                  <span className="text-xs text-muted-foreground px-2 truncate capitalize">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {datedProjects.map((project) => {
            const barStyle = getBarStyle(project)
            return (
              <div
                key={project.id}
                className="flex border-b last:border-0 hover:bg-muted/20 transition-colors group"
              >
                <div className="w-40 shrink-0 px-3 py-3 border-r flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-xs font-medium truncate">{project.name}</span>
                </div>
                <div className="flex-1 relative py-3 px-0 min-h-[2.5rem]">
                  {/* Month dividers */}
                  {months.map((m, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-l border-dashed border-border/30"
                      style={{ left: `${m.leftPct}%` }}
                    />
                  ))}
                  {/* Today line */}
                  {showTodayLine && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-red-400/80 z-10"
                      style={{ left: `${todayPct}%` }}
                    />
                  )}
                  {/* Bar */}
                  {barStyle && (
                    <div
                      className="absolute top-2 bottom-2 rounded-md opacity-75 group-hover:opacity-100 transition-opacity flex items-center px-2"
                      style={{ ...barStyle, backgroundColor: project.color }}
                    >
                      <span className="text-[10px] text-white font-medium truncate">
                        {project.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Undated projects */}
      {undatedProjects.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {t('undatedProjects')}
          </p>
          <div className="flex flex-wrap gap-2">
            {undatedProjects.map((p) => (
              <span
                key={p.id}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 border rounded-md bg-card text-muted-foreground"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Today legend */}
      {showTodayLine && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="inline-block w-4 h-px bg-red-400/80" />
          {t('todayLegend')}
        </p>
      )}
    </div>
  )
}
