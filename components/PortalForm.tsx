"use client"
import React, { useState, useEffect } from 'react'
import { Portal, Dimension } from '../types'
import { useStore } from '../store/useStore'

export default function PortalForm({ portalId, onClose, defaults }: { portalId?: string | null; onClose?: () => void; defaults?: { name?: string; x?: number; z?: number; y?: number } }) {
  const portal = useStore(s => s.portals.find(p => p.id === portalId))
  const addPortal = useStore(s => s.addPortal)
  const updatePortal = useStore(s => s.updatePortal)
  const selectedDim = useStore(s => s.selectedDim)

  const [name, setName] = useState(portal?.name ?? defaults?.name ?? '')
  const [x, setX] = useState(portal?.x ?? defaults?.x ?? 0)
  const [z, setZ] = useState(portal?.z ?? defaults?.z ?? 0)
  const [y, setY] = useState(portal?.y ?? defaults?.y ?? 64)

  useEffect(() => {
    if (portal) {
      setName(portal.name)
      setX(portal.x)
      setZ(portal.z)
      setY(portal.y ?? 64)
    } else if (defaults) {
      setName(defaults.name ?? '')
      setX(defaults.x ?? 0)
      setZ(defaults.z ?? 0)
      setY(defaults.y ?? 64)
    }
  }, [portalId, portal, defaults])

  function save() {
    if (portal) {
      updatePortal(portal.id, { name, x, z, y })
      onClose?.()
      return
    }

    // creating new portal: prevent duplicates in same dim
    const existing = useStore.getState().portals.find(p => p.dim === selectedDim && p.x === x && p.z === z)
    if (existing) {
      // inform user and do not add
      alert('Ya existe un portal en esas coordenadas en esta dimensión. Edita el existente si quieres cambiarlo.')
      return
    }

    addPortal({ name, dim: selectedDim as Dimension, x, z, y })
    onClose?.()
  }

  return (
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-4 border rounded shadow z-50 w-80">
      <h3 className="font-semibold mb-2">{portal ? 'Editar portal' : 'Nuevo portal'}</h3>
      <div className="space-y-2">
        <input className="w-full border p-1" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" />
        <div className="flex gap-2">
          <input className="w-1/2 border p-1" type="number" value={x} onChange={e => setX(Number(e.target.value))} placeholder="x" />
          <input className="w-1/2 border p-1" type="number" value={z} onChange={e => setZ(Number(e.target.value))} placeholder="z" />
        </div>
        <input className="w-full border p-1" type="number" value={y} onChange={e => setY(Number(e.target.value))} placeholder="y" />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button className="px-3 py-1 border rounded" onClick={onClose}>Cancelar</button>
        <button className="px-3 py-1 bg-sky-600 text-white rounded" onClick={save}>Guardar</button>
      </div>
    </div>
  )
}
