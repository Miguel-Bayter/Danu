import { prisma } from '@/lib/prisma'

export const userRepository = {
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } })
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  },

  update(id: string, data: { name?: string; image?: string; timezone?: string }) {
    return prisma.user.update({ where: { id }, data })
  },
}
