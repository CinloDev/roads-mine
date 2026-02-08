import { Point } from '../types'

export function dist(a: Point, b: Point) {
  const dx = a.x - b.x
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dz * dz)
}
