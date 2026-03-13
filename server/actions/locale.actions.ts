'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const SUPPORTED_LOCALES = ['es', 'en'] as const

export async function setLocaleAction(locale: string) {
  if (!SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number])) return
  const cookieStore = await cookies()
  cookieStore.set('locale', locale, { maxAge: 60 * 60 * 24 * 365, path: '/' })
  revalidatePath('/', 'layout')
}
