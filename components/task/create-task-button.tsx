'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ListTodo, X, ChevronDown, Check } from 'lucide-react'
import { createTaskAction } from '@/server/actions/task.actions'
import { Priority, TaskStatus } from '@prisma/client'

interface Member {
  userId: string
  user: { id: string; name: string | null; image: string | null }
}

interface CreateTaskButtonProps {
  projectId: string
  workspaceSlug: string
  members: Member[]
  defaultStatus?: TaskStatus
  projectStartDate?: string   // ISO date string YYYY-MM-DD
}

// ── AssigneeSelect — custom dropdown replacing native <select> ──────────────

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = [
  'from-indigo-500 to-violet-500',
  'from-violet-500 to-pink-500',
  'from-pink-500 to-rose-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-sky-500 to-blue-500',
]

function avatarGradient(name: string | null): string {
  const idx = (name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

function MemberAvatar({ member, size = 'sm' }: { member: Member; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'w-8 h-8 text-[11px]' : 'w-7 h-7 text-[10px]'
  if (member.user.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.user.image}
        alt={member.user.name ?? ''}
        className={`${dim} rounded-full shrink-0 ring-2 ring-border object-cover`}
      />
    )
  }
  return (
    <span
      className={`${dim} rounded-full shrink-0 flex items-center justify-center
                  font-bold text-white ring-2 ring-white/10
                  bg-gradient-to-br ${avatarGradient(member.user.name)}`}
    >
      {getInitials(member.user.name)}
    </span>
  )
}

function AssigneeSelect({
  members,
  unassignedLabel,
}: {
  members: Member[]
  unassignedLabel: string
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Member | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  return (
    <div ref={ref} className="relative">
      <input type="hidden" name="assigneeId" value={selected?.userId ?? ''} />

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm
                    transition-all text-left group
                    ${open
                      ? 'border-primary/50 ring-2 ring-primary/20 bg-primary/[0.04]'
                      : 'border-border bg-background/50 hover:border-primary/35 hover:bg-accent/25'
                    }`}
      >
        {selected ? (
          <>
            <MemberAvatar member={selected} size="sm" />
            <div className="flex-1 min-w-0">
              <span className="block text-[13px] font-semibold truncate leading-snug">
                {selected.user.name ?? selected.userId}
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Dashed placeholder avatar */}
            <span className="w-7 h-7 rounded-full shrink-0 border-2 border-dashed border-border/70
                             flex items-center justify-center transition-colors
                             group-hover:border-primary/40">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            </span>
            <span className="flex-1 text-[13px] text-muted-foreground/50 italic">
              {unassignedLabel}
            </span>
          </>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-all duration-200
                      ${open
                        ? 'text-primary rotate-180'
                        : 'text-muted-foreground/40 group-hover:text-muted-foreground/70'
                      }`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute top-[calc(100%+5px)] left-0 right-0 z-50
                     bg-card/95 backdrop-blur-sm border border-border/80
                     rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.18)]
                     overflow-hidden p-1"
        >
          {/* Accent stripe */}
          <div className="h-[2px] -mt-1 mb-1 mx-0 rounded-t-xl bg-gradient-to-r from-primary/60 via-violet-500/60 to-transparent" />

          {members.map((m) => {
            const isSelected = selected?.userId === m.userId
            return (
              <button
                key={m.userId}
                type="button"
                onClick={() => { setSelected(m); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-left
                            transition-all duration-100 relative
                            ${isSelected
                              ? 'bg-primary/12 text-foreground'
                              : 'hover:bg-accent/70 text-foreground/85'
                            }`}
              >
                {/* Selected indicator bar */}
                {isSelected && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[2.5px] rounded-full bg-primary" />
                )}

                <MemberAvatar member={m} size="md" />

                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] truncate leading-snug
                                 ${isSelected ? 'font-semibold text-foreground' : 'font-medium'}`}>
                    {m.user.name ?? m.userId}
                  </p>
                </div>

                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: {
  value: Priority
  key: string
  idle: string
  active: string
}[] = [
  {
    value: Priority.LOW,
    key: 'LOW',
    idle:   'border border-zinc-300/60   text-zinc-500   dark:border-zinc-600/60 dark:text-zinc-400   hover:bg-zinc-100   dark:hover:bg-zinc-800/60',
    active: 'border border-zinc-500      text-zinc-700   dark:border-zinc-400    dark:text-zinc-100   bg-zinc-100        dark:bg-zinc-700/60',
  },
  {
    value: Priority.MEDIUM,
    key: 'MEDIUM',
    idle:   'border border-yellow-300/60 text-yellow-600 dark:border-yellow-700/60 dark:text-yellow-500 hover:bg-yellow-50  dark:hover:bg-yellow-950/30',
    active: 'border border-yellow-500    text-yellow-700 dark:border-yellow-400   dark:text-yellow-300 bg-yellow-50       dark:bg-yellow-950/40',
  },
  {
    value: Priority.HIGH,
    key: 'HIGH',
    idle:   'border border-orange-300/60 text-orange-500 dark:border-orange-700/60 dark:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30',
    active: 'border border-orange-500    text-orange-700 dark:border-orange-400   dark:text-orange-300 bg-orange-50      dark:bg-orange-950/40',
  },
  {
    value: Priority.URGENT,
    key: 'URGENT',
    idle:   'border border-red-300/60    text-red-500    dark:border-red-700/60   dark:text-red-500    hover:bg-red-50    dark:hover:bg-red-950/30',
    active: 'border border-red-500       text-red-700    dark:border-red-400      dark:text-red-300    bg-red-50          dark:bg-red-950/40',
  },
]

export function CreateTaskButton({
  projectId,
  workspaceSlug,
  members,
  defaultStatus = TaskStatus.TODO,
  projectStartDate,
}: CreateTaskButtonProps) {
  const [open, setOpen] = useState(false)
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const t = useTranslations('task')

  // Minimum allowed due date: latest of today and project start date
  const today = new Date().toISOString().split('T')[0]
  const minDate = projectStartDate && projectStartDate > today ? projectStartDate : today

  async function handleSubmit(formData: FormData) {
    setError('')
    const dueDate = formData.get('dueDate') as string
    const assigneeId = formData.get('assigneeId') as string
    if (!dueDate) { setError(t('dueDateRequired')); return }
    if (dueDate < minDate) { setError(t('dueDateTooEarly')); return }
    if (members.length > 0 && !assigneeId) { setError(t('assigneeRequired')); return }
    setLoading(true)
    formData.set('priority', priority)
    try {
      await createTaskAction(projectId, workspaceSlug, formData)
      setOpen(false)
      setPriority(Priority.MEDIUM)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Trigger — dashed add button */}
      <button
        onClick={() => setOpen(true)}
        className="w-full px-3 py-2.5 text-sm text-muted-foreground border border-dashed rounded-lg
                   hover:border-primary/50 hover:text-foreground hover:bg-accent/30
                   transition-all text-left flex items-center gap-1.5"
      >
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-none stroke-current shrink-0" strokeWidth={2.2}>
          <path strokeLinecap="round" d="M8 3v10M3 8h10" />
        </svg>
        {t('newButton')}
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 bg-black/55 dark:bg-black/70 backdrop-blur-md
                     flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="glass-gold rounded-2xl overflow-hidden w-full max-w-md card-enter">

            {/* Accent stripe */}
            <div className="h-[3px] bg-gradient-to-r from-primary via-violet-500 to-amber-400" />

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-start gap-3 border-b border-border/50">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shrink-0 shadow-glow-sm">
                <ListTodo className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h2 className="font-bold text-[0.9375rem] tracking-tight leading-snug">
                  {t('createTitle')}
                </h2>
                <p className="text-[11.5px] text-muted-foreground/65 mt-0.5">
                  {t('titlePlaceholder')}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground
                           hover:text-foreground hover:bg-accent transition-colors shrink-0 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form action={handleSubmit} className="px-6 py-5 space-y-4">
              <input type="hidden" name="status" value={defaultStatus} />

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  {t('titleLabel')}
                </label>
                <input
                  name="title"
                  required
                  autoFocus
                  placeholder={t('titlePlaceholder')}
                  className="w-full px-3.5 py-3 rounded-xl border border-border bg-background/50
                             text-sm placeholder:text-muted-foreground/35
                             focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60
                             transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  {t('descriptionLabel')}
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder={t('descriptionPlaceholder')}
                  className="w-full px-3.5 py-3 rounded-xl border border-border bg-background/50
                             text-sm placeholder:text-muted-foreground/35
                             focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60
                             transition-all resize-none"
                />
              </div>

              {/* Priority — button group */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  {t('priorityLabel')}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {PRIORITY_CONFIG.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={`py-2 rounded-lg text-[11.5px] font-semibold transition-all
                                  ${priority === p.value ? p.active : p.idle}`}
                    >
                      {t(`priority.${p.key}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due date + Assignee */}
              <div className={`grid gap-3 ${members.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    {t('dueDateLabel')}
                  </label>
                  <input
                    name="dueDate"
                    type="date"
                    required
                    min={minDate}
                    className="w-full px-3 py-3 rounded-xl border border-border bg-background/50
                               text-sm focus:outline-none focus:ring-2 focus:ring-primary/30
                               focus:border-primary/60 transition-all"
                  />
                </div>

                {members.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                      {t('assigneeLabel')}
                    </label>
                    <AssigneeSelect members={members} unassignedLabel={t('unassigned')} />
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <p className="text-[12px] text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2.5 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 text-sm rounded-xl border border-border/80
                             text-muted-foreground hover:text-foreground hover:bg-accent/70
                             transition-all font-medium"
                >
                  {t('cancelButton')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-5 py-2.5 rounded-xl text-sm"
                >
                  {loading ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : null}
                  {t('createButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
