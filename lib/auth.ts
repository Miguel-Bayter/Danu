import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Resend from 'next-auth/providers/resend'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { authConfig } from '@/lib/auth.config'
import { createId } from '@paralleldrive/cuid2'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    ...authConfig.providers,
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM ?? 'Danu <noreply@danu.app>',
    }),
    Credentials({
      credentials: { type: { type: 'text' } },
      async authorize(credentials) {
        if (credentials?.type !== 'demo') return null
        // Each demo click creates a fresh isolated user
        const id = createId()
        const user = await prisma.user.create({
          data: {
            id,
            email: `demo-${id}@danu.app`,
            name: 'Demo User',
            image: `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${id}`,
          },
        })
        return { id: user.id, email: user.email, name: user.name, image: user.image }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        // Flag demo users so we can clean up on sign-out
        if ((user.email as string)?.startsWith('demo-')) {
          token.isDemo = true
        }
      }
      return token
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    },
  },
  events: {
    async signOut(message) {
      // 'token' exists on JWT strategy sign-out
      const token = 'token' in message ? message.token : null
      if (token?.isDemo && token?.sub) {
        // Delete demo user — cascades to workspace, projects, tasks, notifications
        await prisma.user.deleteMany({
          where: {
            id: token.sub as string,
            email: { startsWith: 'demo-', endsWith: '@danu.app' },
          },
        })
      }
    },
  },
})
