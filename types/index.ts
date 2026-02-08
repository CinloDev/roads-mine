export type Dimension = 'overworld' | 'nether'

export type Portal = {
  id: string
  name: string
  dim: Dimension
  x: number
  z: number
  y?: number
  linkedPortalId?: string | null
}

export type Point = { x: number; z: number }

export type PathSegment = {
  id: string
  dim: Dimension
  points: Point[]
  costMultiplier: number
  label?: string
}

export type WorldState = {
  portals: Portal[]
  paths: PathSegment[]
}
