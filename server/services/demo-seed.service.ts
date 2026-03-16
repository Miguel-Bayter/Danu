import { prisma } from '@/lib/prisma'
import { TaskStatus, Priority, NotificationType } from '@prisma/client'

/**
 * Creates a demo workspace with realistic data for a first-time user.
 * Called once automatically when a user has 0 workspaces.
 */
export async function seedDemoWorkspace(userId: string): Promise<void> {
  const now = new Date()
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000)
  const daysFrom = (n: number) => new Date(now.getTime() + n * 86_400_000)

  // ── Workspace ─────────────────────────────────────────────────
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Acme Corp',
      slug: `acme-corp-${userId.slice(-6)}`,
      ownerId: userId,
      members: {
        create: { userId, role: 'OWNER' },
      },
    },
  })

  // ── Project 1: E-commerce Redesign ────────────────────────────
  const p1 = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: 'E-commerce Redesign',
      description: 'Full redesign of the main store: new checkout flow, mobile-first UI and performance improvements.',
      color: '#6366f1',
      startDate: daysAgo(30),
      endDate: daysFrom(45),
    },
  })

  // Project 1 tasks
  const p1Tasks = await prisma.task.createManyAndReturn({
    data: [
      {
        projectId: p1.id,
        creatorId: userId,
        assigneeId: userId,
        title: 'Audit current checkout flow',
        description: 'Map every step, identify friction points and drop-off rates.',
        status: TaskStatus.DONE,
        priority: Priority.HIGH,
        dueDate: daysAgo(20),
        completedAt: daysAgo(18),
        position: 0,
      },
      {
        projectId: p1.id,
        creatorId: userId,
        assigneeId: userId,
        title: 'Design new product page layout',
        description: 'Mobile-first Figma mockups for product detail page.',
        status: TaskStatus.DONE,
        priority: Priority.HIGH,
        dueDate: daysAgo(10),
        completedAt: daysAgo(8),
        position: 1,
      },
      {
        projectId: p1.id,
        creatorId: userId,
        assigneeId: userId,
        title: 'Implement cart component',
        description: 'React component with optimistic updates and local persistence.',
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        dueDate: daysFrom(5),
        position: 2,
      },
      {
        projectId: p1.id,
        creatorId: userId,
        assigneeId: userId,
        title: 'Integrate Stripe payment flow',
        description: 'Replace legacy payment with Stripe Elements + webhooks.',
        status: TaskStatus.IN_REVIEW,
        priority: Priority.URGENT,
        dueDate: daysFrom(3),
        position: 3,
      },
      {
        projectId: p1.id,
        creatorId: userId,
        title: 'Write E2E tests for checkout',
        description: 'Playwright tests covering happy path and error scenarios.',
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        dueDate: daysFrom(15),
        position: 4,
      },
      {
        projectId: p1.id,
        creatorId: userId,
        title: 'Performance audit (Core Web Vitals)',
        description: 'Lighthouse audit target: LCP < 2.5s, CLS < 0.1.',
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        dueDate: daysFrom(20),
        position: 5,
      },
      // Overdue — intentional for Health Score demo
      {
        projectId: p1.id,
        creatorId: userId,
        assigneeId: userId,
        title: 'Update product image CDN config',
        description: 'Migrate to Cloudflare Images for automatic format optimization.',
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.LOW,
        dueDate: daysAgo(5), // overdue
        position: 6,
      },
    ],
  })

  // ── Project 2: Mobile App v2 ───────────────────────────────────
  const p2 = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: 'Mobile App v2',
      description: 'React Native rewrite with offline support and push notifications.',
      color: '#10b981',
      startDate: daysAgo(15),
      endDate: daysFrom(60),
    },
  })

  await prisma.task.createMany({
    data: [
      {
        projectId: p2.id,
        creatorId: userId,
        assigneeId: userId,
        title: 'Set up Expo project structure',
        status: TaskStatus.DONE,
        priority: Priority.HIGH,
        dueDate: daysAgo(12),
        completedAt: daysAgo(11),
        position: 0,
      },
      {
        projectId: p2.id,
        creatorId: userId,
        assigneeId: userId,
        title: 'Implement offline data sync',
        description: 'WatermelonDB + background sync worker.',
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        dueDate: daysFrom(10),
        position: 1,
      },
      {
        projectId: p2.id,
        creatorId: userId,
        title: 'Design push notification system',
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        dueDate: daysFrom(25),
        position: 2,
      },
      {
        projectId: p2.id,
        creatorId: userId,
        title: 'App Store submission prep',
        description: 'Screenshots, metadata, privacy policy, review guidelines.',
        status: TaskStatus.TODO,
        priority: Priority.LOW,
        dueDate: daysFrom(55),
        position: 3,
      },
      // Overdue
      {
        projectId: p2.id,
        creatorId: userId,
        assigneeId: userId,
        title: 'Fix Android back-button crash',
        description: 'Reproducible on Android 12 — NavigationContainer state leak.',
        status: TaskStatus.TODO,
        priority: Priority.URGENT,
        dueDate: daysAgo(3), // overdue
        position: 4,
      },
    ],
  })

  // ── Project 3: Q2 Marketing Campaign ──────────────────────────
  const p3 = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: 'Q2 Marketing Campaign',
      description: 'Content calendar, social assets, and email drip for Q2 product launch.',
      color: '#f59e0b',
      startDate: daysFrom(5),
      endDate: daysFrom(90),
    },
  })

  await prisma.task.createMany({
    data: [
      {
        projectId: p3.id,
        creatorId: userId,
        title: 'Define campaign goals & KPIs',
        status: TaskStatus.TODO,
        priority: Priority.HIGH,
        dueDate: daysFrom(7),
        position: 0,
      },
      {
        projectId: p3.id,
        creatorId: userId,
        title: 'Create social media content calendar',
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        dueDate: daysFrom(20),
        position: 1,
      },
      {
        projectId: p3.id,
        creatorId: userId,
        title: 'Design email drip sequence (5 emails)',
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        dueDate: daysFrom(30),
        position: 2,
      },
    ],
  })

  // ── Subtask example on first task ─────────────────────────────
  if (p1Tasks[2]) {
    await prisma.task.createMany({
      data: [
        {
          projectId: p1.id,
          parentId: p1Tasks[2].id,
          creatorId: userId,
          title: 'Cart item quantity controls',
          status: TaskStatus.DONE,
          priority: Priority.MEDIUM,
          position: 0,
          completedAt: daysAgo(2),
        },
        {
          projectId: p1.id,
          parentId: p1Tasks[2].id,
          creatorId: userId,
          title: 'Remove item with undo toast',
          status: TaskStatus.IN_PROGRESS,
          priority: Priority.MEDIUM,
          position: 1,
        },
      ],
    })
  }

  // ── Welcome notification ───────────────────────────────────────
  await prisma.notification.create({
    data: {
      userId,
      type: NotificationType.WORKSPACE_CREATED,
      title: 'Welcome to Danu!',
      body: 'Your demo workspace "Acme Corp" is ready. Explore projects, drag tasks, and try the Gantt timeline.',
      read: false,
      linkUrl: `/dashboard/${workspace.slug}`,
    },
  })

  // Task assigned notification
  await prisma.notification.create({
    data: {
      userId,
      type: NotificationType.TASK_ASSIGNED,
      title: 'Task assigned to you',
      body: '"Fix Android back-button crash" is overdue and assigned to you.',
      read: false,
      linkUrl: `/dashboard/${workspace.slug}`,
    },
  })
}
