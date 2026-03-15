'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { FolderOpen, ArrowUpRight } from 'lucide-react'
import type { Workspace } from '@prisma/client'
import { getGradientClass } from '@/lib/constants'

type WorkspaceWithCount = Workspace & { _count: { projects: number } }

interface WorkspaceCardProps {
  workspace: WorkspaceWithCount
}

/**
 * Workspace card — gradient header block + glass footer.
 * Spring-powered hover lift via motion. overflow-hidden is safe here
 * since there's no dropdown menu.
 */
export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const t = useTranslations('workspace')
  const count = workspace._count.projects
  const gradientClass = getGradientClass(workspace.name)

  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
    >
      <Link
        href={`/dashboard/${workspace.slug}`}
        className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden glass
                   hover:border-primary/30
                   transition-[border-color,box-shadow] duration-200 shadow-card hover:shadow-card-hover"
      >
        {/* Gradient header — entire colored section */}
        <div className={`${gradientClass} px-4 py-5 flex items-start gap-3 relative`}>
          {/* Subtle inner shine */}
          <div className="absolute inset-0 bg-white/[0.06] pointer-events-none" />

          {/* Monogram badge — frosted glass on gradient */}
          <div className="relative w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg shrink-0 ring-1 ring-white/25">
            {workspace.name[0].toUpperCase()}
          </div>

          {/* Workspace name */}
          <div className="flex-1 min-w-0 pt-0.5 relative">
            <p className="font-bold text-white text-sm leading-snug truncate group-hover:text-white/90 transition-colors">
              {workspace.name}
            </p>
          </div>

          {/* Arrow */}
          <ArrowUpRight
            className="relative w-4 h-4 text-white/40 group-hover:text-white/90
                       group-hover:translate-x-0.5 group-hover:-translate-y-0.5
                       transition-all duration-200 mt-0.5 shrink-0"
          />
        </div>

        {/* Footer — project count */}
        <div className="px-4 py-3 flex items-center gap-2 bg-card border-t border-border">
          <FolderOpen className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
          <p className="text-[11px] text-muted-foreground font-medium tabular-nums">
            {count === 1 ? t('projects_one', { count: 1 }) : t('projects_other', { count })}
          </p>
        </div>
      </Link>
    </motion.div>
  )
}
