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

      {/* ── Aurora orbs — three-layer depth ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Primary — indigo top-left */}
        <div className="absolute w-[700px] h-[700px] -top-[220px] -left-[180px] rounded-full
                        bg-primary/[0.07] dark:bg-primary/[0.14] blur-[110px]" />
        {/* Secondary — violet bottom-right */}
        <div className="absolute w-[550px] h-[550px] -bottom-[120px] -right-[130px] rounded-full
                        bg-violet-400/[0.06] dark:bg-violet-600/[0.16] blur-[100px]" />
        {/* Tertiary — gold center pulse */}
        <div className="absolute w-[380px] h-[380px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full
                        opacity-0 dark:opacity-100
                        blur-[90px]"
          style={{ background: 'radial-gradient(circle, oklch(0.82 0.18 75 / 0.08), transparent 70%)' }}
        />
      </div>

      {/* Dot grid overlay */}
      <div className="absolute inset-0 bg-dot-grid opacity-50 dark:opacity-[0.18] pointer-events-none" />

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* ── Sign-in card ── */}
      <div className="relative w-full max-w-[380px] mx-4 sm:mx-auto z-10 card-enter">
        <div className="glass-gold rounded-2xl overflow-hidden">

          {/* Gold-tipped accent stripe */}
          <div className="h-[3px] bg-gradient-to-r from-primary via-violet-500 to-amber-400" />

          <div className="px-5 sm:px-8 pt-8 sm:pt-10 pb-7 sm:pb-8 space-y-7 sm:space-y-8">

            {/* Logo + branding */}
            <div className="flex flex-col items-center gap-5">
              <LogoMark size="xl" className="shadow-glow-gold" />
              <div className="text-center space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight text-gradient-gold">
                  {t('title')}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('subtitle')}
                </p>
              </div>
            </div>

            {/* Sign-in CTA */}
            <form
              action={async () => {
                'use server'
                await signIn('github', { redirectTo })
              }}
            >
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3
                           bg-foreground text-background
                           hover:opacity-90 active:opacity-80
                           rounded-xl px-4 py-3 text-sm font-semibold tracking-wide
                           transition-opacity shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                {t('githubButton')}
              </button>
            </form>

            {/* Demo button */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">o</span>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <form action={signInDemo}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2
                             border border-border/60 hover:border-primary/40
                             text-muted-foreground hover:text-foreground
                             rounded-xl px-4 py-2.5 text-sm font-medium
                             hover:bg-primary/[0.04]
                             transition-all duration-150"
                >
                  <span className="text-base leading-none">👀</span>
                  Probar demo sin cuenta
                </button>
              </form>
            </div>

            {/* Footer */}
            <p className="text-center text-[10.5px] text-muted-foreground/35 tracking-[0.12em] uppercase">
              Danu · Project Management
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
