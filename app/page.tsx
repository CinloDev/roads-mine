"use client"
import React from 'react'
import dynamic from 'next/dynamic'
import Navbar from '../components/Sidebar'
import { useStore } from '../store/useStore'
import PortalForm from '../components/PortalForm'

const CanvasMap = dynamic(() => import('../components/CanvasMap'), { ssr: false })

export default function Page() {
  const modalOpen = useStore(s => s.portalModalOpen)
  const modalDefaults = useStore(s => s.portalModalDefaults)
  const setPortalModalOpen = useStore(s => s.setPortalModalOpen)

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <main className="flex-1 relative">
        <CanvasMap />
      </main>
      {modalOpen && (
        <PortalForm portalId={undefined} defaults={modalDefaults} onClose={() => setPortalModalOpen(false)} />
      )}
    </div>
  )
}
