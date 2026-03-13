'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ProjectStatus } from '@prisma/client'
import * as projectService from '@/server/services/project.service'
import { requireAuth } from '@/server/lib/auth'

export async function createProjectAction(workspaceId: string, workspaceSlug: string, formData: FormData) {
  const userId = await requireAuth()
  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || undefined
  const color = (formData.get('color') as string) || '#6366f1'
  const startDateRaw = formData.get('startDate') as string
  const endDateRaw = formData.get('endDate') as string

  await projectService.createProject(workspaceId, userId, {
    name,
    description,
    color,
    startDate: startDateRaw ? new Date(startDateRaw) : undefined,
    endDate: endDateRaw ? new Date(endDateRaw) : undefined,
  })

  revalidatePath(`/dashboard/${workspaceSlug}`)
}

export async function updateProjectAction(
  projectId: string,
  workspaceSlug: string,
  formData: FormData,
) {
  const userId = await requireAuth()
  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || undefined
  const color = (formData.get('color') as string) || undefined
  const status = (formData.get('status') as ProjectStatus) || undefined
  const startDateRaw = formData.get('startDate') as string
  const endDateRaw = formData.get('endDate') as string

  await projectService.updateProject(projectId, userId, {
    name,
    description,
    color,
    status,
    startDate: startDateRaw ? new Date(startDateRaw) : null,
    endDate: endDateRaw ? new Date(endDateRaw) : null,
  })

  revalidatePath(`/dashboard/${workspaceSlug}`)
}

export async function deleteProjectAction(
  projectId: string,
  workspaceSlug: string,
) {
  const userId = await requireAuth()
  await projectService.deleteProject(projectId, userId)
  revalidatePath(`/dashboard/${workspaceSlug}`)
  redirect(`/dashboard/${workspaceSlug}`)
}

export async function getProjectAction(projectId: string) {
  const userId = await requireAuth()
  return projectService.getProject(projectId, userId)
}
