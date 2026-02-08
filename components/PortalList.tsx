"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { Portal } from '../types'

export default function PortalList(){
  const portals = useStore(s => s.portals)
  const selectedDim = useStore(s => s.selectedDim)
  const setSelectedPortal = useStore(s => s.setSelectedPortal)
  const setPortalModalOpen = useStore(s => s.setPortalModalOpen)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  const dimPortals = portals.filter(p => p.dim === selectedDim)
  const filtered = dimPortals.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || `${p.x},${p.z}`.includes(q))
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      })
    }, { root: null, threshold: 0.05 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section id="portal-list" ref={ref} className="w-full py-6 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4">
        <div className={`transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Portales — {dimPortals.length}</h2>
              <p className="text-sm text-slate-500">Listado debajo del mapa. Usa la búsqueda cuando lo necesites.</p>
            </div>
            <div className="flex items-center gap-3">
              <input className="border p-2 rounded w-48" placeholder="Buscar por nombre o coords" value={q} onChange={e => setQ(e.target.value)} />
              <button className="px-3 py-2 rounded bg-sky-600 text-white" onClick={() => setOpen(o => !o)}>{open ? 'Ocultar' : 'Mostrar'} portales</button>
              <button className="px-3 py-2 rounded bg-emerald-500 text-white" onClick={() => setPortalModalOpen(true, { name: '', x: 0, z: 0, y: 64 })}>Agregar portal</button>
            </div>
          </div>

          {open && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((p: Portal) => (
                <div key={p.id} className="p-3 bg-white rounded shadow flex justify-between items-center">
                  <div style={{cursor:'pointer'}} onClick={() => { setSelectedPortal(p.id) }}>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-slate-500">{p.x}, {p.z}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 rounded bg-slate-100" onClick={() => setSelectedPortal(p.id)}>C</button>
                    <button className="px-2 py-1 rounded bg-sky-600 text-white" onClick={() => setPortalModalOpen(true, { name: p.name, x: p.x, z: p.z, y: p.y ?? 64 })}>E</button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div className="col-span-full text-center text-slate-500 p-6">No hay portales que coincidan.</div>}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
