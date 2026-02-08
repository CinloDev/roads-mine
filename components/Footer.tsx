"use client"
import React from 'react'

export default function Footer(){
  function scrollToPortals(){
    const el = document.getElementById('portal-list')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <footer className="w-full bg-slate-900 text-white py-6">
      <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="font-semibold">Roads Mine</div>
          <div className="text-sm text-slate-300">Mapa de portales y gestión de rutas</div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-500 transition" onClick={scrollToPortals}>Ver portales</button>
          <a className="px-4 py-2 rounded border border-slate-700 hover:bg-slate-800 transition" href="https://github.com/" target="_blank" rel="noreferrer">Repositorio</a>
        </div>
      </div>
    </footer>
  )
}
