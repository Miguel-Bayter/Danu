'use client'

import React, { useState, useTransition, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { Download, ChevronDown, Check, CalendarDays, Calendar, CalendarRange } from 'lucide-react'
import { getWeeklyReportDataAction } from '@/server/actions/report.actions'
import { APP_LOCALE } from '@/lib/constants'

type Period = 'rolling' | 'week' | 'month'

interface WeeklyReportButtonProps {
  workspaceId: string
  workspaceName: string
}

interface PdfLabels {
  title: string
  summary: string
  totalTasks: string
  completed: string
  overdue: string
  activeProjects: string
  healthScore: string
  completedSection: string
  overdueSection: string
  noCompleted: string
  noOverdue: string
  generatedBy: string
  dueLabel: string
}

function getDateRange(period: Period): { from: Date; to: Date } {
  const now = new Date()

  if (period === 'rolling') {
    return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), to: now }
  }

  if (period === 'week') {
    // Legal work week: Monday 00:00 → Friday 23:59
    const day = now.getDay() // 0=Sun,1=Mon,...,5=Fri,6=Sat
    const diffToMon = (day + 6) % 7  // days since last Monday
    const mon = new Date(now)
    mon.setDate(now.getDate() - diffToMon)
    mon.setHours(0, 0, 0, 0)
    const fri = new Date(mon)
    fri.setDate(mon.getDate() + 4)   // Monday + 4 = Friday
    fri.setHours(23, 59, 59, 999)
    return { from: mon, to: fri }
  }

  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { from, to }
}

export function WeeklyReportButton({ workspaceId, workspaceName }: WeeklyReportButtonProps) {
  const t = useTranslations('report')
  const [isPending, startTransition] = useTransition()
  const [period, setPeriod] = useState<Period>('rolling')
  const [open, setOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)

  const periodOptions: { value: Period; label: string; sub: string; Icon: React.ElementType }[] = [
    { value: 'rolling', label: t('periodRolling'), sub: 'Últimos 7 días corridos',      Icon: CalendarDays  },
    { value: 'week',    label: t('periodWeek'),    sub: 'Lunes 00:00 → Viernes 23:59', Icon: CalendarRange },
    { value: 'month',   label: t('periodMonth'),   sub: 'Del 1° al último día del mes', Icon: Calendar      },
  ]

  function handleOpen() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 6, left: rect.left })
    }
    setOpen((v) => !v)
  }

  // Close on scroll/resize
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  function handleGenerate() {
    const labels: PdfLabels = {
      title:            t('pdfTitle'),
      summary:          t('pdfSummary'),
      totalTasks:       t('pdfTotalTasks'),
      completed:        t('pdfCompleted'),
      overdue:          t('pdfOverdue'),
      activeProjects:   t('pdfActiveProjects'),
      healthScore:      t('pdfHealthScore'),
      completedSection: t('pdfCompletedSection'),
      overdueSection:   t('pdfOverdueSection'),
      noCompleted:      t('pdfNoCompleted'),
      noOverdue:        t('pdfNoOverdue'),
      generatedBy:      t('pdfGeneratedBy'),
      dueLabel:         t('pdfDueLabel'),
    }

    startTransition(async () => {
      const data = await getWeeklyReportDataAction(workspaceId)
      const { default: jsPDF } = await import('jspdf')
      const range = getDateRange(period)
      buildPDF(
        new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }),
        workspaceName,
        data,
        labels,
        range,
      )
    })
  }

  const selectedLabel = periodOptions.find((o) => o.value === period)?.label ?? ''

  return (
    <>
      <div className="flex items-center gap-0 rounded-md border border-border">

        {/* Period selector trigger */}
        <button
          ref={triggerRef}
          onClick={handleOpen}
          disabled={isPending}
          className="flex items-center gap-1 px-2.5 py-2.5 text-[12px] font-medium min-h-[44px]
                     text-muted-foreground hover:text-foreground hover:bg-accent
                     rounded-l-md border-r border-border transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {selectedLabel}
          <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Download button */}
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium min-h-[44px]
                     text-muted-foreground hover:text-foreground hover:bg-accent
                     rounded-r-md transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isPending ? t('generating') : t('button')}
        </button>
      </div>

      {/* Dropdown via portal — escapes any overflow-hidden parent */}
      {open && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 w-[260px] bg-card border border-border/70
                       rounded-2xl shadow-2xl overflow-hidden"
            style={{ top: dropdownPos.top, left: dropdownPos.left }}
          >
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-border/50 bg-muted/30">
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                Periodo del reporte
              </p>
            </div>

            {/* Options */}
            <div className="p-1.5 space-y-0.5">
              {periodOptions.map((opt) => {
                const active = opt.value === period
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setPeriod(opt.value); setOpen(false) }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors
                                flex items-center gap-3 group
                                ${active ? 'bg-primary/10' : 'hover:bg-accent'}`}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
                                    ${active
                                      ? 'bg-primary/20 text-primary'
                                      : 'bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                                    }`}
                    >
                      <opt.Icon className="w-4 h-4" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12.5px] font-semibold leading-snug
                                    ${active ? 'text-primary' : 'text-foreground'}`}>
                        {opt.label}
                      </p>
                      <p className="text-[10.5px] text-muted-foreground/55 leading-snug mt-0.5 truncate">
                        {opt.sub}
                      </p>
                    </div>

                    {/* Check */}
                    {active && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>,
        document.body,
      )}
    </>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPDF(doc: any, workspaceName: string, data: any, labels: PdfLabels, range: { from: Date; to: Date }) {
  const now    = new Date()
  const locale = APP_LOCALE

  const fromStr = range.from.toLocaleDateString(locale)
  const toStr   = range.to.toLocaleDateString(locale)

  // ─── Header ────────────────────────────────────────────────
  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, 210, 36, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(labels.title, 15, 14)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(workspaceName, 15, 22)
  doc.text(`${fromStr}  -  ${toStr}`, 15, 30)

  let y = 50

  // ─── Metrics ───────────────────────────────────────────────
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(labels.summary, 15, y)
  y += 8

  const { metrics, healthScore } = data
  const pct = metrics.total > 0 ? Math.round((metrics.done / metrics.total) * 100) : 0

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  ;[
    `* ${labels.totalTasks}: ${metrics.total}`,
    `* ${labels.completed}: ${metrics.done} (${pct}%)`,
    `* ${labels.overdue}: ${metrics.overdue}`,
    `* ${labels.activeProjects}: ${metrics.activeProjects}`,
  ].forEach((line) => {
    doc.text(line, 15, y)
    y += 7
  })

  if (healthScore) {
    doc.setFont('helvetica', 'bold')
    doc.text(`* ${labels.healthScore}: ${healthScore.score}/100`, 15, y)
    doc.setFont('helvetica', 'normal')
    y += 7
  }

  y += 6

  // ─── Completed in period ────────────────────────────────────
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`${labels.completedSection} (${data.completedThisWeek.length})`, 15, y)
  y += 8
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  if (data.completedThisWeek.length === 0) {
    doc.setTextColor(160, 160, 160)
    doc.text(labels.noCompleted, 15, y)
    doc.setTextColor(0, 0, 0)
    y += 7
  } else {
    data.completedThisWeek.slice(0, 15).forEach((task: { title: string; completedAt?: string | null; project: { name: string } }) => {
      if (y > 255) return
      const date = task.completedAt
        ? new Date(task.completedAt).toLocaleDateString(locale)
        : ''
      doc.text(`* ${task.title}  (${task.project.name}${date ? ` - ${date}` : ''})`.slice(0, 85), 15, y)
      y += 6
    })
  }

  y += 6

  // ─── Overdue ───────────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 20 }

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(220, 38, 38)
  doc.text(`${labels.overdueSection} (${data.overdue.length})`, 15, y)
  doc.setTextColor(0, 0, 0)
  y += 8
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  if (data.overdue.length === 0) {
    doc.setTextColor(160, 160, 160)
    doc.text(labels.noOverdue, 15, y)
    doc.setTextColor(0, 0, 0)
  } else {
    data.overdue.slice(0, 12).forEach((task: { title: string; dueDate?: string | null; project: { name: string } }) => {
      if (y > 270) return
      const due = task.dueDate
        ? `${labels.dueLabel} ${new Date(task.dueDate).toLocaleDateString(locale)}`
        : ''
      doc.text(`* ${task.title}  (${task.project.name}${due ? ` - ${due}` : ''})`.slice(0, 85), 15, y)
      y += 6
    })
  }

  // ─── Footer ────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.text(`${labels.generatedBy}  -  ${now.toLocaleString(locale)}`, 15, 288)
  }

  const slug   = workspaceName.toLowerCase().replace(/\s+/g, '-')
  const period = `${range.from.toISOString().split('T')[0]}_${range.to.toISOString().split('T')[0]}`
  doc.save(`danu-report-${slug}-${period}.pdf`)
}
