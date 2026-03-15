'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { setLocaleAction } from '@/server/actions/locale.actions'

interface LanguageSwitcherProps {
  currentLocale: string
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function setLocale(locale: string) {
    if (locale === currentLocale) return
    startTransition(async () => {
      await setLocaleAction(locale)
      router.refresh()
    })
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-md border border-border bg-background/60 p-0.5 disabled:opacity-50"
      aria-label="Switch language"
    >
      <Globe className="w-3 h-3 text-muted-foreground ml-1 shrink-0" />
      {(['es', 'en'] as const).map((locale) => (
        <button
          key={locale}
          onClick={() => setLocale(locale)}
          disabled={isPending}
          className={`px-1.5 py-0.5 text-[10px] font-semibold rounded transition-colors leading-none ${
            currentLocale === locale
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
