'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Download } from 'lucide-react'
import { getWeeklyReportDataAction } from '@/server/actions/report.actions'
import { APP_LOCALE } from '@/lib/constants'

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

export function WeeklyReportButton({ workspaceId, workspaceName }: WeeklyReportButtonProps) {
  const t = useTranslations('report')
  const [isPending, startTransition] = useTransition()

  function handleGenerate() {
    const labels: PdfLabels = {
      title: t('pdfTitle'),
      summary: t('pdfSummary'),
      totalTasks: t('pdfTotalTasks'),
      completed: t('pdfCompleted'),
      overdue: t('pdfOverdue'),
      activeProjects: t('pdfActiveProjects'),
      healthScore: t('pdfHealthScore'),
      completedSection: t('pdfCompletedSection'),
      overdueSection: t('pdfOverdueSection'),
      noCompleted: t('pdfNoCompleted'),
      noOverdue: t('pdfNoOverdue'),
      generatedBy: t('pdfGeneratedBy'),
      dueLabel: t('pdfDueLabel'),
    }

    startTransition(async () => {
      const data = await getWeeklyReportDataAction(workspaceId)
      const { default: jsPDF } = await import('jspdf')
      buildPDF(
        new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }),
        workspaceName,
        data,
        labels,
      )
    })
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={isPending}
      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border hover:bg-accent transition-colors disabled:opacity-50"
    >
      <Download className="w-4 h-4" />
      {isPending ? t('generating') : t('button')}
    </button>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPDF(doc: any, workspaceName: string, data: any, labels: PdfLabels) {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const locale = APP_LOCALE

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
  doc.text(
    `${weekAgo.toLocaleDateString(locale)} → ${now.toLocaleDateString(locale)}`,
    15,
    30,
  )

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
    `• ${labels.totalTasks}: ${metrics.total}`,
    `• ${labels.completed}: ${metrics.done} (${pct}%)`,
    `• ${labels.overdue}: ${metrics.overdue}`,
    `• ${labels.activeProjects}: ${metrics.activeProjects}`,
  ].forEach((line) => {
    doc.text(line, 15, y)
    y += 7
  })

  if (healthScore) {
    doc.setFont('helvetica', 'bold')
    doc.text(`• ${labels.healthScore}: ${healthScore.score}/100`, 15, y)
    doc.setFont('helvetica', 'normal')
    y += 7
  }

  y += 6

  // ─── Completed this week ───────────────────────────────────
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
    data.completedThisWeek.slice(0, 15).forEach((task: any) => {
      if (y > 255) return
      const date = task.completedAt
        ? new Date(task.completedAt).toLocaleDateString(locale)
        : ''
      doc.text(`• ${task.title}  (${task.project.name}${date ? ` · ${date}` : ''})`.slice(0, 85), 15, y)
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
    data.overdue.slice(0, 12).forEach((task: any) => {
      if (y > 270) return
      const due = task.dueDate
        ? `${labels.dueLabel} ${new Date(task.dueDate).toLocaleDateString(locale)}`
        : ''
      doc.text(`• ${task.title}  (${task.project.name}${due ? ` · ${due}` : ''})`.slice(0, 85), 15, y)
      y += 6
    })
  }

  // ─── Footer ────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.text(`${labels.generatedBy} · ${now.toLocaleString(locale)}`, 15, 288)
  }

  const slug = workspaceName.toLowerCase().replace(/\s+/g, '-')
  doc.save(`danu-report-${slug}-${now.toISOString().split('T')[0]}.pdf`)
}
