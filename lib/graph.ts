import { Portal, PathSegment, Point } from '../types'
import { dist } from './geometry'

export type Node = {
  id: string
  pos: Point
  type: 'portal' | 'path'
  ref?: string // portal id or path id
}

export type Edge = {
  from: string
  to: string
  weight: number
}

export type Graph = {
  nodes: Node[]
  edges: Edge[]
}

export function buildGraph(portals: Portal[], paths: PathSegment[]): Graph {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // portal nodes
  for (const p of portals) {
    nodes.push({ id: `portal:${p.id}`, pos: { x: p.x, z: p.z }, type: 'portal', ref: p.id })
  }

  // path nodes: every vertex becomes a node
  for (const path of paths) {
    path.points.forEach((pt, idx) => {
      nodes.push({ id: `path:${path.id}:${idx}`, pos: pt, type: 'path', ref: path.id })
    })

    // edges between consecutive points
    for (let i = 0; i < path.points.length - 1; i++) {
      const a = path.points[i]
      const b = path.points[i + 1]
      const d = dist(a, b)
      const w = d * (path.costMultiplier ?? 1)
      edges.push({ from: `path:${path.id}:${i}`, to: `path:${path.id}:${i + 1}`, weight: w })
      edges.push({ from: `path:${path.id}:${i + 1}`, to: `path:${path.id}:${i}`, weight: w })
    }
  }

  // virtual edges: connect portals to nearest path node in same dimension
  // Note: dimension filtering must be done by caller: only pass same-dimension portals/paths
  for (const portal of portals) {
    // find exact path node at same position
    let connected = false
    for (const node of nodes.filter(n => n.type === 'path')) {
      if (node.pos.x === portal.x && node.pos.z === portal.z) {
        // portal at path vertex
        edges.push({ from: `portal:${portal.id}`, to: node.id, weight: dist({ x: portal.x, z: portal.z }, node.pos) * 1 })
        edges.push({ from: node.id, to: `portal:${portal.id}`, weight: dist({ x: portal.x, z: portal.z }, node.pos) * 1 })
        connected = true
        break
      }
    }
    if (!connected) {
      // connect to nearest path node with build penalty multiplier 3
      let nearest: Node | null = null
      let best = Infinity
      for (const node of nodes.filter(n => n.type === 'path')) {
        const d = dist({ x: portal.x, z: portal.z }, node.pos)
        if (d < best) {
          best = d
          nearest = node
        }
      }
      if (nearest) {
        const w = best * 3
        edges.push({ from: `portal:${portal.id}`, to: nearest.id, weight: w })
        edges.push({ from: nearest.id, to: `portal:${portal.id}`, weight: w })
      }
    }
  }

  return { nodes, edges }
}
