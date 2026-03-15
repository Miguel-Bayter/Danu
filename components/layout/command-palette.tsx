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

export function CommandPalette() {
  const t = useTranslations('commandPalette')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<SearchData | null>(null)
  const [, startTransition] = useTransition()

  // Global Cmd+K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
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
      {/* Trigger button rendered inline in the sidebar */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-left">{t('openPalette')}</span>
        <kbd className="text-[10px] bg-muted px-1.5 py-0.5 rounded border font-mono leading-none">
          ⌘K
        </kbd>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[18vh]"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-card border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
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
