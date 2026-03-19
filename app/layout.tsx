import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/layout/theme-provider'
import './globals.css'

/**
 * Inter — industry standard for SaaS dashboards (Linear, Figma, Retool, Resend, Cal.com).
 * Designed specifically for screens: superior hinting at 12-14px, tabular numbers,
 * and a full weight range that creates clear hierarchy in dense UIs.
 */
const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Danu — Gestión de proyectos para equipos',
  description: 'Organiza proyectos, tareas y equipos con Danu.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover', // safe-area-inset iOS (iPhone X+)
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NextIntlClientProvider messages={messages}>
            {children}
            <Toaster richColors position="top-right" />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
