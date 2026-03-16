import { prisma } from '@/lib/prisma'
import { TaskStatus, Priority } from '@prisma/client'

/**
 * Creates a lightweight "getting started" workspace for real new users.
 * Shows the 4 task statuses and basic features without overwhelming.
 */
export async function seedOnboardingWorkspace(userId: string): Promise<void> {
  const now = new Date()
  const daysFrom = (n: number) => new Date(now.getTime() + n * 86_400_000)

  const user = await prisma.user.findUnique({ where: { id: userId } })
  const firstName = user?.name?.split(' ')[0] ?? 'Tu'

  const workspace = await prisma.workspace.create({
    data: {
      name: `${firstName}'s Workspace`,
      slug: `workspace-${userId.slice(-8)}`,
      ownerId: userId,
      members: {
        create: { userId, role: 'OWNER' },
      },
    },
  })

  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: 'Mi primer proyecto',
      description: 'Este es un proyecto de ejemplo. Puedes editarlo, agregar tareas y explorar todas las funciones de Danu.',
      color: '#6366f1',
      startDate: now,
      endDate: daysFrom(30),
    },
  })

  await prisma.task.createMany({
    data: [
      {
        projectId: project.id,
        creatorId: userId,
        assigneeId: userId,
        title: '👋 Bienvenido a Danu — explora el Kanban',
        description: 'Arrastra esta tarjeta a otra columna para ver el drag & drop en acción.',
        status: TaskStatus.TODO,
        priority: Priority.HIGH,
        dueDate: daysFrom(3),
        position: 0,
      },
      {
        projectId: project.id,
        creatorId: userId,
        assigneeId: userId,
        title: 'Abrir el Timeline para ver el Gantt',
        description: 'Haz click en "Timeline" en la cabecera del workspace para ver la vista Gantt.',
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.MEDIUM,
        dueDate: daysFrom(7),
        position: 1,
      },
      {
        projectId: project.id,
        creatorId: userId,
        title: 'Probar el Command Palette (Cmd+K)',
        description: 'Presiona Cmd+K o Ctrl+K para abrir la paleta de comandos y navegar rápidamente.',
        status: TaskStatus.IN_REVIEW,
        priority: Priority.LOW,
        dueDate: daysFrom(14),
        position: 2,
      },
      {
        projectId: project.id,
        creatorId: userId,
        title: 'Crear tu propio workspace',
        description: '¡Esta tarea ya está lista! Haz click en "+ Nuevo workspace" cuando quieras empezar de verdad.',
        status: TaskStatus.DONE,
        priority: Priority.MEDIUM,
        dueDate: daysFrom(1),
        completedAt: now,
        position: 3,
      },
    ],
  })
}
