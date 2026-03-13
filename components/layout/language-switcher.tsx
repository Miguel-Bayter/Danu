'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setLocaleAction } from '@/server/actions/locale.actions'

interface LanguageSwitcherProps {
  currentLocale: string
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function toggle() {
    const next = currentLocale === 'es' ? 'en' : 'es'
    startTransition(async () => {
      await setLocaleAction(next)
      router.refresh()
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="flex items-center gap-1 px-2 py-0.5 text-xs rounded border hover:bg-accent transition-colors disabled:opacity-50 font-mono"
      title="Switch language"
    >
      {currentLocale === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}
    </button>
  )
}
