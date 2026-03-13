'use client'

import { useState } from 'react'
import { createWorkspaceAction } from '@/server/actions/workspace.actions'

export function CreateWorkspaceButton() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    setError('')
    try {
      await createWorkspaceAction(formData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear workspace')
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        + Nuevo workspace
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border rounded-xl p-6 w-full max-w-sm shadow-xl space-y-4">
        <h2 className="text-lg font-semibold">Nuevo workspace</h2>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre</label>
            <input
              name="name"
              required
              minLength={2}
              placeholder="Mi equipo"
              className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
