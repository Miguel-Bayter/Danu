import { signIn } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'
import { LogoMark } from '@/components/ui/logo-mark'
import { ThemeToggle } from '@/components/layout/theme-toggle'

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const t = await getTranslations('auth.signIn')
  const { callbackUrl } = await searchParams
  const redirectTo = callbackUrl?.startsWith('/invite/') ? callbackUrl : '/dashboard'

  async function signInDemo() {
    'use server'
    await signIn('credentials', { type: 'demo', redirectTo: '/dashboard' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">

      {/* ── Aurora background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[700px] h-[700px] -top-[220px] -left-[180px] rounded-full
                        bg-primary/[0.07] dark:bg-primary/[0.14] blur-[110px]" />
        <div className="absolute w-[550px] h-[550px] -bottom-[120px] -right-[130px] rounded-full
                        bg-violet-400/[0.06] dark:bg-violet-600/[0.16] blur-[100px]" />
        <div className="aurora-orb-gold absolute w-[380px] h-[380px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full
                        opacity-0 dark:opacity-100 blur-[90px]"
        />
      </div>

      <div className="absolute inset-0 bg-dot-grid opacity-50 dark:opacity-[0.18] pointer-events-none" />

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* ── Card ── */}
      <div className="relative w-full max-w-[400px] mx-4 sm:mx-auto z-10 card-enter">
        <div className="glass-gold rounded-2xl overflow-hidden shadow-xl">
          {/* Gradient bar */}
          <div className="h-[3px] bg-gradient-to-r from-primary via-violet-500 to-amber-400" />

          <div className="px-6 sm:px-8 pt-8 pb-7 space-y-5">

            {/* ── Header ── */}
            <div className="flex flex-col items-center gap-4 text-center">
              <LogoMark size="xl" className="shadow-glow-gold" />
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-gradient-gold">
                  {t('title')}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('subtitle')}
                </p>
              </div>
            </div>

            {/* ── OAuth buttons ── */}
            <div className="space-y-2.5">

              {/* GitHub */}
              <form action={async () => {
                'use server'
                await signIn('github', { redirectTo })
              }}>
                <button type="submit"
                  className="group w-full flex items-center justify-center gap-3
                             bg-foreground text-background
                             hover:opacity-90 active:scale-[0.98]
                             rounded-xl px-4 py-3 text-sm font-semibold tracking-wide
                             transition-all duration-150 shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current shrink-0">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  {t('githubButton')}
                </button>
              </form>

              {/* Google */}
              <form action={async () => {
                'use server'
                await signIn('google', { redirectTo })
              }}>
                <button type="submit"
                  className="group w-full flex items-center justify-center gap-3
                             border border-border/60 hover:border-border
                             bg-background hover:bg-accent
                             active:scale-[0.98]
                             rounded-xl px-4 py-3 text-sm font-semibold
                             transition-all duration-150 shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continuar con Google
                </button>
              </form>
            </div>

            {/* ── Demo ── */}
            <div className="pt-1 border-t border-border/30">
              <form action={signInDemo}>
                <button type="submit"
                  className="w-full flex items-center justify-center gap-2.5
                             text-muted-foreground/60 hover:text-muted-foreground
                             rounded-xl px-4 py-2 text-xs font-medium
                             hover:bg-muted/40 active:scale-[0.98]
                             transition-all duration-150">
                  <span className="text-sm leading-none">👀</span>
                  Probar demo sin cuenta
                </button>
              </form>
            </div>

          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/30 tracking-[0.14em] uppercase mt-4">
          Danu · Project Management
        </p>
      </div>
    </div>
  )
}
