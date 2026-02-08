"use client"
import React, { useRef, useState, useEffect } from 'react'
import { Stage, Layer, Rect, Circle, Line, Group, Text } from 'react-konva'
import { useStore } from '../store/useStore'
import { Point } from '../types'
import PortalForm from './PortalForm'

export default function CanvasMap() {
  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const portals = useStore(s => s.portals)
  const paths = useStore(s => s.paths)
  const selectedDim = useStore(s => s.selectedDim)
  const selectedPortalId = useStore(s => s.selectedPortalId)
  const setSelectedPortal = useStore(s => s.setSelectedPortal)
  const setSelectedDim = useStore(s => s.setSelectedDim)

  const [groupScale, setGroupScale] = useState(1)
  const [groupPos, setGroupPos] = useState({ x: 0, y: 0 })
  const [baseScale, setBaseScale] = useState(1) // pixels per world block before groupScale
  const [pointerWorld, setPointerWorld] = useState<{ x: number; z: number } | null>(null)
  const [modalPortalId, setModalPortalId] = useState<string | null>(null)
  const [autoFit, setAutoFit] = useState(true)
  const prevCount = useRef<number>(portals.length)

  const [stageSize, setStageSize] = useState({ width: 300, height: 300 })

  useEffect(() => {
    function updateSize() {
      const el = containerRef.current
      const isLarge = typeof window !== 'undefined' && window.innerWidth >= 1024
      if (el) {
        const r = el.getBoundingClientRect()
        const containerW = r.width
        const w = Math.max(200, isLarge ? Math.round(containerW * 0.95) : Math.round(containerW - 12))
        const h = Math.max(200, Math.round(r.height - 12))
        setStageSize({ width: w, height: h })
      } else {
        const w = Math.max(200, isLarge ? Math.round(window.innerWidth * 0.95) : window.innerWidth - 40)
        const h = Math.max(200, Math.round(window.innerHeight - 40))
        setStageSize({ width: w, height: h })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // if portals increased, enable autoFit so view expands to include them
  useEffect(() => {
    if (portals.length > prevCount.current) setAutoFit(true)
    prevCount.current = portals.length
  }, [portals.length])

  useEffect(() => {
    // center origin initially
    const centerX = stageSize.width / 2
    const centerY = stageSize.height / 2
    setGroupPos({ x: centerX, y: centerY })
  }, [stageSize.width, stageSize.height])

  const dimPortals = portals.filter(p => p.dim === selectedDim)
  const dimPaths = paths.filter(p => p.dim === selectedDim)
  const requestAutoFitCounter = useStore(s => s.requestAutoFitCounter)

  // compute world bounds for current dimension
  const worldXs: number[] = []
  const worldZs: number[] = []
  dimPortals.forEach(p => { worldXs.push(p.x); worldZs.push(p.z) })
  dimPaths.forEach(pa => pa.points.forEach((pt: Point) => { worldXs.push(pt.x); worldZs.push(pt.z) }))
  const defaultExtent = 600
  const minX = worldXs.length ? Math.min(...worldXs) : -defaultExtent
  const maxX = worldXs.length ? Math.max(...worldXs) : defaultExtent
  // clamp extreme coordinates to avoid numeric instability
  const COORD_LIMIT = 100000
  const minXClamped = Math.max(-COORD_LIMIT, Math.min(COORD_LIMIT, minX))
  const maxXClamped = Math.max(-COORD_LIMIT, Math.min(COORD_LIMIT, maxX))
  const minZ = worldZs.length ? Math.min(...worldZs) : -defaultExtent
  const maxZ = worldZs.length ? Math.max(...worldZs) : defaultExtent
  const paddingBlocks = 20
  const worldWidthBlocks = Math.max(1, (maxXClamped - minXClamped) + paddingBlocks)
  const worldHeightBlocks = Math.max(1, (Math.max(-COORD_LIMIT, Math.min(COORD_LIMIT, maxZ)) - Math.max(-COORD_LIMIT, Math.min(COORD_LIMIT, minZ))) + paddingBlocks)

  // update baseScale to fit world bounds into stage area (only when stageSize or portals change)
  useEffect(() => {
    // if an external request to auto-fit was issued, enable autoFit so the effect below recenters
    if (typeof requestAutoFitCounter !== 'undefined') setAutoFit(true)
    const w = stageSize.width
    const h = stageSize.height
    const fitScaleX = w / Math.max(1, worldWidthBlocks)
    const fitScaleY = h / Math.max(1, worldHeightBlocks)
    // px per block chosen to fit the world; multiply by 0.9 to add margin
    let fitBase = Math.min(fitScaleX, fitScaleY) * 0.9
    // clamp reasonable range
    fitBase = Math.max(0.02, Math.min(8, fitBase))
    setBaseScale(fitBase)
    // if autoFit is enabled, center view to world center when bounds change
    if (autoFit) {
      const centerX = (minXClamped + maxXClamped) / 2
      const centerZ = (Math.max(-COORD_LIMIT, Math.min(COORD_LIMIT, minZ)) + Math.max(-COORD_LIMIT, Math.min(COORD_LIMIT, maxZ))) / 2
      const cx = centerX * fitBase * groupScale
      const cz = centerZ * fitBase * groupScale
      setGroupPos({ x: stageSize.width / 2 - cx, y: stageSize.height / 2 - cz })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageSize.width, stageSize.height, portals.length, paths.length, selectedDim, requestAutoFitCounter])

  // center on selected portal when user clicks it in the sidebar
  useEffect(() => {
    if (!selectedPortalId) return
    const p = portals.find(pp => pp.id === selectedPortalId)
    if (!p) return
    // ensure dimension matches
    if (p.dim !== selectedDim) setSelectedDim(p.dim)
    // center view on portal
    const worldX = p.x * baseScale * groupScale
    const worldY = p.z * baseScale * groupScale
    setGroupPos({ x: stageSize.width / 2 - worldX, y: stageSize.height / 2 - worldY })
    // clear selection to allow future clicks
    setSelectedPortal(null)
  }, [selectedPortalId, portals, baseScale, groupScale, stageSize.width, stageSize.height, selectedDim, setSelectedDim, setSelectedPortal])

  function toScreen(x: number, z: number) {
    return { x: x * baseScale * groupScale + groupPos.x, y: z * baseScale * groupScale + groupPos.y }
  }

  function handleWheel(e: any) {
    e.evt.preventDefault()
    // user interacted -> disable auto-fit so manual zoom/pan takes precedence
    setAutoFit(false)
    const stage = stageRef.current
    if (!stage) return
    const oldScale = groupScale
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    const scaleBy = 1.07
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
    const minScale = 0.1
    const maxScale = 6
    const clamped = Math.max(minScale, Math.min(maxScale, newScale))
    const mousePointTo = { x: (pointer.x - groupPos.x) / (oldScale * baseScale), y: (pointer.y - groupPos.y) / (oldScale * baseScale) }
    const newPosX = pointer.x - mousePointTo.x * clamped
    const newPosY = pointer.y - mousePointTo.y * clamped
    setGroupScale(clamped)
    setGroupPos({ x: newPosX, y: newPosY })
  }

  function handleDragEnd(e: any) {
    setGroupPos({ x: e.target.x(), y: e.target.y() })
    setAutoFit(false)
  }

  function handleMouseMove() {
    const stage = stageRef.current
    if (!stage) return
    const p = stage.getPointerPosition()
    if (!p) return
    const rawWx = (p.x - groupPos.x) / (baseScale * groupScale)
    const rawWz = (p.y - groupPos.y) / (baseScale * groupScale)
    const wx = Math.round(rawWx)
    const wz = Math.round(rawWz)
    if (!Number.isFinite(wx) || !Number.isFinite(wz) || Math.abs(wx) > COORD_LIMIT || Math.abs(wz) > COORD_LIMIT) {
      // avoid showing extreme scientific numbers; treat as out-of-range
      setPointerWorld(null)
    } else {
      setPointerWorld({ x: wx, z: wz })
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}>

      <div className="absolute left-3 right-3 top-3 z-40 pointer-events-none">
        <div className="pointer-events-auto mx-auto bg-slate-900/60 backdrop-blur-sm text-white p-3 rounded-lg shadow-md flex items-center gap-4" style={{ width: stageSize.width }}>
          <div className="flex items-center gap-6">
            <div className="font-semibold">Map</div>
            <div className="text-sm">Dim: <strong className="font-medium">{selectedDim}</strong></div>
            <div className="text-sm">Coords: <strong className="font-medium">{pointerWorld ? (pointerWorld.x + ', ' + pointerWorld.z) : '—'}</strong></div>
          </div>
          <div style={{ marginLeft: 'auto' }} className="flex gap-3 items-center">
            <button className="px-3 py-1 rounded bg-emerald-400 text-slate-900 font-semibold shadow" onClick={() => setModalPortalId('new')}>Agregar portal</button>
            <button className={`px-3 py-1 rounded ${autoFit ? 'bg-sky-600 text-white' : 'bg-slate-700 text-white/90'} font-medium`} onClick={() => setAutoFit(f => !f)}>{autoFit ? 'Auto-fit: ON' : 'Auto-fit: OFF'}</button>
          </div>
        </div>
      </div>

      <div className="absolute left-3 right-3 top-3 bottom-3 flex items-center justify-center">
        <div className="rounded-lg shadow-2xl overflow-hidden mx-auto" style={{ width: stageSize.width, height: stageSize.height, background: '#071023' }}>
          <Stage width={stageSize.width} height={stageSize.height} onWheel={handleWheel} ref={stageRef} onMouseMove={handleMouseMove}>
            <Layer>
              <Group x={groupPos.x} y={groupPos.y} scaleX={groupScale} scaleY={groupScale} draggable onDragEnd={handleDragEnd}>
                <Rect x={-5000} y={-5000} width={10000} height={10000} fill="#071122" />
                {[...Array(81)].map((_, i) => {
                  const pos = -2000 + i * 50
                  return <Line key={i} points={[pos, -2000, pos, 2000]} stroke="#0b1220" strokeWidth={0.5} />
                })}

                {dimPaths.map(path => (
                  <Line key={path.id} points={path.points.flatMap((pt: Point) => [pt.x * baseScale, pt.z * baseScale])} stroke="#94a3b8" strokeWidth={2} lineCap="round" lineJoin="round" />
                ))}

                {dimPortals.map(portal => {
                  const MIN_PORTAL_PIX = 6 // minimum radius in screen pixels
                  const MIN_FONT_PIX = 10 // minimum font size in screen pixels
                  const nominalRadius = Math.max(4, 8 * baseScale)
                  const radiusProp = Math.max(nominalRadius, MIN_PORTAL_PIX / Math.max(1e-6, groupScale))
                  const nominalFont = Math.max(10, 12 * baseScale)
                  const fontProp = Math.max(nominalFont, MIN_FONT_PIX / Math.max(1e-6, groupScale))
                  return (
                    <Group key={portal.id}>
                      <Circle x={portal.x * baseScale} y={portal.z * baseScale} radius={radiusProp} fill="#34d399" />
                      <Text x={portal.x * baseScale + 12} y={portal.z * baseScale - 6} text={portal.name} fontSize={fontProp} fill="#cbd5e1" />
                    </Group>
                  )
                })}
              </Group>
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Portal list moved below the map (see components/PortalList.tsx) */}

      {modalPortalId !== null && (
        <PortalForm portalId={modalPortalId === 'new' ? undefined : modalPortalId ?? undefined} defaults={modalPortalId === 'new' && pointerWorld ? { x: pointerWorld.x, z: pointerWorld.z } : undefined} onClose={() => setModalPortalId(null)} />
      )}
    </div>
  )
}
