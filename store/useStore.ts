"use client"
import create from 'zustand'
import { persist } from 'zustand/middleware'
import { Portal, PathSegment, WorldState, Dimension } from '../types'
import { v4 as uuidv4 } from 'uuid'

type UIState = {
  selectedDim: Dimension
  stageScale: number
  stagePos: { x: number; y: number }
  drawingPathId: string | null
}

type AppState = WorldState & UIState & {
  addPortal: (p: Omit<Portal, 'id'>) => void
  dedupePortals: () => number
  updatePortal: (id: string, patch: Partial<Portal>) => void
  removePortal: (id: string) => void
  addPath: (p: Omit<PathSegment, 'id'>) => string
  finishPath: (id: string) => void
  setSelectedDim: (d: Dimension) => void
  setStageScale: (s: number) => void
  setStagePos: (x: number, y: number) => void
  setDrawingPathId: (id: string | null) => void
}

const STORAGE_KEY = 'rm:worldstate:v1'

export const useStore = create<AppState>(persist((set, get) => ({
  portals: [],
  paths: [],
  selectedDim: 'overworld',
  stageScale: 1,
  stagePos: { x: 0, y: 0 },
  drawingPathId: null,

  // Prevent adding duplicate portals with same x,z in same dimension
  addPortal: (p) => set(state => {
    const exists = state.portals.some(pp => pp.dim === p.dim && pp.x === p.x && pp.z === p.z)
    if (exists) {
      console.warn('[useStore] duplicate portal ignored at', p.x, p.z, p.dim)
      return {}
    }
    return { portals: [...state.portals, { ...p, id: uuidv4(), linkedPortalId: p.linkedPortalId ?? null }] }
  }),
  updatePortal: (id, patch) => set(state => ({ portals: state.portals.map(p => p.id === id ? { ...p, ...patch } : p) })),
  removePortal: (id) => set(state => ({ portals: state.portals.filter(p => p.id !== id) })),
  addPath: (p) => {
    const id = uuidv4()
    set(state => ({ paths: [...state.paths, { ...p, id }] }))
    return id
  },
  finishPath: (id) => set(() => ({})),
  setSelectedDim: (d) => set(() => ({ selectedDim: d })),
  setStageScale: (s) => set(() => ({ stageScale: s })),
  setStagePos: (x, y) => set(() => ({ stagePos: { x, y } })),
  setDrawingPathId: (id) => set(() => ({ drawingPathId: id }))
  ,
  dedupePortals: () => {
    const before = get().portals.length
    const seen = new Set<string>()
    const filtered = get().portals.filter(p => {
      const key = `${p.dim}|${p.x}|${p.z}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    set({ portals: filtered })
    return before - filtered.length
  }
}), { name: STORAGE_KEY }))
