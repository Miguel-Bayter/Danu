import type { NextAuthConfig } from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'

export const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: { signIn: '/sign-in', verifyRequest: '/verify-request' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isPublic = ['/sign-in', '/verify-request', '/api/auth', '/api/health', '/invite'].some(
        (route) => nextUrl.pathname.startsWith(route),
      )
      if (isPublic) return true
      if (!isLoggedIn) return false
      return true
    },
  },
  // Ensure trustHost is true for production (Vercel auto-detects from VERCEL_URL)
  trustHost: true,
}
