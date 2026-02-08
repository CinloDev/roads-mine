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

  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [stageSize, setStageSize] = useState({ width: Math.max(200, window.innerWidth - sidebarWidth - 40), height: Math.max(200, window.innerHeight - 200) })

  useEffect(() => {
    function updateSize() {
      const aside = document.querySelector('aside') as HTMLElement | null
      const sbw = aside ? Math.round(aside.getBoundingClientRect().width) : 0
      setSidebarWidth(sbw)
      const w = Math.max(200, (window.innerWidth || 1200) - sbw - 40)
      const h = Math.max(200, (window.innerHeight || 800) - 160)
      setStageSize({ width: w, height: h })
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
  }, [stageSize.width, stageSize.height, portals.length, paths.length, selectedDim])

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
    <div ref={containerRef} style={{ position: 'fixed', left: sidebarWidth + 'px', top: 0, width: 'calc(100% - ' + sidebarWidth + 'px)', height: '100vh', overflow: 'hidden' }}>

      <div style={{ position: 'absolute', left: 12, right: 12, top: 12, height: 48, zIndex: 30 }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: 8, borderRadius: 6, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontWeight: 700 }}>Map</div>
          <div>Dim: <strong>{selectedDim}</strong></div>
          <div>Coords: <strong>{pointerWorld ? (pointerWorld.x + ', ' + pointerWorld.z) : '—'}</strong></div>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={() => setModalPortalId('new')} style={{ padding: '6px 10px' }}>Agregar portal</button>
            <button onClick={() => setAutoFit(f => !f)} style={{ marginLeft: 8, padding: '6px 8px' }}>{autoFit ? 'Auto-fit: ON' : 'Auto-fit: OFF'}</button>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 12, right: 12, top: 64, bottom: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: stageSize.width, height: stageSize.height, background: '#071023' }}>
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

                {dimPortals.map(portal => (
                  <Group key={portal.id}>
                    <Circle x={portal.x * baseScale} y={portal.z * baseScale} radius={Math.max(4, 8 * baseScale)} fill="#34d399" />
                    <Text x={portal.x * baseScale + 12} y={portal.z * baseScale - 6} text={portal.name} fontSize={Math.max(10, 12 * baseScale)} fill="#cbd5e1" />
                  </Group>
                ))}
              </Group>
            </Layer>
          </Stage>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 0, zIndex: 30 }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: 8, borderRadius: '8px 8px 0 0' }}>
          <div style={{ fontWeight: 700 }}>Portales — {dimPortals.length}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {dimPortals.map(p => (
              <div key={p.id} style={{ padding: 6, border: '1px solid #ddd', borderRadius: 6, minWidth: 140, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }} onClick={() => {
                  const viewW = stageSize.width
                  const viewH = stageSize.height
                  const worldX = p.x * baseScale * groupScale
                  const worldY = p.z * baseScale * groupScale
                  setGroupPos({ x: viewW / 2 - worldX, y: viewH / 2 - worldY })
                  setModalPortalId(p.id)
                }}>{p.name} ({p.x},{p.z})</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => {
                    const viewW = stageSize.width
                    const viewH = stageSize.height
                    const worldX = p.x * baseScale * groupScale
                    const worldY = p.z * baseScale * groupScale
                    setGroupPos({ x: viewW / 2 - worldX, y: viewH / 2 - worldY })
                  }}>C</button>
                  <button onClick={() => setModalPortalId(p.id)}>E</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalPortalId !== null && (
        <PortalForm portalId={modalPortalId === 'new' ? undefined : modalPortalId ?? undefined} defaults={modalPortalId === 'new' && pointerWorld ? { x: pointerWorld.x, z: pointerWorld.z } : undefined} onClose={() => setModalPortalId(null)} />
      )}
    </div>
  )
}
