"use client"
import React from 'react'
import dynamic from 'next/dynamic'
import Navbar from '../components/Sidebar'
import { useStore } from '../store/useStore'
import PortalForm from '../components/PortalForm'
import PortalList from '../components/PortalList'
import Footer from '../components/Footer'

const CanvasMap = dynamic(() => import('../components/CanvasMap'), { ssr: false })

export default function Page() {
  const modalOpen = useStore(s => s.portalModalOpen)
  const modalDefaults = useStore(s => s.portalModalDefaults)
  const setPortalModalOpen = useStore(s => s.setPortalModalOpen)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
        <main className="relative" style={{ height: 'calc(100vh - 80px)' }}>
        <CanvasMap />
      </main>
      <PortalList />
      <Footer />
      {modalOpen && (
        <PortalForm portalId={undefined} defaults={modalDefaults} onClose={() => setPortalModalOpen(false)} />
      )}
    </div>
  )
}
