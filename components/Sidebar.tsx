"use client"
import React, { useState } from 'react'
import { useStore } from '../store/useStore'
import { Portal } from '../types'
import PortalForm from './PortalForm'

export default function Sidebar() {
  const portals = useStore(s => s.portals)
  const selectedDim = useStore(s => s.selectedDim)
  const setSelectedDim = useStore(s => s.setSelectedDim)
  const addPortal = useStore(s => s.addPortal)
  const dedupePortals = useStore(s => s.dedupePortals)

  const [q, setQ] = useState('')

  const filtered = portals.filter(p => p.dim === selectedDim && p.name.toLowerCase().includes(q.toLowerCase()))

  const [modalOpen, setModalOpen] = useState(false)
  const [modalDefaults, setModalDefaults] = useState<{ name?: string; x?: number; z?: number; y?: number } | undefined>(undefined)

  function exportJSON() {
    const state = { portals, paths: useStore.getState().paths }
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'worldstate.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string)
        if (json.portals && json.paths) {
          // replace store
          const set = useStore.setState
          set({ portals: json.portals, paths: json.paths })
        }
      } catch (err) {
        console.error(err)
      }
    }
    reader.readAsText(f)
  }

  return (
    <aside className="w-80 border-r p-4 bg-white flex flex-col">
      <h2 className="text-lg font-semibold mb-2">Portal Network</h2>
      <div className="flex gap-2 mb-3">
        <button className={`px-2 py-1 rounded ${selectedDim==='overworld'?'bg-sky-600 text-white':''}`} onClick={() => setSelectedDim('overworld')}>Overworld</button>
        <button className={`px-2 py-1 rounded ${selectedDim==='nether'?'bg-amber-600 text-white':''}`} onClick={() => setSelectedDim('nether')}>Nether</button>
      </div>

      <div className="mb-2">
        <input className="border p-1 w-full" placeholder="Buscar portal..." value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="flex-1 overflow-auto">
        {filtered.map((p: Portal) => (
          <div key={p.id} className="p-2 border-b flex justify-between items-center">
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-slate-500">x:{p.x} z:{p.z}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          className="flex-1 bg-green-600 text-white py-2 rounded"
          onClick={() => {
            // if a portal already exists at 0,0 in this dim, open edit modal for it
            const dup = portals.find(p => p.dim === selectedDim && p.x === 0 && p.z === 0)
            if (dup) {
              // open modal to edit existing portal
              setModalDefaults({ name: dup.name, x: dup.x, z: dup.z, y: dup.y ?? 64 })
              setModalOpen(true)
            } else if (filtered.length === 0) {
              setModalDefaults({ name: '', x: 0, z: 0, y: 64 })
              setModalOpen(true)
            } else {
              addPortal({ name: 'Portal', dim: selectedDim, x: 0, z: 0 })
            }
          }}
        >Agregar portal</button>
        <button className="px-3 py-2 border rounded" onClick={exportJSON}>Export</button>
        <label className="px-3 py-2 border rounded cursor-pointer">
          Import
          <input type="file" accept="application/json" onChange={importJSON} className="hidden" />
        </label>
        <button
          className="px-3 py-2 border rounded"
          onClick={() => {
            const removed = dedupePortals()
            if (removed > 0) {
              alert(`Eliminados ${removed} portales duplicados.`)
            } else {
              alert('No se encontraron duplicados.')
            }
          }}
        >Eliminar duplicados</button>
      </div>
      {modalOpen && (
        <PortalForm
          portalId={undefined}
          defaults={modalDefaults}
          onClose={() => setModalOpen(false)}
        />
      )}
    </aside>
  )
}
