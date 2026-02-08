"use client"
import React from 'react'
import { useStore } from '../store/useStore'
import { buildGraph } from '../lib/graph'
import { dijkstra } from '../lib/dijkstra'

export default function RoutePanel() {
  const portals = useStore(s => s.portals)
  const paths = useStore(s => s.paths)
  const selectedDim = useStore(s => s.selectedDim)

  const sameDimPortals = portals.filter(p => p.dim === selectedDim)
  const sameDimPaths = paths.filter(p => p.dim === selectedDim)

  // Simplified UI; real selection stored in UI state could be added
  return (
    <div className="p-2 border-t bg-white">
      <div className="text-sm text-slate-600">Routing panel (use Sidebar to select portals in MVP)</div>
    </div>
  )
}
