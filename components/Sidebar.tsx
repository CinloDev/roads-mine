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
    <header className="w-full h-20 p-4 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 z-50 bg-gradient-to-r from-slate-800 via-sky-700 to-indigo-600 text-white shadow-lg">
      <div className="flex-shrink-0 text-center sm:text-left">
        <h1 className="text-2xl font-extrabold tracking-tight">Portal Network</h1>
        <div className="text-sm text-sky-100/80">Manage your portals — rápido y elegante</div>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row items-center gap-3 justify-center sm:justify-end">
        <div className="flex gap-2">
          <button className={`px-3 py-1 rounded-full transition ${selectedDim==='overworld'?'bg-white text-slate-900 shadow':'bg-white/10 hover:bg-white/20'}`} onClick={() => setSelectedDim('overworld')}>Overworld</button>
          <button className={`px-3 py-1 rounded-full transition ${selectedDim==='nether'?'bg-amber-400 text-slate-900 shadow':'bg-white/10 hover:bg-white/20'}`} onClick={() => setSelectedDim('nether')}>Nether</button>
        </div>

        <div className="relative w-full sm:w-auto">
          <input className="rounded-full px-4 py-2 w-full sm:w-72 bg-white/10 placeholder-white/60 text-white outline-none focus:ring-2 focus:ring-sky-300 transition" placeholder="Buscar portal..." value={q} onChange={e => { setQ(e.target.value); setShowSuggestions(true) }} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} />
          {showSuggestions && q.length > 0 && (
            <div className="absolute left-0 top-full z-50 bg-white text-slate-900 rounded-lg shadow-lg w-full sm:w-72 max-h-56 overflow-auto mt-2">
              {filtered.length === 0 && <div className="p-3 text-sm text-slate-500">No hay resultados</div>}
              {filtered.map(p => (
                <div key={p.id} className="p-3 hover:bg-slate-100 cursor-pointer border-b last:border-b-0" onMouseDown={() => onSelectSuggestion(p)}>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.x}, {p.z} — {p.dim}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ml-0 sm:ml-auto flex gap-2">
          <button className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition" onClick={() => requestAutoFit()}>Centrar mapa</button>
          <button className="bg-emerald-400 text-slate-900 px-4 py-2 rounded-full font-semibold shadow hover:scale-[1.02] transition" onClick={() => setPortalModalOpen(true, { name: '', x: 0, z: 0, y: 64 })}>Agregar portal</button>
        </div>
      </div>
    </header>
  )
}
