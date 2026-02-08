import { Graph, Edge } from './graph'

type QItem = { id: string; dist: number }

export function dijkstra(graph: Graph, startId: string, goalId: string) {
  const distMap = new Map<string, number>()
  const prev = new Map<string, string | null>()
  const nodes = graph.nodes.map(n => n.id)

  for (const n of nodes) {
    distMap.set(n, Infinity)
    prev.set(n, null)
  }
  distMap.set(startId, 0)

  const edgesByFrom = new Map<string, Edge[]>()
  for (const e of graph.edges) {
    if (!edgesByFrom.has(e.from)) edgesByFrom.set(e.from, [])
    edgesByFrom.get(e.from)!.push(e)
  }

  const visited = new Set<string>()

  while (true) {
    let u: string | null = null
    let best = Infinity
    for (const [id, d] of distMap) {
      if (!visited.has(id) && d < best) {
        best = d
        u = id
      }
    }
    if (u === null) break
    if (u === goalId) break
    visited.add(u)

    const neighbors = edgesByFrom.get(u) ?? []
    for (const e of neighbors) {
      const alt = (distMap.get(u) ?? Infinity) + e.weight
      if (alt < (distMap.get(e.to) ?? Infinity)) {
        distMap.set(e.to, alt)
        prev.set(e.to, u)
      }
    }
  }

  const path: string[] = []
  let u: string | null = goalId
  if ((prev.get(u) ?? null) !== null || u === startId) {
    while (u) {
      path.unshift(u)
      const p = prev.get(u) ?? null
      if (!p) break
      u = p
    }
  }

  return { distance: distMap.get(goalId) ?? Infinity, path }
}
