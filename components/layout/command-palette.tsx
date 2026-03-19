'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { useTranslations } from 'next-intl'
import { Search, LayoutDashboard } from 'lucide-react'
import { getSearchDataAction } from '@/server/actions/search.actions'
import { COLOR_DOT_CLASS } from '@/lib/constants'

type SearchData = {
  workspaces: { id: string; name: string; slug: string }[]
  projects: {
    id: string
    name: string
    color: string
    workspaceSlug: string
    workspaceName: string
  }[]
}

export function CommandPalette({ showTrigger = true }: { showTrigger?: boolean }) {
  const t = useTranslations('commandPalette')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<SearchData | null>(null)
  const [, startTransition] = useTransition()
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMac(navigator.platform.toUpperCase().includes('MAC') ||
             navigator.userAgent.toUpperCase().includes('MAC'))
  }, [])

  // Global Cmd+K / Ctrl+K + mobile custom event
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    function onOpen() { setOpen(true) }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('open-command-palette', onOpen)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('open-command-palette', onOpen)
    }
  }, [])

  // Load data when palette opens
  useEffect(() => {
    if (open && !data) {
      startTransition(async () => {
        const result = await getSearchDataAction()
        setData(result)
      })
    }
  }, [open, data])

  function navigate(href: string) {
    router.push(href)
    setOpen(false)
  }

  return (
    <>
      {/* Trigger button — only rendered inside sidebar */}
      {showTrigger && <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2.5 w-full px-2.5 py-[7px] rounded-lg
                   text-[12.5px] font-medium text-muted-foreground dark:text-muted-foreground/80
                   hover:bg-accent/50 dark:hover:bg-white/[0.07]
                   hover:text-foreground transition-all duration-150"
      >
        <span className="w-[26px] h-[26px] rounded-lg flex items-center justify-center shrink-0
                         bg-muted/50 dark:bg-white/[0.09] text-muted-foreground
                         dark:text-muted-foreground/80
                         group-hover:bg-muted/80 dark:group-hover:bg-white/[0.13]
                         group-hover:text-foreground transition-all duration-150">
          <Search className="w-[14px] h-[14px]" />
        </span>
        <span className="flex-1 text-left">{t('openPalette')}</span>
        <kbd className="text-[9px] font-semibold leading-none
                        px-1.5 py-[3px] rounded-[5px]
                        bg-muted dark:bg-muted
                        border border-border dark:border-sidebar-border
                        text-muted-foreground dark:text-sidebar-foreground/60
                        font-mono shrink-0 whitespace-nowrap">
          <span className="hidden sm:inline">{isMac ? '⌘K' : 'Ctrl K'}</span>
        </kbd>
      </button>}

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[8vh] sm:pt-[18vh] px-4 sm:px-0"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-card border rounded-xl shadow-2xl w-full max-w-[min(512px,calc(100vw-2rem))] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Command
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false)
              }}
            >
              <div className="flex items-center gap-2 px-4 border-b">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <Command.Input
                  placeholder={t('placeholder')}
                  className="flex-1 py-3 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                />
              </div>

              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                  {t('empty')}
                </Command.Empty>

                {data && data.workspaces.length > 0 && (
                  <Command.Group
                    heading={t('workspaces')}
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                  >
                    {data.workspaces.map((ws) => (
                      <Command.Item
                        key={ws.id}
                        value={ws.name}
                        onSelect={() => navigate(`/dashboard/${ws.slug}`)}
                        className="flex items-center gap-2.5 px-2 py-2 rounded-md cursor-pointer text-sm data-[selected=true]:bg-accent aria-selected:bg-accent"
                      >
                        <LayoutDashboard className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span>{ws.name}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {data && data.projects.length > 0 && (
                  <Command.Group
                    heading={t('projects')}
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                  >
                    {data.projects.map((p) => (
                      <Command.Item
                        key={p.id}
                        value={`${p.name} ${p.workspaceName}`}
                        onSelect={() => navigate(`/dashboard/${p.workspaceSlug}/${p.id}`)}
                        className="flex items-center gap-2.5 px-2 py-2 rounded-md cursor-pointer text-sm data-[selected=true]:bg-accent aria-selected:bg-accent"
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${COLOR_DOT_CLASS[p.color] ?? 'dot-indigo'}`}
                        />
                        <span className="flex-1 truncate">{p.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {p.workspaceName}
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {!data && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {t('loading')}
                  </div>
                )}
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </>
  )
}
