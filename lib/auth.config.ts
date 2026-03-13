import type { NextAuthConfig } from 'next-auth'
import GitHub from 'next-auth/providers/github'

export const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  pages: { signIn: '/sign-in' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isPublic = ['/sign-in', '/api/auth', '/api/health'].some((route) =>
        nextUrl.pathname.startsWith(route)
      )
      if (isPublic) return true
      if (!isLoggedIn) return false
      return true
    },
  },
}
