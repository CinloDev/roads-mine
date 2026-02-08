"use client"
import React, { useState } from 'react'
import { useStore } from '../store/useStore'
import { Portal } from '../types'

export default function Navbar() {
  const portals = useStore(s => s.portals)
  const selectedDim = useStore(s => s.selectedDim)
  const setSelectedDim = useStore(s => s.setSelectedDim)
  const setSelectedPortal = useStore(s => s.setSelectedPortal)
  const setPortalModalOpen = useStore(s => s.setPortalModalOpen)

  const [q, setQ] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const requestAutoFit = useStore(s => s.requestAutoFit)

  const filtered = portals.filter(p => p.name.toLowerCase().includes(q.toLowerCase()))

  function onSelectSuggestion(p: Portal) {
    setQ(p.name)
    setShowSuggestions(false)
    // mark selected so CanvasMap can center on it
    setSelectedPortal(p.id)
  }

  return (
    <header className="w-full border-b bg-white p-4 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 z-50">
      <div className="flex-shrink-0 text-center sm:text-left">
        <h1 className="text-lg font-semibold">Portal Network</h1>
        <div className="text-sm text-slate-600">Manage your portals</div>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row items-center gap-3 justify-center sm:justify-end">
        <div className="flex gap-2">
          <button className={`px-2 py-1 rounded ${selectedDim==='overworld'?'bg-sky-600 text-white':''}`} onClick={() => setSelectedDim('overworld')}>Overworld</button>
          <button className={`px-2 py-1 rounded ${selectedDim==='nether'?'bg-amber-600 text-white':''}`} onClick={() => setSelectedDim('nether')}>Nether</button>
        </div>

        <div className="relative w-full sm:w-auto">
          <input className="border p-2 w-full sm:w-64" placeholder="Buscar portal..." value={q} onChange={e => { setQ(e.target.value); setShowSuggestions(true) }} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} />
          {showSuggestions && q.length > 0 && (
            <div className="absolute left-0 top-full z-50 bg-white border w-full sm:w-64 max-h-44 overflow-auto">
              {filtered.length === 0 && <div className="p-2 text-sm text-slate-500">No hay resultados</div>}
              {filtered.map(p => (
                <div key={p.id} className="p-2 hover:bg-slate-100 cursor-pointer" onMouseDown={() => onSelectSuggestion(p)}>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.x}, {p.z} — {p.dim}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ml-0 sm:ml-auto flex gap-2">
          <button className="px-3 py-2 border rounded" onClick={() => requestAutoFit()}>Centrar mapa</button>
          <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => setPortalModalOpen(true, { name: '', x: 0, z: 0, y: 64 })}>Agregar portal</button>
        </div>
      </div>
    </header>
  )
}
