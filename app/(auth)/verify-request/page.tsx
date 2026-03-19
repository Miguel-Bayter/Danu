import Link from 'next/link'
import { LogoMark } from '@/components/ui/logo-mark'
import { Mail } from 'lucide-react'

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="relative w-full max-w-[380px] mx-auto">
        <div className="glass-gold rounded-2xl overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-primary via-violet-500 to-amber-400" />
          <div className="px-8 py-10 flex flex-col items-center gap-6 text-center">
            <LogoMark size="sm" />
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold">Revisa tu correo</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Te enviamos un link mágico. Haz click en él para iniciar sesión — no necesitas contraseña.
              </p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                El link expira en 24 horas. Si no lo ves, revisa tu carpeta de spam.
              </p>
            </div>
            <Link
              href="/sign-in"
              className="text-sm text-primary hover:text-primary/70 font-medium transition-colors"
            >
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
