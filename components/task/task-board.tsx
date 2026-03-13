'use client'

import { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { CreateTaskButton } from '@/components/task/create-task-button'
import { TaskSheet } from '@/components/task/task-sheet'
import { updateTaskStatusAction } from '@/server/actions/task.actions'
import { Priority, TaskStatus } from '@prisma/client'
import { PRIORITY_COLORS, STATUS_ORDER, APP_LOCALE } from '@/lib/constants'
import { useRealtimeTasks } from '@/hooks/use-realtime-tasks'

interface Member {
  userId: string
  user: { id: string; name: string | null; image: string | null }
}

interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  dueDate: Date | null
  assigneeId: string | null
  assignee: { id: string; name: string | null; image: string | null } | null
  subtasks: { id: string; title: string; status: TaskStatus }[]
  _count: { comments: number }
}

interface TaskBoardProps {
  tasks: Task[]
  projectId: string
  workspaceSlug: string
  members: Member[]
}

// ─── Sortable task card ───────────────────────────────────────────────────────

function TaskCard({
  task,
  onOpen,
  isDragOverlay = false,
}: {
  task: Task
  onOpen: () => void
  isDragOverlay?: boolean
}) {
  const t = useTranslations('task')
  return (
    <button
      onClick={onOpen}
      className={`w-full border rounded-lg p-3 bg-card text-left space-y-1.5 transition-colors ${
        isDragOverlay
          ? 'shadow-xl border-primary/50 rotate-1 cursor-grabbing'
          : 'hover:border-primary/50 cursor-pointer'
      }`}
    >
      <p className="text-sm font-medium leading-snug">{task.title}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[task.priority]}`}>
          {t(`priority.${task.priority}`)}
        </span>
        {task.dueDate && (
          <span className="text-xs text-muted-foreground">
            {new Date(task.dueDate).toLocaleDateString(APP_LOCALE)}
          </span>
        )}
        {task.assignee && (
          <span className="text-xs text-muted-foreground ml-auto truncate max-w-[80px]">
            {task.assignee.name?.split(' ')[0]}
          </span>
        )}
      </div>
      {task.subtasks.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {t('subtasksCount', {
            done: task.subtasks.filter((s) => s.status === TaskStatus.DONE).length,
            total: task.subtasks.length,
          })}
        </div>
      )}
    </button>
  )
}

function SortableTaskCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', status: task.status },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} onOpen={onOpen} />
    </div>
  )
}

// ─── Droppable column ─────────────────────────────────────────────────────────

function KanbanColumn({
  status,
  tasks,
  projectId,
  workspaceSlug,
  members,
  onOpenTask,
}: {
  status: TaskStatus
  tasks: Task[]
  projectId: string
  workspaceSlug: string
  members: Member[]
  onOpenTask: (task: Task) => void
}) {
  const t = useTranslations('task')
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="space-y-2">
      {/* Column header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t(`status.${status}`)}
        </span>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>

      {/* Drop area */}
      <div
        ref={setNodeRef}
        className={`min-h-[60px] space-y-2 rounded-lg transition-colors ${
          isOver ? 'bg-primary/5 ring-1 ring-primary/20' : ''
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onOpen={() => onOpenTask(task)} />
          ))}
        </SortableContext>
      </div>

      {/* Add task */}
      <CreateTaskButton
        projectId={projectId}
        workspaceSlug={workspaceSlug}
        members={members}
        defaultStatus={status}
      />
    </div>
  )
}

// ─── Main board ───────────────────────────────────────────────────────────────

export function TaskBoard({ tasks, projectId, workspaceSlug, members }: TaskBoardProps) {
  useRealtimeTasks(projectId)
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [isPending, startTransition] = useTransition()

  // Sync local state when server re-renders with fresh data (after revalidation)
  // Guard: don't sync while a drag is in progress to avoid visual flicker
  useEffect(() => {
    if (!draggedTask) {
      setLocalTasks(tasks)
    }
  }, [tasks, draggedTask])

  // Require 8px movement before activating drag — allows normal clicks
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const grouped = STATUS_ORDER.reduce<Record<TaskStatus, Task[]>>(
    (acc, status) => {
      acc[status] = localTasks.filter((t) => t.status === status)
      return acc
    },
    { TODO: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [] },
  )

  function onDragStart(event: DragStartEvent) {
    const task = localTasks.find((t) => t.id === event.active.id)
    setDraggedTask(task ?? null)
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setDraggedTask(null)
    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string

    // Determine target status: over.id can be a column (TaskStatus) or another task id
    let targetStatus: TaskStatus
    if ((STATUS_ORDER as string[]).includes(overId)) {
      targetStatus = overId as TaskStatus
    } else {
      const overTask = localTasks.find((t) => t.id === overId)
      if (!overTask) return
      targetStatus = overTask.status
    }

    const sourceTask = localTasks.find((t) => t.id === taskId)
    if (!sourceTask || sourceTask.status === targetStatus) return

    // Optimistic update
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t)),
    )

    // If the task sheet is open for this task, update it too
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) => prev ? { ...prev, status: targetStatus } : prev)
    }

    // Persist to server in a non-urgent transition — rollback on failure
    startTransition(async () => {
      try {
        await updateTaskStatusAction(taskId, targetStatus, projectId, workspaceSlug)
      } catch {
        setLocalTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: sourceTask.status } : t)),
        )
      }
    })
  }

  function handleOpenTask(task: Task) {
    // Always open the current local version (may have been moved)
    const current = localTasks.find((t) => t.id === task.id) ?? task
    setSelectedTask(current)
  }

  function handleCloseSheet() {
    setSelectedTask(null)
    // Sync tasks list after an edit
    // The page will revalidate from the server action — local state stays in sync
  }

  return (
    <>
      <DndContext
        id="kanban-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 transition-opacity ${isPending ? 'opacity-80' : 'opacity-100'}`}>
          {STATUS_ORDER.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={grouped[status]}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
              members={members}
              onOpenTask={handleOpenTask}
            />
          ))}
        </div>

        {/* Floating card shown while dragging */}
        <DragOverlay>
          {draggedTask && (
            <TaskCard task={draggedTask} onOpen={() => {}} isDragOverlay />
          )}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskSheet
          task={selectedTask}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
          members={members}
          onClose={handleCloseSheet}
        />
      )}
    </>
  )
}
