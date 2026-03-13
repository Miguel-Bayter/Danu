import { projectRepository } from '@/server/repositories/project.repository'
import { workspaceRepository } from '@/server/repositories/workspace.repository'
import { ProjectStatus, WorkspaceRole } from '@prisma/client'

async function assertWorkspaceMember(workspaceId: string, userId: string) {
  const member = await workspaceRepository.getMember(workspaceId, userId)
  if (!member) throw new Error('errors.notMember')
  return member
}

async function assertCanEdit(workspaceId: string, userId: string) {
  const member = await assertWorkspaceMember(workspaceId, userId)
  const canEdit: WorkspaceRole[] = [WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER]
  if (!canEdit.includes(member.role)) throw new Error('errors.insufficientPermissions')
  return member
}

function validateDates(startDate?: Date | null, endDate?: Date | null) {
  if (startDate && endDate && endDate < startDate) {
    throw new Error('errors.endDateBeforeStart')
  }
}

export async function createProject(
  workspaceId: string,
  userId: string,
  data: { name: string; description?: string; color?: string; startDate?: Date; endDate?: Date },
) {
  await assertCanEdit(workspaceId, userId)
  if (!data.name || data.name.trim().length < 2) throw new Error('errors.nameTooShort')
  validateDates(data.startDate, data.endDate)
  return projectRepository.create({ workspaceId, ...data, name: data.name.trim() })
}

export async function updateProject(
  projectId: string,
  userId: string,
  data: {
    name?: string
    description?: string
    status?: ProjectStatus
    color?: string
    startDate?: Date | null
    endDate?: Date | null
  },
) {
  const project = await projectRepository.findById(projectId)
  if (!project) throw new Error('errors.notFound')
  await assertCanEdit(project.workspaceId, userId)
  if (data.name !== undefined && data.name.trim().length < 2) throw new Error('errors.nameTooShort')
  validateDates(data.startDate, data.endDate)
  return projectRepository.update(projectId, { ...data, name: data.name?.trim() })
}

export async function deleteProject(projectId: string, userId: string) {
  const project = await projectRepository.findById(projectId)
  if (!project) throw new Error('errors.notFound')
  const member = await assertWorkspaceMember(project.workspaceId, userId)
  const canDelete: WorkspaceRole[] = [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]
  if (!canDelete.includes(member.role)) throw new Error('errors.insufficientPermissions')
  return projectRepository.delete(projectId)
}

export async function getProjects(workspaceId: string, userId: string) {
  await assertWorkspaceMember(workspaceId, userId)
  return projectRepository.findByWorkspace(workspaceId)
}

export async function getProject(projectId: string, userId: string) {
  const project = await projectRepository.findById(projectId)
  if (!project) return null
  await assertWorkspaceMember(project.workspaceId, userId)
  return project
}
