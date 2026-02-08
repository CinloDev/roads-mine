"use client"
import React, { useRef, useState, useEffect } from 'react'
import { Stage, Layer, Rect, Circle, Line, Group, Text } from 'react-konva'
import { useStore } from '../store/useStore'
import { Point, Portal as PortalType } from '../types'
import PortalForm from './PortalForm'
import { dist } from '../lib/geometry'

function worldToScreen(p: Point, scale: number) {
  return { x: p.x * scale, y: p.z * scale }
}

export default function CanvasMap() {
  const stageRef = useRef<any>(null)
  const stageScale = useStore(s => s.stageScale)
  const stagePos = useStore(s => s.stagePos)
  const setStageScale = useStore(s => s.setStageScale)
  const setStagePos = useStore(s => s.setStagePos)
  const portals = useStore(s => s.portals)
  const paths = useStore(s => s.paths)
  const selectedDim = useStore(s => s.selectedDim)
  const addPath = useStore(s => s.addPath)
  const drawingPathId = useStore(s => s.drawingPathId)
  const setDrawingPathId = useStore(s => s.setDrawingPathId)

  const [modalPortalId, setModalPortalId] = useState<string | null>(null)
  const [, setRerender] = useState(0)

  useEffect(() => {
    // initialize center
    if (stageRef.current) {
      // noop
    }
  }, [])

  function handleWheel(e: any) {
    e.evt.preventDefault()
    const scaleBy = 1.05
    const stage = stageRef.current
    if (!stage) return
    const oldScale = stage.scaleX()
    const mousePointTo = {
      x: (stage.getPointerPosition().x - stage.x()) / oldScale,
      y: (stage.getPointerPosition().y - stage.y()) / oldScale,
    }
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
    setStageScale(newScale)
    const newPosX = stage.getPointerPosition().x - mousePointTo.x * newScale
    const newPosY = stage.getPointerPosition().y - mousePointTo.y * newScale
    setStagePos(newPosX, newPosY)
  }

  function handleDragEnd(e: any) {
    setStagePos(e.target.x(), e.target.y())
  }

  function handleDblClick(e: any) {
    const stage = stageRef.current
    const pointer = stage.getPointerPosition()
    const x = (pointer.x - stage.x()) / stage.scaleX()
    const z = (pointer.y - stage.y()) / stage.scaleY()
    // create portal at snapped world coords
    setModalPortalId(null)
    // pass coords via direct store add? open form with coords: we'll use quick add in store
    // Open form with prefilled coords by adding a portal then editing - simplified: open modal without id and fill default values
    setModalPortalId('new')
    // For MVP user can use PortalForm to set coords
  }

  const dimPortals = portals.filter(p => p.dim === selectedDim)
  const dimPaths = paths.filter(p => p.dim === selectedDim)

  function centerOn(x: number, z: number, scale = stageScale) {
    const stage = stageRef.current
    if (!stage) return
    const viewW = window.innerWidth - 320
    const viewH = window.innerHeight
    const worldX = x * 10 * scale
    const worldY = z * 10 * scale
    const newPosX = viewW / 2 - worldX
    const newPosY = viewH / 2 - worldY
    setStageScale(scale)
    setStagePos(newPosX, newPosY)
    // force rerender if needed
    setRerender(r => r + 1)
  }

  function fitToPortals(list: typeof portals) {
    if (!list || list.length === 0) return
    const xs = list.map(p => p.x)
    const zs = list.map(p => p.z)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minZ = Math.min(...zs)
    const maxZ = Math.max(...zs)
    const padding = 50 // world units
    const widthWorld = (maxX - minX) * 10 + padding
    const heightWorld = (maxZ - minZ) * 10 + padding
    const viewW = window.innerWidth - 320
    const viewH = window.innerHeight
    const scaleX = viewW / Math.max(1, widthWorld)
    const scaleY = viewH / Math.max(1, heightWorld)
    const newScale = Math.min(scaleX, scaleY, 3)
    const centerX = (minX + maxX) / 2
    const centerZ = (minZ + maxZ) / 2
    centerOn(centerX, centerZ, newScale)
  }

  return (
    <div className="w-full h-full">
      <Stage
        width={window.innerWidth - 320}
        height={window.innerHeight}
        draggable
        onDragEnd={handleDragEnd}
        onWheel={handleWheel}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        ref={stageRef}
        onDblClick={handleDblClick}
      >
        <Layer>
          {/* grid */}
          <Group>
            <Rect x={-5000} y={-5000} width={10000} height={10000} fill="#0b1220" />
            {/* simple grid lines */}
            {[...Array(101)].map((_, i) => {
              const pos = -2500 + i * 50
              return (
                <Line key={`v${i}`} points={[pos, -2500, pos, 2500]} stroke="#0f172a" strokeWidth={0.5} />
              )
            })}
          </Group>

          {/* paths */}
          {dimPaths.map(path => (
            <Line key={path.id} points={path.points.flatMap(p => [p.x * 10, p.z * 10])} stroke="#94a3b8" strokeWidth={2} lineCap="round" lineJoin="round" />
          ))}

          {/* portals */}
          {dimPortals.map(portal => (
            <Group key={portal.id}>
              <Circle x={portal.x * 10} y={portal.z * 10} radius={8} fill="#34d399" />
              <TextLabel x={portal.x * 10 + 12} y={portal.z * 10 - 6} text={portal.name} />
            </Group>
          ))}
        </Layer>
      </Stage>

      {/* controles de vista */}
      <div style={{ position: 'fixed', right: 12, top: 12, zIndex: 60 }}>
        <div className="bg-white/90 p-2 rounded text-sm shadow flex flex-col gap-2">
          <button className="px-2 py-1 border rounded text-xs" onClick={() => centerOn(0, 0)}>Centrar origen (0,0)</button>
          <button className="px-2 py-1 border rounded text-xs" onClick={() => fitToPortals(portals)}>Ajustar a todos</button>
        </div>
      </div>

      {modalPortalId !== null && <PortalForm portalId={modalPortalId === 'new' ? undefined : modalPortalId} onClose={() => setModalPortalId(null)} />}
    </div>
  )
}

function TextLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <Text x={x} y={y} text={text} fontSize={14} fill="#cbd5e1" />
  )
}
