import { workspaceRepository } from '@/server/repositories/workspace.repository'
import { WorkspaceRole } from '@prisma/client'

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48)
}

export async function assertMemberRole(
  workspaceId: string,
  userId: string,
  minRole: WorkspaceRole,
) {
  const member = await workspaceRepository.getMember(workspaceId, userId)
  if (!member) throw new Error('No eres miembro de este workspace')

  const hierarchy: Record<WorkspaceRole, number> = {
    OWNER: 4,
    ADMIN: 3,
    MEMBER: 2,
    VIEWER: 1,
  }
  if (hierarchy[member.role] < hierarchy[minRole]) {
    throw new Error('No tienes permisos suficientes')
  }
  return member
}

export async function createWorkspace(userId: string, name: string) {
  if (!name || name.trim().length < 2) {
    throw new Error('El nombre debe tener al menos 2 caracteres')
  }

  let slug = slugify(name)
  const existing = await workspaceRepository.findBySlug(slug)
  if (existing) slug = `${slug}-${Date.now().toString(36)}`

  return workspaceRepository.create({ name: name.trim(), slug, ownerId: userId })
}

export async function updateWorkspace(workspaceId: string, userId: string, name: string) {
  await assertMemberRole(workspaceId, userId, WorkspaceRole.ADMIN)
  if (!name || name.trim().length < 2) {
    throw new Error('El nombre debe tener al menos 2 caracteres')
  }
  return workspaceRepository.update(workspaceId, { name: name.trim() })
}

export async function deleteWorkspace(workspaceId: string, userId: string) {
  const member = await assertMemberRole(workspaceId, userId, WorkspaceRole.OWNER)
  if (member.role !== WorkspaceRole.OWNER) {
    throw new Error('Solo el owner puede eliminar el workspace')
  }
  return workspaceRepository.delete(workspaceId)
}

export async function removeMember(workspaceId: string, userId: string, targetUserId: string) {
  await assertMemberRole(workspaceId, userId, WorkspaceRole.ADMIN)
  const target = await workspaceRepository.getMember(workspaceId, targetUserId)
  if (target?.role === WorkspaceRole.OWNER) throw new Error('No puedes eliminar al owner')
  return workspaceRepository.removeMember(workspaceId, targetUserId)
}

export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  targetUserId: string,
  role: WorkspaceRole,
) {
  await assertMemberRole(workspaceId, userId, WorkspaceRole.ADMIN)
  if (role === WorkspaceRole.OWNER) throw new Error('No puedes asignar el rol OWNER')
  return workspaceRepository.updateMemberRole(workspaceId, targetUserId, role)
}

export function getUserWorkspaces(userId: string) {
  return workspaceRepository.findByUser(userId)
}

export async function getWorkspace(slug: string, userId: string) {
  const workspace = await workspaceRepository.findBySlug(slug)
  if (!workspace) return null
  const member = await workspaceRepository.getMember(workspace.id, userId)
  if (!member) return null
  return { workspace, role: member.role }
}
