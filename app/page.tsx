"use client"
import React from 'react'
import dynamic from 'next/dynamic'
import Sidebar from '../components/Sidebar'

const CanvasMap = dynamic(() => import('../components/CanvasMap'), { ssr: false })

export default function Page() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 relative">
        <CanvasMap />
      </main>
    </div>
  )
}
