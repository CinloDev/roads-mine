import '../styles/globals.css'
import React from 'react'

export const metadata = {
  title: 'Minecraft Portal Network Planner',
  description: 'MVP - plan portal networks for Overworld and Nether'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="h-full min-h-screen bg-slate-50 text-slate-900">
          {children}
        </div>
      </body>
    </html>
  )
}
